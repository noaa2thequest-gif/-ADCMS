(function(root, factory) {
  const api = factory(root);
  root.ADCMSDefectDetails = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  let currentDefect = null;

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function renderDefectHeader() {
    const header = document.getElementById('defectHeader');
    if (!header || !currentDefect) return;

    const aircraft = data.getAircraftByRegistration(currentDefect.aircraft);
    
    header.innerHTML = `
      <div>
        <h2 style="margin: 0;">${currentDefect.issue}</h2>
        <p style="margin: 5px 0 0 0; color: var(--text-dim);">
          Aircraft: <strong>${currentDefect.aircraft}</strong> | 
          MSN: ${aircraft ? aircraft.msn : 'N/A'} | 
          Source: ${currentDefect.source} | 
          Reported: ${currentDefect.reportDate}
        </p>
      </div>
      <div>
        <span class="status-badge status-${currentDefect.status.toLowerCase()}">${currentDefect.status}</span>
      </div>
    `;

    // Check for Chronic Defect
    const chronicAlert = document.getElementById('chronicAlert');
    const repeatInfo = data.checkRepeatDefect(currentDefect.aircraft, currentDefect.issue);
    if (repeatInfo.isChronic && chronicAlert) {
      chronicAlert.style.display = 'flex';
    }
  }

  function renderActionLog() {
    const log = document.getElementById('actionLog');
    if (!log || !currentDefect) return;

    if (!currentDefect.actions || currentDefect.actions.length === 0) {
      log.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 20px;">No actions recorded yet.</p>';
      return;
    }

    log.innerHTML = currentDefect.actions.map(action => `
      <div class="action-item ${action.type === 'performed' ? 'action-performed' : 'action-proposed'}">
        <div class="action-icon ${action.type === 'performed' ? 'performed-icon' : 'proposed-icon'}">
          ${action.type === 'performed' ? '✓' : '?'}
        </div>
        <div style="flex-grow: 1;">
          <p style="margin: 0; font-weight: 500;">${action.description}</p>
          <div class="action-meta">
            <span>By: ${action.by || 'Unknown'}</span>
            <span>${new Date(action.at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).reverse().join('');
  }

  function setupMelCountdown() {
    const timerContainer = document.getElementById('melTimerContainer');
    const timerDisplay = document.getElementById('melCountdown');
    
    if (!timerContainer || !timerDisplay || !currentDefect || !currentDefect.isMel) return;

    timerContainer.style.display = 'block';

    const updateTimer = () => {
      const expiry = new Date(currentDefect.melExpiryExtended || currentDefect.melExpiry);
      const now = new Date();
      const diff = expiry - now;

      if (diff <= 0) {
        timerDisplay.textContent = 'EXPIRED';
        timerDisplay.style.color = '#ff0000';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      timerDisplay.textContent = `${days}d ${hours}h ${mins}m`;
      
      if (days < 1) timerDisplay.style.color = '#ff9800';
      if (days < 0) timerDisplay.style.color = '#ff0000';
    };

    updateTimer();
    setInterval(updateTimer, 60000); // Update every minute
  }

  function saveAction() {
    const type = document.getElementById('actionType').value;
    const desc = document.getElementById('actionDesc').value;
    const by = document.getElementById('actionBy').value;

    if (!desc) {
      alert('Please enter a description for the action.');
      return;
    }

    if (!currentDefect.actions) currentDefect.actions = [];
    
    currentDefect.actions.push({
      type: type,
      description: desc,
      by: by,
      at: new Date().toISOString()
    });

    data.persistState();
    renderActionLog();
    
    // Hide form and clear
    document.getElementById('actionForm').style.display = 'none';
    document.getElementById('actionDesc').value = '';
    document.getElementById('actionBy').value = '';
  }

  function closeDefect() {
    const rootCause = document.getElementById('rootCause').value;
    if (!rootCause) {
      alert('Please document the Root Cause before final closure.');
      return;
    }

    if (confirm('Are you sure you want to CLOSE this defect permanently?')) {
      currentDefect.status = 'Closed';
      currentDefect.rootCause = rootCause;
      currentDefect.closedAt = new Date().toISOString();
      
      data.persistState();
      window.location.href = 'index.html';
    }
  }

  function init() {
    const defectId = getQueryParam('defectId');
    if (!defectId) {
      alert('No defect ID provided.');
      window.location.href = 'index.html';
      return;
    }

    const defects = data.workflowState.defects || [];
    currentDefect = defects.find(d => d.id === defectId);

    if (!currentDefect) {
      alert('Defect not found.');
      window.location.href = 'index.html';
      return;
    }

    renderDefectHeader();
    renderActionLog();
    setupMelCountdown();

    // Setup Event Listeners
    document.getElementById('addActionBtn').addEventListener('click', () => {
      document.getElementById('actionForm').style.display = 'block';
    });

    document.getElementById('cancelActionBtn').addEventListener('click', () => {
      document.getElementById('actionForm').style.display = 'none';
    });

    document.getElementById('saveActionBtn').addEventListener('click', saveAction);
    document.getElementById('closeDefectBtn').addEventListener('click', closeDefect);
    
    // Spare parts status listener
    const sparesSelect = document.getElementById('sparePartsStatus');
    if (sparesSelect) {
      sparesSelect.value = currentDefect.sparePartsStatus || 'no';
      sparesSelect.addEventListener('change', (e) => {
        currentDefect.sparePartsStatus = e.target.value;
        data.persistState();
      });
    }
  }

  return {
    init
  };
});
