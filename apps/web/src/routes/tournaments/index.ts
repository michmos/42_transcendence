import { Navbar, Badge, Button } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import TournamentAPI from '../../plugins/api/tournaments.js';
import UserAPI from '../../plugins/api/user.js';
import type {
  Tournament as BackendTournament,
  status,
} from '../../types/api.js';
import { showApiError } from '../../utils/api-helpers.js';
import tournamentSocket from '../../plugins/websocket/tournament.js';
import toast from '../../utils/toast.js';
import { shouldShowNotification } from '../../utils/notification-dedup.js';
import { getAvatarSrc } from '../../utils/avatar-helpers.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

// UI Tournament interface (mapped from backend)
interface Tournament {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  minSize: number;
  maxPlayers: number;
  registeredPlayers: number;
  startDate: string;
}

/**
 * Map backend status to UI status
 */
function mapStatusToUI(
  backendStatus: status
): 'active' | 'upcoming' | 'completed' {
  switch (backendStatus) {
    case 'outstanding':
      return 'upcoming';
    case 'ongoing':
      return 'active';
    case 'finished':
    case 'canceled':
      return 'completed';
    default:
      return 'upcoming';
  }
}

/**
 * Format date to readable string
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Map backend tournament to UI tournament format
 */
function mapTournamentToUI(tournament: BackendTournament): Tournament {
  return {
    id: tournament.uuid,
    name: tournament.tournamentName,
    status: mapStatusToUI(tournament.status),
    minSize: tournament.minPlayers,
    maxPlayers: tournament.maxPlayers,
    registeredPlayers: tournament.playerCount,
    startDate: formatDate(tournament.createdAt),
  };
}

interface WebSocketMessage {
  event: string;
  data?: unknown;
  message?: string;
}

