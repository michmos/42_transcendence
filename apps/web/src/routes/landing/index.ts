import {
  PageContainer,
  Card,
  Button,
  Badge,
  HeaderBar,
} from '../../components/index.js';

export function initRoute() {
  const pageRoot = document.querySelector(
    '.landing-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';

  const container = new PageContainer(pageRoot, {
    maxWidth: 'xl',
    padding: 'lg',
  });

  // Header
  const headerMount = document.createElement('div');
  container.getContentElement()?.appendChild(headerMount);
  new HeaderBar(headerMount, {
    title: 'Mighty Pong Contest',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Tournaments', href: '/tournaments' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  // Hero card
  const heroMount = document.createElement('div');
  container.getContentElement()?.appendChild(heroMount);
  const hero = new Card(heroMount, {
    variant: 'accent',
    title: 'Challenge the World',
    subtitle: 'Play live matches and climb the leaderboards.',
  });
  const heroBody = hero.getBodyElement();
  if (heroBody) {
    const highlights = document.createElement('div');
    highlights.className = 'flex flex-wrap gap-3 mt-2';
    ['Live Tournaments', 'Global Leaderboards', 'Zero Install'].forEach((t) => {
      const bHost = document.createElement('div');
      new Badge(bHost, { text: t, variant: 'info' });
      highlights.appendChild(bHost);
    });
    heroBody.appendChild(highlights);
  }

  // Actions
  const actionsMount = document.createElement('div');
  container.getContentElement()?.appendChild(actionsMount);
  new Button(actionsMount, {
    text: 'Login',
    variant: 'primary',
    size: 'lg',
    onClick: () => {
      if (window.navigateToRoute) window.navigateToRoute('/login');
    },
  });

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
