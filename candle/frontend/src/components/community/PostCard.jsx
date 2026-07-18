import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare } from 'lucide-react';

function PostCard({ post, onLike }) {
  // Calculate time ago
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
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Header: Author + Ticker + Time */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-sm">
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
              {post.company} • {getTimeAgo(post.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3 text-sm leading-relaxed pl-[52px]">
        {post.content}
      </div>

      {/* Actions: Like */}
      <div className="flex items-center gap-2 pl-[52px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post._id)}
          className={`gap-1 ${post.isLikedByUser ? 'text-red-600' : ''}`}
        >
          <Heart 
            className={`size-4 ${post.isLikedByUser ? 'fill-red-600' : ''}`}
          />
          <span>{post.likeCount || 0}</span>
        </Button>

        {/* Placeholder for future reply feature */}
        <Button variant="ghost" size="sm" className="gap-1" disabled>
          <MessageSquare className="size-4" />
          <span className="text-xs text-muted-foreground">Reply (Coming Soon)</span>
        </Button>
      </div>
    </div>
  );
}

export default PostCard;