// TODO: handle events
window.socket.registerWebSocketHook((event: MessageEvent) => {
  const data = JSON.parse(event.data as string) as WebSocketMessage;
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
    if (data.message && shouldShowNotification(data.message)) {
      toast.show(data.message, { variant: 'info' });
    }
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

function renderLoadingState(container: HTMLElement) {
  const loadingState = document.createElement('div');
  loadingState.className = 'py-16 text-center';
  loadingState.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    <p class="mt-4 text-white/60">Loading tournaments...</p>
  `;
  container.appendChild(loadingState);
}

function renderErrorState(container: HTMLElement, message: string) {
  const errorState = document.createElement('div');
  errorState.className = 'py-16 text-center';
  errorState.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-red-400">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <h3 class="mb-2 text-xl font-semibold text-white">Error loading tournaments</h3>
    <p class="text-white/60">${message}</p>
  `;
  container.appendChild(errorState);
}

// Tournament state management using Sets (no UUID exposure needed)
// myTournaments: tournaments where user is a participant
// openTournaments: outstanding tournaments available to join
// tournamentsMap: full tournament objects for display

function renderTournamentGrid(
  container: HTMLElement,
  tournaments: Tournament[],
  backendTournaments: BackendTournament[],
  myTournaments: Set<string>,
  tournamentsMap: Map<string, BackendTournament>
) {
  const grid = document.createElement('div');
  grid.className = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';

  tournaments.forEach((tournament, index) => {
    // Type assertion needed because array access can return undefined
    const backendTournament = backendTournaments[index];
    if (!backendTournament) {
      console.warn(`Backend tournament not found for index ${index}`);
      return;
    }

    const isOutstanding = backendTournament.status === 'outstanding';
    const isFull =
      backendTournament.playerCount >= backendTournament.maxPlayers;

    // Check if user is a participant using Set membership (no UUID exposure needed)
    const isParticipant = myTournaments.has(tournament.id);

    // Check if minimum players have joined (for showing Start button)
    const hasMinPlayers =
      backendTournament.playerCount >= backendTournament.minPlayers;
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
          
          <div class="flex gap-2">
            ${(() => {
              // Button logic using Set membership (no UUID exposure)

              // Button display logic (priority order):
              // 1. Participants see "Start" when min players reached (all participants can start)
              // 2. Participants see "View Details" otherwise (creator and joined users)
              // 3. Non-participants see "Join" button (for outstanding tournaments)
              // 4. Everyone sees "View Details" for non-outstanding tournaments

              // 1. If user IS participant (creator or joined user)
              if (isParticipant) {
                // 1a. If min players reached AND outstanding -> Show Start button
                // (All participants can start the tournament when min players reached)
                if (hasMinPlayers && isOutstanding) {
                  return `<button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer start-tournament-btn" data-tournament-id="${tournament.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Start
                  </button>`;
                }
                // 1b. Otherwise -> Show View Details (creator/participant sees this)
                return `<button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium cursor-pointer view-details-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Details
                </button>`;
              }

              // 2. If tournament is NOT outstanding (e.g. ongoing/finished) -> Show View Details
              if (!isOutstanding) {
                return `<button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium cursor-pointer view-details-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Details
                </button>`;
              }

              // 3. If tournament is full -> Show Full + View Details
              if (isFull) {
                return `<button class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed font-medium" disabled>
                  Full
                </button>
                <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium cursor-pointer view-details-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Details
                </button>`;
              }

              // 4. If tournament is joinable -> Show Join button
              // Non-participants see this button to join the tournament
              if (isOutstanding && !isFull) {
                return `<button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium cursor-pointer join-tournament-btn" data-tournament-id="${tournament.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    <line x1="19" y1="8" x2="19" y2="16"/>
                    <line x1="23" y1="12" x2="15" y2="12"/>
                  </svg>
                  Join
                </button>`;
              }

              // 5. Default -> Show View Details
              return `<button class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium cursor-pointer view-details-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>`;
            })()}
          </div>
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

    // Add click handler for join tournament
    const joinBtn = card.querySelector('.join-tournament-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showJoinTournamentDialog(
          tournament.id,
          tournament.name,
          myTournaments,
          tournamentsMap
        );
      });
    }

    // Add click handler for start tournament button
    const startBtn = card.querySelector('.start-tournament-btn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        void (async () => {
          const tournamentUuid = tournament.id;
          const button = startBtn as HTMLButtonElement;

          // Disable button and show loading
          button.disabled = true;
          button.innerHTML = `
          <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Starting...
        `;

          try {
            await TournamentAPI.startTournament(tournamentUuid);

            // Success - refresh tournaments list
            const windowWithTournaments = window as WindowWithTournaments;
            const loadTournamentsFn = windowWithTournaments.loadTournaments;
            if (typeof loadTournamentsFn === 'function') {
              await loadTournamentsFn();
            }
          } catch (error) {
            // Handle errors
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to start tournament';

            alert(errorMessage);

            // Re-enable button
            button.disabled = false;
            button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Start
          `;
          }
        })();
      });
    }

    // Add click handler for the entire card (fallback for viewing details)
    card.addEventListener('click', () => {
      void navigateTo(`/tournament/${tournament.id}`);
    });

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

// Extend Window interface for tournament functions
interface WindowWithTournaments extends Window {
  loadTournaments?: (statusFilter?: status) => Promise<void>;
}

function showJoinTournamentDialog(
  tournamentUuid: string,
  tournamentName: string,
  myTournaments: Set<string>,
  tournamentsMap: Map<string, BackendTournament>
) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in';

  // Create dialog
  const dialog = document.createElement('div');
  dialog.className =
    'bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95';
  dialog.style.backgroundColor = 'rgb(255, 255, 255)';

  dialog.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-900">Join Tournament</h2>
      <p class="text-sm text-gray-600">Enter your alias for "${tournamentName}"</p>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <label for="join-alias" class="text-sm font-semibold text-gray-700">Your Alias</label>
        <input
          id="join-alias"
          type="text"
          placeholder="Enter your alias (leave blank to use your nickname)"
          maxlength="50"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        <p class="text-xs text-gray-500">This is how you'll appear in the tournament. Leave blank to use your nickname.</p>
      </div>

      <div class="flex gap-3 pt-4">
        <button class="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg cursor-pointer" id="join-btn">
          Join
        </button>
        <button class="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" id="cancel-join-btn">
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

  dialog
    .querySelector('#cancel-join-btn')
    ?.addEventListener('click', closeDialog);

  // Handle form submission
  const joinBtn = dialog.querySelector('#join-btn') as HTMLButtonElement;
  const aliasInput = dialog.querySelector('#join-alias') as HTMLInputElement;

  joinBtn.addEventListener('click', () => {
    void (async () => {
      let alias = aliasInput.value.trim();

      // If alias is blank, fetch user's nickname
      if (!alias) {
        try {
          const currentUser = await UserAPI.getMe();
          alias = currentUser?.nickname || 'Player';
        } catch (error) {
          console.error('Error fetching user info:', error);
          alias = 'Player';
        }
      }

      // Validation
      if (alias.length > 50) {
        alert('Alias must be 50 characters or less');
        aliasInput.focus();
        return;
      }

      // Disable button and show loading state
      joinBtn.disabled = true;
      joinBtn.textContent = 'Joining...';

      try {
        await TournamentAPI.joinTournament(tournamentUuid, alias);

        // Add to myTournaments Set (user is now a participant)
        myTournaments.add(tournamentUuid);
        // Update tournament in Map if it exists, or fetch it
        const existingTournament = tournamentsMap.get(tournamentUuid);
        if (existingTournament) {
          // Update playerCount (will be refreshed from server)
          existingTournament.playerCount += 1;
        } else {
          // Fetch tournament if not in Map
          const tournament = await TournamentAPI.getTournament(tournamentUuid);
          if (tournament) {
            tournamentsMap.set(tournamentUuid, tournament);
          }
        }

        // Success - close dialog and refresh tournaments list
        closeDialog();

        const windowWithTournaments = window as WindowWithTournaments;
        const loadTournamentsFn = windowWithTournaments.loadTournaments;
        if (typeof loadTournamentsFn === 'function') {
          await loadTournamentsFn();
        }
      } catch (error) {
        // Handle errors
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to join tournament';

        alert(errorMessage);

        // Re-enable button
        joinBtn.disabled = false;
        joinBtn.textContent = 'Join';
      }
    })();
  });
}

function showNewTournamentDialog(
  myTournaments: Set<string>,
  tournamentsMap: Map<string, BackendTournament>
) {
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

      <div class="space-y-2">
        <label for="player-alias" class="text-sm font-semibold text-gray-700">Your Alias (for this tournament)</label>
        <input
          id="player-alias"
          type="text"
          placeholder="Enter your alias"
          maxlength="50"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        <p class="text-xs text-gray-500">This is how you'll appear in the tournament</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="min-size" class="text-sm font-semibold text-gray-700">Min Players (min: 2)</label>
          <input
            id="min-size"
            type="number"
            min="2"
            placeholder="2"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div class="space-y-2">
          <label for="max-players" class="text-sm font-semibold text-gray-700">Max Players (max: 16)</label>
          <input
            id="max-players"
            type="number"
            max="16"
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

  // Handle form submission
  const createBtn = dialog.querySelector('#create-btn') as HTMLButtonElement;
  const nameInput = dialog.querySelector(
    '#tournament-name'
  ) as HTMLInputElement;
  const aliasInput = dialog.querySelector('#player-alias') as HTMLInputElement;
  const minSizeInput = dialog.querySelector('#min-size') as HTMLInputElement;
  const maxPlayersInput = dialog.querySelector(
    '#max-players'
  ) as HTMLInputElement;

  createBtn.addEventListener('click', () => {
    void (async () => {
      // Get form values
      const tournamentName = nameInput.value.trim();
      const alias = aliasInput.value.trim();
      const minPlayers = parseInt(minSizeInput.value, 10);
      const maxPlayers = parseInt(maxPlayersInput.value, 10);

      // Validation
      if (!tournamentName) {
        toast.show('Please enter a tournament name', { variant: 'error' });
        nameInput.focus();
        return;
      }

      if (!alias) {
        toast.show('Please enter your alias for this tournament', {
          variant: 'error',
        });
        aliasInput.focus();
        return;
      }

      if (alias.length > 50) {
        toast.show('Alias must be 50 characters or less', { variant: 'error' });
        aliasInput.focus();
        return;
      }

      if (isNaN(minPlayers) || minPlayers < 2) {
        toast.show('Min players must be 2 or higher', { variant: 'error' });
        minSizeInput.focus();
        return;
      }

      if (isNaN(maxPlayers) || maxPlayers > 16) {
        toast.show('Max players must be 16 or lower', { variant: 'error' });
        maxPlayersInput.focus();
        return;
      }

      if (maxPlayers < minPlayers) {
        toast.show('Max players must be greater than or equal to min players', {
          variant: 'error',
        });
        maxPlayersInput.focus();
        return;
      }

      // Disable button and show loading state
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';

      try {
        // Prepare tournament data
        const tournamentData: {
          tournamentName: string;
          minPlayers: number;
          maxPlayers: number;
          alias: string;
        } = {
          tournamentName,
          minPlayers,
          maxPlayers,
          alias,
        };

        // Call API to create tournament
        const tournament = await TournamentAPI.createTournament(tournamentData);

        // Auto-join the tournament as the creator (required: creator must be added automatically)
        try {
          await TournamentAPI.joinTournament(tournament.uuid, alias);
          // Add to myTournaments Set (creator is automatically a participant)
          myTournaments.add(tournament.uuid);
          tournamentsMap.set(tournament.uuid, tournament);
          toast.show('Tournament created and you have been added!', {
            variant: 'success',
          });
        } catch (joinError) {
          // If join fails, show error but still allow navigation
          console.error('Auto-join after create failed:', joinError);
          toast.show(
            'Tournament created, but failed to add you automatically. Please join manually.',
            { variant: 'warning' }
          );
        }

        // Success - close dialog
        closeDialog();

        // Refresh tournaments list to show updated participant status
        const windowWithTournaments = window as WindowWithTournaments;
        const loadTournamentsFn = windowWithTournaments.loadTournaments;
        if (typeof loadTournamentsFn === 'function') {
          await loadTournamentsFn();
        }

        // Navigate to new tournament details page
        void navigateTo(`/tournament/${tournament.uuid}`);
      } catch (error) {
        // Handle errors
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create tournament';

        alert(errorMessage);

        // Re-enable button
        createBtn.disabled = false;
        createBtn.textContent = 'Save';
      }
    })();
  });
}

export default async function initRoute() {
  const pageRoot = document.querySelector<HTMLElement>('.tournaments-page');
  if (!pageRoot) return;

  pageRoot.innerHTML = '';

  // Tournament state management using Sets (no UUID exposure)
  const myTournaments = new Set<string>(); // Tournaments where user is a participant
  const openTournaments = new Set<string>(); // Outstanding tournaments available to join
  const tournamentsMap = new Map<string, BackendTournament>(); // Full tournament objects

  let searchQuery = '';
  let allTournaments: Tournament[] = [];
  let allBackendTournaments: BackendTournament[] = [];
  let filteredTournaments: Tournament[] = [];
  let filteredBackendTournaments: BackendTournament[] = [];
  let isLoading = true;
  let hasError = false;
  let errorMessage = '';

  const windowWithTournaments = window as WindowWithTournaments;

  // Main wrapper with gradient background - matching profile page structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getMe();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [{ label: 'Profile', href: '/profile', active: false }],
    userNickname: userInfo?.nickname || 'No Nickname Set',
    userAvatar: getAvatarSrc(userInfo?.avatar),
    onSettingsClick: () => {
      void navigateTo('/settings');
    },
    onLogoutClick: () => {
      void handleLogout();
    },
  });

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('div');
  mainContent.className = 'max-w-7xl mx-auto px-6 py-8';
  mainWrapper.appendChild(mainContent);

  // Render sections
  renderPageHeader(mainContent, () => {
    showNewTournamentDialog(myTournaments, tournamentsMap);
  });

  // Search functionality
  const searchContainer = document.createElement('div');
  renderSearchBar(searchContainer, (query) => {
    searchQuery = query.toLowerCase();
    const filtered = allTournaments.filter((t) =>
      t.name.toLowerCase().includes(searchQuery)
    );
    filteredTournaments = filtered;
    // Map filtered tournaments to backend tournaments
    filteredBackendTournaments = filtered
      .map((uiTournament) => {
        return allBackendTournaments.find((bt) => bt.uuid === uiTournament.id);
      })
      .filter((bt): bt is BackendTournament => bt !== undefined);
    updateTournamentGrid();
  });
  mainContent.appendChild(searchContainer);

  // Tournament grid container
  const gridContainer = document.createElement('div');
  mainContent.appendChild(gridContainer);

  const updateTournamentGrid = () => {
    gridContainer.innerHTML = '';
    if (isLoading) {
      renderLoadingState(gridContainer);
      return;
    }
    if (hasError) {
      renderErrorState(gridContainer, errorMessage);
      return;
    }
    if (filteredTournaments.length === 0) {
      renderEmptyState(gridContainer);
    } else {
      renderTournamentGrid(
        gridContainer,
        filteredTournaments,
        filteredBackendTournaments,
        myTournaments,
        tournamentsMap
      );
    }
  };

  /**
   * Load tournaments from API
   * Fetches outstanding tournaments and user's tournaments, then populates Sets
   */
  async function loadTournaments(statusFilter?: status) {
    isLoading = true;
    hasError = false;
    errorMessage = '';
    updateTournamentGrid();

    try {
      // Fetch outstanding tournaments (for openTournaments set)
      const outstandingTournaments = await TournamentAPI.getTournaments(
        statusFilter || 'outstanding'
      );

      // Fetch user's tournaments (for myTournaments set)
      const userTournaments =
        await TournamentAPI.getMyTournaments(statusFilter);

      // Populate Sets and Map
      myTournaments.clear();
      openTournaments.clear();
      tournamentsMap.clear();

      // Add user's tournaments to myTournaments
      userTournaments.forEach((tournament) => {
        myTournaments.add(tournament.uuid);
        tournamentsMap.set(tournament.uuid, tournament);
      });

      // Add outstanding tournaments to openTournaments and Map
      outstandingTournaments.forEach((tournament) => {
        openTournaments.add(tournament.uuid);
        tournamentsMap.set(tournament.uuid, tournament);
      });

      // Use all tournaments from Map for display
      allBackendTournaments = Array.from(tournamentsMap.values());
      allTournaments = allBackendTournaments.map(mapTournamentToUI);
      filteredTournaments = [...allTournaments];
      filteredBackendTournaments = [...allBackendTournaments];
      isLoading = false;
      updateTournamentGrid();
    } catch (error) {
      isLoading = false;
      hasError = true;
      errorMessage =
        error instanceof Error ? error.message : 'Failed to load tournaments';
      showApiError({
        message: errorMessage,
        status: 0,
        shouldRedirect: false,
      });
      updateTournamentGrid();
    }
  }

  // Make loadTournaments available globally for dialog callback
  windowWithTournaments.loadTournaments = loadTournaments;

  // ===== HELPER FUNCTIONS FOR TOURNAMENT UPDATES =====
  /**
   * Update filtered arrays based on current search query
   */
  function updateFilteredArrays(): void {
    if (searchQuery) {
      const filtered = allTournaments.filter((t) =>
        t.name.toLowerCase().includes(searchQuery)
      );
      filteredTournaments = filtered;
      filteredBackendTournaments = filtered
        .map((uiTournament) => {
          return allBackendTournaments.find(
            (bt) => bt.uuid === uiTournament.id
          );
        })
        .filter((bt): bt is BackendTournament => bt !== undefined);
    } else {
      filteredTournaments = [...allTournaments];
      filteredBackendTournaments = [...allBackendTournaments];
    }
  }

  /**
   * Update or add a tournament to display arrays
   */
  function updateTournamentInArrays(tournament: BackendTournament): void {
    const index = allBackendTournaments.findIndex(
      (t) => t.uuid === tournament.uuid
    );
    if (index !== -1) {
      // Tournament already in arrays, update it
      allBackendTournaments[index] = tournament;
      allTournaments[index] = mapTournamentToUI(tournament);
    } else if (tournament.status === 'outstanding') {
      // Tournament not in arrays yet, add it
      allBackendTournaments.push(tournament);
      allTournaments.push(mapTournamentToUI(tournament));
    }
    updateFilteredArrays();
    updateTournamentGrid();
  }

  // ===== TOURNAMENT SOCKET INTEGRATION =====
  // Initialize tournament socket for real-time updates
  tournamentSocket.initialize();

  // Set up socket listeners for real-time updates
  // These will work once backend socket handler is implemented
  const handleTournamentCreated = (data: unknown) => {
    const eventData = data as { tournamentUuid?: string };
    if (
      eventData.tournamentUuid &&
      !myTournaments.has(eventData.tournamentUuid)
    ) {
      void (async () => {
        const tournamentUuid = eventData.tournamentUuid;
        if (!tournamentUuid) return;
        const tournament = await TournamentAPI.getTournament(tournamentUuid);
        if (tournament && tournament.status === 'outstanding') {
          openTournaments.add(tournament.uuid);
          tournamentsMap.set(tournament.uuid, tournament);
          updateTournamentInArrays(tournament);
        }
      })();
    } else {
      void loadTournaments();
    }
  };

  const handleTournamentStarted = (_data: unknown) => {
    // Note: Toast notification is handled by the 'notify' event from the backend
    // Update tournament list to show status change
    void loadTournaments();
  };

  const handleTournamentJoined = (data: unknown) => {
    const eventData = data as { uuid: string; playerCount: number };
    const tournament = tournamentsMap.get(eventData.uuid);

    if (tournament) {
      // Tournament already in map, update playerCount
      tournament.playerCount = eventData.playerCount;
      updateTournamentInArrays(tournament);
    } else {
      // Tournament not in map yet - fetch it with correct playerCount
      void (async () => {
        try {
          const fetchedTournament = await TournamentAPI.getTournament(
            eventData.uuid
          );
          if (fetchedTournament) {
            fetchedTournament.playerCount = eventData.playerCount;
            tournamentsMap.set(eventData.uuid, fetchedTournament);
            updateTournamentInArrays(fetchedTournament);
          }
        } catch {
          // Tournament might not exist yet, ignore
        }
      })();
    }
  };

  const handleTournamentLeft = (_data: unknown) => {
    // Refresh full tournament list to get updated participants
    void loadTournaments();
  };

  const handleTournamentUpdated = (data: unknown) => {
    const eventData = data as {
      uuid: string;
      status?: status;
      playerCount?: number;
    };
    const tournament = tournamentsMap.get(eventData.uuid);
    if (tournament) {
      if (eventData.status) {
        tournament.status = eventData.status;
        if (eventData.status !== 'outstanding') {
          openTournaments.delete(eventData.uuid);
        }
      }
      if (eventData.playerCount !== undefined) {
        tournament.playerCount = eventData.playerCount;
      }
      updateTournamentInArrays(tournament);
    }
  };

  // Register socket listeners
  tournamentSocket.on('tournament-created', handleTournamentCreated);
  // Note: tournament-started is handled on tournament detail page only (participants)
  tournamentSocket.on('tournament-started', handleTournamentStarted);
  // Note: tournament-joined is handled on tournament detail page only (participants)
  tournamentSocket.on('tournament-joined', handleTournamentJoined);
  tournamentSocket.on('tournament-left', handleTournamentLeft);
  tournamentSocket.on('tournament-updated', handleTournamentUpdated);

  // Join tournament list room (will fail gracefully if backend not ready)
  tournamentSocket.joinTournamentList();

  // Initial load
  await loadTournaments();
}
