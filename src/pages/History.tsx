import React from 'react';
import { Navbar } from '@/components/Navbar';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Loader2, History as HistoryIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const History: React.FC = () => {
  const { trades, loading } = usePortfolio();

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
            <HistoryIcon className="w-8 h-8 text-primary" />
            Trade History
          </h1>
          <p className="text-muted-foreground mt-2">Your past transactions</p>
        </div>

        {trades.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trades yet. Start trading to see your history!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade, index) => (
              <div 
                key={trade.id} 
                className="glass-card p-4 sm:p-6 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      trade.trade_type === 'BUY' ? "bg-gain/20" : "bg-loss/20"
                    )}>
                      {trade.trade_type === 'BUY' ? (
                        <ArrowDownCircle className="w-6 h-6 text-gain" />
                      ) : (
                        <ArrowUpCircle className="w-6 h-6 text-loss" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          trade.trade_type === 'BUY' ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"
                        )}>
                          {trade.trade_type}
                        </span>
                        <span className="font-mono font-bold text-lg">{trade.symbol}</span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        {format(new Date(trade.executed_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">₹{trade.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-muted-foreground text-sm">
                      {trade.quantity} × ₹{trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
