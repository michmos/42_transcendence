import {
  StatCard,
  MatchCard,
  QuickActionButton,
  GlassCard,
  Navbar,
} from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import {
  type ProfileMatch,
  type ProfileFriend,
} from '../../plugins/api/user.js';
import type { User } from 'db/generated/client/index.js';
// import { getCurrentSession, clearSession } from '../../utils/auth-state.js';
import { getAvatarSrc } from '../../utils/avatar-helpers.js';
import { joinLocalMatch, joinOnlineMatch } from '../game/buttonLogic.js';
import toast from '../../utils/toast.js';
import type { OnlineStatus } from 'types';
import { setupWebSocketHook } from '../game/index.js';

export let isLocalGame = true;

export function getIsLocalGame(): boolean {
  return isLocalGame;
}
export function setIsLocalGame(boolean: boolean) {
  isLocalGame = boolean;
}

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

// Match data interface for MatchCard component
interface MatchData {
  playerName: string;
  playerAvatar: string;
  score: string;
  tournament: string;
  result: 'win' | 'loss';
  date: string;
}

export default async function initRoute() {
  const profileRoot = document.querySelector('.profile-page') as HTMLElement;
  if (!profileRoot) {
    console.error('[profile] Profile root element not found');
    return;
  }
  profileRoot.innerHTML = '';

  // Main wrapper with gradient background
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  profileRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch profile data from API
  const profileData = await window.api.getUserProfile();

  if (!profileData) {
    // User is authenticated but profile fetch failed - show error
    const errorMsg = document.createElement('div');
    errorMsg.className = 'text-center text-muted-foreground py-8';
    errorMsg.innerHTML = `
        <p class="mb-4">Failed to load profile data.</p>
        <button 
          onclick="window.location.reload()" 
          class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Refresh Page
        </button>
      `;
    mainWrapper.appendChild(errorMsg);
    return;
  }

  console.log('[profile] Profile data loaded successfully, rendering page');

  // Calculate stats from API data
  const { cleanedUserData, cleanedUserFriends, userMatches } = profileData;

  // Store current user nickname for filtering status updates
  currentUserNickname = cleanedUserData.nickname || '';

  // Update Navbar with user data
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [{ label: 'Tournaments', href: '/tournaments', active: false }],
    userNickname: cleanedUserData?.nickname || 'No Nickname Set',
    userAvatar: getAvatarSrc(cleanedUserData.avatar),
    onSettingsClick: () => {
      void navigateTo('/settings');
    },
    onLogoutClick: () => {
      // Leave the 'online' room before logout so backend broadcasts offline status
      cleanupOnlineStatusSocket();
      void handleLogout();
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

  // Calculate stats from actual data
  // Total Matches: count from userMatches array
  const totalMatches = userMatches.length;

  // Win Rate: calculate from userMatches by counting WON vs total matches
  const gamesWon = userMatches.filter((match) => match.result === 'WON').length;
  const winRate =
    totalMatches > 0 ? ((gamesWon / totalMatches) * 100).toFixed(1) : '0.0';

  // Tournaments: fetch tournaments where user is a participant
  let tournaments = 0;
  try {
    const userTournaments = await window.api.getMyTournaments();
    tournaments = userTournaments.length;
  } catch (error) {
    console.error('Failed to fetch user tournaments:', error);
    tournaments = 0;
  }

  const friends = cleanedUserFriends.filter(
    (f) => f.state === 'ACCEPTED'
  ).length;

  const stats = [
    {
      icon: '🎯',
      label: 'Total Matches',
      value: totalMatches.toLocaleString(),
      iconColor: 'text-foreground',
    },
    {
      icon: '📈',
      label: 'Win Rate',
      value: `${winRate}%`,
      iconColor: 'text-foreground',
    },
    {
      icon: '🏆',
      label: 'Tournaments',
      value: tournaments.toString(),
      iconColor: 'text-accent',
    },
    {
      icon: '👥',
      label: 'Friends',
      value: friends.toString(),
      iconColor: 'text-foreground',
    },
  ];

  stats.forEach((stat) => {
    new StatCard(statsGrid, stat);
  });

  // Recent Matches
  renderRecentMatches(
    leftColumn,
    userMatches,
    cleanedUserData['nickname'] || ''
  );

  // ===== RIGHT COLUMN (Quick Actions & Events) =====
  const rightColumn = document.createElement('div');
  rightColumn.className = 'space-y-6';
  mainGrid.appendChild(rightColumn);

  // Quick Actions
  renderQuickActions(rightColumn);

  // Friends Management Section (with tabs)
  renderFriendsSection(rightColumn, cleanedUserFriends);

  // ===== ONLINE STATUS SOCKET INTEGRATION =====
  listenForStatusUpdates();
}

// Friends data state for refresh
let currentFriendsData: ProfileFriend[] = [];
let friendsCardBody: HTMLElement | null = null;
let friendsCardHeader: HTMLElement | null = null;
let activeTabName: 'Friends' | 'Pending' | 'Blocked' = 'Friends';
let currentUserNickname: string = '';

async function refreshFriendsData() {
  const profileData = await window.api.getUserProfile();
  if (profileData && friendsCardBody && friendsCardHeader) {
    currentFriendsData = profileData.cleanedUserFriends;
    // Clear existing content before re-rendering
    friendsCardBody.innerHTML = '';
    // Re-render the content area, preserving header and tab state
    renderFriendsSectionContent(
      friendsCardBody,
      currentFriendsData,
      friendsCardHeader,
      activeTabName
    );
  }
}

function renderFriendsSection(
  container: HTMLElement,
  cleanedUserFriends: ProfileFriend[]
): void {
  currentFriendsData = cleanedUserFriends;

  const card = new GlassCard(container, {
    title: 'Friends',
  });

  // Add search bar to header
  const header = card.getHeaderElement();
  friendsCardHeader = header;

  if (header) {
    const headerContent = header.querySelector('h2');
    if (headerContent) {
      // Make header flex to position search bar on the right
      header.className = 'mb-4 flex items-center justify-between gap-4';

      // Only create search bar if it doesn't exist
      interface HeaderWithSearch extends HTMLElement {
        searchContainer?: HTMLElement;
        searchInput?: HTMLInputElement;
        clearBtn?: HTMLButtonElement;
      }
      const headerWithSearch = header as HeaderWithSearch;
      let searchContainer = headerWithSearch.searchContainer;
      if (!searchContainer) {
        searchContainer = document.createElement('div');
        searchContainer.className = 'flex items-center gap-2 flex-1 max-w-xs';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search by nickname...';
        searchInput.className =
          'flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors';
        searchInput.maxLength = 30;

        const clearBtn = document.createElement('button');
        clearBtn.className =
          'px-2 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden';
        clearBtn.innerHTML = `
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        `;

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearBtn);
        header.appendChild(searchContainer);

        // Store search elements for use in renderFriendsSectionContent
        headerWithSearch.searchInput = searchInput;
        headerWithSearch.clearBtn = clearBtn;
        headerWithSearch.searchContainer = searchContainer;
      }
    }
  }

  const body = card.getBodyElement();
  friendsCardBody = body;
  if (!body) return;

  renderFriendsSectionContent(body, cleanedUserFriends, header, activeTabName);
}

