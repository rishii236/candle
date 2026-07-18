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
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Target,
  Flame,
  Star,
  Trophy,
  Activity,
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
} from 'lucide-react';
import { upcomingEarnings } from '../data/dashboardData';

function Dashboard({ onNavigate }) {
  const { user, apiCall } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  
  // Fetch recent predictions from backend
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoadingPredictions(true);
        const response = await apiCall('/predictions?limit=5');
        setPredictions(response?.predictions || []);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        setPredictions([]);
      } finally {
        setLoadingPredictions(false);
      }
    };

    fetchPredictions();
  }, [apiCall]);

  // Fetch recent community posts from backend
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        setLoadingCommunity(true);
        const response = await apiCall('/community?limit=3');
        setCommunityPosts(response?.posts || []);
      } catch (error) {
        console.error('Failed to fetch community posts:', error);
        setCommunityPosts([]);
      } finally {
        setLoadingCommunity(false);
      }
    };

    fetchCommunityPosts();
  }, [apiCall]);

  // Use real user stats from backend with safe fallbacks
  const activeStreak = user?.stats?.currentStreak || 0;
  const totalPoints = user?.stats?.totalPoints || 0;
  const rank = user?.stats?.globalRank;
  const accuracyRate = user?.stats?.accuracyRate != null 
    ? Number(user.stats.accuracyRate).toFixed(1)
    : '0.0';

  // Get prediction type badge
  const getPredictionTypeBadge = (type) => {
    const badges = {
      EVENT: { label: 'Event', color: 'bg-blue-100 text-blue-700' },
      TIME_WINDOW: { label: 'Time', color: 'bg-green-100 text-green-700' },
      TARGET: { label: 'Target', color: 'bg-purple-100 text-purple-700' }
    };
    return badges[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  // Get prediction details based on type
  const getPredictionDetails = (prediction) => {
    if (prediction.predictionType === 'EVENT') {
      const outcome = prediction.eventPrediction || prediction.eventOutcome;
      return `Predict: ${outcome}`;
    } else if (prediction.predictionType === 'TIME_WINDOW') {
      const direction = prediction.priceDirection || prediction.direction;
      return `${prediction.timeWindow} ${direction}`;
    } else if (prediction.predictionType === 'TARGET') {
      const target = prediction.targetPrice;
      return `Target: $${target ? target.toFixed(2) : 'N/A'}`;
    }
    return 'N/A';
  };

  // Get result icon for Beat/Meet/Miss
  const getResultIcon = (result) => {
    if (result === 'Beat') return <TrendingUp className="size-3 inline" />;
    if (result === 'Miss') return <TrendingDown className="size-3 inline" />;
    if (result === 'Meet') return <Minus className="size-3 inline" />;
    return null;
  };

  // Format status for display
  const formatStatus = (prediction) => {
    if (prediction.status === 'pending') return 'Pending';
    if (prediction.status === 'locked') return 'Locked';
    
    if (prediction.status === 'evaluated') {
      if (prediction.actualResult) {
        return prediction.actualResult;
      }
      return prediction.isCorrect ? 'Correct ✓' : 'Wrong ✗';
    }
    
    return prediction.status;
  };

  // Get badge variant based on Beat/Meet/Miss
  const getStatusVariant = (prediction) => {
    if (prediction.status === 'evaluated') {
      if (prediction.actualResult === 'Beat') return 'default';
      if (prediction.actualResult === 'Meet') return 'secondary';
      if (prediction.actualResult === 'Miss') return 'destructive';
      
      return prediction.isCorrect ? 'default' : 'destructive';
    }
    if (prediction.status === 'locked') return 'outline';
    return 'secondary';
  };

  const formatPoints = (points) => {
    if (points == null || points === 0) return '0';
    return points > 0 ? `+${points}` : `${points}`;
  };

  // Calculate time ago for community posts
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return Math.floor(seconds) + 's ago';
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Trader'}!
          </h1>
          <p className="text-muted-foreground">
            Ready to make some predictions? Let's see how your portfolio performs today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="size-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm" onClick={() => onNavigate('stocks')}>
            <Target className="size-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Current Streak
            </CardTitle>
            <Flame className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{activeStreak} days</div>
            <p className="text-xs text-orange-600">
              Keep it going!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Points
            </CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Your lifetime score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Global Rank
            </CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rank != null ? `#${rank}` : '—'}
            </div>
            <p className="text-xs text-green-600">
              Keep climbing!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accuracy Rate
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyRate}%</div>
            <p className="text-xs text-green-600">
              Great accuracy!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Predictions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5" />
                  Recent Predictions
                </CardTitle>
                <CardDescription>
                  Your latest predictions and results
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('myPredictions')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPredictions ? (
              <div className="text-center text-muted-foreground py-4">
                Loading predictions...
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No predictions yet. Start making predictions!
              </div>
            ) : (
              predictions.map((prediction) => {
                const typeBadge = getPredictionTypeBadge(prediction.predictionType);
                const showBeatMeetMiss = prediction.status === 'evaluated' && prediction.actualResult;
                
                return (
                  <div 
                    key={prediction._id} 
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{prediction.ticker}</span>
                        <span className={`text-xs px-2 py-1 rounded ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </div>
                      <Badge variant={getStatusVariant(prediction)}>
                        {showBeatMeetMiss ? (
                          <span className="flex items-center gap-1">
                            {getResultIcon(prediction.actualResult)}
                            {prediction.actualResult}
                          </span>
                        ) : (
                          formatStatus(prediction)
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {getPredictionDetails(prediction)}
                      </span>
                      <span className={`font-medium ${
                        prediction.points > 0 ? 'text-green-600' : 
                        prediction.points < 0 ? 'text-red-600' : 
                        'text-muted-foreground'
                      }`}>
                        {formatPoints(prediction.points)}
                      </span>
                    </div>
                    {prediction.status === 'evaluated' && prediction.resultDetails && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {prediction.resultDetails}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Upcoming Earnings
            </CardTitle>
            <CardDescription>
              Companies reporting earnings soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEarnings.map((earning, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{earning.company}</div>
                  <div className="text-sm text-muted-foreground">{earning.sector}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">{earning.date}</div>
                  <div className="text-xs text-muted-foreground">{earning.time}</div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <Calendar className="size-4 mr-2" />
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Community Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Community Activity
          </CardTitle>
          <CardDescription>
            Latest discussions and insights from the CANDLE community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCommunity ? (
            <div className="text-center text-muted-foreground py-4">
              Loading community posts...
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="size-12 mx-auto mb-4 opacity-20" />
              <p className="mb-4">No community posts yet. Be the first to share!</p>
              <Button 
                variant="outline"
                onClick={() => onNavigate('community')}
              >
                <MessageSquare className="size-4 mr-2" />
                Go to Community
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <div key={post._id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* Author Avatar */}
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-xs">
                          {post.author?.fullName?.[0] || post.author?.username?.[0] || 'U'}
                        </div>
                        
                        {/* Author Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {post.author?.fullName || post.author?.username || 'Anonymous'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {post.ticker}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-sm leading-relaxed pl-11 mb-2">
                      {post.content}
                    </div>

                    {/* Like count */}
                    <div className="flex items-center gap-2 pl-11">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="size-3" />
                        <span>{post.likeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onNavigate('community')}
              >
                <Users className="size-4 mr-2" />
                View Full Community Feed
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;