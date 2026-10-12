/**
 * Device notifications for Smart Hearth alerts.
 * Uses the service worker when available (needed on phones), falling back to
 * the plain Notification API on desktop browsers.
 */

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function showDeviceNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, { body, icon: 'pwa-192.png', badge: 'pwa-192.png', tag: title });
      return;
    }
    new Notification(title, { body, icon: 'pwa-192.png' });
  } catch {
    /* some browsers block notifications outside a user gesture — ignore */
  }
}
