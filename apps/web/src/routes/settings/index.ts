import {
  PageContainer,
  Card,
  Button,
  Alert,
  KeyValueList,
  HeaderBar,
} from '../../components/index.js';

export function initRoute() {
  const pageRoot = document.querySelector(
    '.settings-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';
  const container = new PageContainer(pageRoot, {
    maxWidth: 'lg',
    padding: 'lg',
  });

  const header = document.createElement('div');
  container.getContentElement()?.appendChild(header);
  new HeaderBar(header, {
    title: 'Settings',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ],
    onNavigate: (href) =>
      window.navigateToRoute && window.navigateToRoute(href),
  });

  // Profile settings
  const profile = document.createElement('div');
  container.getContentElement()?.appendChild(profile);
  const profileCard = new Card(profile, { title: 'Profile' });
  const pBody = profileCard.getBodyElement();
  if (pBody) {
    const info = document.createElement('div');
    new KeyValueList(info, {
      items: [{ key: 'Display Name', value: 'Player' }],
    });
    pBody.appendChild(info);
    const btnHost = document.createElement('div');
    btnHost.className = 'mt-3';
    new Button(btnHost, {
      text: 'Change Name',
      variant: 'ghost',
      onClick: () => {
        console.log('Change name');
      },
    });
    pBody.appendChild(btnHost);
  }

  // Security
  const security = document.createElement('div');
  container.getContentElement()?.appendChild(security);
  const secCard = new Card(security, { title: 'Security' });
  const sBody = secCard.getBodyElement();
  if (sBody) {
    const warn = document.createElement('div');
    new Alert(warn, {
      variant: 'warning',
      message:
        '2FA is not configured yet. This is a placeholder. See Issue #2.',
    });
    sBody.appendChild(warn);

    const actions = document.createElement('div');
    actions.className = 'mt-3 flex gap-3';
    const a1 = document.createElement('div');
    new Button(a1, {
      text: 'Enable 2FA',
      variant: 'primary',
      onClick: () => {
        console.log('Enable 2FA');
      },
    });
    actions.appendChild(a1);
    const a2 = document.createElement('div');
    new Button(a2, {
      text: 'Logout',
      variant: 'danger',
      onClick: () => {
        if (window.navigateToRoute) window.navigateToRoute('/landing');
      },
    });
    actions.appendChild(a2);
    sBody.appendChild(actions);
  }

  // Back to Home link for reviewers
  const back = document.createElement('nav');
  back.className = 'mt-6';
  back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
  container.getContentElement()?.appendChild(back);
}
