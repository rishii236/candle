export const menuItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: "Home",
    badge: null,
    isActive: true
  },
  {
    title: "Predictions",
    url: "#",
    icon: "Target",
    badge: "3 Active",
    isActive: false
  },
  {
    title: "Leaderboard",
    url: "#",
    icon: "Trophy",
    badge: null,
    isActive: false
  },
  {
    title: "Market Calendar",
    url: "#",
    icon: "Calendar",
    badge: "5 Today",
    isActive: false
  },
  {
    title: "Analytics",
    url: "#",
    icon: "BarChart3",
    badge: null,
    isActive: false
  },
  {
    title: "Community",
    url: "#",
    icon: "Users",
    badge: "12",
    isActive: false
  },
  {
    title: "Learning Hub",
    url: "#",
    icon: "BookOpen",
    badge: "New",
    isActive: false
  }
];

export const learningItems = [
  {
    title: "Stock Basics",
    url: "#",
    icon: "DollarSign",
  },
  {
    title: "Earnings Analysis",
    url: "#",
    icon: "PieChart",
  },
  {
    title: "Market Trends",
    url: "#",
    icon: "LineChart",
  },
  {
    title: "Portfolio Tips",
    url: "#",
    icon: "Briefcase",
  }
];

export const recentPredictions = [
  { company: "AAPL", prediction: "Beat", result: "Pending", points: "+100", status: "pending" },
  { company: "GOOGL", prediction: "Meet", result: "Beat", points: "-25", status: "wrong" },
  { company: "MSFT", prediction: "Beat", result: "Beat", points: "+150", status: "correct" },
  { company: "TSLA", prediction: "Miss", result: "Beat", points: "-25", status: "wrong" }
];

export const upcomingEarnings = [
  { company: "AMZN", date: "Today", time: "After Hours", sector: "E-commerce" },
  { company: "META", date: "Tomorrow", time: "Before Market", sector: "Social Media" },
  { company: "NFLX", date: "Oct 20", time: "After Hours", sector: "Streaming" }
];

export const communityPosts = [
  {
    user: "Sarah_Trader",
    content: "AAPL looking strong heading into earnings. Revenue growth in services segment is impressive!",
    time: "2h ago",
    reactions: 12
  },
  {
    user: "FinanceGuru",
    content: "Anyone else thinking TSLA might miss on delivery numbers? Supply chain issues might impact Q3.",
    time: "4h ago",
    reactions: 8
  },
  {
    user: "MarketWatcher",
    content: "Great analysis on META from the learning hub! Really helped understand social media metrics.",
    time: "6h ago",
    reactions: 15
  }
];