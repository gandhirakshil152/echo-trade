import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price?: number;
  change?: number;
  change_percent?: number;
  total_value?: number;
  profit_loss?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  executed_at: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  added_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  balance: number;
}

export const usePortfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setProfile(data as Profile);
    }
  }, [user]);

  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) {
      setPortfolio(data.map(item => ({
        id: item.id,
        symbol: item.symbol,
        quantity: item.quantity,
        avg_price: Number(item.avg_price)
      })));
    }
  }, [user]);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false });
    if (!error && data) {
      setTrades(data.map(t => ({
        id: t.id,
        symbol: t.symbol,
        trade_type: t.trade_type as 'BUY' | 'SELL',
        quantity: t.quantity,
        price: Number(t.price),
        total_amount: Number(t.total_amount),
        executed_at: t.executed_at
      })));
    }
  }, [user]);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    if (!error && data) {
      setWatchlist(data as WatchlistItem[]);
    }
  }, [user]);

  const executeTrade = useCallback(async (
    symbol: string,
    quantity: number,
    price: number,
    tradeType: 'BUY' | 'SELL'
  ) => {
    if (!user || !profile) return { success: false, error: 'Not authenticated' };

    const totalAmount = quantity * price;

    if (tradeType === 'BUY') {
      if (profile.balance < totalAmount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Update balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - totalAmount })
        .eq('id', user.id);
      
      if (balanceError) return { success: false, error: balanceError.message };

      // Update or insert portfolio
      const existingItem = portfolio.find(p => p.symbol === symbol);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newAvgPrice = ((existingItem.avg_price * existingItem.quantity) + (price * quantity)) / newQuantity;
        
        await supabase
          .from('portfolio')
          .update({ quantity: newQuantity, avg_price: newAvgPrice })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('portfolio')
          .insert({ user_id: user.id, symbol, quantity, avg_price: price });
      }
    } else {
      // SELL
      const existingItem = portfolio.find(p => p.symbol === symbol);
      if (!existingItem || existingItem.quantity < quantity) {
        return { success: false, error: 'Insufficient shares' };
      }

      // Update balance
      await supabase
        .from('profiles')
        .update({ balance: profile.balance + totalAmount })
        .eq('id', user.id);

      // Update portfolio
      if (existingItem.quantity === quantity) {
        await supabase.from('portfolio').delete().eq('id', existingItem.id);
      } else {
        await supabase
          .from('portfolio')
          .update({ quantity: existingItem.quantity - quantity })
          .eq('id', existingItem.id);
      }
    }

    // Record trade
    await supabase.from('trades').insert({
      user_id: user.id,
      symbol,
      trade_type: tradeType,
      quantity,
      price,
      total_amount: totalAmount
    });

    // Refresh data
    await Promise.all([fetchProfile(), fetchPortfolio(), fetchTrades()]);
    
    toast({
      title: `${tradeType} Order Executed`,
      description: `${quantity} shares of ${symbol} at $${price.toFixed(2)}`
    });

    return { success: true };
  }, [user, profile, portfolio, fetchProfile, fetchPortfolio, fetchTrades, toast]);

  const addToWatchlist = useCallback(async (symbol: string) => {
    if (!user) return;
    const existing = watchlist.find(w => w.symbol === symbol);
    if (existing) {
      toast({ title: 'Already in watchlist', variant: 'destructive' });
      return;
    }
    await supabase.from('watchlist').insert({ user_id: user.id, symbol });
    fetchWatchlist();
    toast({ title: `${symbol} added to watchlist` });
  }, [user, watchlist, fetchWatchlist, toast]);

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    if (!user) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('symbol', symbol);
    fetchWatchlist();
    toast({ title: `${symbol} removed from watchlist` });
  }, [user, fetchWatchlist, toast]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchProfile(), fetchPortfolio(), fetchTrades(), fetchWatchlist()])
        .finally(() => setLoading(false));
    }
  }, [user, fetchProfile, fetchPortfolio, fetchTrades, fetchWatchlist]);

  return {
    portfolio,
    trades,
    watchlist,
    profile,
    loading,
    executeTrade,
    addToWatchlist,
    removeFromWatchlist,
    refreshData: () => Promise.all([fetchProfile(), fetchPortfolio(), fetchTrades(), fetchWatchlist()])
  };
};
