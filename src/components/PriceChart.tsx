import React, { useEffect, useState, useCallback } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStockData, StockHistory } from '@/hooks/useStockData';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceChartProps {
  symbol: string;
  currency?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ symbol, currency = 'INR' }) => {
  const { fetchHistory } = useStockData();
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const history = await fetchHistory(symbol, '1mo');
      
      if (history && history.length > 0) {
        const data = history.map((item: StockHistory) => ({
          time: new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          price: item.close
        }));
        setChartData(data);
      } else {
        setChartData([]);
        setError('No chart data available');
      }
    } catch (err) {
      setError('Failed to load chart data');
      console.error('Chart error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, fetchHistory]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  if (loading) {
    return (
      <div className="glass-card p-6 h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !chartData.length) {
    return (
      <div className="glass-card p-6 h-[300px] flex flex-col items-center justify-center gap-4">
        <span className="text-muted-foreground">{error || 'No chart data available'}</span>
        <Button variant="outline" size="sm" onClick={loadChartData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const padding = (maxPrice - minPrice) * 0.1 || 10;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono font-semibold">{symbol} - 30 Day Price</h3>
        <Button variant="ghost" size="sm" onClick={loadChartData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`colorPrice-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontFamily: 'Space Grotesk'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 84%, 60%)"}
              strokeWidth={2}
              fill={`url(#colorPrice-${symbol})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
