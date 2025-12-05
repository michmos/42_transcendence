import { Navbar, StatCard, GlassCard } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import UserAPI, { type ProfileFriend } from '../../plugins/api/user.js';
import FriendsAPI from '../../plugins/api/friends.js';

export default async function initRoute() {
  // Get the nickname from route parameters
  const routeParams = window.routeParams;
  const nickname = routeParams?.id || '';

  if (!nickname) {
    renderError('No user nickname provided');
    return;
  }

  // Get page root
  const pageRoot = document.querySelector<HTMLElement>('.user-container');
  if (!pageRoot) {
    // If container doesn't exist, create it
    const app = document.getElementById('app');
    if (!app) return;
    
    const container = document.createElement('div');
    container.className = 'user-container';
    app.innerHTML = '';
    app.appendChild(container);
    renderUserProfile(container, nickname);
  } else {
    pageRoot.innerHTML = '';
    renderUserProfile(pageRoot, nickname);
  }
}

async function renderUserProfile(container: HTMLElement, nickname: string) {
  // Main wrapper with gradient background
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  container.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch current user data for navbar
  const currentUserInfo = await UserAPI.getUserBasicInfo();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    userNickname: currentUserInfo?.nickname,
    userAvatar: currentUserInfo?.avatar || undefined,
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: handleLogout,
  });

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('main');
  mainContent.className = 'max-w-7xl mx-auto px-6 py-8';
  mainWrapper.appendChild(mainContent);

  // Loading state
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'text-center text-white py-12';
  loadingDiv.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
    <p>Loading profile...</p>
  `;
  mainContent.appendChild(loadingDiv);

  try {
    // Fetch user data
    const userData = await UserAPI.getUserByNickname(nickname);
    
    if (!userData || !userData.nickname) {
      renderError('User not found', mainContent);
      return;
    }

    // Check if viewing own profile
    const currentUserProfile = await UserAPI.getUserProfile();
    const isSelf = currentUserProfile?.cleanedUserData.nickname?.toLowerCase() === nickname.toLowerCase();
    
    if (isSelf) {
      // Redirect to own profile
      navigateTo('/profile');
      return;
    }

    // Get friendship status
    let friendship: ProfileFriend | undefined;
    if (currentUserProfile) {
      friendship = currentUserProfile.cleanedUserFriends.find(
        (f) => f.otherUser.toLowerCase() === nickname.toLowerCase()
      );
    }

    // Remove loading state
    loadingDiv.remove();

    // Page header with user info
    const pageHeader = document.createElement('div');
    pageHeader.className = 'mb-8 flex items-center gap-6';
    
    const avatar = userData.avatar || null;
    const userNickname = userData.nickname || nickname;
    const initials = userNickname
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const avatarDisplay = document.createElement('div');
    avatarDisplay.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-white/20 overflow-hidden flex-shrink-0';
    
    if (avatar) {
      const avatarImg = document.createElement('img');
      avatarImg.src = avatar;
      avatarImg.alt = userNickname;
      avatarImg.className = 'w-full h-full object-cover';
      avatarDisplay.appendChild(avatarImg);
    } else {
      avatarDisplay.innerHTML = `
        <svg class="w-12 h-12 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `;
    }

    const headerInfo = document.createElement('div');
    headerInfo.className = 'flex-1';
    headerInfo.innerHTML = `
      <h1 class="text-4xl font-bold text-white mb-2">${userNickname}</h1>
      <p class="text-white/80">Player Profile</p>
    `;

    // Friendship action button
    const actionButton = createFriendshipActionButton(friendship, userNickname);
    
    pageHeader.appendChild(avatarDisplay);
    pageHeader.appendChild(headerInfo);
    pageHeader.appendChild(actionButton);
    mainContent.appendChild(pageHeader);

    // Main grid
    const mainGrid = document.createElement('div');
    mainGrid.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6';
    mainContent.appendChild(mainGrid);

    // ===== LEFT COLUMN (Stats) =====
    const leftColumn = document.createElement('div');
    leftColumn.className = 'lg:col-span-2 space-y-6';
    mainGrid.appendChild(leftColumn);

    // Stats Grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    leftColumn.appendChild(statsGrid);

    const totalMatches = userData.gamesPlayed || 0;
    const gamesWon = userData.gamesWon || 0;
    const winRate = totalMatches > 0 ? ((gamesWon / totalMatches) * 100).toFixed(1) : '0.0';
    const tournaments = userData.tournamentsPlayed || 0;
    
    // Calculate friends count (ACCEPTED friends)
    // Use same logic as profile page: filter ACCEPTED friends
    const friends = currentUserProfile
      ? currentUserProfile.cleanedUserFriends.filter(
          (f) => f.state === 'ACCEPTED'
        ).length
      : 0;

    const stats = [
      {
        icon: '🎯',
        label: 'Total Matches',
        value: totalMatches.toLocaleString(),
        iconColor: 'text-foreground',
      },
      {
        icon: '📈',
        label: 'Win Rate',
        value: `${winRate}%`,
        iconColor: 'text-foreground',
      },
      {
        icon: '🏆',
        label: 'Tournaments',
        value: tournaments.toString(),
        iconColor: 'text-accent',
      },
      {
        icon: '👥',
        label: 'Friends',
        value: friends.toString(),
        iconColor: 'text-foreground',
      },
    ];

    stats.forEach((stat) => {
      new StatCard(statsGrid, stat);
    });

    // Match History section removed - match history is private for other users

    // ===== RIGHT COLUMN =====
    const rightColumn = document.createElement('div');
    rightColumn.className = 'space-y-6';
    mainGrid.appendChild(rightColumn);

    // Friendship Status Card
    const friendshipCard = new GlassCard(rightColumn, {
      title: 'Friendship Status',
    });
    const friendshipBody = friendshipCard.getBodyElement();
    if (friendshipBody) {
      renderFriendshipStatus(friendshipBody, friendship, userNickname);
    }

  } catch (error) {
    loadingDiv.remove();
    renderError(
      error instanceof Error ? error.message : 'Failed to load user profile',
      mainContent
    );
  }
}

