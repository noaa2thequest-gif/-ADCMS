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
        <article class="defect-control-item" style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${d.source === 'AOG' ? '#ff5252' : '#ffb100'}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${d.aircraft} • ${d.issue}</strong>
            <span class="tag ${d.status === 'open' ? 'aog' : 'serviceable'}">${d.status}</span>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #aaa;">
            <span>${d.source}</span> • 
            <span>${new Date(d.reportedAt).toLocaleDateString()}</span>
          </div>
          ${d.isMEL ? `<div style="margin-top: 8px; font-size: 12px; color: #ffb100;">⚠️ MEL: ${d.melCategory} (Exp: ${d.melExpiry})</div>` : ''}
        </article>
      `).join('');
      
      const badge = document.getElementById('defectCountBadge');
      if (badge) badge.textContent = `${defects.length} open`;
    } catch (e) {
      console.error('Error in renderDefectControl:', e);
      list.innerHTML = '<p style="color: red; padding: 20px;">Error loading defects. Please try again.</p>';
    }
  }

  async function init() {
    await renderDefectControl();
  }

  return {
    init,
    renderDefectControl
  };
});