function renderFriendsSectionContent(
  body: HTMLElement,
  cleanedUserFriends: ProfileFriend[],
  header?: HTMLElement | null,
  initialTab: 'Friends' | 'Pending' | 'Blocked' = 'Friends'
): void {
  // Update currentFriendsData to ensure tabs always use latest data
  currentFriendsData = cleanedUserFriends;

  // Calculate counts for badges
  const friendsCount = cleanedUserFriends.filter(
    (f) => f.state === 'ACCEPTED'
  ).length;
  const pendingCount = cleanedUserFriends.filter(
    (f) => f.state === 'REQUESTED' && f.isRequester === false
  ).length;
  const blockedCount = cleanedUserFriends.filter(
    (f) => f.state === 'REJECTED' && f.isRequester === false
  ).length;

  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'border-b border-border mb-4';
  const tabsList = document.createElement('div');
  tabsList.className = 'flex gap-1';
  tabsContainer.appendChild(tabsList);

  // Tab buttons
  const isFriendsActive = initialTab === 'Friends';
  const isPendingActive = initialTab === 'Pending';
  const isBlockedActive = initialTab === 'Blocked';

  const friendsTab = createTabButton('Friends', friendsCount, isFriendsActive);
  const pendingTab = createTabButton('Pending', pendingCount, isPendingActive);
  const blockedTab = createTabButton('Blocked', blockedCount, isBlockedActive);

  tabsList.appendChild(friendsTab);
  tabsList.appendChild(pendingTab);
  tabsList.appendChild(blockedTab);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.className = 'min-h-[200px]';

  // Render initial tab based on activeTabName
  if (isFriendsActive) {
    renderFriendsTab(contentArea, cleanedUserFriends, header);
  } else if (isPendingActive) {
    renderPendingRequestsTab(contentArea, cleanedUserFriends);
  } else {
    renderBlockedUsersTab(contentArea, cleanedUserFriends);
  }

  // Tab switching logic - use currentFriendsData to always have latest data
  friendsTab.addEventListener('click', () => {
    activeTabName = 'Friends';
    setActiveTab(friendsTab, [pendingTab, blockedTab]);
    contentArea.innerHTML = '';
    renderFriendsTab(contentArea, currentFriendsData, header);
  });

  pendingTab.addEventListener('click', () => {
    activeTabName = 'Pending';
    setActiveTab(pendingTab, [friendsTab, blockedTab]);
    contentArea.innerHTML = '';
    renderPendingRequestsTab(contentArea, currentFriendsData);
  });

  blockedTab.addEventListener('click', () => {
    activeTabName = 'Blocked';
    setActiveTab(blockedTab, [friendsTab, pendingTab]);
    contentArea.innerHTML = '';
    renderBlockedUsersTab(contentArea, currentFriendsData);
  });

  body.appendChild(tabsContainer);
  body.appendChild(contentArea);
}

