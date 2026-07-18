import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

function Stocks({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get Finnhub API key from environment variable
  const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

  // Debounced search function
  const searchStocks = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    if (!FINNHUB_API_KEY) {
      setError('API key not configured. Please add VITE_FINNHUB_API_KEY to your .env file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search for stock symbols
      const searchResponse = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search stocks');
      }

      const searchData = await searchResponse.json();
      
      // Filter to US stocks only and limit results
      const usStocks = (searchData.result || [])
        .filter(stock => stock.type === 'Common Stock' && !stock.symbol.includes('.'))
        .slice(0, 10);

      // Fetch quote data for each stock
      const stocksWithQuotes = await Promise.all(
        usStocks.map(async (stock) => {
          try {
            const quoteResponse = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`
            );
            const quoteData = await quoteResponse.json();

            return {
              symbol: stock.symbol,
              description: stock.description,
              currentPrice: quoteData.c || 0,
              change: quoteData.d || 0,
              changePercent: quoteData.dp || 0,
              previousClose: quoteData.pc || 0,
            };
          } catch (err) {
            console.error(`Failed to fetch quote for ${stock.symbol}:`, err);
            return null;
          }
        })
      );

      // Filter out failed requests
      const validStocks = stocksWithQuotes.filter(stock => stock !== null);
      setSearchResults(validStocks);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search stocks. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [FINNHUB_API_KEY]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStocks(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchStocks]);

  const handleSelectStock = (stock) => {
    // Navigate to predictions page with selected stock data
    onNavigate('predictions', { 
      selectedStock: {
        symbol: stock.symbol,
        company: stock.description,
        currentPrice: stock.currentPrice,
        change: stock.change,
        changePercent: stock.changePercent
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Search</h1>
        <p className="text-muted-foreground">
          Search for stocks to make earnings predictions
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Stocks</CardTitle>
          <CardDescription>
            Enter a company name or stock symbol (e.g., AAPL, Tesla, Microsoft)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Searching...</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {!loading && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Select a stock to make a prediction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleSelectStock(stock)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{stock.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {stock.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        {formatPrice(stock.currentPrice)}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                        {formatPrice(Math.abs(stock.change))} (
                        {formatPercent(stock.changePercent)})
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && searchQuery && searchResults.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No stocks found. Try a different search term.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!loading && !error && !searchQuery && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Start typing to search for stocks
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Stocks;