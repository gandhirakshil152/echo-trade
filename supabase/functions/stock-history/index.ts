import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARKET_SUFFIXES = ['', '.NS', '.BO', '.BSE'];

async function fetchHistoryData(symbol: string, interval: string, range: string): Promise<any> {
  if (symbol.includes('.')) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.chart?.result?.[0]) {
        return data.chart.result[0];
      }
    }
    return null;
  }

  for (const suffix of MARKET_SUFFIXES) {
    const formattedSymbol = `${symbol}${suffix}`;
    console.log(`Trying history for: ${formattedSymbol}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${interval}&range=${range}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chart?.result?.[0]) {
          console.log(`Found history with suffix: ${suffix || 'none (US)'}`);
          return data.chart.result[0];
        }
      }
    } catch (e) {
      console.log(`Failed to fetch history for ${formattedSymbol}: ${e}`);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, range = '1mo' } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching history for: ${symbol}, range: ${range}`);
    
    const intervalMap: Record<string, string> = {
      '1d': '5m',
      '5d': '15m',
      '1mo': '1d',
      '3mo': '1d',
      '6mo': '1d',
      '1y': '1wk',
    };
    
    const interval = intervalMap[range] || '1d';
    
    const result = await fetchHistoryData(symbol.toUpperCase(), interval, range);
    
    if (!result) {
      console.error(`Stock history not found: ${symbol}`);
      return new Response(
        JSON.stringify({ error: `Stock "${symbol}" not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    
    const history = timestamps.map((timestamp: number, index: number) => ({
      timestamp: timestamp * 1000,
      date: new Date(timestamp * 1000).toISOString(),
      open: quote.open?.[index] || 0,
      high: quote.high?.[index] || 0,
      low: quote.low?.[index] || 0,
      close: quote.close?.[index] || 0,
      volume: quote.volume?.[index] || 0,
    })).filter((item: any) => item.close !== null && item.close !== 0);

    console.log(`Fetched ${history.length} data points for ${symbol}`);

    return new Response(
      JSON.stringify({ symbol: symbol.toUpperCase(), history }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
