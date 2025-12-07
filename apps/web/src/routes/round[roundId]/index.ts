import { Navbar, Card, Badge } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import TournamentAPI from '../../plugins/api/tournaments.js';
import UserAPI from '../../plugins/api/user.js';
import { showApiError } from '../../utils/api-helpers.js';
import { getCurrentUserId } from '../../utils/auth-state.js';
import { joinTournamentMatch } from '../game/buttonLogic.js';
import tournamentSocket from '../../plugins/websocket/tournament.js';
import toast from '../../utils/toast.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
    routeParams?: Record<string, string>;
  }
}

// UI Match interface (mapped from backend)
interface Match {
  id: string;
  opponent1: string;
  opponent2: string;
  score1: number;
  score2: number;
  status: 'completed' | 'live' | 'upcoming';
  hasNullPlayer?: boolean;
  player1Id?: string | null;
  player2Id?: string | null;
}

/**
 * Map backend match status to UI status
 */
function mapMatchStatusToUI(
  backendStatus: 'outstanding' | 'ongoing' | 'finished' | 'canceled'
): 'completed' | 'live' | 'upcoming' {
  switch (backendStatus) {
    case 'finished':
      return 'completed';
    case 'ongoing':
      return 'live';
    case 'outstanding':
    case 'canceled':
      return 'upcoming';
    default:
      return 'upcoming';
  }
}

/**
 * Get player nickname from match player data
 * Handles both cases: when player relation is loaded and when only ID is available
 */
function getPlayerNickname(
  player:
    | { nickname?: string | null; email?: string | null }
    | null
    | undefined,
  playerId?: string | null
): string {
  // If player object exists with nickname/email, use it
  if (player) {
    return player.nickname || player.email || 'Unknown';
  }
  // If only playerId is available, show placeholder
  // TODO: Could fetch user data separately if needed
  if (playerId) {
    return 'Player'; // Placeholder - could fetch user data if needed
  }
  return 'TBD';
}

function renderRoundHeader(
  container: HTMLElement,
  roundIndex: number,
  tournamentName: string
) {
  const roundHeader = document.createElement('div');
  roundHeader.className =
    'flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8';
  roundHeader.innerHTML = `
    <div>
      <div class="mb-2 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
        <h1 class="text-4xl font-bold text-white">Round ${roundIndex + 1}</h1>
      </div>
      <p class="text-white/80">${tournamentName}</p>
    </div>
    <div id="round-badge"></div>
  `;

  // Add badge
  const badgeContainer = roundHeader.querySelector<HTMLElement>('#round-badge');
  if (badgeContainer) {
    new Badge(badgeContainer, {
      text: `Round ${roundIndex + 1}`,
      variant: 'info',
    });
  }

  container.appendChild(roundHeader);
}

function renderMatches(
  container: HTMLElement,
  matches: Match[],
  currentUserId: string | null
) {
  const matchesCardContainer = document.createElement('div');
  const matchesCard = new Card(matchesCardContainer, {
    title: 'Matches',
    variant: 'default',
  });

  const matchesContainer = document.createElement('div');
  matchesContainer.className = 'space-y-4';

  if (matches.length === 0) {
    matchesContainer.innerHTML = `
      <div class="py-8 text-center text-white/60">
        <p>No matches in this round yet</p>
      </div>
    `;
  } else {
    matches.forEach((match) => {
      // Check if this match belongs to the current user
      const isUserMatch =
        currentUserId &&
        (match.player1Id === currentUserId ||
          match.player2Id === currentUserId);
      const showBeginButton =
        isUserMatch && match.status === 'upcoming' && !match.hasNullPlayer;

      const matchItem = document.createElement('div');
      // Gray out matches with null players (automatic wins)
      const baseClasses =
        'overflow-hidden rounded-lg border border-white/20 bg-white/5 transition-all';
      matchItem.className = match.hasNullPlayer
        ? `${baseClasses} opacity-50 grayscale`
        : `${baseClasses} hover:bg-white/10`;

      matchItem.innerHTML = `
      <div class="flex items-center p-6">
        <!-- Opponent 1 -->
        <div class="flex-1 min-w-0">
          <p class="text-lg font-semibold text-white truncate">${match.opponent1}</p>
        </div>

        <!-- Score - Always centered -->
        <div class="flex-shrink-0 mx-8">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span class="text-2xl font-bold text-white">${match.score1}</span>
            </div>
            <span class="text-xl text-white/60">-</span>
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span class="text-2xl font-bold text-white">${match.score2}</span>
            </div>
          </div>
        </div>

        <!-- Opponent 2 + Status Badge/Button - Fixed width container -->
        <div class="flex-1 min-w-0 flex items-center justify-end gap-4">
          <!-- Opponent 2 -->
          <div class="text-right min-w-0">
            <p class="text-lg font-semibold text-white truncate">${match.opponent2}</p>
          </div>

          <!-- Status Badge or Begin Button - Fixed width to ensure alignment -->
          <div class="flex-shrink-0 flex justify-end gap-2" id="status-action-${match.id}"></div>
        </div>
      </div>
    `;

      // Append status badge or begin button
      const actionContainer = matchItem.querySelector<HTMLElement>(
        `#status-action-${match.id}`
      );
      if (actionContainer) {
        if (showBeginButton) {
          // Add "Begin Match" button
          const beginButton = document.createElement('button');
          beginButton.className =
            'px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer font-semibold';
          beginButton.textContent = 'Begin Match';
          beginButton.addEventListener('click', () => {
            joinTournamentMatch(match.id);
            navigateTo('/game');
          });
          actionContainer.appendChild(beginButton);
        } else {
          // Add status badge
          const statusText =
            match.status === 'completed'
              ? 'Final'
              : match.status === 'live'
                ? 'LIVE'
                : 'Scheduled';
          const variant =
            match.status === 'completed'
              ? 'success'
              : match.status === 'live'
                ? 'warning'
                : 'default';
          new Badge(actionContainer, {
            text: statusText,
            variant: variant,
          });
        }
      }

      matchesContainer.appendChild(matchItem);
    });
  }

  const cardBody = matchesCard.getBodyElement();
  if (cardBody) {
    cardBody.appendChild(matchesContainer);
  }
  container.appendChild(matchesCardContainer);
}

