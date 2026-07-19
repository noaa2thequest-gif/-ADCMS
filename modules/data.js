(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const storageKey = 'adcms-workflow-state-v1';
  
  // Demo Data - Guaranteed to show up
  const defaultAircraft = [
    { id: 'ac-1', registration: 'SU-SKY', model: 'A320-200', msn: '5432', engines: 'V2500', status: 'SERVICEABLE', location: 'CAI', openDefects: 0, melItems: 0, lastUpdate: 'Just now' },
    { id: 'ac-2', registration: 'SU-VIS', model: 'B737-800', msn: '2876', engines: 'CFM56', status: 'DEFERRED', location: 'HRG', openDefects: 1, melItems: 1, lastUpdate: '2h ago' },
    { id: 'ac-3', registration: 'SU-ION', model: 'A330-300', msn: '1298', engines: 'Trent 700', status: 'AOG', location: 'SSH', openDefects: 1, melItems: 0, lastUpdate: '10m ago' }
  ];

  const defaultDefects = [
    { id: 'def-1', aircraft: 'SU-VIS', issue: 'Left Landing Light Inop', source: 'Medium', reportedAt: new Date().toISOString(), status: 'open', isMEL: true, melCategory: 'C', melExpiry: '2025-07-25' },
    { id: 'def-2', aircraft: 'SU-ION', issue: 'Engine #1 Fuel Leak', source: 'AOG', reportedAt: new Date().toISOString(), status: 'open', isMEL: false }
  ];

  const defaultInventory = [
    { id: 'part-1', partNumber: 'A320-LIGHT-01', description: 'Landing Light Bulb', location: 'CAI', quantity: 15, unit: 'Piece', lastUpdated: '2025-07-19' },
    { id: 'part-2', partNumber: 'B737-SEAL-99', description: 'Engine Seal Kit', location: 'HRG', quantity: 3, unit: 'Set', lastUpdated: '2025-07-18' }
  ];

  // Load from local storage or use defaults
  function loadFromStorage(key, defaultValue) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  let aircraftFleet = loadFromStorage('adcms-aircraft', defaultAircraft);
  let defectsList = loadFromStorage('adcms-defects', defaultDefects);
  let inventoryList = loadFromStorage('adcms-inventory', defaultInventory);

  function persist() {
    try {
      localStorage.setItem('adcms-aircraft', JSON.stringify(aircraftFleet));
      localStorage.setItem('adcms-defects', JSON.stringify(defectsList));
      localStorage.setItem('adcms-inventory', JSON.stringify(inventoryList));
    } catch (e) { console.error(e); }
  }

  return {
    initCloud: async () => true, // Bypass for now to ensure stability
    getAircraft: async () => aircraftFleet,
    getDefects: async () => defectsList,
    getInventory: async () => inventoryList,
    
    addAircraft: async (data) => {
      const newItem = { id: 'ac-' + Date.now(), ...data, openDefects: 0, melItems: 0, lastUpdate: 'Just now' };
      aircraftFleet.push(newItem);
      persist();
      return newItem;
    },
    
    addDefect: async (data) => {
      const newItem = { id: 'def-' + Date.now(), ...data, reportedAt: new Date().toISOString(), status: 'open' };
      defectsList.push(newItem);
      persist();
      return newItem;
    },

    addInventory: async (data) => {
      const newItem = { id: 'part-' + Date.now(), ...data, lastUpdated: new Date().toLocaleDateString() };
      inventoryList.push(newItem);
      persist();
      return newItem;
    },

    deleteInventory: async (id) => {
      inventoryList = inventoryList.filter(p => p.id !== id);
      persist();
      return true;
    },

    // Compatibility properties
    aircraft: aircraftFleet,
    workflowState: { defects: defectsList, inventory: inventoryList },
    persistState: persist
  };
});
