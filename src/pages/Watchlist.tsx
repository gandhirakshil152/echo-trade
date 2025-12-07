import React, { useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { usePortfolio, WatchlistItem } from '@/hooks/usePortfolio';
import { useRealtimePrices, StockQuote } from '@/hooks/useStockData';
import { Loader2, Star, Trash2, TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnrichedWatchlistItem extends WatchlistItem {
  quote?: StockQuote;
}

const Watchlist: React.FC = () => {
  const { watchlist, removeFromWatchlist, loading } = usePortfolio();
  
  // Get symbols for real-time updates
  const symbols = useMemo(() => watchlist.map(item => item.symbol), [watchlist]);
  
  // Use real-time price updates (refreshes every 30 seconds)
  const { prices, loading: loadingPrices, refreshPrices } = useRealtimePrices(symbols, 30000);

  const enrichedWatchlist: EnrichedWatchlistItem[] = useMemo(() => {
    return watchlist.map(item => ({
      ...item,
      quote: prices[item.symbol]
    }));
  }, [watchlist, prices]);

  const formatCurrency = (value: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return symbol + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-mono font-bold flex items-center gap-3">
              <Star className="w-8 h-8 text-primary fill-primary" />
              Watchlist
            </h1>
            <p className="text-muted-foreground mt-2">Live prices • Auto-refresh every 30s</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPrices}
            disabled={loadingPrices}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loadingPrices && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {enrichedWatchlist.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your watchlist is empty. Add stocks from the dashboard!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedWatchlist.map((item, index) => {
              const isPositive = (item.quote?.changePercent || 0) >= 0;
              const isLoading = !item.quote && loadingPrices;
              const currency = item.quote?.currency || 'INR';
              
              return (
                <div 
                  key={item.id} 
                  className="glass-card p-6 animate-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Live indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />
                    <span className="text-xs text-muted-foreground">LIVE</span>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-bold text-xl">{item.symbol}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                          {item.quote?.exchange || 'NSE'}
                        </span>
                      </div>
                      {item.quote?.name && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {item.quote.name}
                        </p>
                      )}
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" />
                      ) : item.quote ? (
                        <p className="text-2xl font-mono font-bold mt-2 flex items-center gap-1">
                          {currency === 'INR' ? '₹' : <DollarSign className="w-5 h-5" />}
                          {item.quote.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">Price unavailable</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="text-muted-foreground hover:text-loss"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {item.quote && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg",
                      isPositive ? "bg-gain/20" : "bg-loss/20"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-gain" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-loss" />
                      )}
                      <span className={cn("font-mono font-medium", isPositive ? "text-gain" : "text-loss")}>
                        {isPositive ? '+' : ''}{formatCurrency(item.quote.change, currency)} ({isPositive ? '+' : ''}{item.quote.changePercent?.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
