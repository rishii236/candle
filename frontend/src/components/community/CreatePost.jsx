import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Send } from 'lucide-react';

function CreatePost({ onPostCreated, onCancel }) {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    ticker: '',
    company: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-uppercase ticker
    if (name === 'ticker') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.ticker.trim() || !formData.company.trim() || !formData.content.trim()) {
      setError('All fields are required');
      return;
    }

    if (formData.content.length > 300) {
      setError('Content must be 300 characters or less');
      return;
    }

    if (!/^[A-Z]+$/.test(formData.ticker)) {
      setError('Ticker must contain only letters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall('/community', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response?.success) {
        // Clear form
        setFormData({ ticker: '', company: '', content: '' });
        // Notify parent
        onPostCreated(response.post);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = formData.content.length;
  const characterLimit = 300;
  const isOverLimit = characterCount > characterLimit;

  return (
    <Card className="border-2 border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
        <CardDescription>
          Share your thoughts on an upcoming earnings report
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Ticker Input */}
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input
                id="ticker"
                name="ticker"
                placeholder="AAPL"
                value={formData.ticker}
                onChange={handleChange}
                maxLength={10}
                required
                className="uppercase"
              />
            </div>

            {/* Company Input */}
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                placeholder="Apple Inc."
                value={formData.company}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Thoughts</Label>
            <textarea
              id="content"
              name="content"
              placeholder="Share why you think they'll beat, meet, or miss earnings..."
              value={formData.content}
              onChange={handleChange}
              rows={4}
              maxLength={300}
              required
              className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Max 300 characters. Focus on earnings analysis.
              </p>
              <p className={`text-xs font-medium ${
                isOverLimit ? 'text-red-600' : 
                characterCount > 250 ? 'text-orange-600' : 
                'text-muted-foreground'
              }`}>
                {characterCount}/{characterLimit}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || isOverLimit}
              className="flex-1"
            >
              {loading ? (
                'Posting...'
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreatePost;