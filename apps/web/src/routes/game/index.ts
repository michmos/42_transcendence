import {
  PageContainer,
  Card,
  KeyValueList,
  Button,
  HeaderBar,
} from '../../components/index.js';

export function initRoute() {
  const pageRoot = document.querySelector('.game-page') as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';
  const container = new PageContainer(pageRoot, {
    maxWidth: 'xl',
    padding: 'lg',
  });

  const header = document.createElement('div');
  container.getContentElement()?.appendChild(header);
  new HeaderBar(header, {
    title: 'Game',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Tournaments', href: '/tournaments' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  const lobby = document.createElement('div');
  container.getContentElement()?.appendChild(lobby);
  const lobbyCard = new Card(lobby, { variant: 'default', title: 'Lobby' });
  const lobbyBody = lobbyCard.getBodyElement();
  if (lobbyBody) {
    lobbyBody.classList.add('flex', 'gap-3');
    const b1 = document.createElement('div');
    new Button(b1, {
      text: 'Ready',
      variant: 'primary',
      onClick: () => {
        console.log('Ready clicked');
      },
    });
    lobbyBody.appendChild(b1);
    const b2 = document.createElement('div');
    new Button(b2, {
      text: 'Invite Friends',
      variant: 'ghost',
      onClick: () => {
        console.log('Invite clicked');
      },
    });
    lobbyBody.appendChild(b2);
  }

  const canvasWrap = document.createElement('div');
  container.getContentElement()?.appendChild(canvasWrap);
  const canvasCard = new Card(canvasWrap, { title: 'Game' });
  const canvasBody = canvasCard.getBodyElement();
  if (canvasBody) {
    const ph = document.createElement('div');
    ph.className = 'canvas-placeholder';
    canvasBody.appendChild(ph);
  }

  const hudWrap = document.createElement('div');
  container.getContentElement()?.appendChild(hudWrap);
  const hudCard = new Card(hudWrap, { title: 'HUD' });
  const hudBody = hudCard.getBodyElement();
  if (hudBody) {
    const kvHost = document.createElement('div');
    new KeyValueList(kvHost, {
      items: [
        { key: 'Score', value: '0 - 0' },
        { key: 'Timer', value: '—' },
        { key: 'Players', value: 'You vs Opponent' },
      ],
    });
    hudBody.appendChild(kvHost);
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
