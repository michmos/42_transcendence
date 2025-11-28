import { Navbar, Card, Badge, Button } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import TournamentAPI from '../../plugins/api/tournaments.js';
import UserAPI from '../../plugins/api/user.js';
import type {
  Tournament as BackendTournament,
  TournamentRound,
  Match,
  status,
} from '../../types/api.js';
import { showApiError } from '../../utils/api-helpers.js';
import { getCurrentUserId } from '../../utils/auth-state.js';
import tournamentSocket from '../../plugins/websocket/tournament.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
    routeParams?: Record<string, string>;
  }
}

// UI Round interface (mapped from backend)
interface Round {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

// UI LeaderboardEntry interface
interface LeaderboardEntry {
  rank: number;
  player: string;
  points: number;
  scoreDiff: number;
}

/**
 * Map backend status to UI round status
 */
function mapRoundStatusToUI(
  round: TournamentRound
): 'completed' | 'in-progress' | 'upcoming' {
  // Check if all matches are finished
  const allMatchesFinished = round.matches.every(
    (match) => match.status === 'finished'
  );
  const anyMatchOngoing = round.matches.some(
    (match) => match.status === 'ongoing'
  );

  if (allMatchesFinished && round.matches.length > 0) {
    return 'completed';
  }
  if (anyMatchOngoing) {
    return 'in-progress';
  }
  return 'upcoming';
}

/**
 * Build leaderboard from tournament rounds and matches
 */
function buildLeaderboard(
  tournament: BackendTournament,
  rounds: TournamentRound[]
): LeaderboardEntry[] {
  // Get all participants
  const participants = tournament.participants || [];

  // Calculate stats per player
  const playerStats = new Map<
    string,
    { wins: number; losses: number; scoreDiff: number; nickname: string }
  >();

  // Initialize player stats
  participants.forEach((participant) => {
    playerStats.set(participant.uuid, {
      wins: 0,
      losses: 0,
      scoreDiff: 0,
      nickname: participant.nickname || participant.email || 'Unknown',
    });
  });

  // Process all matches from all rounds
  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.status !== 'finished') return;

      const player1Id = match.player1Id;
      const player2Id = match.player2Id;

      if (!player1Id || !player2Id) return;

      const score1 = match.Score1 || 0;
      const score2 = match.Score2 || 0;

      // Update player 1 stats
      const player1Stats = playerStats.get(player1Id);
      if (player1Stats) {
        player1Stats.scoreDiff += score1 - score2;
        if (score1 > score2) {
          player1Stats.wins++;
        } else if (score1 < score2) {
          player1Stats.losses++;
        }
      }

      // Update player 2 stats
      const player2Stats = playerStats.get(player2Id);
      if (player2Stats) {
        player2Stats.scoreDiff += score2 - score1;
        if (score2 > score1) {
          player2Stats.wins++;
        } else if (score2 < score1) {
          player2Stats.losses++;
        }
      }
    });
  });

  // Convert to leaderboard entries
  const leaderboard: LeaderboardEntry[] = Array.from(playerStats.entries())
    .map(([, stats]) => ({
      rank: 0, // Will be set after sorting
      player: stats.nickname,
      points: stats.wins * 2 + stats.losses, // 2 points for win, 1 for loss
      scoreDiff: stats.scoreDiff,
    }))
    .sort((a, b) => {
      // Sort by points (desc), then by scoreDiff (desc)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.scoreDiff - a.scoreDiff;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return leaderboard;
}

function getRoundColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-accent/20 text-accent border-accent/30';
    case 'in-progress':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'upcoming':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted';
  }
}

