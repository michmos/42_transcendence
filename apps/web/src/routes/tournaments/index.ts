import { Navbar, Badge, Button } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import API from '../../plugins/api/index.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

interface Tournament {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  minSize: number;
  maxPlayers: number;
  registeredPlayers: number;
  startDate: string;
  prizePool?: number;
  gameTime: string;
}

function getInput(element: HTMLDivElement, id: string) {
  return (element.querySelector(id) as HTMLInputElement).value;
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Championship Series 2024',
    status: 'active',
    minSize: 16,
    maxPlayers: 32,
    registeredPlayers: 28,
    startDate: 'Dec 16, 2024',
    prizePool: 5000,
    gameTime: '3 min',
  },
  {
    id: '2',
    name: 'Rookie League',
    status: 'upcoming',
    minSize: 8,
    maxPlayers: 16,
    registeredPlayers: 10,
    startDate: 'Mar 27, 2024',
    prizePool: 1500,
    gameTime: '3 min',
  },
  {
    id: '3',
    name: 'Speed Masters',
    status: 'completed',
    minSize: 16,
    maxPlayers: 16,
    registeredPlayers: 16,
    startDate: 'Dec 3, 2024',
    prizePool: 2500,
    gameTime: 'XXSec',
  },
];

// TODO: handle events
window.socket.registerWebSocketHook((event: MessageEvent) => {
  const data = JSON.parse(event.data);
  if (data.event === 'tournament-updated') {
    console.log('Tournament updated:', data);
  } else if (data.event === 'tournament-joined') {
    console.log('Tournament joined:', data);
  } else if (data.event === 'tournament-left') {
    console.log('Tournament left:', data);
  } else if (data.event === 'tournament-created') {
    console.log('Tournament created:', data);
  } else if (data.event === 'tournament-started') {
    console.log('Tournament started:', data);
  } else if (data.event === 'notify') {
    console.log('Notification:', data.message);
  }
});

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-accent text-white';
    case 'upcoming':
      return 'bg-warning text-white';
    case 'completed':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted';
  }
}

