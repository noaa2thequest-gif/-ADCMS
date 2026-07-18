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

  function bindSearch(inputId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = aircraft.filter(a => Object.values(a).join(' ').toLowerCase().includes(q));
      renderAircraftGrid('aircraftGrid');
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
  }

  return { init, renderAircraftGrid };
});
