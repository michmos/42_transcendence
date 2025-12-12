import { Navbar, Card, Badge } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import { showApiError } from '../../utils/api-helpers.js';
import tournamentSocket from '../../plugins/websocket/tournament.js';
import toast from '../../utils/toast.js';
import { joinTournamentMatch } from '../game/buttonLogic.js';
import { getAvatarSrc } from '../../utils/avatar-helpers.js';
import type { TournamentParticipation } from 'types';

// UI Match interface (mapped from backend)
interface Match {
  id: string;
  opponent1: string;
  opponent2: string;
  score1: number;
  score2: number;
  status: 'completed' | 'live' | 'upcoming';
  hasNullPlayer?: boolean;
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
  userNickname: string | null = null,
  userAlias: string | null = null
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
      const matchItem = document.createElement('div');

      // Gray out matches with null players (automatic wins)
      const baseClasses = 'overflow-hidden rounded-lg border transition-all';
      let matchClasses = baseClasses;

      if (match.hasNullPlayer) {
        matchClasses = `${baseClasses} border-white/20 bg-white/5 opacity-50 grayscale`;
      } else {
        matchClasses = `${baseClasses} border-white/20 bg-white/5 hover:bg-white/10`;
      }

      matchItem.className = matchClasses;
      matchItem.id = `match-${match.id}`; // Add ID for easier updates

      // Check if user is a participant in this match
      // Player names can be either aliases (for tournament matches) or nicknames (for regular matches)
      const nicknameMatches =
        userNickname &&
        (match.opponent1 === userNickname || match.opponent2 === userNickname);
      const aliasMatches =
        userAlias &&
        (match.opponent1 === userAlias || match.opponent2 === userAlias);

      const isUserParticipant = nicknameMatches || aliasMatches;

      const showStartButton =
        isUserParticipant &&
        match.status === 'upcoming' &&
        !match.hasNullPlayer;

      matchItem.innerHTML = `
      <div class="flex items-center p-6">
        <!-- Opponent 1 -->
        <div class="flex-1 min-w-0">
          <p class="text-lg font-semibold text-white truncate">${match.opponent1}</p>
        </div>

        <!-- Score - Always centered -->
        <div class="flex-shrink-0 mx-8">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 transition-colors ${match.status === 'live' ? 'bg-accent/20 animate-pulse' : ''}">
              <span class="text-2xl font-bold text-white" id="score1-${match.id}">${match.score1}</span>
            </div>
            <span class="text-xl text-white/60">-</span>
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 transition-colors ${match.status === 'live' ? 'bg-accent/20 animate-pulse' : ''}">
              <span class="text-2xl font-bold text-white" id="score2-${match.id}">${match.score2}</span>
            </div>
          </div>
        </div>

        <!-- Opponent 2 + Status Badge/Button - Fixed width container -->
        <div class="flex-1 min-w-0 flex items-center justify-end gap-4">
          <!-- Opponent 2 -->
          <div class="text-right min-w-0">
            <p class="text-lg font-semibold text-white truncate">${match.opponent2}</p>
          </div>

          <!-- Status Badge or Start Button - Fixed width to ensure alignment -->
          <div class="flex-shrink-0 flex justify-end gap-2" id="match-actions-${match.id}">
            ${
              showStartButton
                ? `
              <button 
                id="start-game-btn-${match.id}"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer text-sm whitespace-nowrap"
              >
                Start Game
              </button>
            `
                : `
              <div class="w-24 flex justify-end" id="status-badge-${match.id}"></div>
            `
            }
          </div>
        </div>
      </div>
    `;