function updateTabBadges(cleanedUserFriends: ProfileFriend[]) {
  const friendsCount = cleanedUserFriends.filter(
    (f) => f.state === 'ACCEPTED'
  ).length;
  const pendingCount = cleanedUserFriends.filter(
    (f) => f.state === 'REQUESTED' && f.isRequester === false
  ).length;
  const blockedCount = cleanedUserFriends.filter(
    (f) => f.state === 'REJECTED' && f.isRequester === false
  ).length;

  // Update badge counts in tabs
  const tabsContainer = friendsCardBody?.querySelector(
    '.border-b.border-border'
  );
  if (tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('button');
    if (tabs.length >= 3) {
      // Update Friends tab badge
      const friendsTab = tabs[0] as HTMLElement;
      if (friendsTab) {
        friendsTab.innerHTML = `
          Friends
          ${friendsCount > 0 ? `<span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">${friendsCount}</span>` : ''}
        `;
      }

      // Update Pending tab badge
      const pendingTab = tabs[1] as HTMLElement;
      if (pendingTab) {
        pendingTab.innerHTML = `
          Pending
          ${pendingCount > 0 ? `<span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">${pendingCount}</span>` : ''}
        `;
      }

      // Update Blocked tab badge
      const blockedTab = tabs[2] as HTMLElement;
      if (blockedTab) {
        blockedTab.innerHTML = `
          Blocked
          ${blockedCount > 0 ? `<span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">${blockedCount}</span>` : ''}
        `;
      }
    }
  }
}

function createTabButton(
  label: string,
  count: number,
  isActive: boolean
): HTMLElement {
  const button = document.createElement('button');
  button.className = `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
    isActive
      ? 'bg-muted text-foreground border-b-2 border-primary'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
  }`;
  button.innerHTML = `
    ${label}
    ${count > 0 ? `<span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">${count}</span>` : ''}
  `;
  return button;
}

function setActiveTab(
  activeTab: HTMLElement,
  inactiveTabs: HTMLElement[]
): void {
  activeTab.className =
    'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer bg-muted text-foreground border-b-2 border-primary';
  inactiveTabs.forEach((tab) => {
    tab.className =
      'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50';
  });
}

// Store search state
let currentSearchQuery = '';
let searchResultsContainer: HTMLElement | null = null;

function renderFriendsTab(
  container: HTMLElement,
  cleanedUserFriends: ProfileFriend[],
  header?: HTMLElement | null
): void {
  // Get search elements from header if available
  interface HeaderWithSearch extends HTMLElement {
    searchInput?: HTMLInputElement;
    clearBtn?: HTMLButtonElement;
  }
  const headerWithSearch = header as HeaderWithSearch | null;
  const searchInput = headerWithSearch?.searchInput;
  const clearBtn = headerWithSearch?.clearBtn;

  // Restore search input value if it exists
  if (searchInput && currentSearchQuery) {
    searchInput.value = currentSearchQuery;
    if (clearBtn) {
      clearBtn.classList.remove('hidden');
    }
  }

  // Search results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'mb-4';
  if (!currentSearchQuery || currentSearchQuery.length < 3) {
    resultsContainer.classList.add('hidden');
  }
  searchResultsContainer = resultsContainer;

  // Friends list container
  const listContainer = document.createElement('div');
  listContainer.className = 'space-y-2 max-h-72 overflow-y-auto pr-2';
  listContainer.style.scrollbarWidth = 'thin';

  const acceptedFriends = cleanedUserFriends.filter(
    (f) => f.state === 'ACCEPTED'
  );

  // Show/hide list based on search state
  if (currentSearchQuery && currentSearchQuery.length >= 3) {
    listContainer.classList.add('hidden');
  } else {
    if (acceptedFriends.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center text-muted-foreground py-8';
      emptyState.textContent = 'No friends yet';
      listContainer.appendChild(emptyState);
    } else {
      acceptedFriends.forEach((friend) => {
        listContainer.appendChild(createFriendItem(friend));
      });
    }
  }

  // Search functionality (only if search input exists in header)
  if (!searchInput || !clearBtn) {
    container.appendChild(listContainer);
    return;
  }

  // Remove existing event listeners by cloning the input
  const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement;
  searchInput.parentNode?.replaceChild(newSearchInput, searchInput);
  if (headerWithSearch) {
    headerWithSearch.searchInput = newSearchInput;
  }

  const newClearBtn = clearBtn.cloneNode(true) as HTMLButtonElement;
  clearBtn.parentNode?.replaceChild(newClearBtn, clearBtn);
  if (headerWithSearch) {
    headerWithSearch.clearBtn = newClearBtn;
  }

  // Restore values
  if (currentSearchQuery) {
    newSearchInput.value = currentSearchQuery;
    newClearBtn.classList.remove('hidden');
  }

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const performSearch = async (query: string) => {
    if (query.length < 3) {
      resultsContainer.classList.add('hidden');
      listContainer.classList.remove('hidden');
      return;
    }

    // Show loading state
    resultsContainer.classList.remove('hidden');
    listContainer.classList.add('hidden');
    resultsContainer.innerHTML = `
      <div class="text-center text-muted-foreground py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
        <p>Searching...</p>
      </div>
    `;

    try {
      // Search for user by exact nickname
      const user = await window.api.getUserByNickname(query);

      if (!user) {
        resultsContainer.innerHTML = `
          <div class="text-center text-muted-foreground py-8">
            <p>User not found</p>
            <p class="text-sm mt-2">Try searching by exact nickname</p>
          </div>
        `;
        return;
      }

      // Check friendship state
      const friendship = cleanedUserFriends.find(
        (f) => f.otherUser.toLowerCase() === query.toLowerCase()
      );

      // Get current user's nickname from profile data
      const profileData = await window.api.getUserProfile();
      const currentNickname = profileData?.cleanedUserData['nickname'] || '';
      const isSelf =
        user['nickname']?.toLowerCase() === currentNickname.toLowerCase();

      // Render search result
      const resultItem = createSearchResultItem(user, friendship, isSelf);
      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(resultItem);
    } catch (error) {
      resultsContainer.innerHTML = `
        <div class="text-center text-red-400 py-8">
          <p>Error searching for user</p>
          <p class="text-sm mt-2 text-muted-foreground">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  };

  newSearchInput.addEventListener('input', () => {
    const query = newSearchInput.value.trim();
    currentSearchQuery = query;

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Show/hide clear button
    if (query.length > 0) {
      newClearBtn.classList.remove('hidden');
    } else {
      newClearBtn.classList.add('hidden');
      currentSearchQuery = '';
    }

    // Debounce search (wait 500ms after typing stops)
    searchTimeout = setTimeout(() => {
      void performSearch(query);
    }, 500);
  });

  newClearBtn.addEventListener('click', () => {
    newSearchInput.value = '';
    currentSearchQuery = '';
    newClearBtn.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';
    listContainer.classList.remove('hidden');
  });

  // Allow Enter key to trigger search
  newSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = newSearchInput.value.trim();
      if (query.length >= 3) {
        void performSearch(query);
      }
    }
  });

  // If there's a saved search query, perform it
  if (currentSearchQuery && currentSearchQuery.length >= 3) {
    void performSearch(currentSearchQuery);
  }

  container.appendChild(searchResultsContainer);
  container.appendChild(listContainer);
}

