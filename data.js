(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  // Helper to calculate MEL expiry based on category and open date
  function calculateMelExpiry(openDate, melCategory) {
    if (!openDate || !melCategory) return null;
    const date = new Date(openDate);
    let daysToAdd = 0;
    switch (melCategory.toUpperCase()) {
      case 'A':
        daysToAdd = 0; // Category A: Must be repaired before flight, no deferral period
        break;
      case 'B':
        daysToAdd = 3;
        break;
      case 'C':
        daysToAdd = 10;
        break;
      case 'D':
        daysToAdd = 120;
        break;
      default:
        return null;
    }
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0]; // Return as YYYY-MM-DD string
  }

  // Demo Data - Always available
  const defaultAircraft = [
    { id: 'ac-1', registration: 'SU-SKY', model: 'A320-200', msn: '5432', engines: 'V2500', status: 'SERVICEABLE', location: 'CAI', openDefects: 0, melItems: 0, lastUpdate: 'Just now' },
    { id: 'ac-2', registration: 'SU-VIS', model: 'B737-800', msn: '2876', engines: 'CFM56', status: 'DEFERRED', location: 'HRG', openDefects: 1, melItems: 1, lastUpdate: '2h ago' },
    { id: 'ac-3', registration: 'SU-ION', model: 'A330-300', msn: '1298', engines: 'Trent 700', status: 'AOG', location: 'SSH', openDefects: 1, melItems: 0, lastUpdate: '10m ago' }
  ];

  const defaultDefects = [
    { 
      id: 'def-1', 
      aircraft: 'SU-VIS', 
      issue: 'Left Landing Light Inop', 
      defectSource: 'Capt Entry', // New field
      reportedAt: '2026-07-18T10:30:00Z', 
      status: 'open', 
      isMEL: true, 
      melCategory: 'C', 
      openDate: '2026-07-18', // New field
      melExpiry: calculateMelExpiry('2026-07-18', 'C'), // Calculated
      melReference: 'MEL-25-11-01', // New field
      maintenanceActionLog: [ // Changed to log
        { action: 'Replaced bulb, tested OK', by: 'Hany Omar', date: '2026-07-18', nextAction: 'Monitor for 24h' }
      ], 
      placardRequired: true, // New field
      closeDate: null // New field
    },
    { 
      id: 'def-2', 
      aircraft: 'SU-ION', 
      issue: 'Engine #1 Fuel Leak', 
      defectSource: 'Maintenance Observation', // New field
      reportedAt: '2026-07-19T08:15:00Z', 
      status: 'AOG', 
      isMEL: false,
      melCategory: null,
      openDate: null,
      melExpiry: null,
      melReference: null,
      maintenanceActionLog: [], // Changed to log
      placardRequired: false,
      closeDate: null
    }
  ];

  const defaultInventory = [
    { id: 'part-1', partNumber: 'A320-LIGHT-01', description: 'Landing Light Bulb', location: 'CAI', quantity: 15, unit: 'Piece', lastUpdated: '2026-07-19' },
    { id: 'part-2', partNumber: 'B737-SEAL-99', description: 'Engine Seal Kit', location: 'HRG', quantity: 3, unit: 'Set', lastUpdated: '2026-07-18' }
  ];

  // Initialize data from localStorage or use defaults
  let aircraftFleet = loadFromLocalStorage('adcms-aircraft', defaultAircraft);
  let defectsList = loadFromLocalStorage('adcms-defects', defaultDefects);
  let inventoryList = loadFromLocalStorage('adcms-inventory', defaultInventory);
  let cabinDefects = loadFromLocalStorage('adcms-cabin-defects', []);

  function loadFromLocalStorage(key, defaultData) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultData));
    } catch (e) {
      console.warn(`Failed to load ${key} from localStorage, using defaults:`, e);
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

    function persist() {
      try {
        localStorage.setItem('adcms-aircraft', JSON.stringify(aircraftFleet));
        localStorage.setItem('adcms-defects', JSON.stringify(defectsList));
        localStorage.setItem('adcms-inventory', JSON.stringify(inventoryList));
        localStorage.setItem('adcms-cabin-defects', JSON.stringify(cabinDefects));
        if (root.ADCMSData && root.ADCMSData._emitDataChange) {
          root.ADCMSData._emitDataChange();
        }
      } catch (e) {
        console.warn('Failed to persist to localStorage:', e);
      }
    }

  return {
    initCloud: async () => {
      // Ensure initial data is persisted if not already
      persist();
      return true;
    },
    
    getAircraft: async () => {
      // Ensure aircraftFleet is always an array
      if (!Array.isArray(aircraftFleet)) {
        console.warn('aircraftFleet is not an array, resetting to default');
        aircraftFleet = defaultAircraft;
        localStorage.setItem('adcms-aircraft', JSON.stringify(aircraftFleet));
      }
      return aircraftFleet;
    },
    getDefects: async () => defectsList,
    getInventory: async () => inventoryList,
    getCabinDefects: async () => cabinDefects,
    getMELs: async () => defectsList.filter(d => d.isMEL === true && d.status !== 'closed'),
    getDefectsByAircraft: async (registration) => defectsList.filter(d => d.aircraft === registration),
    getAircraftDefects: async (registration) => defectsList.filter(d => d.aircraft === registration && d.status !== 'closed'),
    getAircraftMELs: async (registration) => defectsList.filter(d => d.aircraft === registration && d.isMEL === true && d.status !== 'closed'),
    getAircraftOpenDefectsCount: async (registration) => defectsList.filter(d => d.aircraft === registration && d.status === 'open').length,
    getAircraftMELItemsCount: async (registration) => defectsList.filter(d => d.aircraft === registration && d.isMEL === true && d.status === 'open').length,
    getAircraftAOGStatus: async (registration) => defectsList.some(d => d.aircraft === registration && d.status === 'AOG'),
    getAircraftDeferredStatus: async (registration) => defectsList.some(d => d.aircraft === registration && d.status === 'deferred'),
    getAircraftServiceableStatus: async (registration) => !defectsList.some(d => d.aircraft === registration && (d.status === 'AOG' || d.status === 'deferred' || d.isMEL === true && d.status === 'open')),
    
    addAircraft: async (data) => {
      const newItem = { id: 'ac-' + Date.now(), status: 'SERVICEABLE', ...data, openDefects: 0, melItems: 0, lastUpdate: 'Just now' };
      aircraftFleet.push(newItem);
      persist();
      root.ADCMSData._emitDataChange();
      return newItem;
    },

    updateAircraft: async (id, updates) => {
      const aircraft = aircraftFleet.find(a => a.id === id);
      if (aircraft) {
        Object.assign(aircraft, updates);
        persist();
        root.ADCMSData._emitDataChange();
      }
      return aircraft;
    },

    getAircraftByRegistration: async (registration) => {
      return aircraftFleet.find(a => a.registration === registration);
    },

    deleteAircraft: async (id) => {
      const index = aircraftFleet.findIndex(a => a.id === id || String(a.id) === String(id));
      if (index !== -1) {
        aircraftFleet.splice(index, 1);
        persist();
        root.ADCMSData._emitDataChange();
        return true;
      }
      throw new Error('Aircraft not found');
    },
    
    addDefect: async (data) => {
      const newItem = { 
        id: 'def-' + Date.now(), 
        ...data, 
        reportedAt: data.reportedAt || new Date().toISOString(), 
        status: data.status || 'open',
        melExpiry: data.isMEL && data.openDate && data.melCategory ? calculateMelExpiry(data.openDate, data.melCategory) : null,
        maintenanceActionLog: data.maintenanceActionLog || []
      };
      
      // Route to cabin if source is Cabin
      if (data.defectSource === 'Cabin') {
        const cabinItem = {
          ...newItem,
          id: 'CABIN-' + Date.now(),
          area: data.area || 'General Cabin',
          issue: data.issue,
          isCabinDefect: true
        };
        cabinDefects.push(cabinItem);
      } else {
        defectsList.push(newItem);
      }
      
      persist();
      root.ADCMSData._emitDataChange();
      return newItem;
    },

    addCabinDefect: async (data) => {
      const newItem = {
        id: 'CABIN-' + Date.now(),
        ...data,
        status: data.status || 'Open',
        reportDate: data.reportDate || new Date().toISOString().split('T')[0],
        actions: data.actions || [],
        isCabinDefect: true
      };
      cabinDefects.push(newItem);
      persist();
      root.ADCMSData._emitDataChange();
      return newItem;
    },

    updateCabinDefect: async (id, updates) => {
      const defect = cabinDefects.find(d => d.id === id);
      if (defect) {
        Object.assign(defect, updates);
        persist();
        root.ADCMSData._emitDataChange();
      }
      return defect;
    },

    deleteCabinDefect: async (id) => {
      cabinDefects = cabinDefects.filter(d => d.id !== id);
      persist();
      root.ADCMSData._emitDataChange();
      return true;
    },

    addInventory: async (data) => {
      const newItem = { id: 'part-' + Date.now(), ...data, lastUpdated: new Date().toLocaleDateString() };
      inventoryList.push(newItem);
      persist();
      root.ADCMSData._emitDataChange();
      return newItem;
    },

    updateDefect: async (id, updates) => {
      const defect = defectsList.find(d => d.id === id);
      if (defect) {
        Object.assign(defect, updates);
        // Recalculate melExpiry if relevant fields are updated
        if (defect.isMEL && (updates.openDate || updates.melCategory)) {
          defect.melExpiry = calculateMelExpiry(defect.openDate, defect.melCategory);
        }
        persist();
        root.ADCMSData._emitDataChange();
      }
      return defect;
    },

    deleteDefect: async (id) => {
      defectsList = defectsList.filter(d => d.id !== id);
      persist();
      root.ADCMSData._emitDataChange();
      return true;
    },

    deleteInventory: async (id) => {
      inventoryList = inventoryList.filter(p => p.id !== id);
      persist();
      root.ADCMSData._emitDataChange();
      return true;
    },

    calculateMelExpiry,

    // Compatibility properties
    aircraft: aircraftFleet,
    workflowState: { defects: defectsList, inventory: inventoryList, cabinDefects: cabinDefects },
    persistState: persist,
    // A simple event system for data changes
    _listeners: [],
    onDataChange: function(callback) {
      this._listeners.push(callback);
    },
    _emitDataChange: function() {
      this._listeners.forEach(callback => callback());
    }
  };
});
