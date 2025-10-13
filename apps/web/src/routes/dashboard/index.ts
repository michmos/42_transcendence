import {
  PageContainer,
  Card,
  Button,
  Table,
  Badge,
  HeaderBar,
} from '../../components/index.js';

type FeedItem = Record<string, string> & {
  action: string;
  user: string;
  when: string;
};

export function initRoute() {
  const pageRoot = document.querySelector(
    '.dashboard-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';
  const container = new PageContainer(pageRoot, {
    maxWidth: 'xl',
    padding: 'lg',
  });

  const header = document.createElement('div');
  container.getContentElement()?.appendChild(header);
  new HeaderBar(header, {
    title: 'Dashboard',
    links: [
      { label: 'Game', href: '/game' },
      { label: 'Tournaments', href: '/tournaments' },
      { label: 'Profile', href: '/profile' },
      { label: 'Settings', href: '/settings' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  // Quick Actions
  const quick = document.createElement('div');
  container.getContentElement()?.appendChild(quick);
  const quickCard = new Card(quick, {
    variant: 'accent',
    title: 'Quick Actions',
  });
  const quickBody = quickCard.getBodyElement();
  if (quickBody) {
    quickBody.classList.add('flex', 'flex-wrap', 'gap-3');
    ['Play a Game', 'Join a Tournament', 'View Leaderboards'].forEach(
      (label) => {
        const btnHost = document.createElement('div');
        new Button(btnHost, {
          text: label,
          variant: 'primary',
          onClick: () => {
            // placeholder
          },
        });
        quickBody.appendChild(btnHost);
      }
    );

    const status = document.createElement('div');
    new Badge(status, { text: 'Online', variant: 'success' });
    quickBody.appendChild(status);
  }

  // Feed
  const feed = document.createElement('div');
  container.getContentElement()?.appendChild(feed);
  const feedCard = new Card(feed, {
    title: 'Activity Feed',
    variant: 'default',
  });
  const feedBody = feedCard.getBodyElement();
  if (feedBody) {
    const tableHost = document.createElement('div');
    feedBody.appendChild(tableHost);
    const rows: FeedItem[] = [
      { user: 'Micha', action: 'won a tournament', when: '2h ago' },
      { user: 'Alex', action: 'joined a match', when: '10m ago' },
    ];
    new Table<FeedItem>(tableHost, {
      columns: [
        { key: 'user', header: 'User', sortable: true },
        { key: 'action', header: 'Action' },
        { key: 'when', header: 'When', sortable: true },
      ],
      rows,
      emptyMessage: 'No recent activity',
    });
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
