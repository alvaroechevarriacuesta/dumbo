// Chrome storage utility for extension
export interface ChromeStorageData {
  authToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    createdAt: Date;
  };
}

export const chromeStorage = {
  async get(key: keyof ChromeStorageData): Promise<ChromeStorageData[keyof ChromeStorageData] | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return null;
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },

  async set(key: keyof ChromeStorageData, value: ChromeStorageData[keyof ChromeStorageData]): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  async remove(key: keyof ChromeStorageData): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  },

  async clear(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }
}; 