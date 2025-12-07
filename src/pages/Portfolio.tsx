import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { usePortfolio, PortfolioItem } from '@/hooks/usePortfolio';
import { useStockData, StockQuote } from '@/hooks/useStockData';
import { TradeDialog } from '@/components/TradeDialog';
import { Loader2, Briefcase, TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EnrichedPortfolioItem extends PortfolioItem {
  current_price: number;
  change: number;
  change_percent: number;
}

const Portfolio: React.FC = () => {
  const { portfolio, profile, loading, executeTrade } = usePortfolio();
  const { fetchQuote } = useStockData();
  const { toast } = useToast();
  const [enrichedPortfolio, setEnrichedPortfolio] = useState<EnrichedPortfolioItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [tradeDialog, setTradeDialog] = useState<{ 
    open: boolean; 
    type: 'BUY' | 'SELL'; 
    symbol: string; 
    price: number;
    maxQuantity?: number;
  }>({ open: false, type: 'BUY', symbol: '', price: 0 });

  useEffect(() => {
    const fetchPrices = async () => {
      if (portfolio.length === 0) {
        setLoadingPrices(false);
        return;
      }

      setLoadingPrices(true);
      const quotes = await Promise.all(
        portfolio.map(item => fetchQuote(item.symbol))
      );

      const enriched = portfolio.map((item, index) => {
        const quote = quotes[index];
        return {
          ...item,
          current_price: quote?.price || item.avg_price,
          change: quote?.change || 0,
          change_percent: quote?.changePercent || 0
        };
      });

      setEnrichedPortfolio(enriched);
      setLoadingPrices(false);
    };

    fetchPrices();
  }, [portfolio, fetchQuote]);

  const handleTrade = async (quantity: number) => {
    const result = await executeTrade(
      tradeDialog.symbol,
      quantity,
      tradeDialog.price,
      tradeDialog.type
    );
    if (!result.success) {
      toast({
        title: 'Trade Failed',
        description: result.error,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Trade Successful',
        description: `${tradeDialog.type === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${tradeDialog.symbol}`,
      });
    }
  };

  const openTradeDialog = (item: EnrichedPortfolioItem, type: 'BUY' | 'SELL') => {
    setTradeDialog({
      open: true,
      type,
      symbol: item.symbol,
      price: item.current_price,
      maxQuantity: type === 'SELL' ? item.quantity : undefined
    });
  };

  const totalValue = enrichedPortfolio.reduce((acc, item) => acc + (item.quantity * item.current_price), 0);
  const totalCost = enrichedPortfolio.reduce((acc, item) => acc + (item.quantity * item.avg_price), 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const formatINR = (value: number) => {
    return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background trading-grid">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 md:pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Portfolio
          </h1>
          <p className="text-muted-foreground mt-2">Your current holdings in NSE/BSE stocks</p>
        </div>

        {/* Summary Card */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="grid sm:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Value</p>
              <p className="text-2xl font-mono font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Cost</p>
              <p className="text-2xl font-mono font-bold">{formatINR(totalCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total P&L</p>
              <div className={cn("flex items-center gap-2", totalProfitLoss >= 0 ? "text-gain" : "text-loss")}>
                {totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <p className="text-2xl font-mono font-bold">
                  {totalProfitLoss >= 0 ? '+' : ''}{formatINR(totalProfitLoss)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Return</p>
              <p className={cn("text-2xl font-mono font-bold", totalProfitLossPercent >= 0 ? "text-gain" : "text-loss")}>
                {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        {loadingPrices ? (
          <div className="glass-card p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : enrichedPortfolio.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No holdings yet. Start trading to build your portfolio!</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-mono text-muted-foreground font-medium">Symbol</th>
                    <th className="text-right p-4 font-mono text-muted-foreground font-medium">Shares</th>
                    <th className="text-right p-4 font-mono text-muted-foreground font-medium">Avg Price</th>
                    <th className="text-right p-4 font-mono text-muted-foreground font-medium">Current</th>
                    <th className="text-right p-4 font-mono text-muted-foreground font-medium">Value</th>
                    <th className="text-right p-4 font-mono text-muted-foreground font-medium">P&L</th>
                    <th className="text-center p-4 font-mono text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedPortfolio.map((item, index) => {
                    const value = item.quantity * item.current_price;
                    const cost = item.quantity * item.avg_price;
                    const pl = value - cost;
                    const plPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-4">
                          <span className="font-mono font-bold">{item.symbol}</span>
                        </td>
                        <td className="p-4 text-right font-mono">{item.quantity}</td>
                        <td className="p-4 text-right font-mono">{formatINR(item.avg_price)}</td>
                        <td className="p-4 text-right">
                          <div>
                            <p className="font-mono">{formatINR(item.current_price)}</p>
                            <p className={cn("text-xs", item.change_percent >= 0 ? "text-gain" : "text-loss")}>
                              {item.change_percent >= 0 ? '+' : ''}{item.change_percent.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono font-medium">{formatINR(value)}</td>
                        <td className="p-4 text-right">
                          <div className={cn(pl >= 0 ? "text-gain" : "text-loss")}>
                            <p className="font-mono font-medium">{pl >= 0 ? '+' : ''}{formatINR(pl)}</p>
                            <p className="text-xs">{plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs border-gain text-gain hover:bg-gain hover:text-gain-foreground"
                              onClick={() => openTradeDialog(item, 'BUY')}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Buy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs border-loss text-loss hover:bg-loss hover:text-white"
                              onClick={() => openTradeDialog(item, 'SELL')}
                            >
                              <Banknote className="w-3 h-3 mr-1" />
                              Sell
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Trade Dialog */}
      <TradeDialog
        open={tradeDialog.open}
        onOpenChange={(open) => setTradeDialog({ ...tradeDialog, open })}
        symbol={tradeDialog.symbol}
        price={tradeDialog.price}
        tradeType={tradeDialog.type}
        maxQuantity={tradeDialog.maxQuantity}
        balance={profile?.balance}
        onConfirm={handleTrade}
      />
    </div>
  );
};

export default Portfolio;
