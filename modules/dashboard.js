(function(root, factory) {
  const api = factory(root);
  root.ADCMSDashboard = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  const aircraft = data.aircraft || [];

  function renderAircraftGrid(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = aircraft.map(a => `
      <article class="aircraft-card">
        <header><div><h4>${a.reg}</h4><small>${a.type}</small></div><span class="tag ${a.cls}">${a.status}</span></header>
        <div class="plane">✈</div>
        <div class="stats"><div><small>Open Defects</small><b>${a.open}</b></div><div><small>MEL Items</small><b>${a.mel}</b></div></div>
        <div class="meta"><div><small>Location</small><b>⌖ ${a.loc}</b></div><div><small>Last Update</small><span>${a.update}</span></div></div>
      </article>
    `).join('');
  }

  function refreshCounters() {
    if (typeof document === 'undefined') return;
    const defects = (data.workflowState.defects || []).filter(Boolean);
    const openCount = defects.filter(defect => defect.status === 'Open').length;
    const closedCount = defects.filter(defect => defect.status === 'Closed').length;
    const sourceCount = defects.filter(defect => Boolean(defect.defectSource || defect.severity)).length;
    const openEl = document.getElementById('counterOpenDefects');
    const completedEl = document.getElementById('counterCompletedToday');
    const aogEl = document.getElementById('counterAogDefects');
    const badgeEl = document.getElementById('defectCountBadge');
    const breakdownListEl = document.getElementById('sourceBreakdownList');
    const sourceTotalEl = document.getElementById('sourceTotalCount');
    if (openEl) openEl.textContent = String(openCount);
    if (completedEl) completedEl.textContent = String(closedCount);
    if (aogEl) aogEl.textContent = String(sourceCount);
    if (badgeEl) badgeEl.textContent = `${openCount} open`;
    if (sourceTotalEl) sourceTotalEl.textContent = String(defects.length);
    const sourceOptions = ['ECAM Message', 'Failure Message', 'Captain Entry', 'Crew Observation', 'Maintenance Observation', 'Cabin Defect'];
    const sourceColors = ['red-dot', 'orange-dot', 'yellow-dot', 'green-dot', 'red-dot', 'blue-dot'];
    if (breakdownListEl) {
      breakdownListEl.innerHTML = sourceOptions.map((source, index) => {
        const count = defects.filter(defect => (defect.defectSource || defect.severity || '') === source).length;
        return `<li><i class="d ${sourceColors[index]}"></i>${source} <b>${count}</b></li>`;
      }).join('');
    }
  }

  function bindSearch(inputId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = aircraft.filter(a => Object.values(a).join(' ').toLowerCase().includes(q));
      const grid = document.getElementById('aircraftGrid');
      if (!grid) return;
      grid.innerHTML = filtered.map(a => `
        <article class="aircraft-card">
          <header><div><h4>${a.reg}</h4><small>${a.type}</small></div><span class="tag ${a.cls}">${a.status}</span></header>
          <div class="plane">✈</div>
          <div class="stats"><div><small>Open Defects</small><b>${a.open}</b></div><div><small>MEL Items</small><b>${a.mel}</b></div></div>
          <div class="meta"><div><small>Location</small><b>⌖ ${a.loc}</b></div><div><small>Last Update</small><span>${a.update}</span></div></div>
        </article>
      `).join('');
    });
  }

  function init() {
    renderAircraftGrid('aircraftGrid');
    bindSearch('search');
    refreshCounters();
  }

  return { init, renderAircraftGrid, refreshCounters };
});
