import {
  PageContainer,
  Card,
  Table,
  KeyValueList,
  HeaderBar,
} from '../../components/index.js';

declare const routeParams: { id: string } | undefined;

type PRow = Record<string, string | number> & {
  name: string;
  seed: number;
};

export function initRoute() {
  const pageRoot = document.querySelector(
    '.tournament-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';

  const id = routeParams?.id || '—';

  const container = new PageContainer(pageRoot, {
    maxWidth: 'xl',
    padding: 'lg',
  });

  const header = document.createElement('div');
  container.getContentElement()?.appendChild(header);
  new HeaderBar(header, {
    title: `Tournament #${id}`,
    links: [
      { label: 'All Tournaments', href: '/tournaments' },
      { label: 'Profile', href: '/profile' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  const bracket = document.createElement('div');
  container.getContentElement()?.appendChild(bracket);
  const bracketCard = new Card(bracket, { title: 'Bracket' });
  const bracketBody = bracketCard.getBodyElement();
  if (bracketBody) {
    const ph = document.createElement('div');
    ph.className = 'bracket-placeholder';
    bracketBody.appendChild(ph);
  }

  const participants = document.createElement('div');
  container.getContentElement()?.appendChild(participants);
  const partCard = new Card(participants, { title: 'Participants' });
  const partBody = partCard.getBodyElement();
  if (partBody) {
    const tableHost = document.createElement('div');
    partBody.appendChild(tableHost);
    const rows: PRow[] = [
      { name: 'Micha', seed: 1 },
      { name: 'Alex', seed: 2 },
    ];
    new Table<PRow>(tableHost, {
      columns: [
        { key: 'seed', header: 'Seed', sortable: true, widthClass: 'w-20' },
        { key: 'name', header: 'Player', sortable: true },
      ],
      rows,
      emptyMessage: 'No participants yet',
    });
  }

  const next = document.createElement('div');
  container.getContentElement()?.appendChild(next);
  const nextCard = new Card(next, { title: 'Next Match' });
  const nextBody = nextCard.getBodyElement();
  if (nextBody) {
    const kv = document.createElement('div');
    new KeyValueList(kv, {
      items: [
        { key: 'Players', value: 'Winner of A vs Winner of B' },
        { key: 'ETA', value: '10 minutes' },
      ],
    });
    nextBody.appendChild(kv);
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
