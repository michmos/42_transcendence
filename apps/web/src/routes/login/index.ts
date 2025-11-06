import { Card, Button } from '../../components/index.js';

export default function initRoute() {
  const pageRoot = document.querySelector('.root-page') as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.classList.add('overflow-hidden', 'h-screen', 'bg-gradient-primary');

  // Style the h1 title from the HTML - moved lower with top padding
  const pageTitle = pageRoot.querySelector('h1') as HTMLElement | null;
  if (pageTitle) {
    pageTitle.className = 'text-white text-center mb-8 text-5xl font-bold';
    pageTitle.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.3)';
    pageTitle.style.paddingTop = '80px';
    pageTitle.style.marginTop = '0';
  }

  const cardMount = document.getElementById('loginCard') as HTMLElement | null;
  if (!cardMount) return;
  cardMount.innerHTML = '';

  // Main container - centered with proper spacing
  const container = document.createElement('div');
  container.className = 'flex items-center justify-center p-4';
  cardMount.appendChild(container);

  // Card wrapper for custom styling
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'w-4/5 max-w-md';
  container.appendChild(cardWrapper);

  // Use Card component with custom styling
  const loginCard = new Card(cardWrapper, {
    variant: 'accent',
    className:
      '!bg-slate-900/80 !rounded-[32px] !p-8 !shadow-2xl !border-2 !border-slate-600/60',
  });

  const cardBody = loginCard.getBodyElement();
  if (!cardBody) return;

  // Icon
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'flex justify-center mb-6';
  cardBody.appendChild(iconWrapper);

  const icon = document.createElement('div');
  icon.className =
    'w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg';
  icon.innerHTML =
    '<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
  iconWrapper.appendChild(icon);

  // Header
  const header = document.createElement('div');
  header.className = 'text-center mb-6';
  cardBody.appendChild(header);

  const title = document.createElement('h2');
  title.className = 'text-2xl font-bold text-white mb-1';
  title.textContent = 'Welcome';
  header.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'text-slate-400 text-sm mb-8';
  subtitle.textContent = 'Log in and enjoy!';
  header.appendChild(subtitle);

  // OAuth buttons container
  const oauthContainer = document.createElement('div');
  oauthContainer.className = 'flex flex-col items-center w-full';
  oauthContainer.style.gap = '24px';
  cardBody.appendChild(oauthContainer);

  // Google button using Button component
  const googleBtnWrapper = document.createElement('div');
  googleBtnWrapper.className = 'w-3/5';
  oauthContainer.appendChild(googleBtnWrapper);

  new Button(googleBtnWrapper, {
    text: 'Google',
    onClick: () => {
      window.location.href = '/api/auth/login?provider=Google';
    },
    variant: 'secondary',
    size: 'lg',
    fullWidth: true,
    className:
      '!bg-white hover:!bg-gray-100 !border-gray-200 !text-gray-800 !font-semibold !text-lg !transition-all hover:!scale-105 !cursor-pointer !h-20',
  });

  // Apply inline styles to the actual button element
  const googleBtnElement = googleBtnWrapper.querySelector(
    'button'
  ) as HTMLButtonElement;
  if (googleBtnElement) {
    googleBtnElement.style.borderRadius = '16px';
    googleBtnElement.style.minHeight = '80px';
  }

  // 42 button using Button component
  const fortyTwoBtnWrapper = document.createElement('div');
  fortyTwoBtnWrapper.className = 'w-3/5';
  oauthContainer.appendChild(fortyTwoBtnWrapper);

  new Button(fortyTwoBtnWrapper, {
    text: '42',
    onClick: () => {
      window.location.href = '/api/auth/login?provider=42';
    },
    variant: 'secondary',
    size: 'lg',
    fullWidth: true,
    className:
      '!bg-white hover:!bg-gray-100 !border-gray-200 !text-gray-800 !font-semibold !text-lg !transition-all hover:!scale-105 !cursor-pointer !h-20',
  });

  // Apply inline styles to the actual button element
  const fortyTwoBtnElement = fortyTwoBtnWrapper.querySelector(
    'button'
  ) as HTMLButtonElement;
  if (fortyTwoBtnElement) {
    fortyTwoBtnElement.style.borderRadius = '16px';
    fortyTwoBtnElement.style.minHeight = '80px';
  }

  // Footer
  const footer = document.createElement('div');
  footer.className = 'text-center text-xs text-slate-500';
  footer.style.marginTop = '32px';
  footer.textContent =
    'By signing in, you agree to our Terms & Conditions and Privacy Policy';
  cardBody.appendChild(footer);
}
