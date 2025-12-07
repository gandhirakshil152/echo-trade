import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VoiceControl } from '@/components/VoiceControl';
import { StockSearch } from '@/components/StockSearch';
import { StockQuoteCard } from '@/components/StockQuoteCard';
import { BalanceCard } from '@/components/BalanceCard';
import { TradeDialog } from '@/components/TradeDialog';
import { PriceChart } from '@/components/PriceChart';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useStockData, useRealtimePrices, StockQuote, POPULAR_INDIAN_STOCKS } from '@/hooks/useStockData';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchQuote, loading: quoteLoading } = useStockData();
  const { isListening, transcript, supported, startListening, stopListening, speak } = useVoiceCommands();
  const { profile, portfolio, watchlist, executeTrade, addToWatchlist, removeFromWatchlist, loading: portfolioLoading } = usePortfolio();

  const [currentQuote, setCurrentQuote] = useState<StockQuote | null>(null);
  const [tradeDialog, setTradeDialog] = useState<{ open: boolean; type: 'BUY' | 'SELL' }>({ open: false, type: 'BUY' });
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Popular stocks for real-time display - update every 5 seconds
  const popularSymbols = useMemo(() => POPULAR_INDIAN_STOCKS.slice(0, 6).map(s => s.symbol), []);
  const { prices: popularPrices, loading: popularLoading, refreshPrices } = useRealtimePrices(popularSymbols, 5000);
  
  const popularQuotes = useMemo(() => {
    return Object.values(popularPrices).filter(Boolean) as StockQuote[];
  }, [popularPrices]);

  // Auto-refresh current quote every 5 seconds (faster updates)
  const REFRESH_INTERVAL = 5;
  
  const refreshCurrentQuote = useCallback(async () => {
    if (!currentQuote) return;
    setIsRefreshing(true);
    const updatedQuote = await fetchQuote(currentQuote.symbol);
    if (updatedQuote) {
      setCurrentQuote(updatedQuote);
    }
    setIsRefreshing(false);
    setRefreshCountdown(REFRESH_INTERVAL);
  }, [currentQuote, fetchQuote]);

  useEffect(() => {
    if (currentQuote) {
      // Set up auto-refresh interval - every 5 seconds
      refreshIntervalRef.current = setInterval(refreshCurrentQuote, REFRESH_INTERVAL * 1000);
      
      // Set up countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setRefreshCountdown(prev => (prev > 0 ? prev - 1 : REFRESH_INTERVAL));
      }, 1000);

      return () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
  }, [currentQuote?.symbol, refreshCurrentQuote]);

  // Calculate portfolio value
  const portfolioValue = portfolio.reduce((acc, item) => acc + (item.quantity * (item.avg_price || 0)), 0);
  const totalProfitLoss = portfolio.reduce((acc, item) => {
    const currentValue = item.quantity * (item.current_price || item.avg_price);
    const costBasis = item.quantity * item.avg_price;
    return acc + (currentValue - costBasis);
  }, 0);

  const handleSearch = useCallback(async (symbol: string) => {
    const quote = await fetchQuote(symbol);
    if (quote) {
      setCurrentQuote(quote);
    } else {
      toast({
        title: 'Stock not found',
        description: `Could not find quote for ${symbol}. Try searching for a different symbol.`,
        variant: 'destructive'
      });
    }
  }, [fetchQuote, toast]);

  const handleVoiceCommand = useCallback(async (result: any) => {
    speak(`Processing: ${result.command}`);

    switch (result.action) {
      case 'search':
        if (result.symbol) {
          await handleSearch(result.symbol);
          speak(`Showing quote for ${result.symbol}`);
        }
        break;
      case 'buy':
        if (result.symbol && result.quantity) {
          const quote = await fetchQuote(result.symbol);
          if (quote) {
            setCurrentQuote(quote);
            setTradeDialog({ open: true, type: 'BUY' });
            speak(`Preparing to buy ${result.quantity} shares of ${result.symbol}`);
          }
        }
        break;
      case 'sell':
        if (result.symbol && result.quantity) {
          const quote = await fetchQuote(result.symbol);
          if (quote) {
            setCurrentQuote(quote);
            setTradeDialog({ open: true, type: 'SELL' });
            speak(`Preparing to sell ${result.quantity} shares of ${result.symbol}`);
          }
        }
        break;
      case 'portfolio':
        navigate('/portfolio');
        speak('Opening portfolio');
        break;
      case 'watchlist':
        navigate('/watchlist');
        speak('Opening watchlist');
        break;
      case 'history':
        navigate('/history');
        speak('Opening trade history');
        break;
      default:
        speak("Sorry, I didn't understand that command");
    }
  }, [handleSearch, fetchQuote, navigate, speak]);

  const handleTrade = async (quantity: number) => {
    if (!currentQuote) return;
    const result = await executeTrade(
      currentQuote.symbol,
      quantity,
      currentQuote.price,
      tradeDialog.type
    );
    if (!result.success) {
      toast({
        title: 'Trade Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const isInWatchlist = currentQuote ? watchlist.some(w => w.symbol === currentQuote.symbol) : false;
  const portfolioItem = currentQuote ? portfolio.find(p => p.symbol === currentQuote.symbol) : undefined;

  const formatCurrency = (value: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return symbol + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (portfolioLoading) {
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance */}
            <BalanceCard 
              balance={profile?.balance || 0}
              portfolioValue={portfolioValue}
              totalProfitLoss={totalProfitLoss}
            />

            {/* Current Quote */}
            {currentQuote && (
              <>
                <div className="relative">
                  {/* Auto-refresh indicator */}
                  <div className="absolute -top-2 right-0 flex items-center gap-2 text-xs text-muted-foreground z-10">
                    <span className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-full border border-border">
                      {isRefreshing ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>Refresh in {refreshCountdown}s</span>
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={refreshCurrentQuote}
                      disabled={isRefreshing}
                      className="h-6 px-2"
                    >
                      <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                    </Button>
                  </div>
                  <StockQuoteCard
                    quote={currentQuote}
                    onBuy={() => setTradeDialog({ open: true, type: 'BUY' })}
                    onSell={() => setTradeDialog({ open: true, type: 'SELL' })}
                    onAddWatchlist={() => addToWatchlist(currentQuote.symbol)}
                    onRemoveWatchlist={() => removeFromWatchlist(currentQuote.symbol)}
                    isInWatchlist={isInWatchlist}
                  />
                </div>
                <PriceChart symbol={currentQuote.symbol} currency={currentQuote.currency} />
              </>
            )}

            {/* Popular Indian Stocks with Live Prices */}
            {!currentQuote && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-semibold">Popular Stocks</h3>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />
                      Live
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshPrices}
                    disabled={popularLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4", popularLoading && "animate-spin")} />
                  </Button>
                </div>
                {popularLoading && popularQuotes.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularQuotes.map(quote => (
                      <button
                        key={quote.symbol}
                        onClick={() => setCurrentQuote(quote)}
                        className="bg-secondary/50 hover:bg-secondary rounded-lg p-4 text-left transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-bold">{quote.symbol}</span>
                          <span className={quote.changePercent >= 0 ? 'text-gain text-sm' : 'text-loss text-sm'}>
                            {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent?.toFixed(2)}%
                          </span>
                        </div>
                        <PriceDisplay 
                          price={quote.price} 
                          currency={quote.currency}
                          className="font-mono text-lg"
                        />
                        <p className="text-xs text-muted-foreground truncate mt-1">{quote.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Voice Control */}
          <div className="space-y-6">
            <VoiceControl
              isListening={isListening}
              transcript={transcript}
              supported={supported}
              onStart={() => startListening(handleVoiceCommand)}
              onStop={stopListening}
            />
            {/* Search */}
            <div className="glass-card p-6 mb-8">
              <h2 className="font-mono font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Stock Quote
              </h2>
              <StockSearch onSearch={handleSearch} loading={quoteLoading} />
              <p className="text-xs text-muted-foreground mt-2">
                Search Indian (NSE/BSE) or US stocks • Type to see suggestions
              </p>
            </div>
            {/* Quick Stats */}
            {/* <div className="glass-card p-6">
              <h3 className="font-mono font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holdings</span>
                  <span className="font-mono">{portfolio.length} stocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Watchlist</span>
                  <span className="font-mono">{watchlist.length} stocks</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </main>

      {/* Trade Dialog */}
      {currentQuote && (
        <TradeDialog
          open={tradeDialog.open}
          onOpenChange={(open) => setTradeDialog({ ...tradeDialog, open })}
          symbol={currentQuote.symbol}
          price={currentQuote.price}
          tradeType={tradeDialog.type}
          maxQuantity={portfolioItem?.quantity}
          balance={profile?.balance}
          onConfirm={handleTrade}
        />
      )}
    </div>
  );
};

export default Dashboard;
