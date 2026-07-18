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

  return {
    aircraft: [
      { reg: 'SU-SKB', type: 'A320-232', status: 'SERVICEABLE', cls: 'serviceable', open: 3, mel: 1, loc: 'CAI', update: '10 min ago' },
      { reg: 'SU-SKC', type: 'A320-232', status: 'DEFERRED', cls: 'deferred', open: 7, mel: 2, loc: 'HRG', update: '15 min ago' },
      { reg: 'SU-SKD', type: 'A321-231', status: 'AOG', cls: 'aog', open: 12, mel: 4, loc: 'SSH', update: '1 hour ago' },
      { reg: 'SU-SKE', type: 'A320-232', status: 'SERVICEABLE', cls: 'serviceable', open: 2, mel: 0, loc: 'CAI', update: '8 min ago' },
      { reg: 'SU-SKF', type: 'A320-232', status: 'DEFERRED', cls: 'deferred', open: 5, mel: 1, loc: 'ASW', update: '20 min ago' }
    ],
    appVersion: { major: 1, minor: 3, build: 13 },
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