function renderPendingRequestsTab(
  container: HTMLElement,
  cleanedUserFriends: ProfileFriend[]
): void {
  const pendingRequests = cleanedUserFriends.filter(
    (f) => f.state === 'REQUESTED' && f.isRequester === false
  );

  const listContainer = document.createElement('div');
  listContainer.className = 'space-y-2 max-h-72 overflow-y-auto pr-2';
  listContainer.style.scrollbarWidth = 'thin';

  if (pendingRequests.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'text-center text-muted-foreground py-8';
    emptyState.textContent = 'No pending requests';
    listContainer.appendChild(emptyState);
  } else {
    pendingRequests.forEach((request) => {
      listContainer.appendChild(createPendingRequestItem(request));
    });
  }

  container.appendChild(listContainer);
}

function renderBlockedUsersTab(
  container: HTMLElement,
  cleanedUserFriends: ProfileFriend[]
): void {
  const blockedUsers = cleanedUserFriends.filter(
    (f) => f.state === 'REJECTED' && f.isRequester === false
  );

  const listContainer = document.createElement('div');
  listContainer.className = 'space-y-2 max-h-72 overflow-y-auto pr-2';
  listContainer.style.scrollbarWidth = 'thin';

  if (blockedUsers.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'text-center text-muted-foreground py-8';
    emptyState.textContent = 'No blocked users';
    listContainer.appendChild(emptyState);
  } else {
    blockedUsers.forEach((user) => {
      listContainer.appendChild(createBlockedUserItem(user));
    });
  }

  container.appendChild(listContainer);
}

