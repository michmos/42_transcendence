import {
  PageContainer,
  Card,
  KeyValueList,
  Table,
  Button,
  HeaderBar,
} from '../../components/index.js';

type MatchRow = Record<string, string> & {
  date: string;
  opponent: string;
  score: string;
  result: string;
};

export function initRoute() {
  const pageRoot = document.querySelector(
    '.profile-page'
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
    title: 'Your Profile',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/settings' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  // Top card (avatar + name)
  const top = document.createElement('div');
  container.getContentElement()?.appendChild(top);
  const topCard = new Card(top, { variant: 'default' });
  const topBody = topCard.getBodyElement();
  if (topBody) {
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center gap-4';
    const avatar = document.createElement('div');
    avatar.className = 'avatar-circle';
    avatar.textContent = 'YOU';
    const name = document.createElement('div');
    name.className = 'text-white text-lg font-semibold';
    name.textContent = 'Player';
    const btnHost = document.createElement('div');
    new Button(btnHost, {
      text: 'Edit Name',
      variant: 'ghost',
      onClick: () => {
        console.log('Edit name');
      },
    });
    wrap.appendChild(avatar);
    wrap.appendChild(name);
    wrap.appendChild(btnHost);
    topBody.appendChild(wrap);
  }

  // Stats
  const stats = document.createElement('div');
  container.getContentElement()?.appendChild(stats);
  const statsCard = new Card(stats, { title: 'Statistics' });
  const statsBody = statsCard.getBodyElement();
  if (statsBody) {
    const kv = document.createElement('div');
    new KeyValueList(kv, {
      items: [
        { key: 'Wins', value: '24' },
        { key: 'Losses', value: '12' },
        { key: 'Win Ratio', value: '67%' },
      ],
    });
    statsBody.appendChild(kv);
  }

  // History
  const history = document.createElement('div');
  container.getContentElement()?.appendChild(history);
  const histCard = new Card(history, { title: 'Match History' });
  const histBody = histCard.getBodyElement();
  if (histBody) {
    const tableHost = document.createElement('div');
    histBody.appendChild(tableHost);
    const rows: MatchRow[] = [
      { date: '2025-03-01', opponent: 'Micha', score: '10-7', result: 'Win' },
      { date: '2025-02-20', opponent: 'Alex', score: '5-10', result: 'Loss' },
    ];
    new Table<MatchRow>(tableHost, {
      columns: [
        { key: 'date', header: 'Date', sortable: true },
        { key: 'opponent', header: 'Opponent', sortable: true },
        { key: 'score', header: 'Score' },
        { key: 'result', header: 'Result', sortable: true },
      ],
      rows,
      emptyMessage: 'No matches yet',
    });
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
