import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  price: number;
  tradeType: 'BUY' | 'SELL';
  maxQuantity?: number;
  balance?: number;
  onConfirm: (quantity: number) => void;
}

export const TradeDialog: React.FC<TradeDialogProps> = ({
  open,
  onOpenChange,
  symbol,
  price,
  tradeType,
  maxQuantity,
  balance,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState(1);
  const totalAmount = quantity * price;
  const canAfford = tradeType === 'BUY' ? (balance || 0) >= totalAmount : true;
  const hasShares = tradeType === 'SELL' ? (maxQuantity || 0) >= quantity : true;

  const handleConfirm = () => {
    if (quantity > 0 && canAfford && hasShares) {
      onConfirm(quantity);
      onOpenChange(false);
      setQuantity(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {tradeType} {symbol}
          </DialogTitle>
        <DialogDescription>
            Current price: <span className="font-mono font-bold text-primary">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={tradeType === 'SELL' ? maxQuantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-mono"
            />
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per share</span>
              <span className="font-mono">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono">{quantity}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-mono font-bold text-primary">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {tradeType === 'BUY' && (
            <p className="text-sm text-muted-foreground">
              Available balance: <span className="font-mono text-foreground">₹{balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          )}
          {tradeType === 'SELL' && (
            <p className="text-sm text-muted-foreground">
              Shares owned: <span className="font-mono text-foreground">{maxQuantity}</span>
            </p>
          )}

          {!canAfford && (
            <p className="text-sm text-loss">Insufficient balance</p>
          )}
          {!hasShares && (
            <p className="text-sm text-loss">Insufficient shares</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={tradeType === 'BUY' ? 'success' : 'destructive'}
            onClick={handleConfirm}
            disabled={!canAfford || !hasShares}
          >
            Confirm {tradeType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