function createFriendItem(friend: ProfileFriend): HTMLElement {
  const item = document.createElement('div');
  item.className =
    'flex items-center gap-3 p-3 rounded-lg bg-gradient-card backdrop-blur-glass border border-border hover:bg-muted/30 transition-all cursor-pointer';

  // Add data attribute for easy lookup when updating status
  item.setAttribute('data-friend-nickname', friend.otherUser);

  const initials = friend.otherUser
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isOnline = friend.isOnline ?? false;

  const avatarSrc = getAvatarSrc(friend.avatar);
  item.innerHTML = `
    <div class="relative">
      ${
        avatarSrc
          ? `<img src="${avatarSrc}" alt="${friend.otherUser}" class="h-10 w-10 border-2 border-border rounded-full object-cover" />`
          : `<div class="h-10 w-10 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold">
              ${initials}
            </div>`
      }
      <div class="status-indicator absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-red-500'}"></div>
    </div>
    <div class="flex-1">
      <p class="font-semibold text-foreground">${friend.otherUser}</p>
    </div>
    <div class="status-text text-xs text-muted-foreground">
      ${isOnline ? '<span class="text-green-500">Online</span>' : '<span class="text-red-500">Offline</span>'}
    </div>
  `;

  item.addEventListener('click', () => {
    navigateTo(`/user/${friend.otherUser}`);
  });

  return item;
}

