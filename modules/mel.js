(function(root, factory) {
  const api = factory(root);
  root.ADCMSMEL = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  function calculateDaysRemaining(expiryDate) {
    if (!expiryDate) return 999;
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
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'warning';
    return 'safe';
  }

  function getCountdownText(daysRemaining) {
    if (daysRemaining < 0) return `EXPIRED (${Math.abs(daysRemaining)} days ago)`;
    if (daysRemaining === 0) return 'EXPIRES TODAY';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  }

  function getCategoryBadge(category) {
    const badges = {
      A: '<span class="mel-badge badge-category-a">Cat A</span>',
      B: '<span class="mel-badge badge-category-b">Cat B</span>',
      C: '<span class="mel-badge badge-category-c">Cat C</span>',
      D: '<span class="mel-badge badge-category-d">Cat D</span>'
    };
    return badges[category] || `<span class="mel-badge">${category || 'N/A'}</span>`;
  }

  function getStatusBadge(status) {
    const badges = {
      'open': '<span class="mel-badge badge-status-open">OPEN</span>',
      'closed': '<span class="mel-badge badge-status-closed">CLOSED</span>'
    };
    const s = (status || 'open').toLowerCase();
    return badges[s] || `<span class="mel-badge">${s}</span>`;
  }

  async function renderMelStats() {
    const statsContainer = document.getElementById('melStats');
    if (!statsContainer) return;

    try {
      const allMels = await data.getMELs();
      
      const stats = {
        total: allMels.length,
        expired: allMels.filter(d => calculateDaysRemaining(d.melExpiry) < 0).length,
        critical: allMels.filter(d => {
          const days = calculateDaysRemaining(d.melExpiry);
          return days >= 0 && days <= 1;
        }).length,
        warning: allMels.filter(d => {
          const days = calculateDaysRemaining(d.melExpiry);
          return days > 1 && days <= 3;
        }).length,
        safe: allMels.filter(d => calculateDaysRemaining(d.melExpiry) > 3).length
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
    } catch (error) {
      console.error('Error rendering MEL stats:', error);
    }
  }

  async function renderMelTable() {
    const container = document.getElementById('melTableContainer');
    const badge = document.getElementById('melCountBadge');
    
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading MEL data...</p>';

    try {
      const allMels = await data.getMELs();
      
      if (badge) {
        badge.textContent = `${allMels.length} items`;
      }

      if (allMels.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No MEL items recorded yet.</p>
            <p style="font-size: 12px; margin-top: 10px;">Create a new defect and mark it as MEL to get started.</p>
          </div>
        `;
        return;
      }

      const rows = allMels.map(defect => {
        const daysRemaining = calculateDaysRemaining(defect.melExpiry);
        const statusClass = getStatusClass(daysRemaining);
        const countdownText = getCountdownText(daysRemaining);
        
        return `
          <tr class="mel-row-${statusClass}">
            <td><strong>${defect.aircraft}</strong></td>
            <td>${defect.issue}</td>
            <td>${getCategoryBadge(defect.melCategory)}</td>
            <td>${new Date(defect.reportedAt).toLocaleDateString()}</td>
            <td>${new Date(defect.melExpiry).toLocaleDateString()}</td>
            <td>
              <span class="countdown countdown-${statusClass}">
                ${countdownText}
              </span>
            </td>
            <td>-</td>
            <td>-</td>
            <td>${getStatusBadge(defect.status)}</td>
            <td>
              <div class="mel-actions">
                <button onclick="ADCMSMEL.deleteDefect('${defect.id}')" style="background: var(--danger); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
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
    } catch (error) {
      console.error('Error rendering MEL table:', error);
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--danger);">Failed to load MEL data.</p>';
    }
  }

  async function deleteDefect(defectId) {
    if (confirm('Are you sure you want to delete this MEL item?')) {
      try {
        await data.updateDefect(defectId, { isMEL: false });
        await init();
      } catch (error) {
        alert('Failed to delete MEL item');
      }
    }
  }

  async function init() {
    await renderMelStats();
    await renderMelTable();
  }

  return {
    init,
    renderMelTable,
    renderMelStats,
    deleteDefect,
    calculateDaysRemaining,
    getStatusClass
  };
});
