import {
  StatCard,
  MatchCard,
  QuickActionButton,
  EventCard,
  GlassCard,
} from '../../components/index.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

// TODO: Replace with actual API types
interface MatchData {
  playerName: string;
  playerAvatar: string;
  score: string;
  tournament: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface EventData {
  title: string;
  date: string;
  location: string;
}

export default function initRoute() {
  const profileRoot = document.querySelector('.profile-page') as HTMLElement;
  if (!profileRoot) return;
  profileRoot.innerHTML = '';

  // Main wrapper with gradient background
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  profileRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  renderHeader(mainWrapper);

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('main');
  mainContent.className = 'max-w-7xl mx-auto px-6 py-8';
  mainWrapper.appendChild(mainContent);

  const mainGrid = document.createElement('div');
  mainGrid.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6';
  mainContent.appendChild(mainGrid);

  // ===== LEFT COLUMN (Stats & Matches) =====
  const leftColumn = document.createElement('div');
  leftColumn.className = 'lg:col-span-2 space-y-6';
  mainGrid.appendChild(leftColumn);

  // Stats Grid
  const statsGrid = document.createElement('div');
  statsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  leftColumn.appendChild(statsGrid);

  // TODO: Replace with actual API call to fetch user stats
  const stats = [
    {
      icon: '🎯',
      label: 'Total Matches',
      value: '1,247',
      iconColor: 'text-foreground',
    },
    {
      icon: '📈',
      label: 'Win Rate',
      value: '73.2%',
      iconColor: 'text-foreground',
    },
    {
      icon: '🏆',
      label: 'Active Tour Rewards',
      value: '8',
      iconColor: 'text-accent',
    },
    {
      icon: '📊',
      label: 'Global Ranking',
      value: '#42',
      iconColor: 'text-foreground',
    },
  ];

  stats.forEach((stat) => {
    new StatCard(statsGrid, stat);
  });

  // Recent Matches
  renderRecentMatches(leftColumn);

  // ===== RIGHT COLUMN (Quick Actions & Events) =====
  const rightColumn = document.createElement('div');
  rightColumn.className = 'space-y-6';
  mainGrid.appendChild(rightColumn);

  // Quick Actions
  renderQuickActions(rightColumn);

  // Upcoming Events
  renderUpcomingEvents(rightColumn);

  // Achievement Card
  renderAchievement(rightColumn);
}

function renderHeader(container: HTMLElement): void {
  const header = document.createElement('header');
  header.className = 'border-b border-border backdrop-blur-glass bg-muted/30';

  const headerInner = document.createElement('div');
  headerInner.className = 'max-w-7xl mx-auto px-6 py-4';

  const flexContainer = document.createElement('div');
  flexContainer.className = 'flex items-center justify-between';

  // Left: Logo and Title
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center gap-3';
  leftDiv.innerHTML = `
    <div class="p-2 bg-accent rounded-lg">
      <svg class="w-6 h-6 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    </div>
    <h1 class="text-xl font-bold text-foreground">The Pong Game</h1>
  `;

  // Center: Navigation
  const nav = document.createElement('nav');
  nav.className = 'flex items-center gap-8';
  const navLinks = [
    { label: 'Tournament', href: '/tournaments', active: false },
    { label: 'Profile', href: '/profile', active: true },
    { label: 'Settings', href: '/settings', active: false },
  ];

  navLinks.forEach((link) => {
    const button = document.createElement('button');
    button.textContent = link.label;
    button.className = link.active
      ? 'text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md'
      : 'text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md';
    button.addEventListener('click', () => {
      if (window.navigateToRoute) window.navigateToRoute(link.href);
    });
    nav.appendChild(button);
  });

  flexContainer.appendChild(leftDiv);
  flexContainer.appendChild(nav);
  headerInner.appendChild(flexContainer);
  header.appendChild(headerInner);
  container.appendChild(header);
}

function renderRecentMatches(container: HTMLElement): void {
  const card = new GlassCard(container, {
    title: 'Recent Matches',
  });
  const body = card.getBodyElement();
  if (!body) return;

  // TODO: Replace with actual API call to fetch recent matches
  // Example API endpoint: GET /api/matches/recent
  const matches: MatchData[] = [
    {
      playerName: 'Sarah Chen',
      playerAvatar: '',
      score: '21-18',
      tournament: 'Spring Championship',
      difficulty: 'Easy',
    },
    {
      playerName: 'Mike Rodriguez',
      playerAvatar: '',
      score: '19-21',
      tournament: 'Weekly League',
      difficulty: 'Hard',
    },
    {
      playerName: 'Alex Thompson',
      playerAvatar: '',
      score: '21-15',
      tournament: 'Daily Challenge',
      difficulty: 'Easy',
    },
    {
      playerName: 'Emma Wilson',
      playerAvatar: '',
      score: '21-16',
      tournament: 'Spring Championship',
      difficulty: 'Medium',
    },
  ];

  // Matches list
  const matchesList = document.createElement('div');
  matchesList.className = 'space-y-3';
  body.appendChild(matchesList);

  matches.forEach((match) => {
    new MatchCard(matchesList, match);
  });
}

function renderQuickActions(container: HTMLElement): void {
  const card = new GlassCard(container, {
    title: 'Quick Actions',
  });
  const body = card.getBodyElement();
  if (!body) return;

  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'space-y-3';
  body.appendChild(actionsWrapper);

  const actions = [
    { icon: '🎮', label: 'Start New Match', href: '/game' },
    { icon: '👥', label: 'Join Tournament', href: '/tournaments' },
    { icon: '🎯', label: 'Find Players', href: '/profile' },
    { icon: '📊', label: 'View Stats', href: '/profile' },
  ];

  actions.forEach((action) => {
    new QuickActionButton(actionsWrapper, {
      icon: action.icon,
      label: action.label,
      onClick: () => {
        if (window.navigateToRoute) window.navigateToRoute(action.href);
      },
    });
  });
}

function renderUpcomingEvents(container: HTMLElement): void {
  const card = new GlassCard(container, {
    title: 'Upcoming Events',
  });
  const body = card.getBodyElement();
  if (!body) return;

  // TODO: Replace with actual API call to fetch upcoming events
  // Example API endpoint: GET /api/events/upcoming
  const events: EventData[] = [
    {
      title: 'Spring Finals',
      date: 'Tomorrow, 2:30 PM',
      location: 'Central Arena',
    },
    {
      title: 'Team League',
      date: 'Friday, 6:00 PM',
      location: 'North Court',
    },
    {
      title: 'Practice Session',
      date: 'Saturday, 10:00 AM',
      location: 'Service Venue',
    },
  ];

  const eventsList = document.createElement('div');
  eventsList.className = 'space-y-3';
  body.appendChild(eventsList);

  events.forEach((event) => {
    new EventCard(eventsList, event);
  });
}

function renderAchievement(container: HTMLElement): void {
  const achievementCard = document.createElement('div');
  achievementCard.className =
    'border-border bg-gradient-card backdrop-blur-glass p-6 shadow-glow rounded-2xl border text-center';
  container.appendChild(achievementCard);

  achievementCard.innerHTML = `
    <div class="mb-4 flex justify-center">
      <div class="p-4 bg-accent rounded-full">
        <svg class="w-8 h-8 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      </div>
    </div>
    <h3 class="text-lg font-bold text-foreground mb-1">Achievement Unlocked!</h3>
    <p class="text-sm text-muted-foreground">Win 5 matches in a row</p>
  `;
}