function renderInfoCard(container: HTMLElement) {
  const infoCardContainer = document.createElement('div');
  infoCardContainer.className = 'mt-6';
  const infoCard = new Card(infoCardContainer, {
    variant: 'default',
  });

  const cardBody = infoCard.getBodyElement();
  if (cardBody) {
    cardBody.innerHTML = `
      <div class="pt-6">
        <p class="text-center text-white/80">
          This would need to be done with websocket for live updates.
          All matches are updated in real-time as they progress.
        </p>
      </div>
    `;
  }

  container.appendChild(infoCardContainer);
}

function renderLoadingState(container: HTMLElement) {
  const loadingState = document.createElement('div');
  loadingState.className = 'py-16 text-center';
  loadingState.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    <p class="mt-4 text-white/60">Loading round...</p>
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
    <h3 class="mb-2 text-xl font-semibold text-white">Error loading round</h3>
    <p class="text-white/60">${message}</p>
    <button class="mt-4 px-6 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors cursor-pointer" id="retry-btn">
      Retry
    </button>
  `;
  const retryBtn = errorState.querySelector('#retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  container.appendChild(errorState);
}

export default async function initRoute() {
  const roundRoot = document.querySelector<HTMLElement>('.round-detail-page');
  if (!roundRoot) return;

  roundRoot.innerHTML = '';

  // Get route parameters from window.routeParams (set by router)
  const routeParams = window.routeParams || {};
  const roundId = routeParams['roundId'] || '1';
  const roundIndex = parseInt(roundId, 10) - 1; // Convert to 0-based index

  // Get tournamentId from sessionStorage (set when navigating from tournament page)
  // This allows us to navigate back to the correct tournament
  const tournamentId =
    sessionStorage.getItem('lastTournamentId') || routeParams['tournamentId'];

  if (!tournamentId) {
    roundRoot.innerHTML =
      '<div class="p-8 text-white">Tournament ID not found. Please navigate from a tournament page.</div>';
    return;
  }

  // Main wrapper with gradient background - matching other pages structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  roundRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getUserBasicInfo();
  const navbarProps: {
    title: string;
    links: Array<{ label: string; href: string; active: boolean }>;
    userNickname?: string;
    userAvatar?: string | null;
    onSettingsClick: () => void;
    onLogoutClick: () => void;
  } = {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: () => {
      void handleLogout();
    },
  };
  if (userInfo?.nickname) {
    navbarProps.userNickname = userInfo.nickname;
  }
  if (userInfo?.avatar) {
    navbarProps.userAvatar = userInfo.avatar;
  }
  new Navbar(headerContainer, navbarProps);

  // Add back button
  const backButtonContainer = document.createElement('div');
  backButtonContainer.className = 'max-w-7xl mx-auto px-6 pt-4';
  const backButton = document.createElement('div');
  backButton.className = 'mb-6';
  backButton.innerHTML = `
    <button class="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
      </svg>
      <span>Back to Tournament</span>
    </button>
  `;
  const backBtn = backButton.querySelector('button');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateTo(`/tournament/${tournamentId}`);
    });
  }
  backButtonContainer.appendChild(backButton);
  mainWrapper.appendChild(backButtonContainer);

  // ===== MAIN CONTENT =====
  const innerContainer = document.createElement('div');
  innerContainer.className = 'max-w-7xl mx-auto px-6 py-8';
  mainWrapper.appendChild(innerContainer);

  // Show loading state initially
  renderLoadingState(innerContainer);

  try {
    // Fetch tournament to get name and participants
    const tournament = await TournamentAPI.getTournament(tournamentId);
    if (!tournament) {
      renderErrorState(innerContainer, 'Tournament not found');
      return;
    }

    // Fetch round
    const round = await TournamentAPI.getTournamentRound(
      tournamentId,
      roundIndex
    );
    if (!round) {
      renderErrorState(innerContainer, 'Round not found');
      return;
    }

    // Create player ID to alias map from tournament participants
    // Use alias (from TournamentParticipations) as it's tournament-specific
    const playerMap = new Map<string, string>();
    if (tournament.participants) {
      tournament.participants.forEach((participant) => {
        // Use alias if available (tournament-specific), otherwise fall back to nickname
        const displayName =
          (participant as { alias?: string }).alias ||
          participant.nickname ||
          (participant as { email?: string }).email ||
          'Unknown';
        playerMap.set(participant.uuid, displayName);
      });
    }

    // Map matches to UI format with player aliases
    const uiMatches: Match[] = round.matches.map((match) => {
      // Handle player1 - use alias from map, or show "Nobody" if null
      const opponent1 = match.player1Id
        ? playerMap.has(match.player1Id)
          ? (playerMap.get(match.player1Id) ?? 'Unknown')
          : getPlayerNickname(
              (match as { player1?: { nickname?: string | null } }).player1,
              match.player1Id
            )
        : 'Nobody';

      // Handle player2 - use alias from map, or show "Nobody" if null
      const opponent2 = match.player2Id
        ? playerMap.has(match.player2Id)
          ? (playerMap.get(match.player2Id) ?? 'Unknown')
          : getPlayerNickname(
              (match as { player2?: { nickname?: string | null } }).player2,
              match.player2Id
            )
        : 'Nobody';

      // Check if this match has a null player (automatic win)
      const hasNullPlayer = opponent1 === 'Nobody' || opponent2 === 'Nobody';

      return {
        id: match.uuid,
        opponent1,
        opponent2,
        score1: match.score1 || 0,
        score2: match.score2 || 0,
        status: mapMatchStatusToUI(match.status),
        hasNullPlayer,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
      };
    });

    // Get current user ID
    const currentUserId = getCurrentUserId();

    // Clear loading state and render content
    innerContainer.innerHTML = '';

    // Render sections
    renderRoundHeader(innerContainer, roundIndex, tournament.tournamentName);
    renderMatches(innerContainer, uiMatches, currentUserId);
    renderInfoCard(innerContainer);

    // ===== TOURNAMENT SOCKET INTEGRATION =====
    // Initialize tournament socket for real-time updates
    tournamentSocket.initialize();

    // Set up socket listeners for match begin notifications
    const handleMatchUpdated = (data: unknown) => {
      const eventData = data as {
        tournamentUuid?: string;
        uuid?: string;
        roundIndex?: number;
        match?: {
          uuid: string;
          player1Id?: string | null;
          player2Id?: string | null;
          status?: string;
        };
      };
      const eventTournamentUuid = eventData.tournamentUuid || eventData.uuid;
      if (eventTournamentUuid === tournamentId && eventData.match) {
        const match = eventData.match;
        // Check if this match belongs to the current user and status changed to ongoing
        const isUserMatch =
          currentUserId &&
          (match.player1Id === currentUserId ||
            match.player2Id === currentUserId);

        if (isUserMatch && match.status === 'ongoing') {
          // Find opponent name
          const opponentId =
            match.player1Id === currentUserId
              ? match.player2Id
              : match.player1Id;
          const opponentName = opponentId
            ? playerMap.get(opponentId) || 'Your opponent'
            : 'Your opponent';

          // Show toast notification
          toast.show(`${opponentName} has begun the match!`, {
            variant: 'info',
          });
        }
      }
    };

    // Register socket listener
    tournamentSocket.on('match-updated', handleMatchUpdated);

    // Join specific tournament room to receive updates
    tournamentSocket.joinTournament(tournamentId);
  } catch (error) {
    innerContainer.innerHTML = '';
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load round';

    if (errorMessage.includes('Forbidden')) {
      renderErrorState(
        innerContainer,
        'You must be a participant to view this round'
      );
    } else {
      renderErrorState(innerContainer, errorMessage);
    }

    showApiError({
      message: errorMessage,
      status: 0,
      shouldRedirect: false,
    });
  }
}
