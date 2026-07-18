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
import { RefreshCw, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

function AdminPanel() {
  const { apiCall } = useAuth();
  const [stats, setStats] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/stats');
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setMessage('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleEvaluateAll = async () => {
    if (!confirm('Evaluate all due predictions now?')) return;
    
    setEvaluating(true);
    setMessage('');
    
    try {
      const response = await apiCall('/admin/evaluate-all', {
        method: 'POST'
      });
      
      setMessage(`✅ Success! Evaluated ${response.evaluated} predictions`);
      await fetchStats(); // Refresh stats
      
      // Auto-clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Evaluation failed:', error);
      setMessage('❌ Evaluation failed: ' + error.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage prediction evaluations and view system stats
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <Card className={message.startsWith('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <p className={message.startsWith('✅') ? 'text-green-700' : 'text-red-700'}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Evaluation Statistics
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Current system status and pending evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-4">
              Loading stats...
            </div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="size-4" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting evaluation
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="size-4" />
                  <span className="text-sm font-medium">Locked</span>
                </div>
                <div className="text-2xl font-bold">{stats.locked}</div>
                <p className="text-xs text-muted-foreground">
                  Prediction window closed
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="size-4" />
                  <span className="text-sm font-medium">Evaluated</span>
                </div>
                <div className="text-2xl font-bold">{stats.evaluated}</div>
                <p className="text-xs text-muted-foreground">
                  Already scored
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2 bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 text-orange-600">
                  <RefreshCw className="size-4" />
                  <span className="text-sm font-medium">Due Now</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {stats.dueForEvaluation}
                </div>
                <p className="text-xs text-orange-600">
                  Ready to evaluate
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 text-purple-600">
                  <XCircle className="size-4" />
                  <span className="text-sm font-medium">Manual Required</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {stats.awaitingManualEvaluation}
                </div>
                <p className="text-xs text-purple-600">
                  EVENT predictions need input
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Failed to load statistics
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manually trigger evaluation processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Evaluate All Due Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Process all TIME_WINDOW and TARGET predictions that are ready
              </p>
            </div>
            <Button 
              onClick={handleEvaluateAll}
              disabled={evaluating || !stats?.dueForEvaluation}
            >
              {evaluating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4 mr-2" />
                  Evaluate Now
                </>
              )}
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">ℹ️ How It Works</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• TIME_WINDOW predictions are evaluated automatically when the window ends</li>
              <li>• TARGET predictions check if price target was hit before deadline</li>
              <li>• EVENT predictions require manual input (admin must provide actual result)</li>
              <li>• Evaluation runs automatically every 15 minutes via cron job</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPanel;