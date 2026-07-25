(function(root, factory) {
  const api = factory(root);
  root.ADCMSAircraftStatus = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

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
            <p style="color: var(--muted); margin: 5px 0 20px 0;">${aircraft.model} | MSN: ${aircraft.msn || 'N/A'}</p>
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
            <span>${aircraft.manufacturingDate || 'N/A'}</span>
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
    const mels = defects.filter(d => d.isMEL && d.status !== 'closed');
    
    if (count) count.textContent = mels.length;
    if (!list) return;

    if (mels.length === 0) {
      list.innerHTML = '<p style="color: var(--muted); font-size: 13px;">No active MEL items.</p>';
      return;
    }

    list.innerHTML = mels.map(mel => `
      <div class="mel-item-mini" style="border-left-color: ${mel.melCategory === 'B' ? '#ff9800' : (mel.melCategory === 'C' ? '#ffc107' : '#ff5252')}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <strong>${mel.issue}</strong>
          <span class="mel-badge badge-category-${mel.melCategory.toLowerCase()}">Cat ${mel.melCategory}</span>
        </div>
        <div style="font-size: 11px; margin-top: 5px; color: var(--muted);">
          Expires: ${mel.melExpiry}
        </div>
      </div>
    `).join('');
  }

  function renderRecentActivity(defects) {
    const list = document.getElementById('recentActivity');
    if (!list) return;

    let allActions = [];
    defects.forEach(d => {
      if (d.maintenanceActionLog && d.maintenanceActionLog.length > 0) {
        d.maintenanceActionLog.forEach(log => {
          allActions.push({ 
            defectIssue: d.issue,
            defectSource: d.defectSource,
            action: log.action,
            by: log.by,
            date: log.date,
            nextAction: log.nextAction
          });
        });
      }
    });

    allActions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = allActions.slice(0, 10);

    if (recent.length === 0) {
      list.innerHTML = '<p style="color: var(--muted); font-size: 13px;">No recent maintenance activity.</p>';
      return;
    }

    list.innerHTML = recent.map(a => `
      <div class="log-entry" style="margin-bottom: 15px; border-left: 3px solid var(--purple); padding-left: 15px;">
        <div class="log-header">
          <strong style="color: #1e293b;">${a.defectIssue}</strong>
          <span>${a.date} | ${a.by}</span>
        </div>
        <div class="log-action">
          <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-right: 5px;">Source: ${a.defectSource || 'N/A'}</span>
          ${a.action}
        </div>
        ${a.nextAction ? `<div class="log-next"><label>Next:</label>${a.nextAction}</div>` : ''}
      </div>
    `).join('');
  }

  function renderAllDefects(defects) {
    const list = document.getElementById('allDefectsList');
    const count = document.getElementById('allDefectsCount');
    if (!list) return;

    if (count) count.textContent = defects.length;

    if (defects.length === 0) {
      list.innerHTML = '<p style="color: var(--muted); font-size: 13px; padding: 20px; text-align: center;">No defects recorded for this aircraft.</p>';
      return;
    }

    list.innerHTML = defects.map(d => {
      const lastAction = d.maintenanceActionLog && d.maintenanceActionLog.length > 0 
        ? d.maintenanceActionLog[d.maintenanceActionLog.length - 1] 
        : null;
      
      return `
        <div style="background: white; padding: 16px; border-radius: 10px; border-left: 5px solid ${d.status === 'AOG' ? '#ef4444' : (d.status === 'closed' ? '#10b981' : '#f59e0b')}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0; font-size: 16px; color: #1e293b;">${d.issue}</h4>
              <small style="color: #64748b; display: block; margin-top: 4px;">Source: ${d.defectSource || 'N/A'}</small>
            </div>
            <span style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: ${d.status === 'open' ? '#fecaca' : (d.status === 'AOG' ? '#fee2e2' : '#dcfce7')}; color: ${d.status === 'open' ? '#991b1b' : (d.status === 'AOG' ? '#7f1d1d' : '#166534')};">${d.status.toUpperCase()}</span>
          </div>
          
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px;">
            <div style="margin-bottom: 8px;">
              <strong>Last Action:</strong> ${lastAction ? lastAction.action : 'Pending assessment...'}
              <br><small style="color: #94a3b8;">By ${lastAction ? lastAction.by : 'N/A'} on ${lastAction ? lastAction.date : 'N/A'}</small>
            </div>
            ${lastAction && lastAction.nextAction ? `<div style="color: #2563eb; background: #eff6ff; padding: 8px; border-radius: 4px;"><strong>Next Step:</strong> ${lastAction.nextAction}</div>` : ''}
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            ${d.status !== 'closed' ? `<button onclick="window.ADCMSWorkflow && window.ADCMSWorkflow.openActionModal('${d.id}')" style="background: #2563eb; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">+ Add Action</button>` : ''}
            ${d.status !== 'closed' ? `<button onclick="window.ADCMSWorkflow && window.ADCMSWorkflow.closeDefect('${d.id}')" style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">✓ Close</button>` : '<span style="color: #10b981; font-weight: bold;">✓ Closed</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  async function init() {
    const registration = getQueryParam('reg');
    if (!registration) {
      window.location.href = 'index.html';
      return;
    }

    const aircraft = await data.getAircraftByRegistration(registration);
    if (!aircraft) {
      window.location.href = 'index.html';
      return;
    }

    const refresh = async () => {
      const allDefects = await data.getDefects();
      const aircraftDefects = allDefects.filter(d => d.aircraft === registration);
      renderAircraftHeader(aircraft);
      renderActiveMels(aircraftDefects);
      renderRecentActivity(aircraftDefects);
      renderAllDefects(aircraftDefects);
    };

    await refresh();
    data.onDataChange(refresh);
  }

  return { init };
});
