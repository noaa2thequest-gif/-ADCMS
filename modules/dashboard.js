(function(root, factory) {
  const api = factory(root);
  root.ADCMSDashboard = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  const aircraft = data.aircraft || [];
  const defectSources = data.defectSources || [];
  const fleetStatus = data.fleetStatus || {};

  function renderAircraftGrid(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    const aircraftList = data.getAircraft();
    grid.innerHTML = aircraftList.map(a => `
      <article class="aircraft-card" style="cursor: pointer;" onclick="window.location.href='aircraft-status.html?reg=${a.registration}'">
        <header><div><h4>${a.registration}</h4><small>${a.model}</small></div><span class="tag ${a.status === 'SERVICEABLE' ? 'serviceable' : a.status === 'DEFERRED' ? 'deferred' : 'aog'}">${a.status}</span></header>
        <div class="plane">✈</div>
        <div class="stats"><div><small>Open Defects</small><b>${a.openDefects}</b></div><div><small>MEL Items</small><b>${a.melItems}</b></div></div>
        <div class="meta"><div><small>Location</small><b>⌖ ${a.location}</b></div><div><small>Last Update</small><span>${a.lastUpdate}</span></div></div>
      </article>
    `).join('');
  }

  function refreshCounters() {
    if (typeof document === 'undefined') return;

    const defects = (data.workflowState.defects || []).filter(Boolean);
    const openCount = defects.filter((defect) => defect.status === 'Open').length;
    const closedCount = defects.filter((defect) => defect.status === 'Closed').length;

    // Update KPI counters
    const totalAircraftEl = document.getElementById('counterTotalAircraft');
    const openDefectsEl = document.getElementById('counterOpenDefects');
    const melItemsEl = document.getElementById('counterMelItems');
    const aogEl = document.getElementById('counterAogDefects');
    const completedEl = document.getElementById('counterCompletedToday');
    const badgeEl = document.getElementById('defectCountBadge');

    if (totalAircraftEl) totalAircraftEl.textContent = String(data.getAircraft().length);
    const aircraftList = data.getAircraft();
    if (openDefectsEl) openDefectsEl.textContent = String(openCount);
    if (melItemsEl) melItemsEl.textContent = String(aircraftList.reduce((sum, a) => sum + (a.melItems || 0), 0));
    if (aogEl) aogEl.textContent = String(aircraftList.filter((a) => a.status === 'AOG').length);
    if (completedEl) completedEl.textContent = String(closedCount);
    if (badgeEl) badgeEl.textContent = `${openCount} open`;

    // Update defect sources breakdown
    updateDefectSources();

    // Update fleet status bars
    updateFleetStatus();
  }

  function updateDefectSources() {
    if (typeof document === 'undefined') return;

    const breakdownListEl = document.getElementById('sourceBreakdownList');
    const sourceTotalEl = document.getElementById('sourceTotalCount');

    if (sourceTotalEl) {
      const total = defectSources.reduce((sum, source) => sum + source.count, 0);
      sourceTotalEl.textContent = String(total);
    }

    if (breakdownListEl) {
      breakdownListEl.innerHTML = defectSources
        .map(
          (source) => `
        <li>
          <i class="d ${source.color}"></i>
          ${source.source}
          <b>${source.count}</b>
        </li>
      `
        )
        .join('');
    }
  }

  function updateFleetStatus() {
    if (typeof document === 'undefined') return;

    const statusServiceableEl = document.getElementById('statusServiceable');
    const statusDeferredEl = document.getElementById('statusDeferred');
    const statusAogEl = document.getElementById('statusAog');
    const statusMaintenanceEl = document.getElementById('statusMaintenance');

    const barServiceableEl = document.getElementById('barServiceable');
    const barDeferredEl = document.getElementById('barDeferred');
    const barAogEl = document.getElementById('barAog');
    const barMaintenanceEl = document.getElementById('barMaintenance');

    if (statusServiceableEl)
      statusServiceableEl.textContent = `${fleetStatus.serviceable.count} (${fleetStatus.serviceable.percentage}%)`;
    if (statusDeferredEl)
      statusDeferredEl.textContent = `${fleetStatus.deferred.count} (${fleetStatus.deferred.percentage}%)`;
    if (statusAogEl) statusAogEl.textContent = `${fleetStatus.aog.count} (${fleetStatus.aog.percentage}%)`;
    if (statusMaintenanceEl)
      statusMaintenanceEl.textContent = `${fleetStatus.maintenance.count} (${fleetStatus.maintenance.percentage}%)`;

    if (barServiceableEl) barServiceableEl.style.width = `${fleetStatus.serviceable.percentage}%`;
    if (barDeferredEl) barDeferredEl.style.width = `${fleetStatus.deferred.percentage}%`;
    if (barAogEl) barAogEl.style.width = `${fleetStatus.aog.percentage}%`;
    if (barMaintenanceEl) barMaintenanceEl.style.width = `${fleetStatus.maintenance.percentage}%`;
  }

  function bindSearch(inputId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.aircraft-card');

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  function init() {
    renderAircraftGrid('aircraftGrid');
    refreshCounters();
    bindSearch('search');
  }

  return {
    init,
    renderAircraftGrid,
    refreshCounters,
    bindSearch,
    updateDefectSources,
    updateFleetStatus
  };
});
