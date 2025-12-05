import { Navbar, Card, Button } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import { handleApiError, showApiError } from '../../utils/api-helpers.js';
import UserAPI from '../../plugins/api/user.js';

// Extend Window interface for SPA navigation
declare global {
  interface Window {
    navigateToRoute?: (href: string) => void;
  }
}

export default async function initRoute() {
  const pageRoot = document.querySelector<HTMLElement>('.settings-page');
  if (!pageRoot) return;
  pageRoot.innerHTML = '';

  // Main wrapper with gradient background - matching other pages structure
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getUserBasicInfo();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    userNickname: userInfo?.nickname,
    userAvatar: userInfo?.avatar || undefined,
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: handleLogout,
  });

  // Fetch full user profile data
  const profileData = await UserAPI.getUserProfile();
  if (!profileData) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'text-center text-white py-8';
    errorMsg.textContent = 'Failed to load user data. Please try again.';
    mainWrapper.appendChild(errorMsg);
    return;
  }

  const userData = profileData.cleanedUserData;
  const currentNickname = userData.nickname || '';
  const currentAvatar = userData.avatar || null;
  // Email is not included in cleanedUserData for security reasons
  const userEmail = '';

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

  const profilePicContent = document.createElement('div');
  profilePicContent.className = 'flex items-center gap-6';

  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'relative';

  const avatarDisplay = document.createElement('div');
  avatarDisplay.className =
    'w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-white/20 overflow-hidden';

  // Display current avatar or initials
  if (currentAvatar) {
    const avatarImg = document.createElement('img');
    avatarImg.src = currentAvatar;
    avatarImg.alt = currentNickname;
    avatarImg.className = 'w-full h-full object-cover';
    avatarDisplay.appendChild(avatarImg);
  } else {
    const initials = currentNickname
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    avatarDisplay.innerHTML = `
      <svg class="w-12 h-12 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    `;
  }

  const uploadLabel = document.createElement('label');
  uploadLabel.className =
    'absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:bg-accent/80 transition-colors border-2 border-white';
  uploadLabel.innerHTML = `
    <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
    <input type="file" id="avatar-upload" accept="image/png,image/jpeg,image/jpg" class="hidden" />
  `;

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `
    <h3 class="text-lg font-semibold text-white mb-1">Profile Picture</h3>
    <p class="text-sm text-white/60">Upload a new profile picture (max 2MB)</p>
    <p id="avatar-error" class="text-sm text-red-400 mt-1 hidden"></p>
  `;

  avatarContainer.appendChild(avatarDisplay);
  avatarContainer.appendChild(uploadLabel);
  profilePicContent.appendChild(avatarContainer);
  profilePicContent.appendChild(infoDiv);
  profilePicSection.appendChild(profilePicContent);

  // Handle avatar upload
  const avatarInput = uploadLabel.querySelector(
    '#avatar-upload'
  ) as HTMLInputElement;
  const avatarError = infoDiv.querySelector('#avatar-error') as HTMLElement;
  let selectedAvatarFile: File | null = null;

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        avatarError.textContent = 'File size must be less than 2MB';
        avatarError.classList.remove('hidden');
        avatarInput.value = '';
        return;
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        avatarError.textContent = 'File must be PNG or JPEG';
        avatarError.classList.remove('hidden');
        avatarInput.value = '';
        return;
      }

      // Clear error
      avatarError.classList.add('hidden');
      selectedAvatarFile = file;

      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = event.target?.result as string;
        avatarDisplay.innerHTML = '';
        const previewImg = document.createElement('img');
        previewImg.src = img;
        previewImg.alt = currentNickname;
        previewImg.className = 'w-full h-full object-cover';
        avatarDisplay.appendChild(previewImg);
      };
      reader.readAsDataURL(file);
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
    <label for="display-name" class="block text-sm font-medium text-white">Display Name (Nickname)</label>
    <input
      type="text"
      id="display-name"
      value="${currentNickname}"
      maxlength="30"
      class="w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
      placeholder="Enter your display name"
    />
    <p class="text-xs text-white/50">3-30 characters, letters, numbers, underscores, and hyphens only</p>
    <p id="nickname-error" class="text-sm text-red-400 hidden"></p>
  `;
  profileSection.appendChild(displayNameGroup);

  // Email Input (if needed - email is not returned from API for security)
  // Email is managed through OAuth providers, not directly editable

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
      navigateTo('/profile');
    },
  });
  const cancelBtn = cancelBtnWrapper.querySelector('button');
  if (cancelBtn) {
    cancelBtn.className =
      'px-6 py-3 border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors cursor-pointer';
  }

  const saveBtnWrapper = document.createElement('div');
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Changes';
  saveButton.className =
    'ml-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  saveButton.addEventListener('click', async () => {
    const displayNameInput = document.getElementById(
      'display-name'
    ) as HTMLInputElement;
    const nicknameError = document.getElementById(
      'nickname-error'
    ) as HTMLElement;
    const newNickname = displayNameInput?.value.trim();

    // Validate nickname
    if (!newNickname || newNickname.length < 3 || newNickname.length > 30) {
      nicknameError.textContent =
        'Nickname must be between 3 and 30 characters';
      nicknameError.classList.remove('hidden');
      return;
    }

    // Validate nickname pattern (letters, numbers, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(newNickname)) {
      nicknameError.textContent =
        'Nickname can only contain letters, numbers, underscores, and hyphens';
      nicknameError.classList.remove('hidden');
      return;
    }

    nicknameError.classList.add('hidden');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    let hasError = false;
    let errorMessage = 'Failed to save settings';

    try {
      // Update nickname if changed
      if (newNickname !== currentNickname) {
        try {
          const result = await UserAPI.updateNickname(newNickname);
          if (!result) {
            hasError = true;
            errorMessage = 'Failed to update nickname';
          }
        } catch (error) {
          hasError = true;
          errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to update nickname';
          console.error('Error updating nickname:', error);
        }
      }

      // Upload avatar if selected (only if nickname update succeeded or wasn't needed)
      if (selectedAvatarFile && !hasError) {
        try {
          const result = await UserAPI.uploadAvatar(selectedAvatarFile);
          if (!result) {
            hasError = true;
            errorMessage = 'Failed to upload avatar';
          }
        } catch (error) {
          hasError = true;
          errorMessage =
            error instanceof Error ? error.message : 'Failed to upload avatar';
          console.error('Error uploading avatar:', error);
        }
      }

      if (hasError) {
        alert(`Error: ${errorMessage}`);
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      } else {
        // Show success message
        alert('Settings saved successfully!');
        navigateTo('/profile');
      }
    } catch (error) {
      const finalErrorMessage =
        error instanceof Error ? error.message : 'Failed to save settings';
      alert(`Error: ${finalErrorMessage}`);
      console.error('Unexpected error saving settings:', error);
      saveButton.disabled = false;
      saveButton.textContent = 'Save Changes';
    }
  });

  saveBtnWrapper.appendChild(saveButton);

  actionsSection.appendChild(cancelBtnWrapper);
  actionsSection.appendChild(saveBtnWrapper);
  cardBody.appendChild(actionsSection);

  mainContent.appendChild(settingsCardContainer);
}

function createToggleSetting(
  label: string,
  description: string,
  checked: boolean
): HTMLElement {
  const container = document.createElement('div');
  container.className =
    'flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors';

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
