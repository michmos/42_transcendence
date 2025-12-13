import { shouldShowNotification } from '../../utils/notification-dedup.js';
import toast from '../../utils/toast.js';

interface WebSocketMessage {
  event: string;
  data?: unknown;
  message?: string;
}

const registerGlobaMessages = window.socket.registerWebSocketHook(
  (event: MessageEvent) => {
    const data = JSON.parse(event.data as string) as WebSocketMessage;
    if (data.event === 'notify') {
      if (data.message && shouldShowNotification(data.message)) {
        toast.show(data.message, { variant: 'info' });
      }
    }
  }
);

export { registerGlobaMessages };
