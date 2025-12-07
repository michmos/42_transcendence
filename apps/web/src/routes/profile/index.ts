import {
  StatCard,
  MatchCard,
  QuickActionButton,
  GlassCard,
  Navbar,
} from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';

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
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [{ label: 'Tournaments', href: '/tournaments', active: false }],
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: () => {
      // TODO: Add logout API call here
      console.log('Logout clicked');
      navigateTo('/login');
    },
  });

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
    'p-2 rounded-lg border border-border bg-gradient-card hover:bg-muted/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
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
    'p-2 rounded-lg border border-border bg-gradient-card hover:bg-muted/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
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

  // Start New Match button
  new QuickActionButton(actionsWrapper, {
    icon: '🎮',
    label: 'Start New Match',
    onClick: () => {
      navigateTo('/game');
    },
  });

  // Create Tournament button - shows popup
  new QuickActionButton(actionsWrapper, {
    icon: '🏆',
    label: 'Create Tournament',
    onClick: () => {
      showNewTournamentDialog();
    },
  });

  // Settings button - routes to settings page
  new QuickActionButton(actionsWrapper, {
    icon: '⚙️',
    label: 'Settings',
    onClick: () => {
      navigateTo('/settings');
    },
  });
}

function showNewTournamentDialog() {
  // Create modal backdrop - darker for better contrast
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in';

  // Create dialog - lighter background with better contrast
  const dialog = document.createElement('div');
  dialog.className =
    'bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95';
  dialog.style.backgroundColor = 'rgb(255, 255, 255)';

  dialog.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-900">Create New Tournament</h2>
      <p class="text-sm text-gray-600">Set up a new tournament with your preferred settings</p>
    </div>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="tournament-name" class="text-sm font-semibold text-gray-700">Tournament Name</label>
        <input
          id="tournament-name"
          type="text"
          placeholder="Enter tournament name"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="min-size" class="text-sm font-semibold text-gray-700">Min Size</label>
          <input
            id="min-size"
            type="number"
            placeholder="4"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div class="space-y-2">
          <label for="max-players" class="text-sm font-semibold text-gray-700">Max Players</label>
          <input
            id="max-players"
            type="number"
            placeholder="16"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <label for="lock-time" class="text-sm font-semibold text-gray-700">Lock Time</label>
        <input
          id="lock-time"
          type="text"
          placeholder="e.g., 30 sec"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      
      <div class="space-y-2">
        <label for="game-time" class="text-sm font-semibold text-gray-700">Game Time</label>
        <input
          id="game-time"
          type="text"
          placeholder="e.g., 3 min"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      
      <div class="flex gap-3 pt-4">
        <button class="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg cursor-pointer" id="create-btn">
          Save
        </button>
        <button class="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" id="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  `;

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  // Close handlers
  const closeDialog = () => {
    backdrop.classList.add('animate-out', 'fade-out');
    setTimeout(() => backdrop.remove(), 200);
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDialog();
  });

  dialog.querySelector('#cancel-btn')?.addEventListener('click', closeDialog);
  dialog.querySelector('#create-btn')?.addEventListener('click', () => {
    // TODO: Implement tournament creation API call
    console.log('Creating tournament...');
    closeDialog();
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