function createPendingRequestItem(request: ProfileFriend): HTMLElement {
  const item = document.createElement('div');
  item.className =
    'flex items-center gap-3 p-3 rounded-lg bg-gradient-card backdrop-blur-glass border border-border';

  const initials = request.otherUser
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  item.innerHTML = `
    <div class="relative">
      ${
        request.avatar
          ? `<img src="${request.avatar}" alt="${request.otherUser}" class="h-10 w-10 border-2 border-border rounded-full object-cover" />`
          : `<div class="h-10 w-10 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold">
              ${initials}
            </div>`
      }
    </div>
    <div class="flex-1">
      <p class="font-semibold text-foreground">${request.otherUser}</p>
      <p class="text-xs text-muted-foreground">Wants to be your friend</p>
    </div>
    <div class="flex gap-2">
      <button class="accept-request-btn px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer" data-nickname="${request.otherUser}">
        Accept
      </button>
      <button class="reject-request-btn px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer" data-nickname="${request.otherUser}">
        Reject
      </button>
    </div>
  `;

  // Accept button handler
  const acceptBtn = item.querySelector(
    '.accept-request-btn'
  ) as HTMLButtonElement;
  acceptBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    void (async () => {
      const nickname = acceptBtn.dataset['nickname'] || '';
      acceptBtn.disabled = true;
      acceptBtn.textContent = 'Accepting...';

      try {
        const result = await window.api.acceptFriendRequest(nickname);
        if (result) {
          // Get updated profile data
          const updatedProfileData = await window.api.getUserProfile();
          if (updatedProfileData && friendsCardBody && friendsCardHeader) {
            currentFriendsData = updatedProfileData.cleanedUserFriends;
            // Update tab badges
            updateTabBadges(updatedProfileData.cleanedUserFriends);
            // Re-render the active tab content
            const contentArea = friendsCardBody.querySelector(
              '.min-h-\\[200px\\]'
            ) as HTMLElement;
            if (contentArea) {
              if (activeTabName === 'Pending') {
                contentArea.innerHTML = '';
                renderPendingRequestsTab(
                  contentArea,
                  updatedProfileData.cleanedUserFriends
                );
              } else if (activeTabName === 'Friends') {
                contentArea.innerHTML = '';
                renderFriendsTab(
                  contentArea,
                  updatedProfileData.cleanedUserFriends,
                  friendsCardHeader
                );
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to accept request';
        alert(errorMessage);
        acceptBtn.disabled = false;
        acceptBtn.textContent = 'Accept';
      }
    })();
  });

  // Reject button handler
  const rejectBtn = item.querySelector(
    '.reject-request-btn'
  ) as HTMLButtonElement;
  rejectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    void (async () => {
      const nickname = rejectBtn.dataset['nickname'] || '';
      rejectBtn.disabled = true;
      rejectBtn.textContent = 'Rejecting...';

      try {
        const result = await window.api.rejectFriendRequest(nickname);
        if (result) {
          // Get updated profile data
          const updatedProfileData = await window.api.getUserProfile();
          if (updatedProfileData && friendsCardBody && friendsCardHeader) {
            currentFriendsData = updatedProfileData.cleanedUserFriends;
            // Update tab badges
            updateTabBadges(updatedProfileData.cleanedUserFriends);
            // Re-render the active tab content
            const contentArea = friendsCardBody.querySelector(
              '.min-h-\\[200px\\]'
            ) as HTMLElement;
            if (contentArea) {
              if (activeTabName === 'Pending') {
                contentArea.innerHTML = '';
                renderPendingRequestsTab(
                  contentArea,
                  updatedProfileData.cleanedUserFriends
                );
              } else if (activeTabName === 'Blocked') {
                contentArea.innerHTML = '';
                renderBlockedUsersTab(
                  contentArea,
                  updatedProfileData.cleanedUserFriends
                );
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to reject request';
        alert(errorMessage);
        rejectBtn.disabled = false;
        rejectBtn.textContent = 'Reject';
      }
    })();
  });

  return item;
}

function createSearchResultItem(
  user: Partial<User>,
  friendship: ProfileFriend | undefined,
  isSelf: boolean
): HTMLElement {
  const item = document.createElement('div');
  item.className =
    'flex items-center gap-3 p-4 rounded-lg bg-gradient-card backdrop-blur-glass border border-border';

  const nickname = user['nickname'] || 'Unknown';
  const avatar = user.avatar || null;
  const initials = nickname
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determine friendship state and action button
  let statusBadge = '';
  let actionButton = '';

  if (isSelf) {
    statusBadge =
      '<span class="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">You</span>';
    actionButton = '';
  } else if (!friendship) {
    statusBadge =
      '<span class="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Not friends</span>';
    actionButton = `
      <button class="add-friend-btn px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer" data-nickname="${nickname}">
        Add Friend
      </button>
    `;
  } else if (friendship.state === 'ACCEPTED') {
    statusBadge =
      '<span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Friends</span>';
    actionButton = `
      <button class="view-profile-btn px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-lg hover:bg-muted/80 transition-colors cursor-pointer" data-nickname="${nickname}">
        View Profile
      </button>
    `;
  } else if (friendship.state === 'REQUESTED') {
    if (friendship.isRequester) {
      statusBadge =
        '<span class="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Request Sent</span>';
      actionButton = `
        <button class="view-profile-btn px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-lg hover:bg-muted/80 transition-colors cursor-pointer" data-nickname="${nickname}">
          View Profile
        </button>
      `;
    } else {
      statusBadge =
        '<span class="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400">Pending</span>';
      actionButton = `
        <button class="view-profile-btn px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-lg hover:bg-muted/80 transition-colors cursor-pointer" data-nickname="${nickname}">
          View Profile
        </button>
      `;
    }
  } else if (friendship.state === 'REJECTED') {
    statusBadge =
      '<span class="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Blocked</span>';
    actionButton = `
      <button class="view-profile-btn px-4 py-2 bg-muted text-foreground text-sm font-semibold rounded-lg hover:bg-muted/80 transition-colors cursor-pointer" data-nickname="${nickname}">
        View Profile
      </button>
    `;
  }

  item.innerHTML = `
    <div class="relative">
      ${
        avatar
          ? `<img src="${avatar}" alt="${nickname}" class="h-12 w-12 border-2 border-border rounded-full object-cover" />`
          : `<div class="h-12 w-12 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold">
              ${initials}
            </div>`
      }
    </div>
    <div class="flex-1">
      <p class="font-semibold text-foreground">${nickname}</p>
      <div class="flex items-center gap-2 mt-1">
        ${statusBadge}
        ${user.gamesPlayed !== undefined ? `<span class="text-xs text-muted-foreground">${user.gamesPlayed} games</span>` : ''}
      </div>
    </div>
    <div>
      ${actionButton}
    </div>
  `;

  // Add Friend button handler
  const addFriendBtn = item.querySelector(
    '.add-friend-btn'
  ) as HTMLButtonElement;
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void (async () => {
        const nickname = addFriendBtn.dataset['nickname'] || '';
        addFriendBtn.disabled = true;
        addFriendBtn.textContent = 'Sending...';

        try {
          const result = await window.api.sendFriendRequest(nickname);
          if (result) {
            // Get updated profile data
            const updatedProfileData = await window.api.getUserProfile();
            if (updatedProfileData) {
              currentFriendsData = updatedProfileData.cleanedUserFriends;
              const updatedFriendship =
                updatedProfileData.cleanedUserFriends.find(
                  (f) => f.otherUser.toLowerCase() === nickname.toLowerCase()
                );
              // Update the search result by replacing the item
              const newResultItem = createSearchResultItem(
                user,
                updatedFriendship,
                isSelf
              );
              item.replaceWith(newResultItem);
              // Update tab badges and content without full refresh
              if (friendsCardBody && friendsCardHeader) {
                // Update only the content area, preserving tab state
                const contentArea = friendsCardBody.querySelector(
                  '.min-h-\\[200px\\]'
                ) as HTMLElement;
                if (contentArea && activeTabName === 'Friends') {
                  // Re-render just the Friends tab with updated data
                  contentArea.innerHTML = '';
                  renderFriendsTab(
                    contentArea,
                    updatedProfileData.cleanedUserFriends,
                    friendsCardHeader
                  );
                } else if (contentArea && activeTabName === 'Pending') {
                  // Re-render just the Pending tab with updated data
                  contentArea.innerHTML = '';
                  renderPendingRequestsTab(
                    contentArea,
                    updatedProfileData.cleanedUserFriends
                  );
                }
                // Update tab badges
                updateTabBadges(updatedProfileData.cleanedUserFriends);
              }
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to send friend request';
          alert(errorMessage);
          addFriendBtn.disabled = false;
          addFriendBtn.textContent = 'Add Friend';
        }
      })();
    });
  }

  // View Profile button handler
  const viewProfileBtn = item.querySelector(
    '.view-profile-btn'
  ) as HTMLButtonElement;
  if (viewProfileBtn) {
    viewProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nickname = viewProfileBtn.dataset['nickname'] || '';
      void navigateTo(`/user/${nickname}`);
    });
  }

  return item;
}

function createBlockedUserItem(user: ProfileFriend): HTMLElement {
  const item = document.createElement('div');
  item.className =
    'flex items-center gap-3 p-3 rounded-lg bg-gradient-card backdrop-blur-glass border border-border';

  const initials = user.otherUser
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  item.innerHTML = `
    <div class="relative">
      ${
        user.avatar
          ? `<img src="${user.avatar}" alt="${user.otherUser}" class="h-10 w-10 border-2 border-border rounded-full object-cover opacity-50" />`
          : `<div class="h-10 w-10 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold opacity-50">
              ${initials}
            </div>`
      }
    </div>
    <div class="flex-1">
      <p class="font-semibold text-foreground">${user.otherUser}</p>
      <p class="text-xs text-muted-foreground">You rejected this user</p>
    </div>
    <div>
      <button class="unblock-btn px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors cursor-pointer" data-nickname="${user.otherUser}">
        Remove
      </button>
    </div>
  `;

  // Unblock button handler
  const unblockBtn = item.querySelector('.unblock-btn') as HTMLButtonElement;
  unblockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    void (async () => {
      const nickname = unblockBtn.dataset['nickname'] || '';

      if (!confirm(`Remove ${nickname} from blocked users?`)) {
        return;
      }

      unblockBtn.disabled = true;
      unblockBtn.textContent = 'Removing...';

      try {
        await window.api.unblockUser(nickname);
        await refreshFriendsData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to remove user';
        alert(errorMessage);
        unblockBtn.disabled = false;
        unblockBtn.textContent = 'Remove';
      }
    })();
  });

  return item;
}

