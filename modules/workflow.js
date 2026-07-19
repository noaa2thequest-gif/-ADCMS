(function(root, factory) {
  const api = factory(root);
  root.ADCMSWorkflow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

  async function renderDefectControl() {
    const list = document.getElementById('defectControlList');
    if (!list) return;

    try {
      const defects = await data.getDefects();
      
      if (!defects || defects.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No open defects logged.</p>';
        return;
      }

      list.innerHTML = defects.map(d => `
        <article class="defect-control-item" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 6px solid ${d.source === 'AOG' ? '#ef4444' : '#f59e0b'}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 18px; color: #1e293b;">${d.aircraft} • ${d.issue}</strong>
            <span class="tag ${d.status === 'open' ? 'aog' : 'serviceable'}" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${d.status.toUpperCase()}</span>
          </div>
          
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="font-size: 13px; color: #475569; margin-bottom: 5px;"><strong>Action Taken:</strong> ${d.actionTaken || 'Pending initial assessment...'}</div>
            <div style="font-size: 13px; color: #2563eb;"><strong>Proposed Action:</strong> ${d.proposedAction || 'Await engineering feedback.'}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; pt: 10px; margin-top: 10px;">
            <div style="font-size: 12px; color: #64748b;">
              <span>Source: ${d.source}</span> • <span>${new Date(d.reportedAt).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              ${!d.isMEL ? `<button onclick="ADCMSWorkflow.openMELModal('${d.id}')" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Convert to MEL</button>` : `<span style="color: #f59e0b; font-weight: bold; font-size: 12px;">⚠️ MEL: ${d.melCategory}</span>`}
              <button onclick="ADCMSWorkflow.openActionModal('${d.id}')" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Update Status</button>
            </div>
          </div>
        </article>
      `).join('');
      
      const badge = document.getElementById('defectCountBadge');
      if (badge) badge.textContent = `${defects.length} open`;
    } catch (e) {
      console.error('Error in renderDefectControl:', e);
      list.innerHTML = '<p style="color: red; padding: 20px;">Error loading defects.</p>';
    }
  }

  function openMELModal(id) {
    const cat = prompt("Enter MEL Category (A, B, C, D):", "C");
    const exp = prompt("Enter Expiry Date (YYYY-MM-DD):", new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0]);
    if (cat && exp) {
      this.convertToMEL(id, cat, exp);
    }
  }

  async function convertToMEL(id, category, expiry) {
    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      d.isMEL = true;
      d.melCategory = category;
      d.melExpiry = expiry;
      d.proposedAction = "Deferred under MEL Category " + category;
      data.persistState();
      renderDefectControl();
      alert("Defect converted to MEL and transferred to MEL tracking.");
    }
  }

  function openActionModal(id) {
    const action = prompt("Enter Action Taken:");
    const prop = prompt("Enter Proposed Next Step:");
    if (action || prop) {
      this.updateDefectActions(id, action, prop);
    }
  }

  async function updateDefectActions(id, action, proposed) {
    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      if (action) d.actionTaken = action;
      if (proposed) d.proposedAction = proposed;
      data.persistState();
      renderDefectControl();
    }
  }

  async function init() {
    await renderDefectControl();
  }

  return {
    init,
    renderDefectControl,
    openMELModal,
    convertToMEL,
    openActionModal,
    updateDefectActions
  };
});
