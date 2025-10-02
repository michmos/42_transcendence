import {
  PageContainer,
  Card,
  NavPills,
  Table,
  HeaderBar,
} from '../../components/index.js';

type TRow = Record<string, string> & {
  name: string;
  status: string;
  starts: string;
};

export function initRoute() {
  const pageRoot = document.querySelector(
    '.tournaments-page'
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
    title: 'Tournaments',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  const filters = document.createElement('div');
  container.getContentElement()?.appendChild(filters);
  new NavPills(filters, {
    items: [
      { label: 'All', href: '/tournaments', active: true },
      { label: 'Active', href: '/tournaments?filter=active' },
      { label: 'Upcoming', href: '/tournaments?filter=upcoming' },
    ],
  });

  const list = document.createElement('div');
  container.getContentElement()?.appendChild(list);
  const card = new Card(list, { variant: 'default', title: 'List' });
  const body = card.getBodyElement();
  if (body) {
    const tableHost = document.createElement('div');
    body.appendChild(tableHost);
    const rows: TRow[] = [
      { name: 'Spring Cup', status: 'Upcoming', starts: 'Mar 10' },
      { name: 'Winter Clash', status: 'Active', starts: 'Today' },
    ];
    new Table<TRow>(tableHost, {
      columns: [
        { key: 'name', header: 'Tournament', sortable: true },
        { key: 'status', header: 'Status', sortable: true },
        { key: 'starts', header: 'Starts' },
      ],
      rows,
      emptyMessage: 'No tournaments available',
    });
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
