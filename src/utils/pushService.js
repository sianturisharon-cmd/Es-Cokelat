// src/utils/pushService.js
class PushNotificationService {
  constructor() {
    this.publicVapidKey = 'BPHjFqJ7P8L9bY3tRvE2wQ5xYzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
    this.isSubscribed = false;
    this.registration = null;
  }

  // Initialize push service
  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      await this.checkSubscription();
      this.setupSubscriptionToggle();
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Check current subscription status
  async checkSubscription() {
    const subscription = await this.registration.pushManager.getSubscription();
    this.isSubscribed = !(subscription === null);
    
    this.updateUI();
    return this.isSubscribed;
  }

  // Subscribe to push notifications
  async subscribe() {
    if (this.isSubscribed) {
      console.log('Already subscribed to push notifications');
      return true;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      this.isSubscribed = true;
      this.updateUI();
      
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      
      if (Notification.permission === 'denied') {
        alert('Anda telah memblokir notifikasi. Silakan aktifkan notifikasi di pengaturan browser untuk menerima update cerita terbaru.');
      }
      
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.isSubscribed) {
      return true;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.deleteSubscriptionFromServer(subscription);
        
        this.isSubscribed = false;
        this.updateUI();
        
        console.log('Successfully unsubscribed from push notifications');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Toggle subscription
  async toggleSubscription() {
    if (this.isSubscribed) {
      return await this.unsubscribe();
    } else {
      return await this.subscribe();
    }
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to backend server
  async sendSubscriptionToServer(subscription) {
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      console.warn('User not authenticated, skipping subscription save');
      return;
    }

    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subscription: subscription,
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      console.log('Subscription saved to server successfully');
    } catch (error) {
      console.error('Error saving subscription to server:', error);
    }
  }

  // Delete subscription from server
  async deleteSubscriptionFromServer(subscription) {
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription from server');
      }

      console.log('Subscription deleted from server successfully');
    } catch (error) {
      console.error('Error deleting subscription from server:', error);
    }
  }

  // Setup subscription toggle UI
  setupSubscriptionToggle() {
    // This will be called when the settings page is loaded
    // Implementation in settings.js
  }

  // Update UI based on subscription status
  updateUI() {
    const toggleBtn = document.getElementById('notificationToggle');
    const statusEl = document.getElementById('notificationStatus');
    
    if (toggleBtn && statusEl) {
      if (this.isSubscribed) {
        toggleBtn.textContent = 'Nonaktifkan Notifikasi';
        toggleBtn.classList.add('secondary');
        statusEl.textContent = 'Notifikasi diaktifkan';
        statusEl.className = 'status-active';
      } else {
        toggleBtn.textContent = 'Aktifkan Notifikasi';
        toggleBtn.classList.remove('secondary');
        statusEl.textContent = 'Notifikasi dinonaktifkan';
        statusEl.className = 'status-inactive';
      }
    }
  }

  // Request notification permission
  async requestPermission() {
    if (Notification.permission === 'denied') {
      alert('Anda telah memblokir notifikasi. Silakan aktifkan notifikasi di pengaturan browser.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export const pushService = new PushNotificationService();