function renderTournamentHeader(
  container: HTMLElement,
  tournament: BackendTournament
) {
  const tournamentHeader = document.createElement('div');
  tournamentHeader.className =
    'mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between';

  const titleSection = document.createElement('div');
  titleSection.innerHTML = `
    <h1 class="mb-2 text-4xl font-bold text-white">${tournament.tournamentName}</h1>
    <p class="text-white/80">Tournament details and progress</p>
  `;

  const actionsSection = document.createElement('div');
  actionsSection.className = 'flex flex-col sm:flex-row gap-3 items-center';

  const badgesSection = document.createElement('div');
  badgesSection.className = 'flex gap-2';

  // Add Join/Start button logic
  const currentUserId = getCurrentUserId();
  const participants = tournament.participants || [];
  let isParticipant = false;
  if (currentUserId && participants.length > 0) {
    isParticipant = participants.some((p) => p.uuid === currentUserId);
  }

  const isOutstanding = tournament.status === 'outstanding';
  const isFull = tournament.playerCount >= tournament.maxPlayers;
  const hasMinPlayers = tournament.playerCount >= tournament.minPlayers;

  const buttonContainer = document.createElement('div');

  // Logic matched with tournaments/index.ts
  if (isParticipant) {
    if (hasMinPlayers && isOutstanding) {
      // Start button
      new Button(buttonContainer, {
        text: 'Start Tournament',
        variant: 'primary',
        onClick: async () => {
          try {
            await TournamentAPI.startTournament(tournament.uuid);
            // Will refresh via socket
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to start');
          }
        },
        className: '!bg-green-600 hover:!bg-green-700',
      });
    }
    // If participant but cannot start, show nothing or maybe "Waiting for players" label?
    // For now, just show badges.
  } else if (currentUserId && isOutstanding && !isFull) {
    // Join button
    new Button(buttonContainer, {
      text: 'Join Tournament',
      variant: 'secondary',
      onClick: async () => {
        try {
          await TournamentAPI.joinTournament(tournament.uuid);
          // Will refresh via socket or manual reload if needed
          window.location.reload();
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to join');
        }
      },
      className: '!bg-accent !text-white hover:!bg-accent/90',
    });
  }

  actionsSection.appendChild(badgesSection);
  if (buttonContainer.hasChildNodes()) {
    actionsSection.appendChild(buttonContainer);
  }

  tournamentHeader.appendChild(titleSection);
  tournamentHeader.appendChild(actionsSection);
  container.appendChild(tournamentHeader);
}

function renderStatsCards(
  container: HTMLElement,
  tournament: BackendTournament
) {
  const statsGrid = document.createElement('div');
  statsGrid.className = 'grid gap-4 md:grid-cols-2 mb-8';

  const stats = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      value: `${tournament.playerCount}/${tournament.maxPlayers}`,
      label: 'Reg. Players',
      bgColor: 'bg-accent/20',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>`,
      value: `${tournament.numberOfRounds}`,
      label: 'Total Rounds',
      bgColor: 'bg-secondary/20',
    },
  ];

  stats.forEach((stat) => {
    const card = document.createElement('div');
    card.className =
      'rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-8';
    card.innerHTML = `
      <div class="flex items-center gap-6">
        <div class="rounded-full ${stat.bgColor} p-4 flex-shrink-0">
          ${stat.icon}
        </div>
        <div class="flex-1">
          <p class="text-4xl font-bold text-white mb-1">${stat.value}</p>
          <p class="text-base text-white/70 font-medium">${stat.label}</p>
        </div>
      </div>
    `;
    statsGrid.appendChild(card);
  });

  container.appendChild(statsGrid);
}

function renderTournamentProgress(
  container: HTMLElement,
  rounds: Round[],
  tournamentUuid: string
) {
  const cardContainer = document.createElement('div');
  const card = new Card(cardContainer, {
    title: 'Tournament Progress',
    variant: 'default',
  });

  // Apply custom styling to card
  const cardElement = cardContainer.firstElementChild as HTMLElement;
  if (cardElement) {
    cardElement.className =
      'rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6';
  }

  const roundsContainer = document.createElement('div');
  roundsContainer.className = 'space-y-3';

  rounds.forEach((round) => {
    const roundItem = document.createElement('div');
    roundItem.className = `flex items-center justify-between rounded-lg border p-4 transition-all hover:scale-105 cursor-pointer ${getRoundColor(round.status)}`;

    const statusText =
      round.status === 'completed'
        ? 'Complete'
        : round.status === 'in-progress'
          ? '100%'
          : 'Upcoming';

    const statusBadgeContainer = document.createElement('div');
    new Badge(statusBadgeContainer, { text: statusText, variant: 'default' });
    const statusBadgeElement =
      statusBadgeContainer.firstElementChild as HTMLElement;
    if (statusBadgeElement) {
      statusBadgeElement.className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRoundColor(round.status)}`;
    }

    roundItem.innerHTML = `
      <span class="font-medium">${round.name}</span>
    `;
    roundItem.appendChild(statusBadgeContainer);

    if (roundItem) {
      roundItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Store tournamentId in sessionStorage for round page to use
        sessionStorage.setItem('lastTournamentId', tournamentUuid);
        navigateTo(`/round/${round.id}`);
      });
    }

    roundsContainer.appendChild(roundItem);
  });

  const cardBody = card.getBodyElement();
  if (cardBody) {
    cardBody.appendChild(roundsContainer);
  }

  container.appendChild(cardContainer);
}

