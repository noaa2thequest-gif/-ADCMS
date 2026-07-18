(function(root, factory) {
  const api = factory(root);
  root.ADCMSAircraftStatus = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function renderAircraftHeader(aircraft) {
    const header = document.getElementById('aircraftHeader');
    if (!header) return;

    header.innerHTML = `
      <div class="aircraft-image-large">
        <img src="https://via.placeholder.com/400x250?text=${aircraft.registration}" alt="${aircraft.registration}">
      </div>
      <div style="flex-grow: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="margin: 0; font-size: 32px;">${aircraft.registration}</h1>
            <p style="color: var(--text-dim); margin: 5px 0 20px 0;">${aircraft.model} | MSN: ${aircraft.msn}</p>
          </div>
          <span class="status-badge status-${(aircraft.status || 'Serviceable').toLowerCase()}">${aircraft.status || 'Serviceable'}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="info-group">
            <label>Engines</label>
            <span>${aircraft.engines || 'N/A'}</span>
          </div>
          <div class="info-group">
            <label>Current Location</label>
            <span>${aircraft.location || 'N/A'}</span>
          </div>
          <div class="info-group">
            <label>Manufacturing Date</label>
            <span>${aircraft.mfgDate || 'N/A'}</span>
          </div>
          <div class="info-group">
            <label>Last Updated</label>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderActiveMels(defects) {
    const list = document.getElementById('activeMelList');
    const count = document.getElementById('melCount');
    const mels = defects.filter(d => d.isMel && d.status === 'Open');
    
    if (count) count.textContent = mels.length;
    if (!list) return;

    if (mels.length === 0) {
      list.innerHTML = '<p style="color: var(--text-dim); font-size: 13px;">No active MEL items.</p>';
      return;
    }

    list.innerHTML = mels.map(mel => `
      <div class="mel-item-mini" style="border-left-color: ${mel.melCategory === 'B' ? '#ff9800' : (mel.melCategory === 'C' ? '#ffc107' : '#ff5252')}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <strong>${mel.issue}</strong>
          <span class="mel-badge badge-category-${mel.melCategory.toLowerCase()}">Cat ${mel.melCategory}</span>
        </div>
        <div style="font-size: 11px; margin-top: 5px; color: var(--text-dim);">
          Expires: ${mel.melExpiryExtended || mel.melExpiry}
        </div>
      </div>
    `).join('');
  }

  function renderRequiredParts(defects) {
    const list = document.getElementById('partsList');
    const count = document.getElementById('partsCount');
    const partsDefects = defects.filter(d => d.sparePartsStatus && d.sparePartsStatus !== 'no');

    if (count) count.textContent = partsDefects.length;
    if (!list) return;

    if (partsDefects.length === 0) {
      list.innerHTML = '<p style="color: var(--text-dim); font-size: 13px;">No pending spare parts.</p>';
      return;
    }

    list.innerHTML = partsDefects.map(d => `
      <div class="part-item-mini">
        <div>
          <div style="font-size: 13px; font-weight: 600;">${d.issue}</div>
          <div style="font-size: 11px; color: var(--text-dim);">${d.proposedAction || 'Awaiting P/N info'}</div>
        </div>
        <span class="part-status-tag tag-${d.sparePartsStatus}">${d.sparePartsStatus.toUpperCase()}</span>
      </div>
    `).join('');
  }

  function renderRecentActivity(defects) {
    const list = document.getElementById('recentActivity');
    if (!list) return;

    // Get all actions from all defects of this aircraft
    let allActions = [];
    defects.forEach(d => {
      if (d.actions) {
        d.actions.forEach(a => {
          allActions.push({ ...a, defectIssue: d.issue });
        });
      }
    });

    // Sort by date descending
    allActions.sort((a, b) => new Date(b.at) - new Date(a.at));
    const recent = allActions.slice(0, 5);

    if (recent.length === 0) {
      list.innerHTML = '<p style="color: var(--text-dim); font-size: 13px;">No recent maintenance activity.</p>';
      return;
    }

    list.innerHTML = recent.map(a => `
      <div class="action-item ${a.type === 'performed' ? 'action-performed' : 'action-proposed'}" style="padding: 10px; margin-bottom: 10px; font-size: 12px;">
        <div class="action-icon ${a.type === 'performed' ? 'performed-icon' : 'proposed-icon'}" style="width: 20px; height: 20px; font-size: 10px;">
          ${a.type === 'performed' ? '✓' : '?'}
        </div>
        <div style="flex-grow: 1;">
          <div style="font-weight: 600;">${a.defectIssue}</div>
          <p style="margin: 2px 0;">${a.description}</p>
          <div style="font-size: 10px; color: var(--text-dim); display: flex; justify-content: space-between;">
            <span>By: ${a.by}</span>
            <span>${new Date(a.at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function init() {
    const registration = getQueryParam('reg');
    if (!registration) {
      alert('No aircraft registration provided.');
      window.location.href = 'index.html';
      return;
    }

    const aircraft = data.getAircraftByRegistration(registration);
    if (!aircraft) {
      alert('Aircraft not found.');
      window.location.href = 'index.html';
      return;
    }

    const allDefects = data.workflowState.defects || [];
    const aircraftDefects = allDefects.filter(d => d.aircraft === registration);

    renderAircraftHeader(aircraft);
    renderActiveMels(aircraftDefects);
    renderRequiredParts(aircraftDefects);
    renderRecentActivity(aircraftDefects);
  }

  return {
    init
  };
});
