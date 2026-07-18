import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Search,
  Target,
  Trophy,
  BarChart3,
  BookOpen,
  BarChart2,
  Brain,
  AlertTriangle,
  Signal,
  Settings,
  LogOut,
  MessageSquare,
} from 'lucide-react';

// Matches the section ids & icons inside LearningCenter.jsx exactly
const LEARNING_SECTIONS = [
  { id: 'stock-basics',         label: 'Stock Basics',          icon: BookOpen },
  { id: 'earnings-financials', label: 'Earnings & Financials', icon: BarChart2 },
  { id: 'beat-meet-miss',      label: 'Beat · Meet · Miss',    icon: Target },
  { id: 'prediction-strategy', label: 'Prediction Strategy',   icon: Brain },
  { id: 'common-mistakes',     label: 'Common Mistakes',       icon: AlertTriangle },
  { id: 'market-signals',      label: 'Market Signals',        icon: Signal },
];

function AppSidebar({ currentPage, currentLearningSection, onNavigate }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'stocks',         label: 'Stock Search',     icon: Search },
    { id: 'myPredictions',  label: 'My Predictions',  icon: Target },
    { id: 'community',      label: 'Community',        icon: MessageSquare },
    { id: 'leaderboard',    label: 'Leaderboard',      icon: Trophy },
    { id: 'analytics',      label: 'Analytics',        icon: BarChart3 },
    { id: 'learning',       label: 'Learning Center',  icon: BookOpen },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        {/* Branding */}
        <SidebarGroup>
          <div className="px-4 py-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              CANDLE
            </h2>
            <p className="text-xs text-muted-foreground">
              Earnings Prediction Platform
            </p>
          </div>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    isActive={currentPage === item.id}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learning Center sub-nav — only visible when on the learning page */}
        {currentPage === 'learning' && (
          <SidebarGroup>
            <SidebarGroupLabel>Learning Center</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {LEARNING_SECTIONS.map((section) => (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigate('learning', { section: section.id })}
                      isActive={currentLearningSection === section.id}
                    >
                      <section.icon className="size-4" />
                      <span>{section.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onNavigate('settings')}>
                  <Settings className="size-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold">
                {user?.fullName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;