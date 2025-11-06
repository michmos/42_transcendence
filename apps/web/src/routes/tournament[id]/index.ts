import { Navbar, Card, Badge } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

interface Round {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

interface LeaderboardEntry {
  rank: number;
  player: string;
  points: number;
  scoreDiff: number;
}

const mockRounds: Round[] = [
  { id: 1, name: 'Round 1', status: 'completed' },
  { id: 2, name: 'Round 2', status: 'completed' },
  { id: 3, name: 'Round 3', status: 'in-progress' },
  { id: 4, name: 'Round 4', status: 'upcoming' },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, player: 'PoPo', points: 4, scoreDiff: 23 },
  { rank: 2, player: 'MichPich', points: 2, scoreDiff: 25 },
  { rank: 3, player: 'Lightning', points: 4, scoreDiff: 18 },
  { rank: 4, player: 'Thunder', points: 3, scoreDiff: 15 },
];

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

function renderTournamentHeader(container: HTMLElement) {
  const tournamentHeader = document.createElement('div');
  tournamentHeader.className =
    'mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between';

  const titleSection = document.createElement('div');
  titleSection.innerHTML = `
    <h1 class="mb-2 text-4xl font-bold text-white">Summer Championship 2024</h1>
    <p class="text-white/80">Elite tournament featuring the best ping players worldwide</p>
  `;

  const badgesSection = document.createElement('div');
  badgesSection.className = 'flex gap-2';

  const activeBadgeContainer = document.createElement('div');
  new Badge(activeBadgeContainer, { text: 'Active', variant: 'default' });
  const activeBadgeElement =
    activeBadgeContainer.firstElementChild as HTMLElement;
  if (activeBadgeElement) {
    activeBadgeElement.className =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-accent text-white';
  }

  const roundBadgeContainer = document.createElement('div');
  new Badge(roundBadgeContainer, { text: 'Round of 16', variant: 'default' });
  const roundBadgeElement =
    roundBadgeContainer.firstElementChild as HTMLElement;
  if (roundBadgeElement) {
    roundBadgeElement.className =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-info text-white';
  }

  badgesSection.appendChild(activeBadgeContainer);
  badgesSection.appendChild(roundBadgeContainer);

  tournamentHeader.appendChild(titleSection);
  tournamentHeader.appendChild(badgesSection);
  container.appendChild(tournamentHeader);
}

function renderStatsCards(container: HTMLElement) {
  const statsGrid = document.createElement('div');
  statsGrid.className = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8';

  const stats = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      value: '64',
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
      value: '16',
      label: 'Bracket #',
      bgColor: 'bg-secondary/20',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>`,
      value: '2:45',
      label: 'Avg Match Time',
      bgColor: 'bg-accent/20',
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

function renderTournamentProgress(container: HTMLElement) {
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

  mockRounds.forEach((round) => {
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
        // Get tournamentId from route params
        const routeParams = window.routeParams || {};
        const tournamentId = routeParams.id;
        // Store tournamentId in sessionStorage for round page to use
        if (tournamentId) {
          sessionStorage.setItem('lastTournamentId', tournamentId);
        }
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

function renderLeaderboard(container: HTMLElement) {
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
      ${mockLeaderboard
        .map(
          (entry) => `
        <tr class="border-b border-white/20 hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 text-white font-medium">${entry.rank}</td>
          <td class="py-3 px-4 text-white">${entry.player}</td>
          <td class="py-3 px-4 text-white">${entry.points}</td>
          <td class="py-3 px-4 text-white">${entry.scoreDiff}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  `;

  const cardBody = card.getBodyElement();
  if (cardBody) {
    cardBody.appendChild(table);
  }

  container.appendChild(cardContainer);
}

export default function initRoute() {
  const pageRoot = document.querySelector(
    '.tournament-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;

  pageRoot.innerHTML = '';

  // Main wrapper with gradient background - matching profile/tournaments structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: () => {
      navigateTo('/login');
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

  // Render sections
  renderTournamentHeader(innerContainer);
  renderStatsCards(innerContainer);

  // Two-column grid for progress and leaderboard
  const gridContainer = document.createElement('div');
  gridContainer.className = 'grid gap-6 lg:grid-cols-2';

  const progressColumn = document.createElement('div');
  renderTournamentProgress(progressColumn);
  gridContainer.appendChild(progressColumn);

  const leaderboardColumn = document.createElement('div');
  renderLeaderboard(leaderboardColumn);
  gridContainer.appendChild(leaderboardColumn);

  innerContainer.appendChild(gridContainer);
  mainWrapper.appendChild(innerContainer);
}
