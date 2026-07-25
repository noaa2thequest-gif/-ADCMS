(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  // Firebase config
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

  // Initialize Firebase
  let database = null;
  let firebaseReady = false;

  async function initFirebase() {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
      const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      const app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      firebaseReady = true;
      console.log('✅ Firebase initialized');
      return true;
    } catch (e) {
      console.warn('Firebase init failed:', e);
      return false;
    }
  }

  // Helper to calculate MEL expiry
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

  // Data storage
  let aircraftFleet = [];
  let defectsList = [];
  let inventoryList = [];
  let cabinDefects = [];

  // Load from Firebase
  async function loadFromFirebase() {
    if (!firebaseReady) {
      await initFirebase();
    }

    try {
      const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      // Load aircraft
      const aircraftRef = ref(database, 'aircraft');
      const aircraftSnap = await get(aircraftRef);
      aircraftFleet = aircraftSnap.val() ? Object.values(aircraftSnap.val()) : [];
      
      // Load defects
      const defectsRef = ref(database, 'defects');
      const defectsSnap = await get(defectsRef);
      defectsList = defectsSnap.val() ? Object.values(defectsSnap.val()) : [];
      
      // Load inventory
      const inventoryRef = ref(database, 'stores');
      const inventorySnap = await get(inventoryRef);
      inventoryList = inventorySnap.val() ? Object.values(inventorySnap.val()) : [];
      
      // Load cabin defects
      const cabinRef = ref(database, 'cabinDefects');
      const cabinSnap = await get(cabinRef);
      cabinDefects = cabinSnap.val() ? Object.values(cabinSnap.val()) : [];
      
      console.log('✅ Data loaded from Firebase');
      return true;
    } catch (e) {
      console.warn('Failed to load from Firebase:', e);
      return false;
    }
  }

  // Save to Firebase
  async function saveToFirebase() {
    if (!firebaseReady) {
      await initFirebase();
    }

    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      // Save aircraft
      if (aircraftFleet.length > 0) {
        const aircraftObj = {};
        aircraftFleet.forEach((ac, idx) => {
          aircraftObj[ac.id || `ac-${idx}`] = ac;
        });
        await set(ref(database, 'aircraft'), aircraftObj);
      }
      
      // Save defects
      if (defectsList.length > 0) {
        const defectsObj = {};
        defectsList.forEach((def, idx) => {
          defectsObj[def.id || `def-${idx}`] = def;
        });
        await set(ref(database, 'defects'), defectsObj);
      }
      
      console.log('✅ Data saved to Firebase');
      return true;
    } catch (e) {
      console.warn('Failed to save to Firebase:', e);
      return false;
    }
  }

  return {
    initCloud: loadFromFirebase,

    // Aircraft methods
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

    // Defects methods
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

    // Inventory methods
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

    // Cabin defects
    getCabinDefects: () => cabinDefects,
    addCabinDefect: (defect) => {
      cabinDefects.push(defect);
      saveToFirebase();
    },

    // Utility
    calculateMelExpiry
  };
});
