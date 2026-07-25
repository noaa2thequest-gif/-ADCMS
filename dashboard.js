(function(root, factory) {
  const api = factory(root);
  root.ADCMSDashboard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

  async function renderAircraftGrid(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    try {
      const fleet = await data.getAircraft();
      const defects = await data.getDefects();
      
      grid.innerHTML = fleet.map(ac => {
        const acDefects = defects.filter(d => d.aircraft === ac.registration);
        const openCount = acDefects.filter(d => d.status === 'open').length;
        const melCount = acDefects.filter(d => d.isMEL && d.status !== 'closed').length;
        const cabinCount = acDefects.filter(d => d.source === 'Cabin' && d.status !== 'closed').length;
        const isAOG = acDefects.some(d => d.status === 'AOG');
        
        let statusClass = (ac.status || 'SERVICEABLE').toLowerCase();
        if (isAOG) statusClass = 'aog';
        else if (melCount > 0) statusClass = 'deferred';

        return `
          <article class="aircraft-card" onclick="window.location.href='aircraft-status.html?reg=${ac.registration}'">
            <div class="card-header">
              <h4>${ac.registration}</h4>
              <span class="tag ${statusClass}">${statusClass.toUpperCase()}</span>
            </div>
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">Defects</span>
                <span class="stat-value">${openCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">MEL</span>
                <span class="stat-value">${melCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Cabin</span>
                <span class="stat-value">${cabinCount}</span>
              </div>
            </div>
          </article>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
    }
  }

  async function refreshCounters() {
    const fleet = await data.getAircraft();
    const defects = await data.getDefects();

    const counters = {
      'totalAircraft': fleet.length,
      'aogRecovery': defects.filter(d => d.status === 'AOG').length,
      'melItems': defects.filter(d => d.isMEL && d.status !== 'closed').length,
      'fleetHealth': fleet.length > 0 ? Math.round(((fleet.length - defects.filter(d => d.status === 'AOG').length) / fleet.length) * 100) + '%' : '100%'
    };

    // Try both naming conventions for compatibility
    for (const [id, val] of Object.entries(counters)) {
      const el = document.getElementById(id) || document.getElementById('counter' + id.charAt(0).toUpperCase() + id.slice(1));
      if (el) el.textContent = val;
    }
  }

  async function init() {
    await renderAircraftGrid("aircraftGrid");
    await refreshCounters();
    data.onDataChange(async () => {
      await renderAircraftGrid("aircraftGrid");
      await refreshCounters();
    });
  }

  return { init, renderAircraftGrid, refreshCounters };
});
