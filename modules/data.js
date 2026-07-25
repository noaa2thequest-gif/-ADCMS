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

  async function initFirebase() {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
      const { getDatabase, ref, get, set, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      const app = initializeApp(firebaseConfig);
      db = getDatabase(app);

      // Load all data from Firebase
      const dbRef = ref(db);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        aircraftFleet = data.aircraft ? Object.values(data.aircraft) : [];
        defectsList = data.defects ? Object.values(data.defects) : [];
        inventoryList = data.stores ? Object.values(data.stores) : [];
        cabinDefects = data.cabinDefects ? Object.values(data.cabinDefects) : [];
      }

      console.log('✅ Firebase loaded successfully');
      return true;
    } catch (e) {
      console.error('Firebase init error:', e);
      return false;
    }
  }

  async function saveToFirebase() {
    if (!db) return;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      const data = {
        aircraft: {},
        defects: {},
        stores: {},
        cabinDefects: {}
      };

      aircraftFleet.forEach((ac, i) => {
        data.aircraft[ac.id || `ac-${i}`] = ac;
      });
      defectsList.forEach((def, i) => {
        data.defects[def.id || `def-${i}`] = def;
      });
      inventoryList.forEach((inv, i) => {
        data.stores[inv.id || `inv-${i}`] = inv;
      });
      cabinDefects.forEach((cd, i) => {
        data.cabinDefects[cd.id || `cd-${i}`] = cd;
      });

      await set(ref(db), data);
    } catch (e) {
      console.warn('Firebase save error:', e);
    }
  }

  return {
    initCloud: initFirebase,

    getAircraft: () => aircraftFleet,
    addAircraft: (aircraft) => {
      aircraftFleet.push(aircraft);
      saveToFirebase();
    },
    updateAircraft: (id, updates) => {
      const idx = aircraftFleet.findIndex(a => a.id === id);
      if (idx !== -1) {
        aircraftFleet[idx] = { ...aircraftFleet[idx], ...updates };
        saveToFirebase();
      }
    },
    deleteAircraft: (id) => {
      aircraftFleet = aircraftFleet.filter(a => a.id !== id);
      saveToFirebase();
    },

    getDefects: () => defectsList,
    addDefect: (defect) => {
      defectsList.push(defect);
      saveToFirebase();
    },
    updateDefect: (id, updates) => {
      const idx = defectsList.findIndex(d => d.id === id);
      if (idx !== -1) {
        defectsList[idx] = { ...defectsList[idx], ...updates };
        saveToFirebase();
      }
    },
    deleteDefect: (id) => {
      defectsList = defectsList.filter(d => d.id !== id);
      saveToFirebase();
    },

    getInventory: () => inventoryList,
    addInventoryItem: (item) => {
      inventoryList.push(item);
      saveToFirebase();
    },
    updateInventoryItem: (id, updates) => {
      const idx = inventoryList.findIndex(i => i.id === id);
      if (idx !== -1) {
        inventoryList[idx] = { ...inventoryList[idx], ...updates };
        saveToFirebase();
      }
    },

    getCabinDefects: () => cabinDefects,
    addCabinDefect: (defect) => {
      cabinDefects.push(defect);
      saveToFirebase();
    },

    calculateMelExpiry
  };
});
