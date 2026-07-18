import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target, TrendingUp, AlertCircle, Calendar, Clock, TrendingDown } from 'lucide-react';

function Predictions({ selectedStock, onNavigate }) {
  const { apiCall } = useAuth();

  // Prediction type selection
  const [predictionType, setPredictionType] = useState('');

  // Common form state
  const [confidence, setConfidence] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // EVENT-BASED state
  const [eventType, setEventType] = useState('earnings');
  const [eventDate, setEventDate] = useState('');
  const [eventOutcome, setEventOutcome] = useState('');

  // TIME-WINDOW state
  const [timeWindow, setTimeWindow] = useState('');
  const [priceDirection, setPriceDirection] = useState('');

  // TARGET-PRICE state
  const [targetPrice, setTargetPrice] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Reset form when prediction type changes
  useEffect(() => {
    setError(null);
    setConfidence('3');
    
    // Reset type-specific fields
    setEventType('earnings');
    setEventDate('');
    setEventOutcome('');
    setTimeWindow('');
    setPriceDirection('');
    setTargetPrice('');
    setTargetDate('');
  }, [predictionType]);

  // Redirect if no stock selected
  if (!selectedStock) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-600" />
              <p className="text-sm text-orange-600">
                No stock selected. Please search for a stock first.
              </p>
            </div>
            <Button
              onClick={() => onNavigate('stocks')}
              className="mt-4"
              variant="outline"
            >
              Go to Stock Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate common fields
    if (!predictionType || !confidence) {
      setError('Please select a prediction type and confidence level');
      return;
    }

    // Build request body based on prediction type
    let requestBody = {
      ticker: selectedStock.symbol,
      company: selectedStock.company,
      predictionType,
      confidence: parseInt(confidence),
    };

    // Type-specific validation and data
    if (predictionType === 'EVENT') {
      if (!eventType || !eventDate || !eventOutcome) {
        setError('Please fill in all event prediction fields');
        return;
      }
      requestBody = {
        ...requestBody,
        eventType,
        eventDate,
        eventOutcome,
      };
    } else if (predictionType === 'TIME_WINDOW') {
      if (!timeWindow || !priceDirection) {
        setError('Please fill in all time window fields');
        return;
      }
      requestBody = {
        ...requestBody,
        timeWindow,
        priceDirection,
        startPrice: selectedStock.currentPrice,
      };
    } else if (predictionType === 'TARGET') {
      if (!targetPrice || !targetDate) {
        setError('Please fill in all target price fields');
        return;
      }
      
      const targetPriceNum = parseFloat(targetPrice);
      if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
        setError('Target price must be a positive number');
        return;
      }
      
      requestBody = {
        ...requestBody,
        targetPrice: targetPriceNum,
        targetDate,
        entryPrice: selectedStock.currentPrice,
      };
    }

    setSubmitting(true);

    try {
      const response = await apiCall('/predictions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (response) {
        // Success - navigate to dashboard
        onNavigate('dashboard');
      }
    } catch (err) {
      console.error('Failed to submit prediction:', err);
      setError(err.message || 'Failed to submit prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  // Get minimum date for event/target (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Make a Prediction</h1>
        <p className="text-muted-foreground">
          Choose your prediction strategy for {selectedStock.company}
        </p>
      </div>

      {/* Selected Stock Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Selected Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl">{selectedStock.symbol}</span>
                  <span className="text-muted-foreground">
                    {selectedStock.company}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">
                Current Price: {formatPrice(selectedStock.currentPrice)}
              </span>
              <span
                className={`flex items-center gap-1 ${
                  selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className="size-4" />
                {formatPrice(Math.abs(selectedStock.change))} (
                {formatPercent(selectedStock.changePercent)})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Prediction Type</CardTitle>
          <CardDescription>
            Choose how you want to predict this stock's performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* EVENT Card */}
            <button
              onClick={() => setPredictionType('EVENT')}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                predictionType === 'EVENT'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="size-6 mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Event-Based</h3>
              <p className="text-xs text-muted-foreground">
                Predict earnings or event outcomes (Beat/Meet/Miss)
              </p>
            </button>

            {/* TIME WINDOW Card */}
            <button
              onClick={() => setPredictionType('TIME_WINDOW')}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                predictionType === 'TIME_WINDOW'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="size-6 mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">Time Window</h3>
              <p className="text-xs text-muted-foreground">
                Predict price direction over 1D, 7D, or 30D
              </p>
            </button>

            {/* TARGET PRICE Card */}
            <button
              onClick={() => setPredictionType('TARGET')}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                predictionType === 'TARGET'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingDown className="size-6 mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">Target Price</h3>
              <p className="text-xs text-muted-foreground">
                Set a target price and deadline
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Prediction Form */}
      {predictionType && (
        <Card>
          <CardHeader>
            <CardTitle>
              {predictionType === 'EVENT' && 'Event Prediction Details'}
              {predictionType === 'TIME_WINDOW' && 'Time Window Prediction'}
              {predictionType === 'TARGET' && 'Target Price Prediction'}
            </CardTitle>
            <CardDescription>
              {predictionType === 'EVENT' && 'Predict how the company will perform at their next event'}
              {predictionType === 'TIME_WINDOW' && 'Predict the price movement over a specific time period'}
              {predictionType === 'TARGET' && 'Set your target price and date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company & Ticker (Read-only) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={selectedStock.company}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker</Label>
                  <Input
                    id="ticker"
                    value={selectedStock.symbol}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* EVENT-BASED FIELDS */}
              {predictionType === 'EVENT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type *</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earnings">Earnings Report</SelectItem>
                        <SelectItem value="product_launch">Product Launch</SelectItem>
                        <SelectItem value="other">Other Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      min={getMinDate()}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your prediction will lock 24 hours before this date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventOutcome">Prediction *</Label>
                    <Select value={eventOutcome} onValueChange={setEventOutcome}>
                      <SelectTrigger id="eventOutcome">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beat">Beat - Exceed Expectations</SelectItem>
                        <SelectItem value="Meet">Meet - Match Expectations</SelectItem>
                        <SelectItem value="Miss">Miss - Fall Short of Expectations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* TIME-WINDOW FIELDS */}
              {predictionType === 'TIME_WINDOW' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="timeWindow">Time Window *</Label>
                    <Select value={timeWindow} onValueChange={setTimeWindow}>
                      <SelectTrigger id="timeWindow">
                        <SelectValue placeholder="Select time window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1D">1 Day</SelectItem>
                        <SelectItem value="7D">7 Days</SelectItem>
                        <SelectItem value="30D">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startPrice">Starting Price</Label>
                    <Input
                      id="startPrice"
                      value={formatPrice(selectedStock.currentPrice)}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current market price (locks immediately)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priceDirection">Price Direction *</Label>
                    <Select value={priceDirection} onValueChange={setPriceDirection}>
                      <SelectTrigger id="priceDirection">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UP">UP - Price will increase</SelectItem>
                        <SelectItem value="DOWN">DOWN - Price will decrease</SelectItem>
                        <SelectItem value="FLAT">FLAT - Price stays within ±2%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* TARGET-PRICE FIELDS */}
              {predictionType === 'TARGET' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input
                      id="entryPrice"
                      value={formatPrice(selectedStock.currentPrice)}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current market price
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetPrice">Target Price *</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The price you predict the stock will reach
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date *</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      min={getMinDate()}
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Stock must reach target price before this date
                    </p>
                  </div>
                </>
              )}

              {/* Confidence (Common to all types) */}
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence Level *</Label>
                <Select value={confidence} onValueChange={setConfidence}>
                  <SelectTrigger id="confidence">
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low Confidence</SelectItem>
                    <SelectItem value="2">2 - Low Confidence</SelectItem>
                    <SelectItem value="3">3 - Medium Confidence</SelectItem>
                    <SelectItem value="4">4 - High Confidence</SelectItem>
                    <SelectItem value="5">5 - Very High Confidence</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Higher confidence multiplies your points but increases risk
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate('stocks')}
                  disabled={submitting}
                >
                  Back to Search
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Prediction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Predictions;