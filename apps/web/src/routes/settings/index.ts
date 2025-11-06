import { Navbar, Card, Button } from '../../components/index.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

export default function initRoute() {
  const pageRoot = document.querySelector(
    '.settings-page'
  ) as HTMLElement | null;
  if (!pageRoot) return;
  pageRoot.innerHTML = '';

  // Main wrapper with gradient background - matching other pages structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

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

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('div');
  mainContent.className = 'max-w-4xl mx-auto px-6 py-8';
  mainWrapper.appendChild(mainContent);

  // Page header
  const pageHeader = document.createElement('div');
  pageHeader.className = 'mb-8';
  pageHeader.innerHTML = `
    <h1 class="text-4xl font-bold text-white mb-2">Settings</h1>
    <p class="text-white/80">Manage your account preferences and game settings</p>
  `;
  mainContent.appendChild(pageHeader);

  // Settings card
  const settingsCardContainer = document.createElement('div');
  const settingsCard = new Card(settingsCardContainer, {
    variant: 'default',
  });

  // Apply custom styling to card
  const cardElement = settingsCardContainer.firstElementChild as HTMLElement;
  if (cardElement) {
    cardElement.className =
      'rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-8';
  }

  const cardBody = settingsCard.getBodyElement();
  if (!cardBody) return;

  // Profile Picture Section
  const profilePicSection = document.createElement('div');
  profilePicSection.className = 'mb-8 pb-8 border-b border-white/20';
  profilePicSection.innerHTML = `
    <div class="flex items-center gap-6">
      <div class="relative">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-white/20">
          <svg class="w-12 h-12 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <label for="avatar-upload" class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:bg-accent/80 transition-colors border-2 border-white">
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
          <input type="file" id="avatar-upload" accept="image/*" class="hidden" />
        </label>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-white mb-1">Profile Picture</h3>
        <p class="text-sm text-white/60">Upload a new profile picture</p>
      </div>
    </div>
  `;

  // Handle avatar upload
  const avatarInput = profilePicSection.querySelector('#avatar-upload') as HTMLInputElement;
  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement actual upload logic when backend is ready
        console.log('Profile picture selected:', file.name);
        // Preview the image
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = event.target?.result as string;
          const avatarDiv = profilePicSection.querySelector('.rounded-full');
          if (avatarDiv && img) {
            avatarDiv.style.backgroundImage = `url(${img})`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
            avatarDiv.innerHTML = '';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  cardBody.appendChild(profilePicSection);

  // Profile Settings Section
  const profileSection = document.createElement('div');
  profileSection.className = 'space-y-6 mb-8 pb-8 border-b border-white/20';
  
  const sectionTitle = document.createElement('div');
  sectionTitle.className = 'flex items-center gap-3 mb-6';
  sectionTitle.innerHTML = `
    <svg class="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <h2 class="text-xl font-semibold text-white">Profile Settings</h2>
  `;
  profileSection.appendChild(sectionTitle);

  // Display Name Input
  const displayNameGroup = document.createElement('div');
  displayNameGroup.className = 'space-y-2';
  displayNameGroup.innerHTML = `
    <label for="display-name" class="block text-sm font-medium text-white">Display Name</label>
    <input
      type="text"
      id="display-name"
      value="PongMaster2024"
      class="w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
      placeholder="Enter your display name"
    />
  `;
  profileSection.appendChild(displayNameGroup);

  // Email Input
  const emailGroup = document.createElement('div');
  emailGroup.className = 'space-y-2';
  emailGroup.innerHTML = `
    <label for="email" class="block text-sm font-medium text-white">Email</label>
    <input
      type="email"
      id="email"
      value="player@example.com"
      readonly
      class="w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg text-white/60 cursor-not-allowed"
    />
    <p class="text-xs text-white/50">Email cannot be changed</p>
  `;
  profileSection.appendChild(emailGroup);

  cardBody.appendChild(profileSection);

  // Game Preferences Section
  const gameSection = document.createElement('div');
  gameSection.className = 'space-y-6 mb-8';
  
  const gameTitle = document.createElement('div');
  gameTitle.className = 'flex items-center gap-3 mb-6';
  gameTitle.innerHTML = `
    <svg class="w-5 h-5 text-secondary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="6" x2="10" y1="12" y2="12"/>
      <path d="m8 6-4 6 4 6"/>
      <path d="M17.5 6a2.5 2.5 0 0 0 0 5"/>
      <path d="M20 6h-4"/>
      <path d="M20 12h-4"/>
      <path d="M20 18h-4"/>
    </svg>
    <h2 class="text-xl font-semibold text-white">Game Preferences</h2>
  `;
  gameSection.appendChild(gameTitle);

  // Sound Effects Toggle
  const soundToggle = createToggleSetting(
    'Enable Sound Effects',
    'Get audio feedback during gameplay',
    true
  );
  gameSection.appendChild(soundToggle);

  // Notifications Toggle
  const notifToggle = createToggleSetting(
    'Push Notifications',
    'Get notified about tournament updates',
    true
  );
  gameSection.appendChild(notifToggle);

  cardBody.appendChild(gameSection);

  // Action Buttons
  const actionsSection = document.createElement('div');
  actionsSection.className = 'flex gap-3 pt-6 border-t border-white/20';
  
  const cancelBtnWrapper = document.createElement('div');
  new Button(cancelBtnWrapper, {
    text: 'Cancel',
    variant: 'ghost',
    onClick: () => {
      if (window.navigateToRoute) {
        window.navigateToRoute('/profile');
      }
    },
  });
  const cancelBtn = cancelBtnWrapper.querySelector('button');
  if (cancelBtn) {
    cancelBtn.className = 'px-6 py-3 border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors cursor-pointer';
  }
  
  const saveBtnWrapper = document.createElement('div');
  new Button(saveBtnWrapper, {
    text: 'Save Changes',
    variant: 'primary',
    onClick: () => {
      // TODO: Implement save logic when backend is ready
      const displayName = (document.getElementById('display-name') as HTMLInputElement)?.value;
      console.log('Saving settings:', { displayName });
      // Show success message
      alert('Settings saved successfully!');
      if (window.navigateToRoute) {
        window.navigateToRoute('/profile');
      }
    },
  });
  const saveBtn = saveBtnWrapper.querySelector('button');
  if (saveBtn) {
    saveBtn.className = 'ml-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer';
  }

  actionsSection.appendChild(cancelBtnWrapper);
  actionsSection.appendChild(saveBtnWrapper);
  cardBody.appendChild(actionsSection);

  mainContent.appendChild(settingsCardContainer);
}

function createToggleSetting(label: string, description: string, checked: boolean): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors';
  
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex-1';
  leftDiv.innerHTML = `
    <h3 class="text-white font-medium mb-1">${label}</h3>
    <p class="text-sm text-white/60">${description}</p>
  `;
  
  const toggleWrapper = document.createElement('div');
  toggleWrapper.className = 'flex-shrink-0 ml-4';
  
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
    checked ? 'bg-accent' : 'bg-white/20'
  }`;
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', checked.toString());
  
  const toggleThumb = document.createElement('span');
  toggleThumb.className = `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    checked ? 'translate-x-6' : 'translate-x-1'
  }`;
  
  toggle.appendChild(toggleThumb);
  
  toggle.addEventListener('click', () => {
    const isChecked = toggle.getAttribute('aria-checked') === 'true';
    const newState = !isChecked;
    toggle.setAttribute('aria-checked', newState.toString());
    toggle.className = `relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
      newState ? 'bg-accent' : 'bg-white/20'
    }`;
    toggleThumb.className = `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      newState ? 'translate-x-6' : 'translate-x-1'
    }`;
  });
  
  toggleWrapper.appendChild(toggle);
  container.appendChild(leftDiv);
  container.appendChild(toggleWrapper);
  
  return container;
}
