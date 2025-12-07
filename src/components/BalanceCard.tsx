import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  portfolioValue?: number;
  totalProfitLoss?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  portfolioValue = 0,
  totalProfitLoss = 0
}) => {
  const totalValue = balance + portfolioValue;
  const isPositive = totalProfitLoss >= 0;

  const formatINR = (value: number) => {
    return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="glass-card p-6 glow-primary animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Total Value</p>
          <p className="text-3xl font-mono font-bold">{formatINR(totalValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Cash Balance</p>
          <p className="font-mono font-semibold">{formatINR(balance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Portfolio</p>
          <p className="font-mono font-semibold">{formatINR(portfolioValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">P&L</p>
          <div className={cn(
            "flex items-center gap-1",
            isPositive ? "text-gain" : "text-loss"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <p className="font-mono font-semibold">
              {isPositive ? '+' : ''}{formatINR(totalProfitLoss)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
