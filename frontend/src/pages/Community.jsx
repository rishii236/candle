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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, TrendingUp, Users, AlertCircle } from 'lucide-react';
import CreatePost from '../components/community/CreatePost';
import PostCard from '../components/community/PostCard';

function Community({ onNavigate }) {
  const { apiCall } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filterTicker, setFilterTicker] = useState('');

  // Fetch community feed
  useEffect(() => {
    fetchPosts();
  }, [filterTicker]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = filterTicker ? `?ticker=${filterTicker}` : '';
      const response = await apiCall(`/community${query}`);
      setPosts(response?.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load community posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle new post creation
  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  // Handle like toggle
  const handleLikeToggle = async (postId) => {
    try {
      const response = await apiCall(`/community/${postId}/like`, {
        method: 'POST'
      });

      if (response?.success) {
        // Update post in local state
        setPosts(posts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLikedByUser: response.isLiked,
                likeCount: response.likeCount 
              }
            : post
        ));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="size-8" />
            Community
          </h1>
          <p className="text-muted-foreground">
            Discuss upcoming earnings and share your predictions with fellow traders
          </p>
        </div>
        <Button onClick={() => setShowCreatePost(!showCreatePost)}>
          <MessageSquare className="size-4 mr-2" />
          {showCreatePost ? 'Cancel' : 'Create Post'}
        </Button>
      </div>

      {/* Community Guidelines */}
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>Community Guidelines:</strong> Focus on stock analysis and earnings predictions. 
          Share why you chose Beat, Meet, or Miss. No spam, no portfolio discussion.
        </AlertDescription>
      </Alert>

      {/* Create Post Form */}
      {showCreatePost && (
        <CreatePost onPostCreated={handlePostCreated} onCancel={() => setShowCreatePost(false)} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Posts
            </CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-xs text-muted-foreground">
              Active discussions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Traders
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(posts.map(p => p.author?.username)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Contributing today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trending Stock
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (posts.length === 0) return 'N/A';
                const tickerCounts = posts.reduce((acc, post) => {
                  acc[post.ticker] = (acc[post.ticker] || 0) + 1;
                  return acc;
                }, {});
                const sortedTickers = Object.entries(tickerCounts).sort((a, b) => b[1] - a[1]);
                return sortedTickers[0]?.[0] || 'N/A';
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Most discussed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Community Feed</CardTitle>
          <CardDescription>
            Latest thoughts and predictions from the CANDLE community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="size-12 mx-auto mb-4 opacity-20" />
              <p>No posts yet. Be the first to share your thoughts!</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreatePost(true)}
              >
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onLike={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Community;