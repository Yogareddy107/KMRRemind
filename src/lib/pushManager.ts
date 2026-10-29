import { supabase } from './supabase';

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscriptionEndpoint: string | null;
  error: string | null;
}

export class WebPushManager {
  private vapidPublicKey: string;

  constructor() {
    this.vapidPublicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY ||
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  }

  /**
   * Check browser capability for Service Worker and Push API
   */
  public isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current permission and active subscription status
   */
  public async getStatus(): Promise<PushStatus> {
    if (!this.isPushSupported()) {
      return {
        isSupported: false,
        permission: 'denied',
        isSubscribed: false,
        subscriptionEndpoint: null,
        error: 'Push notifications are not supported by this browser.',
      };
    }

    const permission = Notification.permission;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        return {
          isSupported: true,
          permission,
          isSubscribed: false,
          subscriptionEndpoint: null,
          error: null,
        };
      }

      const subscription = await reg.pushManager.getSubscription();
      return {
        isSupported: true,
        permission,
        isSubscribed: !!subscription,
        subscriptionEndpoint: subscription ? subscription.endpoint : null,
        error: null,
      };
    } catch (err: any) {
      return {
        isSupported: true,
        permission,
        isSubscribed: false,
        subscriptionEndpoint: null,
        error: err.message || 'Error checking push status',
      };
    }
  }

  /**
   * Explicit user interaction to request permission and subscribe
   */
  public async subscribeUser(userId: string, deviceLabel = 'Web Device'): Promise<{ success: boolean; error?: string }> {
    if (!this.isPushSupported()) {
      return { success: false, error: 'Push notifications are not supported by your browser.' };
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error:
            permission === 'denied'
              ? 'Notification permission was denied. Please allow notifications in your browser site settings.'
              : 'Notification permission was dismissed.',
        };
      }

      // 2. Ensure Service Worker is registered and active
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;

      // 3. Subscribe with PushManager
      const applicationServerKey = urlBase64ToUint8Array(this.vapidPublicKey);
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // Extract keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to retrieve cryptographic keys from PushManager subscription.');
      }

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))));
      const authSecret = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))));

      // 4. Save subscription to Supabase push_subscriptions table
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh,
            auth_secret: authSecret,
            device_label: deviceLabel || navigator.userAgent.slice(0, 50),
            disabled_at: null,
            last_success_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );

      if (dbError) {
        console.warn('Subscription saved locally, db sync notice:', dbError.message);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Push subscribe error:', err);
      return { success: false, error: err.message || 'Failed to subscribe for push notifications.' };
    }
  }

  /**
   * Disable and unsubscribe push notifications
   */
  public async unsubscribeUser(userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isPushSupported()) {
        return { success: true };
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          // Mark disabled in Supabase
          if (userId && endpoint) {
            await supabase
              .from('push_subscriptions')
              .update({ disabled_at: new Date().toISOString() })
              .eq('endpoint', endpoint);
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send a test browser notification immediately (local verification)
   */
  public async showLocalTestNotification(): Promise<boolean> {
    if (!this.isPushSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      await registration.showNotification('KMR Remind — Test Alert', {
        body: 'Push alerts are enabled and ready to remind you!',
        icon: '/icons/icon-192.svg',
        badge: '/icons/badge-72.svg',
      } as any);
      return true;
    }
    return false;
  }
}

export const pushManager = new WebPushManager();
