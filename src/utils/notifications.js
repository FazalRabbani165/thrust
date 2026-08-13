// Native Android notifications with a safe browser fallback.
// The Tauri plugin is installed by the included upgrade script.
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  cancel,
  Schedule,
} from '@tauri-apps/plugin-notification';

let permissionPromise = null;

export async function ensureNotificationPermission() {
  if (permissionPromise) return permissionPromise;
  permissionPromise = (async () => {
    try {
      if (await isPermissionGranted()) return true;
      return (await requestPermission()) === 'granted';
    } catch (_) {
      return false;
    }
  })();
  return permissionPromise;
}

export async function notifyApp(title, body) {
  try {
    const granted = await ensureNotificationPermission();
    if (granted) {
      sendNotification({ title, body });
      return true;
    }
  } catch (_) {
    // Fall through to the Web Notification API.
  }

  try {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
        return true;
      }
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
          return true;
        }
      }
    }
  } catch (_) {}

  return false;
}

export function haptic(pattern = [120, 60, 120]) {
  try {
    if (navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch (_) {}
}


const TIMER_NOTIFICATION_ID = 120813;

export async function scheduleTimerEnd(seconds, isBreak) {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted || seconds <= 0) return false;
    await cancel([TIMER_NOTIFICATION_ID]);
    const at = new Date(Date.now() + seconds * 1000);
    sendNotification({
      id: TIMER_NOTIFICATION_ID,
      title: 'THRUST',
      body: isBreak ? 'Break over. Ready to focus?' : 'Focus session complete. Take a break.',
      schedule: Schedule.at(at, false, true),
    });
    return true;
  } catch (_) {
    return false;
  }
}

export async function cancelTimerEnd() {
  try {
    await cancel([TIMER_NOTIFICATION_ID]);
  } catch (_) {}
}
