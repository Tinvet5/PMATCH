(function () {
  const DB_NAME = 'pluginMatchStudioDB';
  const DB_VERSION = 1;
  const STORE = 'modules';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, operation) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  const API = {
    get(id) {
      return withStore('readonly', store => store.get(id));
    },
    getAll() {
      return withStore('readonly', store => store.getAll());
    },
    put(module) {
      return withStore('readwrite', store => store.put(module));
    },
    delete(id) {
      return withStore('readwrite', store => store.delete(id));
    }
  };

  window.PluginMatchStudioDB = API;
})();