function createFriendshipActionButton(
  friendship: ProfileFriend | undefined,
  nickname: string
): HTMLElement {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'flex-shrink-0';

  let button: HTMLButtonElement;

  if (!friendship) {
    // Not friends - show Add Friend button
    button = document.createElement('button');
    button.className =
      'px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer';
    button.textContent = 'Add Friend';
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Sending...';
      try {
        await FriendsAPI.sendFriendRequest(nickname);
        button.textContent = 'Request Sent';
        button.className =
          'px-6 py-3 bg-muted text-foreground font-semibold rounded-lg cursor-not-allowed opacity-50';
        // Refresh page to update friendship status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send friend request';
        alert(errorMessage);
        button.disabled = false;
        button.textContent = 'Add Friend';
      }
    });
  } else if (friendship.state === 'ACCEPTED') {
    // Friends - show Remove Friend button
    button = document.createElement('button');
    button.className =
      'px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer';
    button.textContent = 'Remove Friend';
    button.addEventListener('click', async () => {
      if (!confirm(`Remove ${nickname} from your friends?`)) {
        return;
      }
      button.disabled = true;
      button.textContent = 'Removing...';
      try {
        await FriendsAPI.removeFriend(nickname);
        button.textContent = 'Removed';
        button.className =
          'px-6 py-3 bg-muted text-foreground font-semibold rounded-lg cursor-not-allowed opacity-50';
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to remove friend';
        alert(errorMessage);
        button.disabled = false;
        button.textContent = 'Remove Friend';
      }
    });
  } else if (friendship.state === 'REQUESTED') {
    if (friendship.isRequester) {
      // Request sent by current user
      button = document.createElement('button');
      button.className =
        'px-6 py-3 bg-muted text-foreground font-semibold rounded-lg cursor-not-allowed opacity-50';
      button.textContent = 'Request Sent';
      button.disabled = true;
    } else {
      // Request received - show Accept/Reject buttons
      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'flex gap-2';
      
      const acceptBtn = document.createElement('button');
      acceptBtn.className =
        'px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer';
      acceptBtn.textContent = 'Accept';
      acceptBtn.addEventListener('click', async () => {
        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Accepting...';
        try {
          await FriendsAPI.acceptFriendRequest(nickname);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to accept request';
          alert(errorMessage);
          acceptBtn.disabled = false;
          acceptBtn.textContent = 'Accept';
        }
      });

      const rejectBtn = document.createElement('button');
      rejectBtn.className =
        'px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer';
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', async () => {
        if (!confirm(`Reject ${nickname}'s friend request?`)) {
          return;
        }
        rejectBtn.disabled = true;
        rejectBtn.textContent = 'Rejecting...';
        try {
          await FriendsAPI.rejectFriendRequest(nickname);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to reject request';
          alert(errorMessage);
          rejectBtn.disabled = false;
          rejectBtn.textContent = 'Reject';
        }
      });

      buttonGroup.appendChild(acceptBtn);
      buttonGroup.appendChild(rejectBtn);
      return buttonGroup;
    }
  } else if (friendship.state === 'REJECTED') {
    // Blocked
    button = document.createElement('button');
    button.className =
      'px-6 py-3 bg-muted text-foreground font-semibold rounded-lg cursor-not-allowed opacity-50';
    button.textContent = 'Blocked';
    button.disabled = true;
  } else {
    // Fallback
    button = document.createElement('button');
    button.className =
      'px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer';
    button.textContent = 'Add Friend';
  }

  buttonContainer.appendChild(button);
  return buttonContainer;
}

function renderFriendshipStatus(
  container: HTMLElement,
  friendship: ProfileFriend | undefined,
  nickname: string
): void {
  let statusText = '';
  let statusColor = 'text-muted-foreground';

  if (!friendship) {
    statusText = 'Not friends';
    statusColor = 'text-blue-400';
  } else if (friendship.state === 'ACCEPTED') {
    statusText = 'Friends';
    statusColor = 'text-green-400';
  } else if (friendship.state === 'REQUESTED') {
    if (friendship.isRequester) {
      statusText = 'Friend request sent';
      statusColor = 'text-yellow-400';
    } else {
      statusText = 'Friend request received';
      statusColor = 'text-orange-400';
    }
  } else if (friendship.state === 'REJECTED') {
    statusText = 'Blocked';
    statusColor = 'text-red-400';
  }

  const statusDiv = document.createElement('div');
  statusDiv.className = 'text-center py-4';
  statusDiv.innerHTML = `
    <p class="text-sm text-muted-foreground mb-2">Current Status</p>
    <p class="text-lg font-semibold ${statusColor}">${statusText}</p>
  `;
  container.appendChild(statusDiv);
}

function renderError(message: string, container?: HTMLElement): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'text-center text-white py-12';
  errorDiv.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Error</h2>
    <p class="mb-6">${message}</p>
    <button class="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer" onclick="window.history.back()">
      Go Back
    </button>
  `;

  if (container) {
    container.appendChild(errorDiv);
  } else {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
      app.appendChild(errorDiv);
    }
  }
}
