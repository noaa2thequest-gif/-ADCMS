(function(root, factory) {
  const api = factory(root);
  root.ADCMSCabin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

  async function renderCabinDefects() {
    const grid = document.getElementById('cabinDefectList');
    if (!grid) return;

    try {
      const defects = await data.getDefects();
      const cabinDefects = defects.filter(d => d.source === 'Cabin');
      const badge = document.getElementById('cabinDefectCount');
      if (badge) badge.textContent = `${cabinDefects.length} items`;

      if (!cabinDefects || cabinDefects.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px; grid-column: 1/-1;">No cabin defects found.</div>';
        return;
      }

      grid.innerHTML = cabinDefects.map(d => {
        const lastAction = d.maintenanceActionLog && d.maintenanceActionLog.length > 0 
          ? d.maintenanceActionLog[d.maintenanceActionLog.length - 1] 
          : null;

        return `
          <div class="cabin-defect-card" style="background: white; border-radius: 12px; border-left: 5px solid ${d.status === 'closed' ? '#10b981' : (d.isMEL ? '#f59e0b' : '#3b82f6')}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="padding: 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="margin: 0; font-size: 16px; color: #1e293b;">${d.aircraft}</h4>
                <small style="color: #64748b;">${d.issue}</small>
              </div>
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: ${d.status === 'closed' ? '#dcfce7' : (d.isMEL ? '#fef3c7' : '#dbeafe')}; color: ${d.status === 'closed' ? '#166534' : (d.isMEL ? '#92400e' : '#1e40af')};">
                ${d.status}
              </span>
            </div>
            <div style="padding: 15px;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;"><strong>Description:</strong> ${d.issue}</p>
              
              ${d.isMEL ? `<div style="background: #fffbeb; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #f59e0b; font-size: 12px;">
                <strong style="color: #92400e;">⚠️ MEL Status:</strong><br>
                Category: ${d.melCategory} | Reference: ${d.melReference}<br>
                Expires: ${d.melExpiry}
              </div>` : ''}
              
              <div style="background: #f1f5f9; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px;">
                <div style="margin-bottom: 5px;"><strong>Last Action:</strong> ${lastAction ? lastAction.action : 'No action taken yet'}</div>
                <div style="color: #94a3b8;">By ${lastAction ? lastAction.by : 'N/A'} on ${lastAction ? lastAction.date : 'N/A'}</div>
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${!d.isMEL ? `<button onclick="ADCMSCabin.convertToMEL('${d.id}')" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #f59e0b; color: white; font-size: 11px; font-weight: 600; cursor: pointer;">Convert to MEL</button>` : ''}
                ${d.status !== 'closed' ? `<button onclick="ADCMSCabin.openActionModal('${d.id}')" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #2563eb; color: white; font-size: 11px; font-weight: 600; cursor: pointer;">+ Add Action</button>` : ''}
                ${d.status !== 'closed' ? `<button onclick="ADCMSCabin.closeDefect('${d.id}')" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #10b981; color: white; font-size: 11px; font-weight: 600; cursor: pointer;">✓ Close</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error('Error rendering cabin defects:', e);
    }
  }

  function openAddModal() {
    const modal = document.getElementById('addCabinDefectModal');
    if (modal) {
      modal.style.display = 'flex';
      populateAircraftDropdown();
      document.getElementById('cabinAreaInput').value = '';
      document.getElementById('cabinIssueInput').value = '';
      document.getElementById('cabinIsMEL').value = 'false';
      document.getElementById('cabinMELFields').style.display = 'none';
    }
  }

  function toggleMELFields() {
    const isMEL = document.getElementById('cabinIsMEL').value === 'true';
    const container = document.getElementById('cabinMELFields');
    if (container) container.style.display = isMEL ? 'block' : 'none';
  }

  async function populateAircraftDropdown() {
    const select = document.getElementById('cabinAircraftSelect');
    if (!select) return;
    const aircrafts = await data.getAircraft();
    select.innerHTML = aircrafts.map(ac => `<option value="${ac.registration}">${ac.registration}</option>`).join('');
  }

  async function submitNewDefect() {
    const aircraft = document.getElementById('cabinAircraftSelect').value;
    const area = document.getElementById('cabinAreaInput').value;
    const issue = document.getElementById('cabinIssueInput').value;
    const isMEL = document.getElementById('cabinIsMEL').value === 'true';

    if (!aircraft || !issue) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    if (isMEL) {
      const category = document.getElementById('cabinMELCategory').value;
      const reference = document.getElementById('cabinMELReference').value.trim();
      const expiry = document.getElementById('cabinMELExpiry').value;
      if (!reference || !expiry) {
        showToast('Please fill in all MEL fields', 'error');
        return;
      }
    }

    const newDefect = {
      id: 'defect-' + Date.now(),
      aircraft: aircraft,
      issue: issue,
      defectSource: 'Cabin',
      source: 'Cabin',
      status: 'open',
      reportedAt: new Date().toISOString(),
      isMEL: isMEL,
      maintenanceActionLog: []
    };

    if (isMEL) {
      newDefect.melCategory = document.getElementById('cabinMELCategory').value;
      newDefect.melReference = document.getElementById('cabinMELReference').value;
      newDefect.melExpiry = document.getElementById('cabinMELExpiry').value;
    }

    const defects = await data.getDefects();
    defects.push(newDefect);
    data.persistState();
    renderCabinDefects();
    document.getElementById('addCabinDefectModal').style.display = 'none';
    showToast('✓ Cabin defect logged successfully!', 'success');
  }

  let currentEditingId = null;

  async function openActionModal(id) {
    currentEditingId = id;
    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      document.getElementById('cabinActionText').value = '';
      document.getElementById('cabinStatusSelect').value = d.status === 'open' ? 'Open' : 'Resolved';
      document.getElementById('cabinActionModal').style.display = 'flex';
    }
  }

  async function saveAction() {
    const text = document.getElementById('cabinActionText').value.trim();
    const status = document.getElementById('cabinStatusSelect').value;

    if (!text) {
      showToast('Please describe the action', 'error');
      return;
    }

    const defects = await data.getDefects();
    const d = defects.find(x => x.id === currentEditingId);
    if (d) {
      if (!d.maintenanceActionLog) d.maintenanceActionLog = [];
      d.maintenanceActionLog.push({
        action: text,
        by: 'Cabin Crew',
        date: new Date().toISOString().split('T')[0],
        nextAction: ''
      });
      d.status = status === 'Resolved' ? 'closed' : 'open';
      data.persistState();
      document.getElementById('cabinActionModal').style.display = 'none';
      renderCabinDefects();
      showToast('✓ Action logged successfully!', 'success');
    }
  }

  async function convertToMEL(id) {
    const category = prompt("Enter MEL Category (A, B, C, D):", "C");
    if (!category) return;
    const reference = prompt("Enter MEL Reference (e.g., MEL-25-11-01):", "MEL-");
    if (!reference) return;

    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      d.isMEL = true;
      d.melCategory = category;
      d.melReference = reference;
      d.melExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      data.persistState();
      renderCabinDefects();
      showToast('✓ Converted to MEL successfully!', 'success');
    }
  }

  async function closeDefect(id) {
    const confirmed = confirm('Are you sure you want to close this defect?');
    if (!confirmed) return;

    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      d.status = 'closed';
      d.closeDate = new Date().toISOString().split('T')[0];
      data.persistState();
      renderCabinDefects();
      showToast('✓ Defect closed successfully!', 'success');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6')};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideInUp 0.3s ease;
      font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function init() {
    renderCabinDefects();
    const saveBtn = document.getElementById('saveCabinAction');
    if (saveBtn) saveBtn.onclick = saveAction;
    
    data.onDataChange(() => {
      renderCabinDefects();
    });
  }

  return {
    init,
    openAddModal,
    toggleMELFields,
    submitNewDefect,
    openActionModal,
    closeDefect,
    convertToMEL
  };
});
