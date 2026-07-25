(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  
  const firebaseConfig = {
    apiKey: "AIzaSyDUMuUM-CSRsT4u8hlQ4YtWQNK69F3weSc",
    authDomain: "adcms-realtime.firebaseapp.com",
    databaseURL: "https://adcms-realtime-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "adcms-realtime",
    storageBucket: "adcms-realtime.firebasestorage.app",
    messagingSenderId: "197073995350",
    appId: "1:197073995350:web:74462049fc06b354dd9df7",
    measurementId: "G-E5VDB5XQCS"
  };

  let db = null;
  let aircraftFleet = [];
  let defectsList = [];
  let inventoryList = [];
  let cabinDefects = [];
  let dataChangeCallbacks = [];
  let isInitialized = false;

  function calculateMelExpiry(openDate, melCategory) {
    if (!openDate || !melCategory) return null;
    const date = new Date(openDate);
    let daysToAdd = 0;
    switch (melCategory.toUpperCase()) {
      case 'A': daysToAdd = 0; break;
      case 'B': daysToAdd = 3; break;
      case 'C': daysToAdd = 10; break;
      case 'D': daysToAdd = 120; break;
      default: return null;
    }
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

  function notifyDataChange() {
    dataChangeCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Data change callback error:', e);
      }
    });
  }

  async function initFirebase() {
    if (isInitialized) {
      console.log('✅ Firebase already initialized');
      return true;
    }

    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
      const { getDatabase, ref, onValue, set, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      const app = initializeApp(firebaseConfig);
      db = getDatabase(app);

      // Listen to Aircraft changes
      onValue(ref(db, 'aircraft'), (snapshot) => {
        const data = snapshot.val();
        aircraftFleet = data ? Object.values(data) : [];
        console.log('📡 Aircraft updated:', aircraftFleet.length);
        notifyDataChange();
      });

      // Listen to Defects changes
      onValue(ref(db, 'defects'), (snapshot) => {
        const data = snapshot.val();
        defectsList = data ? Object.values(data) : [];
        console.log('📡 Defects updated:', defectsList.length);
        notifyDataChange();
      });

      // Listen to Stores changes
      onValue(ref(db, 'stores'), (snapshot) => {
        const data = snapshot.val();
        inventoryList = data ? Object.values(data) : [];
        console.log('📡 Stores updated:', inventoryList.length);
        notifyDataChange();
      });

      // Listen to Cabin Defects changes
      onValue(ref(db, 'cabinDefects'), (snapshot) => {
        const data = snapshot.val();
        cabinDefects = data ? Object.values(data) : [];
        console.log('📡 Cabin Defects updated:', cabinDefects.length);
        notifyDataChange();
      });

      isInitialized = true;
      console.log('✅ Firebase initialized successfully');
      return true;
    } catch (e) {
      console.error('❌ Firebase init error:', e);
      return false;
    }
  }

  async function saveToFirebase(path, data) {
    if (!db) return;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      await set(ref(db, path), data);
    } catch (e) {
      console.warn('Firebase save error:', e);
    }
  }

  return {
    initCloud: initFirebase,

    // Aircraft methods
    getAircraft: async () => {
      if (!isInitialized) await initFirebase();
      return aircraftFleet;
    },
    
    addAircraft: async (aircraft) => {
      if (!isInitialized) await initFirebase();
      aircraft.id = aircraft.id || 'ac-' + Date.now();
      aircraftFleet.push(aircraft);
      const data = {};
      aircraftFleet.forEach(ac => {
        data[ac.id] = ac;
      });
      await saveToFirebase('aircraft', data);
      notifyDataChange();
    },
    
    updateAircraft: async (id, updates) => {
      if (!isInitialized) await initFirebase();
      const idx = aircraftFleet.findIndex(a => a.id === id);
      if (idx !== -1) {
        aircraftFleet[idx] = { ...aircraftFleet[idx], ...updates };
        const data = {};
        aircraftFleet.forEach(ac => {
          data[ac.id] = ac;
        });
        await saveToFirebase('aircraft', data);
        notifyDataChange();
      }
    },
    
    deleteAircraft: async (id) => {
      if (!isInitialized) await initFirebase();
      aircraftFleet = aircraftFleet.filter(a => a.id !== id);
      const data = {};
      aircraftFleet.forEach(ac => {
        data[ac.id] = ac;
      });
      await saveToFirebase('aircraft', data);
      notifyDataChange();
    },

    // Defects methods
    getDefects: async () => {
      if (!isInitialized) await initFirebase();
      return defectsList;
    },
    
    addDefect: async (defect) => {
      if (!isInitialized) await initFirebase();
      defect.id = defect.id || 'def-' + Date.now();
      defectsList.push(defect);
      const data = {};
      defectsList.forEach(def => {
        data[def.id] = def;
      });
      await saveToFirebase('defects', data);
      notifyDataChange();
    },
    
    updateDefect: async (id, updates) => {
      if (!isInitialized) await initFirebase();
      const idx = defectsList.findIndex(d => d.id === id);
      if (idx !== -1) {
        defectsList[idx] = { ...defectsList[idx], ...updates };
        const data = {};
        defectsList.forEach(def => {
          data[def.id] = def;
        });
        await saveToFirebase('defects', data);
        notifyDataChange();
      }
    },
    
    deleteDefect: async (id) => {
      if (!isInitialized) await initFirebase();
      defectsList = defectsList.filter(d => d.id !== id);
      const data = {};
      defectsList.forEach(def => {
        data[def.id] = def;
      });
      await saveToFirebase('defects', data);
      notifyDataChange();
    },

    // Inventory methods
    getInventory: async () => {
      if (!isInitialized) await initFirebase();
      return inventoryList;
    },
    
    addInventoryItem: async (item) => {
      if (!isInitialized) await initFirebase();
      item.id = item.id || 'inv-' + Date.now();
      inventoryList.push(item);
      const data = {};
      inventoryList.forEach(inv => {
        data[inv.id] = inv;
      });
      await saveToFirebase('stores', data);
      notifyDataChange();
    },
    
    updateInventoryItem: async (id, updates) => {
      if (!isInitialized) await initFirebase();
      const idx = inventoryList.findIndex(i => i.id === id);
      if (idx !== -1) {
        inventoryList[idx] = { ...inventoryList[idx], ...updates };
        const data = {};
        inventoryList.forEach(inv => {
          data[inv.id] = inv;
        });
        await saveToFirebase('stores', data);
        notifyDataChange();
      }
    },

    // Cabin Defects methods
    getCabinDefects: async () => {
      if (!isInitialized) await initFirebase();
      return cabinDefects;
    },
    
    addCabinDefect: async (defect) => {
      if (!isInitialized) await initFirebase();
      defect.id = defect.id || 'cd-' + Date.now();
      cabinDefects.push(defect);
      const data = {};
      cabinDefects.forEach(cd => {
        data[cd.id] = cd;
      });
      await saveToFirebase('cabinDefects', data);
      notifyDataChange();
    },

    // Callbacks
    onDataChange: (callback) => {
      dataChangeCallbacks.push(callback);
    },

    // Utilities
    calculateMelExpiry
  };
});
