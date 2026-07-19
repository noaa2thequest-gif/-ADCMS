(function(root, factory) {
  const api = factory(root);
  root.ADCMSMCCCenter = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  function calculateDaysRemaining(expiryDate) {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  async function renderStats() {
    try {
      const allAircraft = await data.getAircraft();
      const allDefects = await data.getDefects();
      const activeMels = allDefects.filter(d => d.isMEL && (d.status === 'Open' || d.status === 'open'));
      const criticalMels = activeMels.filter(d => {
        const daysLeft = calculateDaysRemaining(d.melExpiry);
        return daysLeft <= 1;
      });

      const els = {
        total: document.getElementById('mccTotalAircraft'),
        serviceable: document.getElementById('mccServiceable'),
        mels: document.getElementById('mccActiveMels'),
        critical: document.getElementById('mccCritical')
      };

      if (els.total) els.total.textContent = allAircraft.length;
      if (els.serviceable) els.serviceable.textContent = allAircraft.filter(a => a.status === 'SERVICEABLE' || a.status === 'serviceable').length;
      if (els.mels) els.mels.textContent = activeMels.length;
      if (els.critical) els.critical.textContent = criticalMels.length;
    } catch (error) {
      console.error('Error rendering MCC stats:', error);
    }
  }

  async function renderMelList() {
    const list = document.getElementById('mccMelList');
    if (!list) return;

    try {
      const allDefects = await data.getDefects();
      const activeMels = allDefects.filter(d => d.isMEL && (d.status === 'Open' || d.status === 'open'));

      if (activeMels.length === 0) {
        list.innerHTML = '<div class="mcc-empty">✓ No active MEL items. Fleet is clear.</div>';
        return;
      }

      list.innerHTML = activeMels.map(mel => {
        const daysLeft = calculateDaysRemaining(mel.melExpiry);
        const isCritical = daysLeft <= 1;
        const isWarning = daysLeft <= 3;

        return `
          <div class="mel-item-mcc ${isCritical ? 'critical' : isWarning ? 'warning' : ''}">
            <div class="mel-info">
              <h5>${mel.aircraft} - ${mel.issue}</h5>
              <p>Category: <strong>Cat ${mel.melCategory || 'N/A'}</strong> | Expires: ${new Date(mel.melExpiry).toLocaleDateString()}</p>
              <p>Status: ${mel.status}</p>
              <div class="mcc-actions-inline">
                <button class="btn-edit-mel" onclick="window.location.href='mel.html'">Manage</button>
                <button class="btn-remove-mel" onclick="ADCMSMCCCenter.removeMel('${mel.id}')">Close</button>
              </div>
            </div>
            <div class="mel-countdown ${isCritical ? 'critical' : ''}">
              ${daysLeft > 0 ? `${daysLeft} days` : 'EXPIRED'}
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering MEL list:', error);
    }
  }

  async function renderAircraftList() {
    const list = document.getElementById('mccAircraftList');
    if (!list) return;

    try {
      const allAircraft = await data.getAircraft();
      const allDefects = await data.getDefects();

      if (allAircraft.length === 0) {
        list.innerHTML = '<div class="mcc-empty">No aircraft in fleet.</div>';
        return;
      }

      list.innerHTML = allAircraft.map(aircraft => {
        const openDefects = allDefects.filter(d => d.aircraft === aircraft.registration && (d.status === 'Open' || d.status === 'open')).length;
        const activeMels = allDefects.filter(d => d.aircraft === aircraft.registration && d.isMEL && (d.status === 'Open' || d.status === 'open')).length;

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
    } catch (error) {
      console.error('Error rendering aircraft list:', error);
    }
  }

  async function renderCriticalAlerts() {
    const alerts = document.getElementById('mccAlerts');
    if (!alerts) return;

    try {
      const allDefects = await data.getDefects();
      const criticalItems = [];

      // Check for expired MELs
      const expiredMels = allDefects.filter(d => {
        if (!d.isMEL || (d.status !== 'Open' && d.status !== 'open')) return false;
        const daysLeft = calculateDaysRemaining(d.melExpiry);
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
        if (!d.isMEL || (d.status !== 'Open' && d.status !== 'open')) return false;
        const daysLeft = calculateDaysRemaining(d.melExpiry);
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
    } catch (error) {
      console.error('Error rendering critical alerts:', error);
    }
  }

  async function removeMel(melId) {
    if (confirm('Are you sure you want to close this MEL?')) {
      try {
        await data.updateDefect(melId, { status: 'closed' });
        await init();
      } catch (error) {
        alert('Failed to close MEL');
      }
    }
  }

  async function init() {
    await renderStats();
    await renderMelList();
    await renderAircraftList();
    await renderCriticalAlerts();

    // Auto-refresh every 5 minutes
    setInterval(async () => {
      await renderStats();
      await renderMelList();
      await renderAircraftList();
      await renderCriticalAlerts();
    }, 5 * 60 * 1000);
  }

  return {
    init,
    removeMel
  };
});
