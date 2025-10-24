import {
  StatCard,
  MatchCard,
  QuickActionButton,
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
  result: 'win' | 'loss';
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

  // TODO: Replace with actual API calls to fetch user stats
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
      label: 'Tournaments',
      value: '12',
      iconColor: 'text-accent',
    },
    {
      icon: '👥',
      label: 'Active Friends',
      value: '28',
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

  // Friends List
  renderFriendsList(rightColumn);
}

function renderHeader(container: HTMLElement): void {
  const header = document.createElement('header');
  header.className =
    'border-b border-border backdrop-blur-glass bg-muted/30 relative z-40';

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

  // Right-aligned Navigation
  const nav = document.createElement('nav');
  nav.className = 'flex items-center gap-8 ml-auto';
  const navLinks = [
    { label: 'Tournament', href: '/tournaments', active: false },
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

  // Right: Profile Dropdown
  const rightDiv = document.createElement('div');
  rightDiv.className = 'relative';

  // Profile Avatar Button
  const avatarButton = document.createElement('button');
  avatarButton.className =
    'w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover:opacity-80 transition-opacity';
  avatarButton.innerHTML = `
    <svg class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;

  // Dropdown Menu
  const dropdown = document.createElement('div');
  dropdown.className =
    'hidden absolute right-0 mt-2 w-48 rounded-lg border border-border shadow-glow overflow-hidden';
  dropdown.style.top = '100%';
  dropdown.style.zIndex = '9999';
  dropdown.style.backgroundColor = 'hsl(262, 83%, 25%)'; // Solid dark purple background
  dropdown.innerHTML = `
    <div class="py-1">
      <button class="w-full px-4 py-2 text-left text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2" data-action="settings">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Settings
      </button>
      <button class="w-full px-4 py-2 text-left text-white hover:bg-muted/50 transition-colors flex items-center gap-2" data-action="logout">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </div>
  `;

  // Toggle dropdown visibility
  let isOpen = false;
  avatarButton.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) {
      dropdown.classList.remove('hidden');
    } else {
      dropdown.classList.add('hidden');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!rightDiv.contains(e.target as Node) && isOpen) {
      isOpen = false;
      dropdown.classList.add('hidden');
    }
  });

  // Handle dropdown actions
  const settingsBtn = dropdown.querySelector('[data-action="settings"]');
  const logoutBtn = dropdown.querySelector('[data-action="logout"]');

  settingsBtn?.addEventListener('click', () => {
    if (window.navigateToRoute) window.navigateToRoute('/settings');
    dropdown.classList.add('hidden');
    isOpen = false;
  });

  logoutBtn?.addEventListener('click', () => {
    // TODO: Add logout API call here
    console.log('Logout clicked');
    if (window.navigateToRoute) window.navigateToRoute('/login');
    dropdown.classList.add('hidden');
    isOpen = false;
  });

  rightDiv.appendChild(avatarButton);
  rightDiv.appendChild(dropdown);

  flexContainer.appendChild(leftDiv);
  flexContainer.appendChild(nav);
  flexContainer.appendChild(rightDiv);
  headerInner.appendChild(flexContainer);
  header.appendChild(headerInner);
  container.appendChild(header);
}

function renderRecentMatches(container: HTMLElement): void {
  const card = new GlassCard(container, {
    title: 'Match History',
  });
  const body = card.getBodyElement();
  if (!body) return;

  // TODO: Replace with actual API call to fetch match history with pagination
  // Example API endpoint: GET /api/matches/history?page=1&limit=10
  const matches: MatchData[] = [
    {
      playerName: 'Sarah Chen',
      playerAvatar: '',
      score: '21-18',
      tournament: 'Spring Championship',
      result: 'win',
    },
    {
      playerName: 'Mike Rodriguez',
      playerAvatar: '',
      score: '19-21',
      tournament: 'Weekly League',
      result: 'loss',
    },
    {
      playerName: 'Alex Thompson',
      playerAvatar: '',
      score: '21-15',
      tournament: 'Daily Challenge',
      result: 'win',
    },
    {
      playerName: 'Emma Wilson',
      playerAvatar: '',
      score: '21-16',
      tournament: 'Spring Championship',
      result: 'win',
    },
  ];

  // Matches list
  const matchesList = document.createElement('div');
  matchesList.className = 'space-y-3';
  body.appendChild(matchesList);

  matches.forEach((match) => {
    new MatchCard(matchesList, match);
  });

  // TODO: Show pagination only if total matches > 10
  // Pagination arrows
  const paginationDiv = document.createElement('div');
  paginationDiv.className =
    'flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border';

  const prevButton = document.createElement('button');
  prevButton.className =
    'p-2 rounded-lg border border-border bg-gradient-card hover:bg-muted/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  prevButton.disabled = true; // TODO: Enable based on current page
  prevButton.innerHTML = `
    <svg class="w-5 h-5 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  `;
  prevButton.addEventListener('click', () => {
    // TODO: Load previous page of matches
    console.log('Previous page');
  });

  const pageInfo = document.createElement('span');
  pageInfo.className = 'text-sm text-muted-foreground';
  pageInfo.textContent = 'Page 1 of 1'; // TODO: Update based on actual pagination data

  const nextButton = document.createElement('button');
  nextButton.className =
    'p-2 rounded-lg border border-border bg-gradient-card hover:bg-muted/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  nextButton.disabled = true; // TODO: Enable based on total pages
  nextButton.innerHTML = `
    <svg class="w-5 h-5 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  `;
  nextButton.addEventListener('click', () => {
    // TODO: Load next page of matches
    console.log('Next page');
  });

  paginationDiv.appendChild(prevButton);
  paginationDiv.appendChild(pageInfo);
  paginationDiv.appendChild(nextButton);
  body.appendChild(paginationDiv);
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
    { icon: '🏆', label: 'Create Tournament', href: '/tournaments' },
    { icon: '⚙️', label: 'Settings', href: '/settings' },
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

function renderFriendsList(container: HTMLElement): void {
  const card = new GlassCard(container, {
    title: 'Friends List',
  });
  const body = card.getBodyElement();
  if (!body) return;

  // TODO: Replace with actual API call to fetch friends list
  // Example API endpoint: GET /api/friends
  interface FriendData {
    name: string;
    username: string;
    isOnline: boolean;
  }

  const friends: FriendData[] = [
    { name: 'Sarah Chen', username: '@sarah_c', isOnline: true },
    { name: 'Mike Rodriguez', username: '@mike_r', isOnline: true },
    { name: 'Alex Thompson', username: '@alex_t', isOnline: false },
    { name: 'Emma Wilson', username: '@emma_w', isOnline: true },
    { name: 'James Miller', username: '@james_m', isOnline: false },
    { name: 'Lisa Anderson', username: '@lisa_a', isOnline: true },
    { name: 'David Lee', username: '@david_l', isOnline: false },
    { name: 'Sofia Martinez', username: '@sofia_m', isOnline: true },
  ];

  // Scrollable friends list container
  const friendsListContainer = document.createElement('div');
  friendsListContainer.className = 'space-y-2 max-h-72 overflow-y-auto pr-2';
  friendsListContainer.style.scrollbarWidth = 'thin'; // Firefox
  body.appendChild(friendsListContainer);

  friends.forEach((friend) => {
    const friendItem = document.createElement('div');
    friendItem.className =
      'flex items-center gap-3 p-3 rounded-lg bg-gradient-card backdrop-blur-glass border border-border hover:bg-muted/30 transition-all cursor-pointer';

    // Get initials from name
    const initials = friend.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    friendItem.innerHTML = `
      <div class="relative">
        <div class="h-10 w-10 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold">
          ${initials}
        </div>
        <div class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${friend.isOnline ? 'bg-accent' : 'bg-destructive'}"></div>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-foreground">${friend.name}</p>
        <p class="text-xs text-muted-foreground">${friend.username}</p>
      </div>
      <div class="text-xs text-muted-foreground">
        ${friend.isOnline ? '<span class="text-accent">Online</span>' : '<span class="text-muted-foreground">Offline</span>'}
      </div>
    `;

    friendItem.addEventListener('click', () => {
      // TODO: Navigate to friend's profile
      console.log('View friend profile:', friend.username);
    });

    friendsListContainer.appendChild(friendItem);
  });
}
