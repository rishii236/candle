import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Flame,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react';

const UserProfile = () => {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    avatar: user?.avatar || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    const result = await updateProfile({
      fullName: formData.fullName.trim(),
      avatar: formData.avatar.trim()
    });

    if (result.success) {
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setError(result.error);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit3 className="size-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-4">
              <Avatar className="size-20">
                <AvatarImage src={user.avatar} alt={user.fullName} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    type="url"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={loading}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="size-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Last login {formatDate(user.lastLogin)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Performance Statistics
            </CardTitle>
            <CardDescription>Your prediction performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="size-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {user.stats.currentStreak}
                </div>
                <div className="text-sm text-orange-600">Day Streak</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Star className="size-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold">
                  {user.stats.totalPoints.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="size-6 text-amber-600" />
                </div>
                <div className="text-2xl font-bold">
                  {user.stats.globalRank ? `#${user.stats.globalRank}` : 'Unranked'}
                </div>
                <div className="text-sm text-muted-foreground">Global Rank</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Target className="size-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold">
                  {user.stats.accuracyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Predictions:</span>
                  <span className="font-medium">{user.stats.totalPredictions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct Predictions:</span>
                  <span className="font-medium text-green-600">{user.stats.correctPredictions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wrong Predictions:</span>
                  <span className="font-medium text-red-600">
                    {user.stats.totalPredictions - user.stats.correctPredictions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <Badge variant={user.stats.accuracyRate >= 70 ? "default" : user.stats.accuracyRate >= 50 ? "secondary" : "destructive"}>
                    {user.stats.totalPredictions > 0 
                      ? `${((user.stats.correctPredictions / user.stats.totalPredictions) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;