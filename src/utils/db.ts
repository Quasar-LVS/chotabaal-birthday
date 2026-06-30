// Client-side IndexedDB database wrapper
// Fully SSR safe

const DB_NAME = 'MemoryBoxDB';
const DB_VERSION = 1;

export interface PhotoEntry {
  id: string;
  name: string;
  blob?: Blob;
  path?: string;
  order: number;
}

export interface MediaEntry {
  blob?: Blob;
  name: string;
  path?: string;
}

export interface TextConfig {
  title: string;
  enterButton: string;
  heroTitle: string;
  heroSubtitle: string;
  heroParagraphs: string[];
  sectionTitles: {
    hero: string;
    constellation: string;
    gallery: string;
    cinema: string;
  };
  navigation: {
    hero: string;
    constellation: string;
    gallery: string;
    cinema: string;
    final: string;
  };
}

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  title: "Magical Memory Box",
  enterButton: "Open Memory Box →",
  heroTitle: "Happy Birthday",
  heroSubtitle: "A secret memory universe at midnight.",
  heroParagraphs: [
    "Today is a celebration of you. Open this memory box and wander through our moments together.",
    "Tap on the glowing star bubbles in the constellation, flip through the Polaroid scrapbook, or play the birthday film in the cinema room. There are no rules, locks, or gates. Simply enjoy."
  ],
  sectionTitles: {
    hero: "Happy Birthday",
    constellation: "Memory Constellation",
    gallery: "Dream Scrapbook",
    cinema: "The Cinema Room",
  },
  navigation: {
    hero: "Home",
    constellation: "Constellation",
    gallery: "Scrapbook",
    cinema: "Cinema",
    final: "Forever",
  }
};

// Safe DB accessor
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available on server-side'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store 1: Text Configs & general media
      if (!db.objectStoreNames.contains('configs')) {
        db.createObjectStore('configs');
      }

      // Store 2: Photos array list
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' });
      }
    };
  });
}

// ---------------- CONFIG READ/WRITE ----------------

export async function getTextConfig(): Promise<TextConfig> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('configs', 'readonly');
      const store = transaction.objectStore('configs');
      const request = store.get('textConfig');

      request.onsuccess = () => {
        resolve(request.result || DEFAULT_TEXT_CONFIG);
      };
      request.onerror = () => {
        resolve(DEFAULT_TEXT_CONFIG);
      };
    });
  } catch (e) {
    return DEFAULT_TEXT_CONFIG;
  }
}

export async function saveTextConfig(config: TextConfig): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('configs', 'readwrite');
    const store = transaction.objectStore('configs');
    const request = store.put(config, 'textConfig');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------- VIDEO READ/WRITE ----------------

export async function getVideo(): Promise<MediaEntry | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('configs', 'readonly');
      const store = transaction.objectStore('configs');
      const request = store.get('video');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function saveVideo(blob: Blob, name: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('configs', 'readwrite');
    const store = transaction.objectStore('configs');
    const request = store.put({ blob, name }, 'video');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideo(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('configs', 'readwrite');
    const store = transaction.objectStore('configs');
    const request = store.delete('video');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------- MUSIC READ/WRITE ----------------

export async function getMusic(): Promise<MediaEntry | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('configs', 'readonly');
      const store = transaction.objectStore('configs');
      const request = store.get('music');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function saveMusic(blob: Blob, name: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('configs', 'readwrite');
    const store = transaction.objectStore('configs');
    const request = store.put({ blob, name }, 'music');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMusic(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('configs', 'readwrite');
    const store = transaction.objectStore('configs');
    const request = store.delete('music');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------- PHOTOS READ/WRITE ----------------

export async function getPhotos(): Promise<PhotoEntry[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.getAll();

      request.onsuccess = () => {
        const list = (request.result as PhotoEntry[]) || [];
        // Sort by order field
        list.sort((a, b) => a.order - b.order);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

export async function savePhoto(id: string, name: string, blob: Blob, order: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.put({ id, name, blob, order });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------- RESET DATABASE ----------------

export async function resetDB(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['configs', 'photos'], 'readwrite');
    const configStore = transaction.objectStore('configs');
    const photoStore = transaction.objectStore('photos');

    configStore.clear();
    photoStore.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
