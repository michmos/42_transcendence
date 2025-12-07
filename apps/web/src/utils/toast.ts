export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function createToast(message: string, type: ToastType = 'info'): void {
  const container =
    document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
  };

  toast.className = `${bgColors[type]} text-white px-4 py-3 rounded-lg shadow-lg mb-3 transform transition-all duration-300 translate-x-full flex items-center gap-2 min-w-[300px]`;
  toast.innerHTML = `
    <span class="flex-1 font-medium">${message}</span>
    <button class="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function createToastContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className =
    'fixed top-24 right-6 z-50 flex flex-col items-end pointer-events-none';
  // Make children pointer events enabled
  const style = document.createElement('style');
  style.textContent = '#toast-container > * { pointer-events: auto; }';
  document.head.appendChild(style);
  document.body.appendChild(container);
  return container;
}