function renderLeaderboard(
  container: HTMLElement,
  leaderboard: LeaderboardEntry[]
) {
  const cardContainer = document.createElement('div');
  const card = new Card(cardContainer, {
    title: 'Leaderboard',
    variant: 'default',
  });

  // Apply custom styling to card
  const cardElement = cardContainer.firstElementChild as HTMLElement;
  if (cardElement) {
    cardElement.className =
      'rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6';
  }

  const table = document.createElement('table');
  table.className = 'w-full';

  table.innerHTML = `
    <thead>
      <tr class="border-b border-white/20">
        <th class="text-left py-3 px-4 text-white/80 font-medium">#</th>
        <th class="text-left py-3 px-4 text-white/80 font-medium">Player</th>
        <th class="text-left py-3 px-4 text-white/80 font-medium">Points</th>
        <th class="text-left py-3 px-4 text-white/80 font-medium">Score Diff</th>
      </tr>
    </thead>
    <tbody>
      ${
        leaderboard.length === 0
          ? '<tr><td colspan="4" class="py-8 text-center text-white/60">No matches played yet</td></tr>'
          : leaderboard
              .map(
                (entry) => `
        <tr class="border-b border-white/20 hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 text-white font-medium">${entry.rank}</td>
          <td class="py-3 px-4 text-white">${entry.player}</td>
          <td class="py-3 px-4 text-white">${entry.points}</td>
          <td class="py-3 px-4 text-white">${entry.scoreDiff > 0 ? '+' : ''}${entry.scoreDiff}</td>
        </tr>
      `
              )
              .join('')
      }
    </tbody>
  `;

  const cardBody = card.getBodyElement();
  if (cardBody) {
    cardBody.appendChild(table);
  }

  container.appendChild(cardContainer);
}

