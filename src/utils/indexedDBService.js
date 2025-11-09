// src/utils/indexedDBService.js
class IndexedDBService {
  constructor() {
    this.dbName = 'StoryHubDB';
    this.version = 3;
    this.db = null;
    this.STORE_NAME = 'offlineStories';
    this.SYNC_STORE = 'syncQueue';
  }

  // Open database connection
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for offline stories
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        // Create object store for sync queue
        if (!db.objectStoreNames.contains(this.SYNC_STORE)) {
          const syncStore = db.createObjectStore(this.SYNC_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Save story for offline viewing
  async saveStory(story) {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const storyWithMeta = {
        ...story,
        timestamp: new Date().getTime(),
        synced: true, // Stories from API are already synced
        isOffline: false
      };

      const request = store.add(storyWithMeta);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Save offline story to sync later
  async saveOfflineStory(storyData) {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME, this.SYNC_STORE], 'readwrite');
      const storyStore = transaction.objectStore(this.STORE_NAME);
      const syncStore = transaction.objectStore(this.SYNC_STORE);

      const offlineStory = {
        ...storyData,
        timestamp: new Date().getTime(),
        synced: false,
        isOffline: true
      };

      // Save to stories store
      const storyRequest = storyStore.add(offlineStory);

      storyRequest.onsuccess = (event) => {
        const storyId = event.target.result;
        
        // Add to sync queue
        const syncItem = {
          type: 'CREATE_STORY',
          data: { ...offlineStory, id: storyId },
          timestamp: new Date().getTime()
        };

        const syncRequest = syncStore.add(syncItem);

        syncRequest.onsuccess = () => resolve(storyId);
        syncRequest.onerror = () => reject(syncRequest.error);
      };

      storyRequest.onerror = () => reject(storyRequest.error);
    });
  }

  // Get all stories with filtering and sorting
  async getStories(options = {}) {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let stories = request.result;

        // Apply filters
        if (options.filter) {
          stories = this.applyFilters(stories, options.filter);
        }

        // Apply sorting
        if (options.sort) {
          stories = this.applySorting(stories, options.sort);
        }

        // Apply search
        if (options.search) {
          stories = this.applySearch(stories, options.search);
        }

        resolve(stories);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Apply filters to stories
  applyFilters(stories, filters) {
    return stories.filter(story => {
      if (filters.synced !== undefined && story.synced !== filters.synced) {
        return false;
      }
      if (filters.isOffline !== undefined && story.isOffline !== filters.isOffline) {
        return false;
      }
      if (filters.dateRange) {
        const storyDate = new Date(story.timestamp);
        if (filters.dateRange.start && storyDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && storyDate > filters.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  // Apply sorting to stories
  applySorting(stories, sort) {
    return stories.sort((a, b) => {
      if (sort.by === 'date') {
        return sort.order === 'asc' ? 
          a.timestamp - b.timestamp : 
          b.timestamp - a.timestamp;
      }
      if (sort.by === 'name') {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return sort.order === 'asc' ? 
          nameA.localeCompare(nameB) : 
          nameB.localeCompare(nameA);
      }
      return 0;
    });
  }

  // Apply search to stories
  applySearch(stories, searchTerm) {
    const term = searchTerm.toLowerCase();
    return stories.filter(story => 
      (story.description || '').toLowerCase().includes(term) ||
      (story.name || '').toLowerCase().includes(term)
    );
  }

  // Delete story
  async deleteStory(storyId) {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME, this.SYNC_STORE], 'readwrite');
      const storyStore = transaction.objectStore(this.STORE_NAME);
      const syncStore = transaction.objectStore(this.SYNC_STORE);

      // Check if story is offline (not synced)
      const getRequest = storyStore.get(storyId);

      getRequest.onsuccess = () => {
        const story = getRequest.result;
        
        if (story && !story.synced) {
          // Add delete operation to sync queue
          const syncItem = {
            type: 'DELETE_STORY',
            data: { id: storyId },
            timestamp: new Date().getTime()
          };

          syncStore.add(syncItem);
        }

        // Delete from stories store
        const deleteRequest = storyStore.delete(storyId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Sync offline data when online
  async syncOfflineData() {
    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return { success: false, message: 'Device is offline' };
    }

    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SYNC_STORE, this.STORE_NAME], 'readwrite');
      const syncStore = transaction.objectStore(this.SYNC_STORE);
      const storyStore = transaction.objectStore(this.STORE_NAME);

      const request = syncStore.getAll();

      request.onsuccess = async () => {
        const syncQueue = request.result;
        const results = [];

        for (const item of syncQueue) {
          try {
            if (item.type === 'CREATE_STORY') {
              await this.syncStoryToServer(item.data);
              results.push({ id: item.id, success: true });
            } else if (item.type === 'DELETE_STORY') {
              // Handle delete sync if needed
              results.push({ id: item.id, success: true });
            }
          } catch (error) {
            results.push({ id: item.id, success: false, error: error.message });
          }
        }

        // Clear successfully synced items
        const clearPromises = results
          .filter(result => result.success)
          .map(result => {
            return new Promise((resolveClear, rejectClear) => {
              const deleteRequest = syncStore.delete(result.id);
              deleteRequest.onsuccess = () => resolveClear();
              deleteRequest.onerror = () => rejectClear(deleteRequest.error);
            });
          });

        // Update story sync status
        const updatePromises = syncQueue
          .filter(item => item.type === 'CREATE_STORY')
          .map(item => {
            return new Promise((resolveUpdate, rejectUpdate) => {
              const getRequest = storyStore.get(item.data.id);
              
              getRequest.onsuccess = () => {
                const story = getRequest.result;
                if (story) {
                  story.synced = true;
                  const updateRequest = storyStore.put(story);
                  updateRequest.onsuccess = () => resolveUpdate();
                  updateRequest.onerror = () => rejectUpdate(updateRequest.error);
                } else {
                  resolveUpdate();
                }
              };
              
              getRequest.onerror = () => rejectUpdate(getRequest.error);
            });
          });

        try {
          await Promise.all([...clearPromises, ...updatePromises]);
          resolve({ 
            success: true, 
            message: `Synced ${results.filter(r => r.success).length} items` 
          });
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Sync individual story to server
  async syncStoryToServer(storyData) {
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('description', storyData.description);

    if (storyData.photoFile) {
      formData.append('photo', storyData.photoFile);
    }

    if (storyData.lat) formData.append('lat', storyData.lat);
    if (storyData.lon) formData.append('lon', storyData.lon);

    const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync story');
    }

    return response.json();
  }

  // Check if there's pending sync data
  async hasPendingSync() {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SYNC_STORE], 'readonly');
      const store = transaction.objectStore(this.SYNC_STORE);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result > 0);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  // Clear all data (for testing/debugging)
  async clearAllData() {
    await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME, this.SYNC_STORE], 'readwrite');
      const storyStore = transaction.objectStore(this.STORE_NAME);
      const syncStore = transaction.objectStore(this.SYNC_STORE);

      const clearStory = storyStore.clear();
      const clearSync = syncStore.clear();

      Promise.all([clearStory, clearSync])
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }
}

export const indexedDBService = new IndexedDBService();