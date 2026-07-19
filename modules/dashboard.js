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
        const melCount = acDefects.filter(d => d.isMEL).length;
        
        let statusClass = ac.status.toLowerCase();
        if (openCount > 0 && statusClass === 'serviceable') statusClass = 'deferred';

        return `
          <article class="aircraft-card" onclick="window.location.href='aircraft-status.html?reg=${ac.registration}'">
            <header>
              <div><h4>${ac.registration}</h4><small>${ac.model}</small></div>
              <span class="tag ${statusClass}">${ac.status}</span>
            </header>
            <div class="plane">✈</div>
            <div class="stats">
              <div><small>Open Defects</small><b>${openCount}</b></div>
              <div><small>MEL Items</small><b>${melCount}</b></div>
            </div>
            <div class="meta">
              <div><small>Location</small><b>⌖ ${ac.location}</b></div>
              <div><small>Last Update</small><span>Just now</span></div>
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
      'counterTotalAircraft': fleet.length,
      'counterOpenDefects': defects.filter(d => d.status === 'open').length,
      'counterMelItems': defects.filter(d => d.isMEL).length,
      'counterAogDefects': fleet.filter(a => a.status === 'AOG').length,
      'counterCompletedToday': defects.filter(d => d.status === 'closed').length
    };

    for (const [id, val] of Object.entries(counters)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    
    const badge = document.getElementById('defectCountBadge');
    if (badge) badge.textContent = `${counters.counterOpenDefects} open`;
  }

  async function init() {
    await renderAircraftGrid('aircraftGrid');
    await refreshCounters();
  }

  return { init, renderAircraftGrid, refreshCounters };
});
