import { Navbar, Card, Badge } from '../../components/index.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

interface Match {
  id: number;
  opponent1: string;
  opponent2: string;
  score1: number;
  score2: number;
  status: 'completed' | 'live' | 'upcoming';
}

const mockMatches: Match[] = [
  {
    id: 1,
    opponent1: 'Alex Green',
    opponent2: 'Maria Silva',
    score1: 2,
    score2: 1,
    status: 'completed',
  },
  {
    id: 2,
    opponent1: 'David Kim',
    opponent2: 'Tom Wilson',
    score1: 1,
    score2: 2,
    status: 'live',
  },
  {
    id: 3,
    opponent1: 'Sarah Lee',
    opponent2: 'Mike Brown',
    score1: 0,
    score2: 0,
    status: 'upcoming',
  },
  {
    id: 4,
    opponent1: 'Emma Chen',
    opponent2: 'John Doe',
    score1: 0,
    score2: 0,
    status: 'upcoming',
  },
];

function renderRoundHeader(container: HTMLElement, roundId: string) {
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
        <h1 class="text-4xl font-bold text-white">Round ${roundId}</h1>
      </div>
      <p class="text-white/80">Summer Championship 2024</p>
    </div>
    <div id="round-badge"></div>
  `;

  // Add badge
  const badgeContainer = roundHeader.querySelector('#round-badge');
  if (badgeContainer) {
    new Badge(badgeContainer as HTMLElement, {
      text: 'Round of 16',
      variant: 'info',
    });
  }

  container.appendChild(roundHeader);
}

function renderMatches(container: HTMLElement) {
  const matchesCardContainer = document.createElement('div');
  const matchesCard = new Card(matchesCardContainer, {
    title: 'Matches',
    variant: 'default',
  });

  const matchesContainer = document.createElement('div');
  matchesContainer.className = 'space-y-4';

  mockMatches.forEach((match) => {
    const matchItem = document.createElement('div');
    matchItem.className =
      'overflow-hidden rounded-lg border border-white/20 bg-white/5 transition-all hover:bg-white/10';

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

        <!-- Opponent 2 + Status Badge - Fixed width container -->
        <div class="flex-1 min-w-0 flex items-center justify-end gap-4">
          <!-- Opponent 2 -->
          <div class="text-right min-w-0">
            <p class="text-lg font-semibold text-white truncate">${match.opponent2}</p>
          </div>

          <!-- Status Badge - Fixed width to ensure alignment -->
          <div class="flex-shrink-0 w-24 flex justify-end" id="status-badge-${match.id}"></div>
        </div>
      </div>
    `;

    // Append status badge
    const badgeContainer = matchItem.querySelector(`#status-badge-${match.id}`);
    if (badgeContainer) {
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
      new Badge(badgeContainer as HTMLElement, {
        text: statusText,
        variant: variant,
      });
    }

    matchesContainer.appendChild(matchItem);
  });

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

export default function initRoute() {
  const roundRoot = document.querySelector(
    '.round-detail-page'
  ) as HTMLElement | null;
  if (!roundRoot) return;

  roundRoot.innerHTML = '';

  // Get route parameters from window.routeParams (set by router)
  const routeParams = window.routeParams || {};
  const roundId = routeParams.roundId || '1';
  // Get tournamentId from sessionStorage (set when navigating from tournament page)
  // This allows us to navigate back to the correct tournament
  const tournamentId =
    sessionStorage.getItem('lastTournamentId') || routeParams.tournamentId;

  // Main wrapper with gradient background - matching other pages structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  roundRoot.appendChild(mainWrapper);

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
      if (window.navigateToRoute) {
        window.navigateToRoute('/settings');
      } else if (window.router) {
        window.router.navigate('/settings');
      }
    },
    onLogoutClick: () => {
      if (window.navigateToRoute) window.navigateToRoute('/login');
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
      if (window.navigateToRoute) {
        window.navigateToRoute(
          tournamentId ? `/tournament/${tournamentId}` : '/tournaments'
        );
      } else if (window.router) {
        window.router.navigate(
          tournamentId ? `/tournament/${tournamentId}` : '/tournaments'
        );
      }
    });
  }
  backButtonContainer.appendChild(backButton);
  mainWrapper.appendChild(backButtonContainer);

  // ===== MAIN CONTENT =====
  const innerContainer = document.createElement('div');
  innerContainer.className = 'max-w-7xl mx-auto px-6 py-8';

  // Render sections
  renderRoundHeader(innerContainer, roundId);
  renderMatches(innerContainer);
  renderInfoCard(innerContainer);

  mainWrapper.appendChild(innerContainer);
}
