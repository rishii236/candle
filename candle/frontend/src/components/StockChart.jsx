// components/StockChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function StockChart({ symbol, company }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState('1D');

  const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

  // Time range options
  const ranges = [
    { value: '1D', label: '1D', resolution: '5', days: 1 },
    { value: '5D', label: '5D', resolution: '15', days: 5 },
    { value: '1M', label: '1M', resolution: '60', days: 30 },
    { value: '3M', label: '3M', resolution: 'D', days: 90 },
    { value: '6M', label: '6M', resolution: 'D', days: 180 },
    { value: '1Y', label: '1Y', resolution: 'D', days: 365 },
  ];

  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) {
        setLoading(false);
        return;
      }

      if (!FINNHUB_API_KEY) {
        setError('API key not configured. Please add VITE_FINNHUB_API_KEY to your .env file');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const range = ranges.find(r => r.value === selectedRange);
        const now = Math.floor(Date.now() / 1000);
        const from = now - (range.days * 24 * 60 * 60);

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${range.resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`;
        
        console.log('Fetching chart data:', url);

        const response = await fetch(url);

        console.log('Response status:', response.status);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('API access forbidden. Please check your API key and account limits.');
          } else if (response.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
          } else {
            throw new Error(`Failed to fetch chart data (Status: ${response.status})`);
          }
        }

        const result = await response.json();
        console.log('Chart data result:', result);

        if (result.s === 'no_data' || !result.t || result.t.length === 0) {
          setError('No chart data available for this stock');
          setData([]);
          setLoading(false);
          return;
        }

        // Transform data for recharts
        const chartData = result.t.map((timestamp, index) => ({
          time: formatTime(timestamp, range.resolution),
          price: result.c[index],
          volume: result.v[index]
        }));

        setData(chartData);
      } catch (err) {
        console.error('Chart error:', err);
        setError(err.message || 'Failed to load chart data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, selectedRange, FINNHUB_API_KEY]);

  const formatTime = (timestamp, resolution) => {
    const date = new Date(timestamp * 1000);
    
    if (resolution === 'D' || resolution === 'W') {
      // For daily/weekly, show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For intraday, show time
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  const formatPrice = (value) => {
    return `$${value.toFixed(2)}`;
  };

  const formatYAxis = (value) => {
    return `$${value.toFixed(0)}`;
  };

  // Calculate price change
  const priceChange = data.length > 0 ? data[data.length - 1].price - data[0].price : 0;
  const priceChangePercent = data.length > 0 ? (priceChange / data[0].price) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {symbol} - {company}
            </CardTitle>
            {!loading && data.length > 0 && (
              <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
                ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </div>
            )}
          </div>
          
          {/* Range selector */}
          <div className="flex gap-1">
            {ranges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
                className="px-3 py-1 text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : error ? (
          <div className="h-[300px] flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-red-600 text-center">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip 
                formatter={(value) => formatPrice(value)}
                labelStyle={{ color: '#000' }}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={priceChange >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default StockChart;