function renderRecentMatches(
  container: HTMLElement,
  userMatches: ProfileMatch[],
  currentUserNickname: string
): void {
  const card = new GlassCard(container, {
    title: 'Match History',
  });
  const body = card.getBodyElement();
  if (!body) return;

  // Convert API match data to MatchCard format
  // Show most recent matches first (reverse order)
  const matches: MatchData[] = userMatches
    .slice()
    .reverse()
    .map((match) => {
      // Determine which player is the current user
      const isPlayer1 = match.player1 === currentUserNickname;
      const opponentName = isPlayer1 ? match.player2 : match.player1;

      // Determine if current user won
      const isWin = match.result === 'WON';

      // Format score (always show user's score first)
      const userScore = isPlayer1 ? match.score1 : match.score2;
      const opponentScore = isPlayer1 ? match.score2 : match.score1;
      const score = `${userScore}-${opponentScore}`;
      const date = match.date;

      return {
        playerName: opponentName,
        playerAvatar: '',
        score: score,
        tournament: match.gameType,
        result: isWin ? 'win' : 'loss',
        date: date,
      };
    });

  // Scrollable matches list container
  const matchesList = document.createElement('div');
  matchesList.className =
    'space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin';
  matchesList.style.scrollbarWidth = 'thin';
  matchesList.style.scrollbarColor = 'rgba(255, 255, 255, 0.3) transparent';

  // Add custom scrollbar styling for webkit browsers (only if not already added)
  if (!document.getElementById('profile-scrollbar-style')) {
    const style = document.createElement('style');
    style.id = 'profile-scrollbar-style';
    style.textContent = `
      .scrollbar-thin::-webkit-scrollbar {
        width: 8px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  body.appendChild(matchesList);

  if (matches.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'text-center text-muted-foreground py-8';
    emptyState.textContent = 'No matches played yet';
    matchesList.appendChild(emptyState);
  } else {
    matches.forEach((match) => {
      new MatchCard(matchesList, match);
    });
  }
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

  // Play Locally button
  new QuickActionButton(actionsWrapper, {
    icon: '🎮',
    label: 'Play Locally',
    onClick: () => {
      isLocalGame = true;
      setupWebSocketHook();
      joinLocalMatch();
      navigateTo('/game');
    },
  });

  // Play Online button - backend will handle the logic
  new QuickActionButton(actionsWrapper, {
    icon: '🌐',
    label: 'Play Online',
    onClick: () => {
      isLocalGame = false;
      setupWebSocketHook();
      joinOnlineMatch();
      navigateTo('/game');
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

// ===== ONLINE STATUS SOCKET HANDLING =====

/**
 * Listens for status-update events
 */
function listenForStatusUpdates() {
  if (!window.socket) return;

  // Listen for status updates
  window.socket.registerWebSocketHook((event: MessageEvent) => {
    try {
      const parsed: unknown = JSON.parse(event.data as string);

      // Handle online status updates
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'event' in parsed &&
        parsed.event === 'status-update' &&
        'nickname' in parsed &&
        parsed.nickname &&
        typeof parsed.nickname === 'string' &&
        currentUserNickname &&
        parsed.nickname.toLowerCase() !== currentUserNickname.toLowerCase()
      ) {
        handleOnlineStatusUpdate(parsed as OnlineStatus);
      }

      // Note: tournament-created events are handled by tournaments list page
      // to avoid duplicate toasts. Profile page only handles online status updates.
    } catch {
      // Ignore non-JSON or non-matching messages
    }
  });
}

function cleanupOnlineStatusSocket(): void {
  // Leave rooms and close socket so backend broadcasts offline status
  if (window.socket?.isConnected()) {
    window.socket.leaveRoom('tournament:main');
    // Close socket to trigger backend's onClose handler which broadcasts offline status
    const ws = window.socket.getSocket();
    ws.close();
  }
  currentUserNickname = '';
  // Note: Rooms will be rejoined automatically when socket reconnects (via app.ts)
}

function handleOnlineStatusUpdate(status: OnlineStatus) {
  const friend = currentFriendsData.find(
    (f) => f.otherUser.toLowerCase() === status.nickname.toLowerCase()
  );

  if (!friend) return;

  const wasOnline = friend.isOnline;
  friend.isOnline = status.isOnline;

  // Show toast if status changed
  if (wasOnline !== status.isOnline && friend.state === 'ACCEPTED') {
    const message = status.isOnline
      ? `${status.nickname} is now online`
      : `${status.nickname} went offline`;
    toast.show(message, { variant: status.isOnline ? 'info' : 'warning' });
  }

  // Update UI if on Friends tab
  if (activeTabName === 'Friends' && friendsCardBody) {
    updateFriendItemStatus(status.nickname, status.isOnline);
  }
}

function updateFriendItemStatus(nickname: string, isOnline: boolean) {
  if (!friendsCardBody) return;

  const items = friendsCardBody.querySelectorAll('[data-friend-nickname]');
  items.forEach((item) => {
    const itemNickname = (item as HTMLElement).getAttribute(
      'data-friend-nickname'
    );
    if (itemNickname?.toLowerCase() === nickname.toLowerCase()) {
      const dot = item.querySelector('.status-indicator') as HTMLElement;
      if (dot) {
        dot.className = `status-indicator absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`;
      }

      const text = item.querySelector('.status-text') as HTMLElement;
      if (text) {
        text.innerHTML = isOnline
          ? '<span class="text-green-500">Online</span>'
          : '<span class="text-red-500">Offline</span>';
      }
    }
  });
}
