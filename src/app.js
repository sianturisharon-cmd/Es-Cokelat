// src/app.js
import { initializeRouter } from "./utils/router.js";
import { pushService } from "./utils/pushService.js";
import { indexedDBService } from "./utils/indexedDBService.js";

// Initialize PWA features
function initializePWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      pushService.initialize().then(supported => {
        console.log('Push notifications supported:', supported);
      });
    });
  }

  // Handle online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Show offline indicator
  function updateOnlineStatus() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
      indicator.classList.toggle('show', !navigator.onLine);
    }
  }

  function handleOnline() {
    console.log('Device is online');
    updateOnlineStatus();
    
    // Auto-sync when coming online
    indexedDBService.syncOfflineData().then(result => {
      if (result.success) {
        console.log('Auto-sync completed:', result.message);
      }
    });
  }

  function handleOffline() {
    console.log('Device is offline');
    updateOnlineStatus();
  }

  // Create offline indicator
  const offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offlineIndicator';
  offlineIndicator.className = 'offline-indicator';
  offlineIndicator.textContent = 'Anda sedang offline. Beberapa fitur mungkin tidak tersedia.';
  document.body.appendChild(offlineIndicator);

  updateOnlineStatus();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializePWA();
  initializeRouter();
});

// Handle before install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button if needed
  const installButton = document.getElementById('installButton');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});