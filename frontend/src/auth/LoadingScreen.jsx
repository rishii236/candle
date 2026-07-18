import React from 'react';
import { Flame, Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <Flame className="size-8" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">CANDLE</h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <Loader2 className="size-6 animate-spin mx-auto" />
      </div>
    </div>
  );
}

export default LoadingScreen;