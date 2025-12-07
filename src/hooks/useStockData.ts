import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  currency: string;
  exchange: string;
  marketSuffix?: string;
}

export interface StockHistory {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Popular Indian stocks for quick access
export const POPULAR_INDIAN_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'LT', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK', name: 'Axis Bank' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'TATASTEEL', name: 'Tata Steel' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp' },
  { symbol: 'NTPC', name: 'NTPC Limited' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp' },
];

// Popular US stocks
export const POPULAR_US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
];

export const useStockData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<StockHistory[]>([]);

  const fetchQuote = useCallback(async (symbol: string): Promise<StockQuote | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-quote', {
        body: { symbol: symbol.toUpperCase() }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setQuote(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stock data';
      setError(message);
      console.error('Stock quote error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (symbol: string, range: string = '1mo'): Promise<StockHistory[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-history', {
        body: { symbol: symbol.toUpperCase(), range }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setHistory(data.history || []);
      return data.history || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stock history';
      setError(message);
      console.error('Stock history error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStocks = useCallback((query: string) => {
    if (!query) return [...POPULAR_INDIAN_STOCKS, ...POPULAR_US_STOCKS];
    const upperQuery = query.toUpperCase();
    return [...POPULAR_INDIAN_STOCKS, ...POPULAR_US_STOCKS].filter(
      stock => 
        stock.symbol.includes(upperQuery) || 
        stock.name.toUpperCase().includes(upperQuery)
    );
  }, []);

  // Legacy compatibility
  const getQuote = fetchQuote;
  const getCandles = fetchHistory;

  return {
    loading,
    error,
    quote,
    history,
    fetchQuote,
    fetchHistory,
    searchStocks,
    getQuote,
    getCandles,
    popularStocks: POPULAR_INDIAN_STOCKS,
  };
};

// Hook for real-time price updates (polling-based)
export const useRealtimePrices = (symbols: string[], intervalMs: number = 30000) => {
  const [prices, setPrices] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return;
    
    setLoading(true);
    const newPrices: Record<string, StockQuote> = {};
    
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const { data, error } = await supabase.functions.invoke('stock-quote', {
            body: { symbol }
          });
          
          if (!error && data && !data.error) {
            newPrices[symbol] = data;
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
        }
      })
    );
    
    if (isMountedRef.current) {
      setPrices(prev => ({ ...prev, ...newPrices }));
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchPrices();
    
    // Set up polling interval
    intervalRef.current = setInterval(fetchPrices, intervalMs);
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrices, intervalMs]);

  const refreshPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, loading, refreshPrices };
};
