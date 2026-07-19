(function(root, factory) {
  const api = factory(root);
  root.ADCMSDashboard = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  async function renderAircraftGrid(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    // Show loading state
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">Loading fleet data...</p>';
    
    try {
      const aircraftList = await data.getAircraft() || [];
      
      if (aircraftList.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">No aircraft found. Add your first aircraft in Administration.</p>';
        return;
      }
      
      grid.innerHTML = aircraftList.map(a => `
        <article class="aircraft-card" style="cursor: pointer;" onclick="window.location.href='aircraft-status.html?reg=${a.registration}'">
          <header><div><h4>${a.registration}</h4><small>${a.model}</small></div><span class="tag ${a.status === 'SERVICEABLE' ? 'serviceable' : a.status === 'DEFERRED' ? 'deferred' : 'aog'}">${a.status}</span></header>
          <div class="plane">✈</div>
          <div class="stats"><div><small>Open Defects</small><b>${a.openDefects || 0}</b></div><div><small>MEL Items</small><b>${a.melItems || 0}</b></div></div>
          <div class="meta"><div><small>Location</small><b>⌖ ${a.location || 'CAI'}</b></div><div><small>Last Update</small><span>${a.lastUpdate || 'Just now'}</span></div></div>
        </article>
      `).join('');
    } catch (error) {
      console.error('Error rendering aircraft grid:', error);
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">Failed to load fleet data. Please refresh.</p>';
    }
  }

  async function refreshCounters() {
    if (typeof document === 'undefined') return;

    try {
      const aircraftList = await data.getAircraft();
      const defectsList = await data.getDefects();
      
      const openCount = defectsList.filter(d => d.status === 'open' || d.status === 'Open').length;
      const closedCount = defectsList.filter(d => d.status === 'closed' || d.status === 'Closed').length;
      const melCount = defectsList.filter(d => d.isMEL).length;
      const aogCount = aircraftList.filter(a => a.status === 'AOG').length;

      // Update KPI counters
      const totalAircraftEl = document.getElementById('counterTotalAircraft');
      const openDefectsEl = document.getElementById('counterOpenDefects');
      const melItemsEl = document.getElementById('counterMelItems');
      const aogEl = document.getElementById('counterAogDefects');
      const completedEl = document.getElementById('counterCompletedToday');
      const badgeEl = document.getElementById('defectCountBadge');

      if (totalAircraftEl) totalAircraftEl.textContent = String(aircraftList.length);
      if (openDefectsEl) openDefectsEl.textContent = String(openCount);
      if (melItemsEl) melItemsEl.textContent = String(melCount);
      if (aogEl) aogEl.textContent = String(aogCount);
      if (completedEl) completedEl.textContent = String(closedCount);
      if (badgeEl) badgeEl.textContent = `${openCount} open`;

      // Update defect sources breakdown
      updateDefectSources(defectsList);

      // Update fleet status bars
      updateFleetStatus(aircraftList);
    } catch (error) {
      console.error('Error refreshing counters:', error);
    }
  }

  function updateDefectSources(defects) {
    if (typeof document === 'undefined') return;

    const breakdownListEl = document.getElementById('sourceBreakdownList');
    const sourceTotalEl = document.getElementById('sourceTotalCount');

    const sources = [
      { source: 'AOG', color: 'red-dot', count: defects.filter(d => d.source === 'AOG').length },
      { source: 'High', color: 'orange-dot', count: defects.filter(d => d.source === 'High').length },
      { source: 'Medium', color: 'yellow-dot', count: defects.filter(d => d.source === 'Medium').length },
      { source: 'Low', color: 'green-dot', count: defects.filter(d => d.source === 'Low').length }
    ];

    if (sourceTotalEl) {
      sourceTotalEl.textContent = String(defects.length);
    }

    if (breakdownListEl) {
      breakdownListEl.innerHTML = sources
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

  function updateFleetStatus(aircraft) {
    if (typeof document === 'undefined' || !aircraft.length) return;

    const total = aircraft.length;
    const counts = {
      serviceable: aircraft.filter(a => a.status === 'SERVICEABLE' || a.status === 'serviceable').length,
      deferred: aircraft.filter(a => a.status === 'DEFERRED' || a.status === 'deferred').length,
      aog: aircraft.filter(a => a.status === 'AOG' || a.status === 'aog').length,
      maintenance: aircraft.filter(a => a.status === 'MAINTENANCE' || a.status === 'maintenance').length
    };

    const percentages = {
      serviceable: Math.round((counts.serviceable / total) * 100) || 0,
      deferred: Math.round((counts.deferred / total) * 100) || 0,
      aog: Math.round((counts.aog / total) * 100) || 0,
      maintenance: Math.round((counts.maintenance / total) * 100) || 0
    };

    const statusEls = {
      serviceable: document.getElementById('statusServiceable'),
      deferred: document.getElementById('statusDeferred'),
      aog: document.getElementById('statusAog'),
      maintenance: document.getElementById('statusMaintenance')
    };

    const barEls = {
      serviceable: document.getElementById('barServiceable'),
      deferred: document.getElementById('barDeferred'),
      aog: document.getElementById('barAog'),
      maintenance: document.getElementById('barMaintenance')
    };

    if (statusEls.serviceable) statusEls.serviceable.textContent = `${counts.serviceable} (${percentages.serviceable}%)`;
    if (statusEls.deferred) statusEls.deferred.textContent = `${counts.deferred} (${percentages.deferred}%)`;
    if (statusEls.aog) statusEls.aog.textContent = `${counts.aog} (${percentages.aog}%)`;
    if (statusEls.maintenance) statusEls.maintenance.textContent = `${counts.maintenance} (${percentages.maintenance}%)`;

    if (barEls.serviceable) barEls.serviceable.style.width = `${percentages.serviceable}%`;
    if (barEls.deferred) barEls.deferred.style.width = `${percentages.deferred}%`;
    if (barEls.aog) barEls.aog.style.width = `${percentages.aog}%`;
    if (barEls.maintenance) barEls.maintenance.style.width = `${percentages.maintenance}%`;
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

  async function init() {
    await renderAircraftGrid('aircraftGrid');
    await refreshCounters();
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
