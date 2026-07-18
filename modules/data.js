(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const storageKey = 'adcms-workflow-state-v1';
  const aircraftStorageKey = 'adcms-aircraft-fleet-v1';
  
  const defaultWorkflowState = {
    activeDefect: null,
    history: [],
    defects: []
  };

  // Default aircraft data - Empty by default, user adds their own
  const defaultAircraft = [];

  function loadState() {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function loadAircraft() {
    if (typeof localStorage === 'undefined') {
      return defaultAircraft;
    }
    try {
      const raw = localStorage.getItem(aircraftStorageKey);
      return raw ? JSON.parse(raw) : defaultAircraft;
    } catch (error) {
      return defaultAircraft;
    }
  }

  function normalizeState(savedState) {
    const state = savedState || defaultWorkflowState;
    return {
      activeDefect: { ...defaultWorkflowState.activeDefect, ...(state.activeDefect || {}) },
      history: Array.isArray(state.history) ? state.history : [...defaultWorkflowState.history],
      defects: Array.isArray(state.defects) ? state.defects : []
    };
  }

  const workflowState = normalizeState(loadState());
  let aircraftFleet = loadAircraft();

  // Defect sources for breakdown - Reset to zero
  const defectSources = [
    { source: 'AOG', count: 0, color: 'red-dot', percentage: 0 },
    { source: 'High', count: 0, color: 'orange-dot', percentage: 0 },
    { source: 'Medium', count: 0, color: 'yellow-dot', percentage: 0 },
    { source: 'Low', count: 0, color: 'green-dot', percentage: 0 }
  ];

  // Fleet status breakdown - Reset to zero
  const fleetStatus = {
    serviceable: { count: 0, percentage: 0, status: 'Serviceable' },
    deferred: { count: 0, percentage: 0, status: 'Deferred' },
    aog: { count: 0, percentage: 0, status: 'AOG' },
    maintenance: { count: 0, percentage: 0, status: 'In Maintenance' }
  };

  return {
    // Aircraft management
    getAircraft() {
      return aircraftFleet;
    },

    addAircraft(aircraftData) {
      const newAircraft = {
        id: 'ac-' + Date.now(),
        registration: aircraftData.registration,
        model: aircraftData.model,
        msn: aircraftData.msn,
        engines: aircraftData.engines,
        manufacturingDate: aircraftData.manufacturingDate,
        status: aircraftData.status || 'SERVICEABLE',
        location: aircraftData.location || 'CAI',
        openDefects: 0,
        melItems: 0,
        lastUpdate: 'Just now'
      };
      aircraftFleet.push(newAircraft);
      this.persistAircraft();
      return newAircraft;
    },

    updateAircraft(aircraftId, updates) {
      const aircraft = aircraftFleet.find(a => a.id === aircraftId);
      if (aircraft) {
        Object.assign(aircraft, updates);
        this.persistAircraft();
        return aircraft;
      }
      return null;
    },

    deleteAircraft(aircraftId) {
      const index = aircraftFleet.findIndex(a => a.id === aircraftId);
      if (index > -1) {
        aircraftFleet.splice(index, 1);
        this.persistAircraft();
        return true;
      }
      return false;
    },

    getAircraftByRegistration(registration) {
      return aircraftFleet.find(a => a.registration === registration);
    },

    persistAircraft() {
      if (typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.setItem(aircraftStorageKey, JSON.stringify(aircraftFleet));
      } catch (error) {
        console.error('Error persisting aircraft:', error);
      }
    },

    // Legacy properties for compatibility
    aircraft: aircraftFleet,
    defectSources: defectSources,
    fleetStatus: fleetStatus,
    appVersion: { major: 1, minor: 0, build: 1 },
    workflowState,

    persistState() {
      if (typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(workflowState));
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    }
  };
});
