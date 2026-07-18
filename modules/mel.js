(function(root, factory) {
  const api = factory(root);
  root.ADCMSMEL = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  function calculateDaysRemaining(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  function getStatusClass(daysRemaining) {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining === 0) return 'critical';
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'warning';
    return 'safe';
  }

  function getCountdownText(daysRemaining) {
    if (daysRemaining < 0) {
      return `EXPIRED (${Math.abs(daysRemaining)} days ago)`;
    }
    if (daysRemaining === 0) {
      return 'EXPIRES TODAY';
    }
    if (daysRemaining === 1) {
      return '1 day remaining';
    }
    return `${daysRemaining} days remaining`;
  }

  function getCategoryBadge(category) {
    const badges = {
      A: '<span class="mel-badge badge-category-a">Cat A</span>',
      B: '<span class="mel-badge badge-category-b">Cat B</span>',
      C: '<span class="mel-badge badge-category-c">Cat C</span>',
      D: '<span class="mel-badge badge-category-d">Cat D</span>'
    };
    return badges[category] || '';
  }

  function getStatusBadge(status) {
    const badges = {
      'Open': '<span class="mel-badge badge-status-open">OPEN</span>',
      'Closed': '<span class="mel-badge badge-status-closed">CLOSED</span>'
    };
    return badges[status] || '';
  }

  function renderMelStats() {
    const statsContainer = document.getElementById('melStats');
    if (!statsContainer) return;

    const allDefects = (data.workflowState.defects || []).filter(d => d.isMel);
    
    const stats = {
      total: allDefects.length,
      expired: allDefects.filter(d => calculateDaysRemaining(d.melExpiry) < 0).length,
      critical: allDefects.filter(d => {
        const days = calculateDaysRemaining(d.melExpiry);
        return days >= 0 && days <= 1;
      }).length,
      warning: allDefects.filter(d => {
        const days = calculateDaysRemaining(d.melExpiry);
        return days > 1 && days <= 3;
      }).length,
      safe: allDefects.filter(d => {
        const days = calculateDaysRemaining(d.melExpiry);
        return days > 3;
      }).length
    };

    statsContainer.innerHTML = `
      <div class="mel-stat-card">
        <h4>Total MEL Items</h4>
        <div class="value">${stats.total}</div>
      </div>
      <div class="mel-stat-card expired">
        <h4>Expired</h4>
        <div class="value">${stats.expired}</div>
      </div>
      <div class="mel-stat-card critical">
        <h4>Critical (≤1 day)</h4>
        <div class="value">${stats.critical}</div>
      </div>
      <div class="mel-stat-card warning">
        <h4>Warning (2-3 days)</h4>
        <div class="value">${stats.warning}</div>
      </div>
      <div class="mel-stat-card safe">
        <h4>Safe (>3 days)</h4>
        <div class="value">${stats.safe}</div>
      </div>
    `;
  }

  function renderMelTable() {
    const container = document.getElementById('melTableContainer');
    const badge = document.getElementById('melCountBadge');
    
    if (!container) return;

    const allDefects = (data.workflowState.defects || []).filter(d => d.isMel);
    
    if (badge) {
      badge.textContent = `${allDefects.length} items`;
    }

    if (allDefects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No MEL items recorded yet.</p>
          <p style="font-size: 12px; margin-top: 10px;">Create a new defect and mark it as MEL to get started.</p>
        </div>
      `;
      return;
    }

    const rows = allDefects.map(defect => {
      const daysRemaining = calculateDaysRemaining(defect.melExpiry);
      const statusClass = getStatusClass(daysRemaining);
      const countdownText = getCountdownText(daysRemaining);
      
      return `
        <tr class="mel-row-${statusClass}">
          <td><strong>${defect.aircraft}</strong></td>
          <td>${defect.issue}</td>
          <td>${getCategoryBadge(defect.melCategory)}</td>
          <td>${defect.reportDate}</td>
          <td>${defect.melExpiry}</td>
          <td>
            <span class="countdown countdown-${statusClass}">
              ${countdownText}
            </span>
          </td>
          <td>
            ${defect.hasExtension ? `
              <span class="mel-badge" style="background-color: #9c27b0; color: white;">
                ${defect.extensionType === 'first' ? '1st Ext.' : '2nd Ext.'}
              </span>
            ` : '-'}
          </td>
          <td>${defect.melExpiryExtended ? defect.melExpiryExtended : '-'}</td>
          <td>${getStatusBadge(defect.status)}</td>
          <td>
            <div class="mel-actions">
              <button onclick="ADCMSMEL.editDefect('${defect.id}')">Edit</button>
              <button class="delete" onclick="ADCMSMEL.deleteDefect('${defect.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table class="mel-table">
        <thead>
          <tr>
            <th>Aircraft</th>
            <th>Issue</th>
            <th>Category</th>
            <th>Report Date</th>
            <th>Expiry Date</th>
            <th>Time Remaining</th>
            <th>Extension</th>
            <th>Extended Expiry</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function editDefect(defectId) {
    alert('Edit functionality will be implemented soon.\nDefect ID: ' + defectId);
  }

  function deleteDefect(defectId) {
    if (confirm('Are you sure you want to delete this MEL item?')) {
      data.workflowState.defects = (data.workflowState.defects || []).filter(d => d.id !== defectId);
      data.persistState();
      renderMelStats();
      renderMelTable();
    }
  }

  function init() {
    renderMelStats();
    renderMelTable();
  }

  return {
    init,
    renderMelTable,
    renderMelStats,
    editDefect,
    deleteDefect,
    calculateDaysRemaining,
    getStatusClass
  };
});
