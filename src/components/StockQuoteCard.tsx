import React from 'react';
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockQuote } from '@/hooks/useStockData';
import { cn } from '@/lib/utils';

interface StockQuoteCardProps {
  quote: StockQuote;
  onBuy?: () => void;
  onSell?: () => void;
  onAddWatchlist?: () => void;
  onRemoveWatchlist?: () => void;
  isInWatchlist?: boolean;
  showActions?: boolean;
}

export const StockQuoteCard: React.FC<StockQuoteCardProps> = ({
  quote,
  onBuy,
  onSell,
  onAddWatchlist,
  onRemoveWatchlist,
  isInWatchlist,
  showActions = true
}) => {
  const isPositive = quote.change >= 0;

  const formatINR = (value: number) => {
    return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-mono font-bold">{quote.symbol}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              {quote.exchange || 'NSE'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm truncate max-w-[250px]">{quote.name || quote.symbol}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
          isPositive ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"
        )}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? '+' : ''}{quote.changePercent?.toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Current Price</p>
          <p className="text-3xl font-mono font-bold">
            {formatINR(quote.price)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Change</p>
          <p className={cn(
            "text-xl font-mono font-semibold",
            isPositive ? "text-gain" : "text-loss"
          )}>
            {isPositive ? '+' : ''}{formatINR(quote.change)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-sm mb-6">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Open</p>
          <p className="font-mono font-medium">{formatINR(quote.open)}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">High</p>
          <p className="font-mono font-medium text-gain">{formatINR(quote.high)}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Low</p>
          <p className="font-mono font-medium text-loss">{formatINR(quote.low)}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Prev Close</p>
          <p className="font-mono font-medium">{formatINR(quote.previousClose)}</p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-3">
          <Button onClick={onBuy} className="flex-1" variant="success">
            Buy
          </Button>
          <Button onClick={onSell} className="flex-1" variant="destructive">
            Sell
          </Button>
          {isInWatchlist ? (
            <Button onClick={onRemoveWatchlist} variant="outline" size="icon">
              <Minus className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={onAddWatchlist} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