      // Append status badge (if not showing start button)
      if (!showStartButton) {
        const badgeContainer = matchItem.querySelector<HTMLElement>(
          `#status-badge-${match.id}`
        );
        if (badgeContainer) {
          const statusText =
            match.status === 'completed'
              ? 'Final'
              : match.status === 'live'
                ? 'LIVE'
                : 'Upcoming';
          const variant =
            match.status === 'completed'
              ? 'success'
              : match.status === 'live'
                ? 'warning'
                : 'default';
          new Badge(badgeContainer, {
            text: statusText,
            variant: variant,
          });
        }
      } else {
        // Add click handler for Start Game button
        const startButton = matchItem.querySelector<HTMLButtonElement>(
          `#start-game-btn-${match.id}`
        );
        if (startButton) {
          startButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            joinTournamentMatch(match.id);
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
  // Removed "This would need to be done with websocket" text
  // Replaced with live updates indicator
  infoCardContainer.innerHTML = `
    <div class="flex items-center justify-center gap-2 text-white/60 text-sm">
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/50 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
      </span>
      Live updates enabled
      </div>
    `;

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

/**
 * Get user's tournament alias using two strategies:
 *
 * @param tournamentId - Tournament UUID to match against
 * @returns Promise<string | null> - User's alias for the tournament, or null if not found
 */
async function getUserTournamentAlias(
  tournamentId: string
): Promise<string | null> {
  const currentUserId = window.user?.cleanedUserData.uuid;
  if (!currentUserId) return null;

  try {
    const myTournaments: TournamentParticipation[] =
      await window.api.getMyTournaments();
    return (
      myTournaments.find((t) => t.tournamentId === tournamentId)?.alias || null
    );
  } catch (error) {
    console.error('Error fetching tournament alias:', (error as Error).message);
  }
  return null;
}

export default async function initRoute() {
  if (window.user == null) {
    navigateTo('/');
    return;
  }

  const roundRoot = document.querySelector<HTMLElement>('.round-detail-page');
  if (!roundRoot) return;

  roundRoot.innerHTML = '';

  // Get route parameters from window.routeParams (set by router)
  const routeParams = window.routeParams || {};
  const roundId = routeParams['roundId'] || '1';
  const roundIndex = parseInt(roundId, 10) - 1; // Convert to 0-based index

  // Get tournament ID from route parameters (from URL: /tournament/:tournamentId/round/:roundId)
  const tournamentId = routeParams['tournamentId'];

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
  const userInfo = await window.api.getMe();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    userNickname: userInfo?.nickname || 'No Nickname Set',
    userAvatar: getAvatarSrc(userInfo?.avatar),
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: () => {
      void handleLogout();
    },
  });

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

  // Function to refresh round data
  const refreshRoundData = async () => {
    try {
      // Re-fetch tournament
      const tournament = await window.api.getTournament(tournamentId);
      if (!tournament) return;

      // Re-fetch round
      const round = await window.api.getTournamentRound(
        tournamentId,
        roundIndex
      );
      if (!round) return;

      // Fetch full match details for each match UUID
      const matchDetails = await Promise.all(
        round.matches.map((match) => window.api.getMatch(match.uuid))
      );

      // Map matches using MatchResponse data
      const uiMatches: Match[] = matchDetails
        .filter((match): match is NonNullable<typeof match> => match !== null)
        .map((match) => {
          const opponent1 = match.player1Name || 'Nobody';
          const opponent2 = match.player2Name || 'Nobody';
          const hasNullPlayer =
            opponent1 === 'Nobody' || opponent2 === 'Nobody';

          return {
            id: match.uuid,
            opponent1,
            opponent2,
            score1: match.score1 || 0,
            score2: match.score2 || 0,
            status: mapMatchStatusToUI(match.status),
            hasNullPlayer,
          };
        });

      // Get user's tournament alias
      const userAlias = await getUserTournamentAlias(tournamentId);

      // Clear and re-render
      innerContainer.innerHTML = '';
      renderRoundHeader(innerContainer, roundIndex, tournament.tournamentName);
      renderMatches(
        innerContainer,
        uiMatches,
        userInfo?.nickname || null,
        userAlias
      );
      renderInfoCard(innerContainer);
    } catch (error) {
      console.error('Error refreshing round data:', error);
    }
  };

  try {
    // Fetch tournament data
    const tournament = await window.api.getTournament(tournamentId);
    if (!tournament) {
      renderErrorState(innerContainer, 'Tournament not found');
      return;
    }

    // Fetch round data
    const round = await window.api.getTournamentRound(tournamentId, roundIndex);
    if (!round) {
      renderErrorState(innerContainer, 'Round not found');
      return;
    }

    // Fetch full match details for each match UUID
    const matchDetails = await Promise.all(
      round.matches.map((match) => window.api.getMatch(match.uuid))
    );

    // Map matches using MatchResponse data
    const uiMatches: Match[] = matchDetails
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .map((match) => {
        const opponent1 = match.player1Name || 'Nobody';
        const opponent2 = match.player2Name || 'Nobody';
        const hasNullPlayer = opponent1 === 'Nobody' || opponent2 === 'Nobody';

        return {
          id: match.uuid,
          opponent1,
          opponent2,
          score1: match.score1 || 0,
          score2: match.score2 || 0,
          status: mapMatchStatusToUI(match.status),
          hasNullPlayer,
        };
      });

    // Get user's tournament alias
    const userAlias = await getUserTournamentAlias(tournamentId);

    // Render content
    innerContainer.innerHTML = '';
    renderRoundHeader(innerContainer, roundIndex, tournament.tournamentName);
    renderMatches(
      innerContainer,
      uiMatches,
      userInfo?.nickname || null,
      userAlias
    );
    renderInfoCard(innerContainer);

    // ===== SOCKET INTEGRATION =====
    tournamentSocket.initialize();
    tournamentSocket.joinTournament(tournamentId);

    const handleMatchUpdated = (data: unknown) => {
      const eventData = data as {
        tournamentUuid: string;
        match: Match;
      };
      if (eventData.tournamentUuid === tournamentId) {
        // We could optimize to update just one match, but refreshing is safer
        void refreshRoundData();
      }
    };

    const handleRoundCompleted = (data: unknown) => {
      const eventData = data as {
        tournamentUuid: string;
        roundIndex: number;
      };
      if (
        eventData.tournamentUuid === tournamentId &&
        eventData.roundIndex === roundIndex
      ) {
        toast.show('Round completed!', { variant: 'success' });
        void refreshRoundData();
      }
    };

    tournamentSocket.on('match-updated', handleMatchUpdated);
    tournamentSocket.on('round-completed', handleRoundCompleted);
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