function renderLoadingState(container: HTMLElement) {
  const loadingState = document.createElement('div');
  loadingState.className = 'py-16 text-center';
  loadingState.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    <p class="mt-4 text-white/60">Loading tournament...</p>
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
    <h3 class="mb-2 text-xl font-semibold text-white">Error loading tournament</h3>
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
  const pageRoot = document.querySelector(
    '.tournament-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;

  // Get tournament UUID from route params
  const routeParams = window.routeParams || {};
  const tournamentUuid = routeParams.id;

  if (!tournamentUuid) {
    pageRoot.innerHTML =
      '<div class="p-8 text-white">Tournament ID not found</div>';
    return;
  }

  pageRoot.innerHTML = '';

  // Main wrapper with gradient background - matching profile/tournaments structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getUserBasicInfo();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    ...(userInfo?.nickname && { userNickname: userInfo.nickname }),
    ...(userInfo?.avatar && { userAvatar: userInfo.avatar }),
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: handleLogout,
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
      <span>Back to Tournaments</span>
    </button>
  `;
  const backBtn = backButton.querySelector('button');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateTo('/tournaments');
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

  // Map tournament status for badge (defined early for use in refresh function)
  const statusMap: Record<status, string> = {
    outstanding: 'Upcoming',
    ongoing: 'Active',
    finished: 'Completed',
    canceled: 'Canceled',
  };

  // Store tournament and rounds for socket updates
  let currentTournament: BackendTournament | null = null;
  let currentLeaderboard: LeaderboardEntry[] = [];
  let currentUIRounds: Round[] = [];

  // Function to refresh tournament data
  const refreshTournamentData = async () => {
    if (!currentTournament) return;

    try {
      const updatedTournament =
        await TournamentAPI.getTournament(tournamentUuid);
      if (updatedTournament) {
        currentTournament = updatedTournament;
        // Re-fetch rounds if needed
        const updatedRounds: TournamentRound[] = [];
        for (let i = 0; i < updatedTournament.numberOfRounds; i++) {
          try {
            const round = await TournamentAPI.getTournamentRound(
              tournamentUuid,
              i
            );
            if (round) {
              updatedRounds.push(round);
            }
          } catch (error) {
            console.error(`Error fetching round ${i}:`, error);
          }
        }
        currentUIRounds = updatedRounds.map((round) => ({
          id: round.index,
          name: `Round ${round.index + 1}`,
          status: mapRoundStatusToUI(round),
        }));
        currentLeaderboard = buildLeaderboard(updatedTournament, updatedRounds);

        // Re-render the page with updated data
        innerContainer.innerHTML = '';
        const headerDiv = document.createElement('div');
        renderTournamentHeader(headerDiv, updatedTournament);
        innerContainer.appendChild(headerDiv);

        // Re-add status badge
        const tournamentHeader = headerDiv.firstElementChild as HTMLElement;
        if (tournamentHeader) {
          // The badges section is now nested inside actionsSection
          const actionsSection =
            tournamentHeader.lastElementChild as HTMLElement;
          const badgesSection = actionsSection?.querySelector('.flex.gap-2');

          if (badgesSection) {
            const statusBadgeContainer = document.createElement('div');
            new Badge(statusBadgeContainer, {
              text: statusMap[updatedTournament.status] || 'Unknown',
              variant: 'default',
            });
            const statusBadgeElement =
              statusBadgeContainer.firstElementChild as HTMLElement;
            if (statusBadgeElement) {
              const statusColors: Record<status, string> = {
                outstanding: 'bg-warning text-white',
                ongoing: 'bg-accent text-white',
                finished: 'bg-muted text-muted-foreground',
                canceled: 'bg-red-500 text-white',
              };
              statusBadgeElement.className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[updatedTournament.status] || 'bg-muted'}`;
            }
            badgesSection.insertBefore(
              statusBadgeContainer,
              badgesSection.firstChild
            );
          }
        }

        renderStatsCards(innerContainer, updatedTournament);
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid gap-6 lg:grid-cols-2';
        const progressColumn = document.createElement('div');
        renderTournamentProgress(
          progressColumn,
          currentUIRounds,
          tournamentUuid
        );
        gridContainer.appendChild(progressColumn);
        const leaderboardColumn = document.createElement('div');
        renderLeaderboard(leaderboardColumn, currentLeaderboard);
        gridContainer.appendChild(leaderboardColumn);
        innerContainer.appendChild(gridContainer);
      }
    } catch (error) {
      console.error('Error refreshing tournament data:', error);
    }
  };

  try {
    // Fetch tournament
    const tournament = await TournamentAPI.getTournament(tournamentUuid);
    if (!tournament) {
      renderErrorState(innerContainer, 'Tournament not found');
      return;
    }

    currentTournament = tournament;

    // Fetch all rounds
    const rounds: TournamentRound[] = [];
    for (let i = 0; i < tournament.numberOfRounds; i++) {
      try {
        const round = await TournamentAPI.getTournamentRound(tournamentUuid, i);
        if (round) {
          rounds.push(round);
        }
      } catch (error) {
        // Handle 403 (not participant) or other errors
        if (error instanceof Error && error.message.includes('Forbidden')) {
          innerContainer.innerHTML = '';
          renderErrorState(
            innerContainer,
            'You must be a participant to view this tournament'
          );
          return;
        }
        console.error(`Error fetching round ${i}:`, error);
      }
    }

    // Map rounds to UI format
    currentUIRounds = rounds.map((round) => ({
      id: round.index,
      name: `Round ${round.index + 1}`,
      status: mapRoundStatusToUI(round),
    }));

    // Build leaderboard
    currentLeaderboard = buildLeaderboard(tournament, rounds);

    // Clear loading state and render content
    innerContainer.innerHTML = '';

    // Render header with tournament data
    const headerDiv = document.createElement('div');
    renderTournamentHeader(headerDiv, tournament);
    innerContainer.appendChild(headerDiv);

    // Add status badge to header
    const tournamentHeader = headerDiv.firstElementChild as HTMLElement;
    if (tournamentHeader) {
      // The badges section is now nested inside actionsSection
      const actionsSection = tournamentHeader.lastElementChild as HTMLElement;
      const badgesSection = actionsSection?.querySelector('.flex.gap-2');

      if (badgesSection) {
        const statusBadgeContainer = document.createElement('div');
        new Badge(statusBadgeContainer, {
          text: statusMap[tournament.status] || 'Unknown',
          variant: 'default',
        });
        const statusBadgeElement =
          statusBadgeContainer.firstElementChild as HTMLElement;
        if (statusBadgeElement) {
          const statusColors: Record<status, string> = {
            outstanding: 'bg-warning text-white',
            ongoing: 'bg-accent text-white',
            finished: 'bg-muted text-muted-foreground',
            canceled: 'bg-red-500 text-white',
          };
          statusBadgeElement.className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[tournament.status] || 'bg-muted'}`;
        }
        badgesSection.insertBefore(
          statusBadgeContainer,
          badgesSection.firstChild
        );
      }
    }

    // Render stats cards
    renderStatsCards(innerContainer, tournament);

    // Two-column grid for progress and leaderboard
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid gap-6 lg:grid-cols-2';

    const progressColumn = document.createElement('div');
    renderTournamentProgress(progressColumn, currentUIRounds, tournamentUuid);
    gridContainer.appendChild(progressColumn);

    const leaderboardColumn = document.createElement('div');
    renderLeaderboard(leaderboardColumn, currentLeaderboard);
    gridContainer.appendChild(leaderboardColumn);

    innerContainer.appendChild(gridContainer);

    // ===== TOURNAMENT SOCKET INTEGRATION =====
    // Initialize tournament socket for real-time updates
    tournamentSocket.initialize();

    // Set up socket listeners for tournament-specific updates
    const handleTournamentUpdated = (data: {
      uuid: string;
      status?: status;
      playerCount?: number;
    }) => {
      if (data.uuid === tournamentUuid && currentTournament) {
        // Update tournament data
        if (data.status) {
          currentTournament.status = data.status;
        }
        if (data.playerCount !== undefined) {
          currentTournament.playerCount = data.playerCount;
        }
        // Refresh the page to show updates
        refreshTournamentData();
      }
    };

    const handleUserJoined = (data: {
      tournamentUuid: string;
      user: unknown;
    }) => {
      if (data.tournamentUuid === tournamentUuid) {
        // Refresh tournament to show updated player count
        refreshTournamentData();
      }
    };

    const handleUserLeft = (data: {
      tournamentUuid: string;
      userUuid: string;
    }) => {
      if (data.tournamentUuid === tournamentUuid) {
        // Refresh tournament to show updated player count
        refreshTournamentData();
      }
    };

    const handleTournamentStarted = (data: {
      uuid: string;
      rounds: TournamentRound[];
    }) => {
      if (data.uuid === tournamentUuid) {
        // Tournament started - refresh to show rounds
        refreshTournamentData();
      }
    };

    const handleMatchUpdated = (data: {
      tournamentUuid: string;
      roundIndex: number;
      match: Match;
    }) => {
      if (data.tournamentUuid === tournamentUuid) {
        // Match updated - refresh to show updated scores
        refreshTournamentData();
      }
    };

    const handleRoundCompleted = (data: {
      tournamentUuid: string;
      roundIndex: number;
    }) => {
      if (data.tournamentUuid === tournamentUuid) {
        // Round completed - refresh to show updated status
        refreshTournamentData();
      }
    };

    // Register socket listeners
    tournamentSocket.on('tournament-updated', handleTournamentUpdated);
    tournamentSocket.on('tournament-joined', handleUserJoined);
    tournamentSocket.on('tournament-left', handleUserLeft);
    tournamentSocket.on('tournament-started', handleTournamentStarted);
    tournamentSocket.on('match-updated', handleMatchUpdated);
    tournamentSocket.on('round-completed', handleRoundCompleted);

    // Join specific tournament room (will fail gracefully if backend not ready)
    tournamentSocket.joinTournament(tournamentUuid);
  } catch (error) {
    innerContainer.innerHTML = '';
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load tournament';

    if (errorMessage.includes('Forbidden')) {
      renderErrorState(
        innerContainer,
        'You must be a participant to view this tournament'
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
