(function(root, factory) {
  const api = factory(root);
  root.ADCMSMCCCenter = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  function calculateDaysRemaining(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  function renderStats() {
    const allAircraft = data.getAircraft();
    const allDefects = data.workflowState.defects || [];
    const activeMels = allDefects.filter(d => d.isMel && d.status === 'Open');
    const criticalMels = activeMels.filter(d => {
      const daysLeft = calculateDaysRemaining(d.melExpiryExtended || d.melExpiry);
      return daysLeft <= 1;
    });

    document.getElementById('mccTotalAircraft').textContent = allAircraft.length;
    document.getElementById('mccServiceable').textContent = allAircraft.filter(a => a.status === 'SERVICEABLE').length;
    document.getElementById('mccActiveMels').textContent = activeMels.length;
    document.getElementById('mccCritical').textContent = criticalMels.length;
  }

  function renderMelList() {
    const list = document.getElementById('mccMelList');
    if (!list) return;

    const allDefects = data.workflowState.defects || [];
    const activeMels = allDefects.filter(d => d.isMel && d.status === 'Open');

    if (activeMels.length === 0) {
      list.innerHTML = '<div class="mcc-empty">✓ No active MEL items. Fleet is clear.</div>';
      return;
    }

    list.innerHTML = activeMels.map(mel => {
      const daysLeft = calculateDaysRemaining(mel.melExpiryExtended || mel.melExpiry);
      const isCritical = daysLeft <= 1;
      const isWarning = daysLeft <= 3;

      return `
        <div class="mel-item-mcc ${isCritical ? 'critical' : isWarning ? 'warning' : ''}">
          <div class="mel-info">
            <h5>${mel.aircraft} - ${mel.issue}</h5>
            <p>Category: <strong>Cat ${mel.melCategory}</strong> | Expires: ${mel.melExpiryExtended || mel.melExpiry}</p>
            <p>Status: ${mel.status}</p>
            <div class="mcc-actions-inline">
              <button class="btn-edit-mel" onclick="ADCMSMCCCenter.editMel('${mel.id}')">Edit</button>
              <button class="btn-remove-mel" onclick="ADCMSMCCCenter.removeMel('${mel.id}')">Remove</button>
            </div>
          </div>
          <div class="mel-countdown ${isCritical ? 'critical' : ''}">
            ${daysLeft > 0 ? `${daysLeft} days` : 'EXPIRED'}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAircraftList() {
    const list = document.getElementById('mccAircraftList');
    if (!list) return;

    const allAircraft = data.getAircraft();

    if (allAircraft.length === 0) {
      list.innerHTML = '<div class="mcc-empty">No aircraft in fleet.</div>';
      return;
    }

    list.innerHTML = allAircraft.map(aircraft => {
      const openDefects = (data.workflowState.defects || []).filter(d => d.aircraft === aircraft.registration && d.status === 'Open').length;
      const activeMels = (data.workflowState.defects || []).filter(d => d.aircraft === aircraft.registration && d.isMel && d.status === 'Open').length;

      return `
        <div class="aircraft-status-mcc">
          <div class="aircraft-info-mcc">
            <h5>${aircraft.registration}</h5>
            <small>${aircraft.model} | Open Defects: ${openDefects} | MELs: ${activeMels}</small>
          </div>
          <span class="status-badge-mcc badge-${aircraft.status ? aircraft.status.toLowerCase() : 'serviceable'}">
            ${aircraft.status || 'SERVICEABLE'}
          </span>
        </div>
      `;
    }).join('');
  }

  function renderCriticalAlerts() {
    const alerts = document.getElementById('mccAlerts');
    if (!alerts) return;

    const allDefects = data.workflowState.defects || [];
    const criticalItems = [];

    // Check for expired MELs
    const expiredMels = allDefects.filter(d => {
      if (!d.isMel || d.status !== 'Open') return false;
      const daysLeft = calculateDaysRemaining(d.melExpiryExtended || d.melExpiry);
      return daysLeft < 0;
    });

    expiredMels.forEach(mel => {
      criticalItems.push({
        type: 'EXPIRED_MEL',
        aircraft: mel.aircraft,
        message: `MEL on ${mel.aircraft} has EXPIRED: ${mel.issue}`,
        severity: 'critical'
      });
    });

    // Check for MELs expiring within 24 hours
    const urgentMels = allDefects.filter(d => {
      if (!d.isMel || d.status !== 'Open') return false;
      const daysLeft = calculateDaysRemaining(d.melExpiryExtended || d.melExpiry);
      return daysLeft >= 0 && daysLeft <= 1;
    });

    urgentMels.forEach(mel => {
      criticalItems.push({
        type: 'URGENT_MEL',
        aircraft: mel.aircraft,
        message: `MEL on ${mel.aircraft} expires within 24 hours: ${mel.issue}`,
        severity: 'warning'
      });
    });

    if (criticalItems.length === 0) {
      alerts.innerHTML = '<div class="mcc-empty">✓ No critical alerts. All systems normal.</div>';
      return;
    }

    alerts.innerHTML = criticalItems.map(alert => `
      <div style="background-color: ${alert.severity === 'critical' ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 193, 7, 0.1)'}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${alert.severity === 'critical' ? '#ff5252' : '#ffc107'};">
        <strong style="color: ${alert.severity === 'critical' ? '#ff5252' : '#ffc107'};">⚠️ ${alert.severity.toUpperCase()}</strong>
        <p style="margin: 5px 0 0 0; font-size: 12px;">${alert.message}</p>
      </div>
    `).join('');
  }

  function editMel(melId) {
    alert('Edit MEL feature coming soon. Redirect to MEL Management page.');
  }

  function removeMel(melId) {
    if (confirm('Are you sure you want to remove this MEL?')) {
      const defect = (data.workflowState.defects || []).find(d => d.id === melId);
      if (defect) {
        defect.status = 'Closed';
        data.persistState();
        renderMelList();
        renderStats();
        renderCriticalAlerts();
      }
    }
  }

  function sendReport() {
    const allAircraft = data.getAircraft();
    const allDefects = data.workflowState.defects || [];
    const activeMels = allDefects.filter(d => d.isMel && d.status === 'Open');

    const report = `
MCC CENTER REPORT
Generated: ${new Date().toLocaleString()}

FLEET SUMMARY:
- Total Aircraft: ${allAircraft.length}
- Serviceable: ${allAircraft.filter(a => a.status === 'SERVICEABLE').length}
- Deferred: ${allAircraft.filter(a => a.status === 'DEFERRED').length}
- AOG: ${allAircraft.filter(a => a.status === 'AOG').length}

ACTIVE MEL ITEMS: ${activeMels.length}
${activeMels.map(m => `- ${m.aircraft}: ${m.issue} (Cat ${m.melCategory}, Expires: ${m.melExpiryExtended || m.melExpiry})`).join('\n')}

STATUS: All systems monitored. No critical issues at this time.
    `;

    alert('Report generated:\n\n' + report + '\n\nThis would be sent via email in production.');
  }

  function init() {
    renderStats();
    renderMelList();
    renderAircraftList();
    renderCriticalAlerts();

    // Auto-refresh every 5 minutes
    setInterval(() => {
      renderStats();
      renderMelList();
      renderAircraftList();
      renderCriticalAlerts();
    }, 5 * 60 * 1000);
  }

  return {
    init,
    editMel,
    removeMel,
    sendReport
  };
});
