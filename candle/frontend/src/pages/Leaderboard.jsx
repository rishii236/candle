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
  Trophy,
  Medal,
  Award,
  Star,
  Target,
  Flame,
  TrendingUp,
} from 'lucide-react';

function Leaderboard() {
  const { user, apiCall } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/leaderboard');
        setLeaderboard(response?.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [apiCall]);

  // Fetch user's rank
  useEffect(() => {
    const fetchMyRank = async () => {
      try {
        const response = await apiCall('/leaderboard/my-rank');
        setMyRank(response?.rank);
      } catch (error) {
        console.error('Failed to fetch user rank:', error);
      }
    };

    if (user) {
      fetchMyRank();
    }
  }, [apiCall, user]);

  // Get rank icon and styling for top 3
  const getRankDisplay = (rank) => {
    if (rank === 1) {
      return {
        icon: <Trophy className="size-6 text-yellow-500" />,
        bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }
    if (rank === 2) {
      return {
        icon: <Medal className="size-6 text-gray-400" />,
        bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800 border-gray-300'
      };
    }
    if (rank === 3) {
      return {
        icon: <Award className="size-6 text-orange-600" />,
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
        borderColor: 'border-orange-300',
        textColor: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800 border-orange-300'
      };
    }
    return {
      icon: <span className="text-lg font-bold text-muted-foreground">#{rank}</span>,
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900',
      badge: 'bg-gray-100 text-gray-700 border-gray-200'
    };
  };

  // Check if user is in top 3
  const isCurrentUser = (username) => user?.username === username;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you rank against other traders on CANDLE
          </p>
        </div>
      </div>

      {/* Current User Rank Card */}
      {myRank && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold">Rank #{myRank}</div>
                <div className="text-sm text-muted-foreground">
                  {user?.fullName || user?.username}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Points</div>
                  <div className="text-xl font-bold">{user?.stats?.totalPoints || 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="text-xl font-bold">
                    {user?.stats?.accuracyRate?.toFixed(1) || '0.0'}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Streak</div>
                  <div className="text-xl font-bold flex items-center gap-1">
                    <Flame className="size-4 text-orange-500" />
                    {user?.stats?.currentStreak || 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            Top Traders
          </CardTitle>
          <CardDescription>
            Rankings based on total points, accuracy, and predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No users on the leaderboard yet. Be the first to make predictions!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const rankDisplay = getRankDisplay(entry.rank);
                const isCurrent = isCurrentUser(entry.username);
                
                return (
                  <div
                    key={entry.username}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isCurrent 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : rankDisplay.borderColor
                    } ${rankDisplay.bgColor}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-16 h-16">
                        {rankDisplay.icon}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold text-lg truncate ${rankDisplay.textColor}`}>
                            {entry.fullName || entry.username}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{entry.username}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        {/* Total Points */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Star className="size-3" />
                            Points
                          </div>
                          <div className="text-lg font-bold">
                            {entry.stats.totalPoints.toLocaleString()}
                          </div>
                        </div>

                        {/* Accuracy */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <TrendingUp className="size-3" />
                            Accuracy
                          </div>
                          <div className="text-lg font-bold">
                            {entry.stats.accuracyRate.toFixed(1)}%
                          </div>
                        </div>

                        {/* Streak */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Flame className="size-3" />
                            Streak
                          </div>
                          <div className="text-lg font-bold text-orange-600">
                            {entry.stats.currentStreak}
                          </div>
                        </div>

                        {/* Predictions */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Target className="size-3" />
                            Predictions
                          </div>
                          <div className="text-sm font-medium">
                            {entry.stats.correctPredictions}/{entry.stats.totalPredictions}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Rankings Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">1. Total Points</span> - 
              Your primary ranking metric. Earn points by making accurate predictions.
            </p>
            <p>
              <span className="font-semibold text-foreground">2. Accuracy Rate</span> - 
              If tied on points, higher accuracy percentage wins.
            </p>
            <p>
              <span className="font-semibold text-foreground">3. Total Predictions</span> - 
              If still tied, more predictions places you higher (shows activity).
            </p>
            <p className="pt-2 text-xs">
              Only active users with at least 1 prediction are shown on the leaderboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Leaderboard;