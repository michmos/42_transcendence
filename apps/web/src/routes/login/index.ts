import { Card, Button } from '../../components/index.js';
import { getSession } from '../../plugins/api/auth.js';
import { setSession } from '../../utils/auth-state.js';
import { navigateTo } from '../../utils/navigation.js';

export default async function initRoute() {
  // Check if user is already logged in (e.g., after OAuth callback)
  const session = await getSession();
  if (session) {
    setSession(session);
    // User is logged in, redirect to profile
    navigateTo('/profile');
    return;
  }

  // Clear any stale session
  setSession(null);
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

  /**
   * Creates an OAuth login button with consistent styling.
   *
   * @param container - The parent container to append the button to
   * @param provider - The OAuth provider name (e.g., 'Google', '42')
   * @param buttonText - The text to display on the button
   */
  function createOAuthButton(
    container: HTMLElement,
    provider: string,
    buttonText: string
  ): void {
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'w-3/5';
    container.appendChild(btnWrapper);

    new Button(btnWrapper, {
      text: buttonText,
      onClick: () => {
        window.location.href = `/api/auth/login?provider=${provider}`;
      },
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      className:
        '!bg-white hover:!bg-gray-100 !border-gray-200 !text-gray-800 !font-semibold !text-lg !transition-all hover:!scale-105 !cursor-pointer !h-20',
    });

    // Apply inline styles to the actual button element
    const btnElement = btnWrapper.querySelector('button') as HTMLButtonElement;
    if (btnElement) {
      btnElement.style.borderRadius = '16px';
      btnElement.style.minHeight = '80px';
    }
  }

  // Create OAuth buttons
  createOAuthButton(oauthContainer, 'Google', 'Google');
  createOAuthButton(oauthContainer, '42', '42');

  // Footer
  const footer = document.createElement('div');
  footer.className = 'text-center text-xs text-slate-500';
  footer.style.marginTop = '32px';
  footer.textContent =
    'By signing in, you agree to our Terms & Conditions and Privacy Policy';
  cardBody.appendChild(footer);
}
