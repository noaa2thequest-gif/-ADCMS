(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const storageKey = 'adcms-workflow-state-v1';
  const defaultWorkflowState = {
    activeDefect: {
      aircraft: 'SU-SKD',
      issue: 'Hydraulic pump noise',
      defectSource: 'ECAM Message',
      status: 'Open',
      repeatDefect: false,
      troubleshooting: [],
      attachments: [],
      rootCause: ''
    },
    history: [
      { aircraft: 'SU-SKD', issue: 'Hydraulic pump noise', status: 'Closed', rootCause: 'Pump seal wear', reportedAt: '2026-07-10T09:00:00.000Z' }
    ],
    defects: []
  };

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

  function normalizeState(savedState) {
    const state = savedState || defaultWorkflowState;
    return {
      activeDefect: { ...defaultWorkflowState.activeDefect, ...(state.activeDefect || {}) },
      history: Array.isArray(state.history) ? state.history : [...defaultWorkflowState.history],
      defects: Array.isArray(state.defects) ? state.defects : []
    };
  }

  const workflowState = normalizeState(loadState());

  // Enhanced aircraft data matching the new design
  const aircraftData = [
    {
      reg: 'SU-SKB',
      type: 'A320-232',
      status: 'SERVICEABLE',
      cls: 'serviceable',
      open: 3,
      mel: 1,
      loc: 'CAI',
      update: '10 min ago',
      image: '✈'
    },
    {
      reg: 'SU-SKC',
      type: 'A320-232',
      status: 'DEFERRED',
      cls: 'deferred',
      open: 7,
      mel: 2,
      loc: 'HRG',
      update: '15 min ago',
      image: '✈'
    },
    {
      reg: 'SU-SKD',
      type: 'A321-231',
      status: 'AOG',
      cls: 'aog',
      open: 12,
      mel: 4,
      loc: 'SSH',
      update: '1 hour ago',
      image: '✈'
    },
    {
      reg: 'SU-SKE',
      type: 'B737-800',
      status: 'SERVICEABLE',
      cls: 'serviceable',
      open: 2,
      mel: 0,
      loc: 'CAI',
      update: '8 min ago',
      image: '✈'
    },
    {
      reg: 'SU-SKF',
      type: 'A320-232',
      status: 'DEFERRED',
      cls: 'deferred',
      open: 5,
      mel: 1,
      loc: 'ASW',
      update: '20 min ago',
      image: '✈'
    }
  ];

  // Defect sources for breakdown
  const defectSources = [
    { source: 'AOG', count: 12, color: 'red-dot', percentage: 25 },
    { source: 'High', count: 18, color: 'orange-dot', percentage: 37.5 },
    { source: 'Medium', count: 10, color: 'yellow-dot', percentage: 20.8 },
    { source: 'Low', count: 8, color: 'green-dot', percentage: 16.7 }
  ];

  // Fleet status breakdown
  const fleetStatus = {
    serviceable: { count: 6, percentage: 50, status: 'Serviceable' },
    deferred: { count: 3, percentage: 25, status: 'Deferred' },
    aog: { count: 3, percentage: 25, status: 'AOG' },
    maintenance: { count: 0, percentage: 0, status: 'In Maintenance' }
  };

  return {
    aircraft: aircraftData,
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
        // Ignore storage failures.
      }
    }
  };
});
