(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  
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

  // Load from localStorage - NO DEFAULT DATA
  function loadFromLocalStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      return [];
    }
  }

  // Data storage - START EMPTY
  let aircraftFleet = loadFromLocalStorage('adcms-aircraft');
  let defectsList = loadFromLocalStorage('adcms-defects');
  let inventoryList = loadFromLocalStorage('adcms-inventory');
  let cabinDefects = loadFromLocalStorage('adcms-cabin-defects');

  function persist() {
    try {
      localStorage.setItem('adcms-aircraft', JSON.stringify(aircraftFleet));
      localStorage.setItem('adcms-defects', JSON.stringify(defectsList));
      localStorage.setItem('adcms-inventory', JSON.stringify(inventoryList));
      localStorage.setItem('adcms-cabin-defects', JSON.stringify(cabinDefects));
    } catch (e) {
      console.warn('Failed to persist data:', e);
    }
  }

  return {
    initCloud: async () => true,

    // Aircraft
    getAircraft: () => aircraftFleet,
    addAircraft: (aircraft) => {
      aircraftFleet.push(aircraft);
      persist();
    },
    updateAircraft: (id, updates) => {
      const idx = aircraftFleet.findIndex(a => a.id === id);
      if (idx !== -1) {
        aircraftFleet[idx] = { ...aircraftFleet[idx], ...updates };
        persist();
      }
    },
    deleteAircraft: (id) => {
      aircraftFleet = aircraftFleet.filter(a => a.id !== id);
      persist();
    },

    // Defects
    getDefects: () => defectsList,
    addDefect: (defect) => {
      defectsList.push(defect);
      persist();
    },
    updateDefect: (id, updates) => {
      const idx = defectsList.findIndex(d => d.id === id);
      if (idx !== -1) {
        defectsList[idx] = { ...defectsList[idx], ...updates };
        persist();
      }
    },
    deleteDefect: (id) => {
      defectsList = defectsList.filter(d => d.id !== id);
      persist();
    },

    // Inventory
    getInventory: () => inventoryList,
    addInventoryItem: (item) => {
      inventoryList.push(item);
      persist();
    },
    updateInventoryItem: (id, updates) => {
      const idx = inventoryList.findIndex(i => i.id === id);
      if (idx !== -1) {
        inventoryList[idx] = { ...inventoryList[idx], ...updates };
        persist();
      }
    },

    // Cabin defects
    getCabinDefects: () => cabinDefects,
    addCabinDefect: (defect) => {
      cabinDefects.push(defect);
      persist();
    },

    // Utility
    calculateMelExpiry
  };
});
