import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POPULAR_INDIAN_STOCKS, POPULAR_US_STOCKS } from '@/hooks/useStockData';

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  loading?: boolean;
}

// Fuzzy match function - matches if all characters appear in order
const fuzzyMatch = (text: string, query: string): { matches: boolean; score: number } => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return { matches: true, score: 100 };
  if (textLower.startsWith(queryLower)) return { matches: true, score: 90 };
  if (textLower.includes(queryLower)) return { matches: true, score: 80 };
  
  // Fuzzy matching - characters in order
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }
  
  if (queryIndex === queryLower.length) {
    // All query characters found in order
    return { matches: true, score: 50 + maxConsecutive * 5 };
  }
  
  return { matches: false, score: 0 };
};

export const StockSearch: React.FC<StockSearchProps> = ({ onSearch, loading }) => {
  const [symbol, setSymbol] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allStocks = useMemo(() => [
    ...POPULAR_INDIAN_STOCKS.map(s => ({ ...s, market: 'NSE' })),
    ...POPULAR_US_STOCKS.map(s => ({ ...s, market: 'US' }))
  ], []);

  const suggestions = useMemo(() => {
    if (symbol.length === 0) {
      // Show all stocks when empty
      return allStocks.slice(0, 10);
    }
    
    // Fuzzy search with scoring
    const matches = allStocks
      .map(stock => {
        const symbolMatch = fuzzyMatch(stock.symbol, symbol);
        const nameMatch = fuzzyMatch(stock.name, symbol);
        const bestScore = Math.max(symbolMatch.score, nameMatch.score);
        return { stock, matches: symbolMatch.matches || nameMatch.matches, score: bestScore };
      })
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.stock);
    
    return matches;
  }, [symbol, allStocks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim().toUpperCase());
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    onSearch(selectedSymbol);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Type any letter to search (e.g., R, TC, AP)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onFocus={handleFocus}
            className="pl-12 h-14 text-lg font-mono uppercase border-2 focus:border-primary"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={loading || !symbol.trim()} className="h-14 px-6 text-base">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Quote'}
        </Button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-[100] w-full mt-2 bg-card border-2 border-primary/30 rounded-xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '400px' }}
        >
          <div className="p-3 border-b border-border bg-secondary/50 sticky top-0">
            <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
              <TrendingUp className="w-4 h-4 text-primary" />
              {symbol.length > 0 ? `Results for "${symbol}"` : 'Popular Stocks'}
            </span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
            {suggestions.map((stock, index) => (
              <button
                key={stock.symbol}
                type="button"
                className="w-full px-4 py-4 text-left hover:bg-primary/10 transition-all flex items-center justify-between border-b border-border/30 last:border-0 group"
                onClick={() => handleSelectSuggestion(stock.symbol)}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {stock.symbol}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      stock.market === 'NSE' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {stock.market}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary">Click to view →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};
