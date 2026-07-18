import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Flame,
  Star,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Trophy,
  Calendar,
} from 'lucide-react';

function Analytics() {
  const { apiCall } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/analytics/overview');
        setAnalytics(response);
        setHasData(response?.hasData !== false);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiCall]);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-medium">Loading analytics...</div>
            <div className="text-sm text-muted-foreground mt-2">
              Calculating your prediction performance
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData || !analytics?.hasData) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Analytics</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
              <p className="text-muted-foreground">
                Start making predictions to see your performance analytics!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, byPredictionType, byConfidence, byType, points, streaks, monthly, topStocks } = analytics;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Understand your prediction performance and improve your strategy
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Predictions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPredictions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.evaluated} evaluated • {summary.pending} pending
            </p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Accuracy Rate
            </CardTitle>
            <Activity className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summary.accuracy}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              {summary.correct} correct • {summary.wrong} wrong
            </p>
          </CardContent>
        </Card>

        {/* Net Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Points</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              points.net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {points.net >= 0 ? '+' : ''}{points.net}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {points.average > 0 ? '+' : ''}{points.average} avg per prediction
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Current Streak
            </CardTitle>
            <Flame className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {streaks.current}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Longest: {streaks.longest}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Points Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Points Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Points Breakdown
            </CardTitle>
            <CardDescription>Earned vs lost points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-green-600" />
                <span className="font-medium">Points Earned</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                +{points.earned}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-5 text-red-600" />
                <span className="font-medium">Points Lost</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                -{points.lost}
              </span>
            </div>

            {points.best && (
              <div className="pt-3 border-t">
                <div className="text-sm font-medium mb-2">Best Prediction</div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div>
                    <div className="font-bold">{points.best.ticker}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(points.best.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    +{points.best.points} pts
                  </Badge>
                </div>
              </div>
            )}

            {points.worst && points.worst.points < 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Worst Prediction</div>
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
                  <div>
                    <div className="font-bold">{points.worst.ticker}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(points.worst.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {points.worst.points} pts
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prediction Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" />
              Prediction Types
            </CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">Event-Based</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{byType.EVENT}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((byType.EVENT / summary.totalPredictions) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Time Window</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{byType.TIME_WINDOW}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((byType.TIME_WINDOW / summary.totalPredictions) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-sm font-medium">Target Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{byType.TARGET}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((byType.TARGET / summary.totalPredictions) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Visual bar representation */}
            <div className="pt-4 border-t">
              <div className="h-4 flex rounded overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(byType.EVENT / summary.totalPredictions) * 100}%` }}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(byType.TIME_WINDOW / summary.totalPredictions) * 100}%` }}
                ></div>
                <div 
                  className="bg-purple-500" 
                  style={{ width: `${(byType.TARGET / summary.totalPredictions) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beat/Meet/Miss Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Outcome Distribution (Event Predictions)
          </CardTitle>
          <CardDescription>
            Your Beat/Meet/Miss prediction performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Beat */}
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-green-700">Beat</span>
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {byPredictionType.Beat.total}
                </div>
                <div className="text-xs text-green-600">
                  {byPredictionType.Beat.correct} correct • {byPredictionType.Beat.wrong} wrong
                  {byPredictionType.Beat.pending > 0 && ` • ${byPredictionType.Beat.pending} pending`}
                </div>
                {(byPredictionType.Beat.correct + byPredictionType.Beat.wrong) > 0 && (
                  <div className="text-sm font-medium mt-2">
                    Accuracy: {((byPredictionType.Beat.correct / (byPredictionType.Beat.correct + byPredictionType.Beat.wrong)) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Meet */}
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-yellow-700">Meet</span>
                <Activity className="size-5 text-yellow-600" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-700">
                  {byPredictionType.Meet.total}
                </div>
                <div className="text-xs text-yellow-600">
                  {byPredictionType.Meet.correct} correct • {byPredictionType.Meet.wrong} wrong
                  {byPredictionType.Meet.pending > 0 && ` • ${byPredictionType.Meet.pending} pending`}
                </div>
                {(byPredictionType.Meet.correct + byPredictionType.Meet.wrong) > 0 && (
                  <div className="text-sm font-medium mt-2">
                    Accuracy: {((byPredictionType.Meet.correct / (byPredictionType.Meet.correct + byPredictionType.Meet.wrong)) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Miss */}
            <div className="p-4 border rounded-lg bg-red-50 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-red-700">Miss</span>
                <TrendingDown className="size-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-700">
                  {byPredictionType.Miss.total}
                </div>
                <div className="text-xs text-red-600">
                  {byPredictionType.Miss.correct} correct • {byPredictionType.Miss.wrong} wrong
                  {byPredictionType.Miss.pending > 0 && ` • ${byPredictionType.Miss.pending} pending`}
                </div>
                {(byPredictionType.Miss.correct + byPredictionType.Miss.wrong) > 0 && (
                  <div className="text-sm font-medium mt-2">
                    Accuracy: {((byPredictionType.Miss.correct / (byPredictionType.Miss.correct + byPredictionType.Miss.wrong)) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Analysis & Top Stocks */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Confidence Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5" />
              Confidence Analysis
            </CardTitle>
            <CardDescription>
              How your confidence correlates with accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(level => {
                const data = byConfidence[level];
                const hasData = data.total > 0;
                
                return (
                  <div key={level} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        {[...Array(level)].map((_, i) => (
                          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[...Array(5 - level)].map((_, i) => (
                          <Star key={i} className="size-4 text-gray-300" />
                        ))}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Level {level}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.total} predictions
                        </div>
                      </div>
                    </div>
                    {hasData && (
                      <Badge variant={data.accuracy >= 60 ? "default" : "secondary"}>
                        {data.accuracy}% accuracy
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Stocks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5" />
              Top Performing Stocks
            </CardTitle>
            <CardDescription>
              Stocks where you've earned the most points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topStocks && topStocks.length > 0 ? (
              <div className="space-y-3">
                {topStocks.map((stock, index) => (
                  <div key={stock.ticker} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold">{stock.ticker}</div>
                        <div className="text-xs text-muted-foreground">
                          {stock.total} predictions • {stock.accuracy}% accuracy
                        </div>
                      </div>
                    </div>
                    <Badge variant={stock.points >= 0 ? "default" : "destructive"}>
                      {stock.points >= 0 ? '+' : ''}{stock.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No stock data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      {monthly && monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>
              Track your performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthly.slice().reverse().map(month => (
                <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-bold">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {month.total} predictions • {month.correct} correct • {month.wrong} wrong
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                      <div className="text-lg font-bold">{month.accuracy}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Points</div>
                      <div className={`text-lg font-bold ${
                        month.points >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {month.points >= 0 ? '+' : ''}{month.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Analytics;