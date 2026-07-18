import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Search, Zap } from 'lucide-react';

function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search companies, predictions..."
          className="flex-1 px-3 py-1 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
     
    </header>
  );
}

export default AppHeader;