function renderPageHeader(container: HTMLElement, onNewTournament: () => void) {
  const pageHeader = document.createElement('div');
  pageHeader.className =
    'mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between';
  pageHeader.innerHTML = `
    <div>
      <h1 class="mb-2 text-4xl font-bold text-white">Tournaments</h1>
      <p class="text-white/80">Manage and view all tournament competitions</p>
    </div>
  `;

  const buttonContainer = document.createElement('div');
  new Button(buttonContainer, {
    text: 'New Tournament',
    variant: 'primary',
    size: 'lg',
    onClick: onNewTournament,
  });

  // Add custom styling and icon via the button element
  const buttonElement = buttonContainer.querySelector('button');
  if (buttonElement) {
    buttonElement.className =
      'flex items-center gap-2 px-6 py-3 bg-white text-primary hover:bg-white/90 rounded-lg transition-colors font-medium text-base cursor-pointer';
    buttonElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="M12 5v14"/>
      </svg>
      New Tournament
    `;
  }

  pageHeader.appendChild(buttonContainer);

  container.appendChild(pageHeader);
}

function renderSearchBar(
  container: HTMLElement,
  onSearch: (query: string) => void
) {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'mb-6';

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'relative';

  // Create search icon with better rendering
  const searchIcon = document.createElement('svg');
  searchIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  searchIcon.setAttribute('width', '20');
  searchIcon.setAttribute('height', '20');
  searchIcon.setAttribute('viewBox', '0 0 24 24');
  searchIcon.setAttribute('fill', 'none');
  searchIcon.setAttribute('stroke', 'currentColor');
  searchIcon.setAttribute('stroke-width', '2');
  searchIcon.setAttribute('stroke-linecap', 'round');
  searchIcon.setAttribute('stroke-linejoin', 'round');
  searchIcon.style.cssText =
    'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.6); shape-rendering: geometricPrecision; image-rendering: -webkit-optimize-contrast;';
  searchIcon.innerHTML =
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';

  searchWrapper.appendChild(searchIcon);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search tournaments...';
  input.className =
    'w-full border border-white/20 bg-white/5 pl-10 pr-4 py-3 rounded-lg text-white placeholder:text-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary';
  input.id = 'tournament-search';

  searchWrapper.appendChild(input);

  input.addEventListener('input', (e) => {
    onSearch((e.target as HTMLInputElement).value);
  });

  searchContainer.appendChild(searchWrapper);
  container.appendChild(searchContainer);
}

function renderTournamentGrid(
  container: HTMLElement,
  tournaments: Tournament[]
) {
  const grid = document.createElement('div');
  grid.className = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';

  tournaments.forEach((tournament) => {
    const card = document.createElement('div');
    card.className =
      'overflow-hidden rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/10 cursor-pointer';

    const statusBadgeContainer = document.createElement('div');
    new Badge(statusBadgeContainer, {
      text: tournament.status,
      variant: 'default',
    });
    // Apply custom coloring
    const badgeElement = statusBadgeContainer.firstElementChild as HTMLElement;
    if (badgeElement) {
      badgeElement.className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(tournament.status)}`;
    }

    card.innerHTML = `
      <div class="p-6">
        <div class="mb-4 flex items-start justify-between">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
          <div id="status-badge-${tournament.id}"></div>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">${tournament.name}</h3>
        <p class="text-white/70 mb-4">${tournament.gameTime} per match</p>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-2 text-white/80">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span class="text-sm">${tournament.registeredPlayers}/${tournament.maxPlayers}</span>
            </div>
            <div class="flex items-center gap-2 text-white/80">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 2v4"/>
                <path d="M16 2v4"/>
                <rect width="18" height="18" x="3" y="4" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
              <span class="text-sm">${tournament.startDate}</span>
            </div>
          </div>
          
          <button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium cursor-pointer view-details-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Details
          </button>
        </div>
      </div>
    `;

    // Add status badge
    const badgeSlot = card.querySelector(`#status-badge-${tournament.id}`);
    if (badgeSlot) {
      badgeSlot.appendChild(statusBadgeContainer);
    }

    // Add click handler for view details
    const viewBtn = card.querySelector('.view-details-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateTo(`/tournament/${tournament.id}`);
      });
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderEmptyState(container: HTMLElement) {
  const emptyState = document.createElement('div');
  emptyState.className = 'py-16 text-center';
  emptyState.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-white/40">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
    <h3 class="mb-2 text-xl font-semibold text-white">No tournaments found</h3>
    <p class="text-white/60">Try adjusting your search or create a new tournament</p>
  `;
  container.appendChild(emptyState);
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
  dialog.querySelector('#create-btn')?.addEventListener('click', async () => {
    const tournamentName = getInput(dialog, '#tournament-name');
    const minPlayers = parseInt(getInput(dialog, '#min-size'));
    const maxPlayers = parseInt(getInput(dialog, '#max-players'));

    // TODO: add validation logic (maxPlayers >=2 , minPlayer >=2, maxPlayers >= minPlayers)

    console.log('Creating tournament...');
    try {
      const newTournament = await API.createTournament({
        tournamentName,
        minPlayers,
        maxPlayers,
      });
      // TODO: update UI with new tournament
      console.log('Tournament created:', newTournament);
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
    closeDialog();
  });
}

export default function initRoute() {
  const pageRoot = document.querySelector(
    '.tournaments-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;

  pageRoot.innerHTML = '';

  let searchQuery = '';
  let filteredTournaments = [...mockTournaments];

  // Main wrapper with gradient background - matching profile page structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [{ label: 'Profile', href: '/profile', active: false }],
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: () => {
      navigateTo('/login');
    },
  });

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('div');
  mainContent.className = 'max-w-7xl mx-auto px-6 py-8';
  mainWrapper.appendChild(mainContent);

  // Render sections
  renderPageHeader(mainContent, showNewTournamentDialog);

  // Search functionality
  const searchContainer = document.createElement('div');
  renderSearchBar(searchContainer, (query) => {
    searchQuery = query.toLowerCase();
    filteredTournaments = mockTournaments.filter((t) =>
      t.name.toLowerCase().includes(searchQuery)
    );
    updateTournamentGrid();
  });
  mainContent.appendChild(searchContainer);

  // Tournament grid container
  const gridContainer = document.createElement('div');
  mainContent.appendChild(gridContainer);

  const updateTournamentGrid = () => {
    gridContainer.innerHTML = '';
    if (filteredTournaments.length === 0) {
      renderEmptyState(gridContainer);
    } else {
      renderTournamentGrid(gridContainer, filteredTournaments);
    }
  };

  updateTournamentGrid();
}
