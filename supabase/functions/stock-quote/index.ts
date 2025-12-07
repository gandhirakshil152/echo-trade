import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try different market suffixes to find the stock
const MARKET_SUFFIXES = ['', '.NS', '.BO', '.BSE'];

async function fetchStockData(symbol: string): Promise<any> {
  // If symbol already has a suffix, use it directly
  if (symbol.includes('.')) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.chart?.result?.[0]) {
        return { data: data.chart.result[0], suffix: '' };
      }
    }
    return null;
  }

  // Try different suffixes
  for (const suffix of MARKET_SUFFIXES) {
    const formattedSymbol = `${symbol}${suffix}`;
    console.log(`Trying symbol: ${formattedSymbol}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chart?.result?.[0]) {
          console.log(`Found stock with suffix: ${suffix || 'none (US)'}`);
          return { data: data.chart.result[0], suffix };
        }
      }
    } catch (e) {
      console.log(`Failed to fetch ${formattedSymbol}: ${e}`);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching quote for: ${symbol}`);
    
    const result = await fetchStockData(symbol.toUpperCase());
    
    if (!result) {
      console.error(`Stock not found: ${symbol}`);
      return new Response(
        JSON.stringify({ error: `Stock "${symbol}" not found. Try adding exchange suffix like .NS (NSE) or .BO (BSE)` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: stockResult, suffix } = result;
    const meta = stockResult.meta;
    const quote = stockResult.indicators?.quote?.[0];
    
    const currentPrice = meta.regularMarketPrice || quote?.close?.[quote.close?.length - 1] || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;
    const high = meta.regularMarketDayHigh || quote?.high?.[quote.high?.length - 1] || currentPrice;
    const low = meta.regularMarketDayLow || quote?.low?.[quote.low?.length - 1] || currentPrice;
    const open = meta.regularMarketOpen || quote?.open?.[0] || currentPrice;
    const volume = meta.regularMarketVolume || quote?.volume?.[quote.volume?.length - 1] || 0;

    // Determine currency based on exchange
    let currency = meta.currency || 'USD';
    let exchange = meta.exchangeName || 'Unknown';
    
    if (suffix === '.NS' || suffix === '.BO' || suffix === '.BSE') {
      currency = 'INR';
      exchange = suffix === '.NS' ? 'NSE' : 'BSE';
    }

    const stockData = {
      symbol: symbol.toUpperCase(),
      name: meta.shortName || meta.longName || symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      high: high,
      low: low,
      open: open,
      previousClose: previousClose,
      volume: volume,
      currency: currency,
      exchange: exchange,
      marketSuffix: suffix
    };

    console.log(`Successfully fetched data for ${symbol}:`, stockData);

    return new Response(
      JSON.stringify(stockData),
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
