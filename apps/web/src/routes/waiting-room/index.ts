import { Navbar } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import UserAPI from '../../plugins/api/user.js';
import { setPlayerNickname, getPlayerNickname } from '../game/state.js';
import { getAvatarSrc } from 'src/utils/avatar-helpers.js';

export default function initRoute() {
  const pageRoot = document.querySelector('.waiting-room-page');
  if (!pageRoot) return;

  pageRoot.innerHTML = '';

  // Show nickname input dialog before entering waiting room
  showNicknameDialog(() => {
    // Callback after nickname is set - show waiting room
    void renderWaitingRoom(pageRoot);
  });
}

async function renderWaitingRoom(pageRoot: HTMLElement) {
  // Main wrapper with gradient background
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // Navbar
  const navbarContainer = document.createElement('div');
  mainWrapper.appendChild(navbarContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getMe();
  new Navbar(navbarContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Profile', href: '/profile', active: false },
      { label: 'Tournaments', href: '/tournaments', active: false },
    ],
    userNickname: userInfo?.nickname || 'Guest',
    userAvatar: getAvatarSrc(userInfo?.avatarUrl),
    onSettingsClick: () => {
      void navigateTo('/settings');
    },
    onLogoutClick: () => {
      void handleLogout();
    },
  });

  // Main content
  const mainContent = document.createElement('main');
  mainContent.className =
    'max-w-4xl mx-auto px-6 py-8 flex items-center justify-center';
  mainWrapper.appendChild(mainContent);

  // Waiting room content
  const waitingRoomCard = document.createElement('div');
  waitingRoomCard.className =
    'w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-8 text-center';

  const nickname = getPlayerNickname() || 'Player';

  waitingRoomCard.innerHTML = `
    <div class="mb-6">
      <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
      <h1 class="text-3xl font-bold text-white mb-2">Waiting for Opponent</h1>
      <p class="text-white/70">Searching for an online player to match with...</p>
      <p class="text-white/50 text-sm mt-2">Playing as: <span class="font-semibold">${nickname}</span></p>
    </div>
    
    <div class="space-y-4">
      <div class="flex items-center justify-center gap-2 text-white/60">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="text-sm">Connecting to matchmaking server...</span>
      </div>
      
      <button 
        id="cancel-matchmaking-btn"
        class="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors cursor-pointer"
      >
        Cancel
      </button>
    </div>
  `;

  mainContent.appendChild(waitingRoomCard);

  // Cancel button handler
  const cancelBtn = waitingRoomCard.querySelector(
    '#cancel-matchmaking-btn'
  ) as HTMLButtonElement;
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // TODO: Cancel matchmaking request (will be implemented by backend team)
      setPlayerNickname(null); // Clear nickname when canceling
      navigateTo('/profile');
    });
  }
}

/**
 * Show nickname input dialog
 */
function showNicknameDialog(onConfirm: () => void) {
  // Check if nickname already set (e.g., returning to waiting room)
  const existingNickname = getPlayerNickname();
  if (existingNickname) {
    // Already have a nickname, proceed directly
    onConfirm();
    return;
  }

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in';
  backdrop.style.animationDuration = '200ms';

  // Create dialog
  const dialog = document.createElement('div');
  dialog.className =
    'bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95';
  dialog.style.animationDuration = '200ms';

  dialog.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-900">Enter Your Nickname</h2>
      <p class="text-sm text-gray-600">Choose a name to display during the game</p>
    </div>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="nickname-input" class="text-sm font-semibold text-gray-700">Nickname</label>
        <input
          id="nickname-input"
          type="text"
          placeholder="Player"
          maxlength="20"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          autofocus
        />
      </div>
      
      <div class="flex gap-3 pt-4">
        <button 
          id="enter-waiting-room-btn"
          class="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
        >
          Enter Waiting Room
        </button>
        <button 
          id="cancel-nickname-btn"
          class="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  `;

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  // Close handlers
  const closeDialog = () => {
    backdrop.classList.add('animate-out', 'fade-out');
    dialog.classList.add('animate-out', 'zoom-out-95');
    setTimeout(() => backdrop.remove(), 200);
  };

  const enterWaitingRoom = () => {
    const nicknameInput = dialog.querySelector(
      '#nickname-input'
    ) as HTMLInputElement;
    const nickname = nicknameInput.value.trim() || 'Player';

    // Set nickname (max 20 chars)
    setPlayerNickname(nickname.substring(0, 20));

    closeDialog();
    onConfirm();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      // If clicked outside, cancel and go back
      closeDialog();
      navigateTo('/profile');
    }
  });

  const cancelBtn = dialog.querySelector('#cancel-nickname-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeDialog();
      navigateTo('/profile');
    });
  }

  const enterBtn = dialog.querySelector('#enter-waiting-room-btn');
  if (enterBtn) {
    enterBtn.addEventListener('click', enterWaitingRoom);
  }

  // Allow Enter key to enter waiting room
  const nicknameInput = dialog.querySelector(
    '#nickname-input'
  ) as HTMLInputElement;
  if (nicknameInput) {
    nicknameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        enterWaitingRoom();
      }
    });
  }
}
