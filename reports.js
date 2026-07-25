(function(root, factory) {
  const api = factory(root);
  root.ADCMSReports = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  let charts = {};

  function renderSummaryCards() {
    const grid = document.getElementById('summaryGrid');
    if (!grid) return;

    const allDefects = data.workflowState.defects || [];
    const allAircraft = data.getAircraft();

    const stats = {
      totalAircraft: allAircraft.length,
      openDefects: allDefects.filter(d => d.status === 'Open').length,
      closedDefects: allDefects.filter(d => d.status === 'Closed').length,
      activeMels: allDefects.filter(d => d.isMel && d.status === 'Open').length,
      safaFindings: allDefects.filter(d => d.safaFinding && d.status === 'Open').length,
      awaitingParts: allDefects.filter(d => d.sparePartsStatus === 'waiting').length
    };

    grid.innerHTML = `
      <div class="summary-card">
        <h4>Total Aircraft</h4>
        <div class="value">${stats.totalAircraft}</div>
      </div>
      <div class="summary-card critical">
        <h4>Open Defects</h4>
        <div class="value">${stats.openDefects}</div>
      </div>
      <div class="summary-card success">
        <h4>Closed Defects</h4>
        <div class="value">${stats.closedDefects}</div>
      </div>
      <div class="summary-card warning">
        <h4>Active MEL Items</h4>
        <div class="value">${stats.activeMels}</div>
      </div>
      <div class="summary-card warning">
        <h4>SAFA Findings</h4>
        <div class="value">${stats.safaFindings}</div>
      </div>
      <div class="summary-card critical">
        <h4>Awaiting Parts</h4>
        <div class="value">${stats.awaitingParts}</div>
      </div>
    `;
  }

  function renderFleetStatusChart() {
    const ctx = document.getElementById('fleetStatusChart');
    if (!ctx) return;

    const allAircraft = data.getAircraft();
    const statuses = {};
    allAircraft.forEach(a => {
      const status = a.status || 'Serviceable';
      statuses[status] = (statuses[status] || 0) + 1;
    });

    if (charts.fleetStatus) charts.fleetStatus.destroy();

    charts.fleetStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statuses),
        datasets: [{
          data: Object.values(statuses),
          backgroundColor: ['#4caf50', '#ff9800', '#ff5252', '#2196f3'],
          borderColor: 'var(--bg-secondary)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  function renderMelCategoryChart() {
    const ctx = document.getElementById('melCategoryChart');
    if (!ctx) return;

    const allDefects = data.workflowState.defects || [];
    const mels = allDefects.filter(d => d.isMel);
    const categories = { A: 0, B: 0, C: 0, D: 0 };

    mels.forEach(m => {
      if (m.melCategory && categories.hasOwnProperty(m.melCategory)) {
        categories[m.melCategory]++;
      }
    });

    if (charts.melCategory) charts.melCategory.destroy();

    charts.melCategory = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Category A', 'Category B', 'Category C', 'Category D'],
        datasets: [{
          label: 'MEL Items',
          data: [categories.A, categories.B, categories.C, categories.D],
          backgroundColor: ['#ff5252', '#ff9800', '#ffc107', '#4caf50'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderDefectSourceChart() {
    const ctx = document.getElementById('defectSourceChart');
    if (!ctx) return;

    const allDefects = data.workflowState.defects || [];
    const sources = {};

    allDefects.forEach(d => {
      const source = d.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });

    if (charts.defectSource) charts.defectSource.destroy();

    charts.defectSource = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(sources),
        datasets: [{
          data: Object.values(sources),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#ff5252', '#9c27b0'],
          borderColor: 'var(--bg-secondary)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function renderSparePartsChart() {
    const ctx = document.getElementById('sparePartsChart');
    if (!ctx) return;

    const allDefects = data.workflowState.defects || [];
    const statuses = {
      'Not Required': allDefects.filter(d => !d.sparePartsStatus || d.sparePartsStatus === 'no').length,
      'Waiting': allDefects.filter(d => d.sparePartsStatus === 'waiting').length,
      'Ordered': allDefects.filter(d => d.sparePartsStatus === 'ordered').length,
      'Received': allDefects.filter(d => d.sparePartsStatus === 'received').length
    };

    if (charts.spareParts) charts.spareParts.destroy();

    charts.spareParts = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(statuses),
        datasets: [{
          label: 'Count',
          data: Object.values(statuses),
          backgroundColor: ['#9e9e9e', '#ff9800', '#2196f3', '#4caf50'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderMelTable() {
    const tbody = document.getElementById('melTableBody');
    if (!tbody) return;

    const allDefects = data.workflowState.defects || [];
    const mels = allDefects.filter(d => d.isMel && d.status === 'Open');

    tbody.innerHTML = mels.map(m => `
      <tr>
        <td><strong>${m.aircraft}</strong></td>
        <td>${m.issue}</td>
        <td><span class="mel-badge badge-category-${m.melCategory.toLowerCase()}">Cat ${m.melCategory}</span></td>
        <td>${m.melExpiryExtended || m.melExpiry}</td>
        <td><span class="status-indicator status-open"></span> Open</td>
      </tr>
    `).join('');

    if (mels.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">No active MEL items</td></tr>';
    }
  }

  function renderDefectsTable() {
    const tbody = document.getElementById('defectsTableBody');
    if (!tbody) return;

    const allDefects = data.workflowState.defects || [];
    const openDefects = allDefects.filter(d => d.status === 'Open').slice(0, 10);

    tbody.innerHTML = openDefects.map(d => `
      <tr>
        <td><strong>${d.aircraft}</strong></td>
        <td>${d.issue}</td>
        <td>${d.source}</td>
        <td>${d.reportDate}</td>
        <td><span class="status-indicator status-open"></span> ${d.status}</td>
      </tr>
    `).join('');

    if (openDefects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">No open defects</td></tr>';
    }
  }

  function generatePDF() {
    alert('PDF generation feature will be available soon. This will export all charts and tables to a professional PDF report.');
  }

  function init() {
    renderSummaryCards();
    renderFleetStatusChart();
    renderMelCategoryChart();
    renderDefectSourceChart();
    renderSparePartsChart();
    renderMelTable();
    renderDefectsTable();
  }

  return {
    init,
    generatePDF
  };
});
