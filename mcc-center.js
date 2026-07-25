(function(root, factory) {
  const api = factory(root);
  root.ADCMSMCCCenter = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  let currentEditingDefectId = null;

  function calculateDaysRemaining(expiryDate) {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  async function renderCounters() {
    try {
      const allDefects = await data.getDefects();
      const aogDefects = allDefects.filter(d => d.status === 'AOG' || d.status === 'aog').length;
      const melItems = allDefects.filter(d => d.isMEL && d.status !== 'closed').length;
      const totalAircraft = 3;
      const healthyAircraft = totalAircraft - (aogDefects > 0 ? 1 : 0);
      const fleetHealth = Math.round((healthyAircraft / totalAircraft) * 100);

      const aogEl = document.getElementById('counterAogDefects');
      const melEl = document.getElementById('counterMelItems');
      const healthEl = document.getElementById('fleetHealth');

      if (aogEl) aogEl.textContent = aogDefects;
      if (melEl) melEl.textContent = melItems;
      if (healthEl) healthEl.textContent = fleetHealth + '%';
    } catch (error) {
      console.error('Error rendering MCC counters:', error);
    }
  }

  async function renderFleetView() {
    const list = document.getElementById('mccFleetList');
    if (!list) return;

    try {
      const aircraft = await data.getAircraft();
      const allDefects = await data.getDefects();

      if (!aircraft || aircraft.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No aircraft found.</p>';
        return;
      }

      list.innerHTML = aircraft.map(ac => {
        const acDefects = allDefects.filter(d => d.aircraft === ac.registration);
        const openDefects = acDefects.filter(d => d.status !== 'closed');
        const melDefects = acDefects.filter(d => d.isMEL && d.status !== 'closed');
        const aogDefects = acDefects.filter(d => d.status === 'AOG' || d.status === 'aog');
        const expandId = `expand-${ac.registration}`;

        return `
          <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border-left: 5px solid ${aogDefects.length > 0 ? '#ef4444' : (melDefects.length > 0 ? '#f59e0b' : '#10b981')};">
            <!-- Aircraft Header -->
            <div onclick="document.getElementById('${expandId}').style.display = document.getElementById('${expandId}').style.display === 'none' ? 'block' : 'none';" style="padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; transition: all 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                <div style="font-size: 32px;">✈</div>
                <div>
                  <h3 style="margin: 0; font-size: 20px; color: #1e293b;">${ac.registration}</h3>
                  <small style="color: #64748b;">${ac.model} • ${ac.location || 'N/A'}</small>
                </div>
              </div>
              <div style="display: flex; gap: 20px; align-items: center;">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: ${openDefects.length > 0 ? '#ef4444' : '#10b981'};">${openDefects.length}</div>
                  <small style="color: #64748b;">Open</small>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${melDefects.length}</div>
                  <small style="color: #64748b;">MEL</small>
                </div>
                <div style="font-size: 20px; color: #64748b;">▼</div>
              </div>
            </div>

            <!-- Defects List (Expandable) -->
            <div id="${expandId}" style="display: none; padding: 20px; background: #ffffff; border-top: 1px solid #e2e8f0;">
              ${acDefects.length === 0 ? `
                <p style="text-align: center; color: #94a3b8; padding: 20px;">✓ No defects for this aircraft</p>
              ` : acDefects.map(d => {
                const lastAction = d.maintenanceActionLog && d.maintenanceActionLog.length > 0 
                  ? d.maintenanceActionLog[d.maintenanceActionLog.length - 1] 
                  : null;
                const daysLeft = d.isMEL ? calculateDaysRemaining(d.melExpiry) : null;

                return `
                  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${d.status === 'AOG' ? '#ef4444' : (d.status === 'closed' ? '#10b981' : '#f59e0b')};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                      <div>
                        <h4 style="margin: 0; font-size: 16px; color: #1e293b;">${d.issue}</h4>
                        <small style="color: #64748b; display: block; margin-top: 4px;">Source: ${d.defectSource || 'N/A'}</small>
                      </div>
                      <span style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: ${d.status === 'open' ? '#fecaca' : (d.status === 'AOG' ? '#fee2e2' : '#dcfce7')}; color: ${d.status === 'open' ? '#991b1b' : (d.status === 'AOG' ? '#7f1d1d' : '#166534')};">${d.status.toUpperCase()}</span>
                    </div>
                    
                    ${d.isMEL ? `
                      <div style="background: #fffbeb; padding: 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #f59e0b; font-size: 12px;">
                        <div style="color: #92400e; font-weight: bold; margin-bottom: 4px;">⚠️ MEL Status</div>
                        <div style="color: #92400e;">Category: ${d.melCategory} | Reference: ${d.melReference}</div>
                        <div style="color: ${daysLeft <= 3 ? '#dc2626' : '#92400e'}; font-weight: bold;">Expires: ${d.melExpiry} (${daysLeft} days)</div>
                      </div>
                    ` : ''}

                    <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; border: 1px solid #e2e8f0;">
                      <div style="margin-bottom: 8px;">
                        <strong>Last Action:</strong> ${lastAction ? lastAction.action : 'Pending assessment...'}
                        <br><small style="color: #94a3b8;">By ${lastAction ? lastAction.by : 'N/A'} on ${lastAction ? lastAction.date : 'N/A'}</small>
                      </div>
                      ${lastAction && lastAction.nextAction ? `<div style="color: #2563eb; background: #eff6ff; padding: 8px; border-radius: 4px;"><strong>Next Step:</strong> ${lastAction.nextAction}</div>` : ''}
                    </div>

                    <div style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
                      ${d.status !== 'closed' && !d.isMEL ? `<button onclick="ADCMSMCCCenter.openMELEditModal('${d.id}')" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">+ Convert to MEL</button>` : ''}
                      ${d.isMEL && d.status !== 'closed' ? `<button onclick="ADCMSMCCCenter.openMELEditModal('${d.id}')" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">✎ Edit MEL</button>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering fleet view:', error);
      list.innerHTML = '<p style="color: red; padding: 20px;">Error loading fleet data.</p>';
    }
  }

  function openMELEditModal(defectId) {
    currentEditingDefectId = defectId;
    const modal = document.getElementById('melEditModal');
    if (!modal) return;

    data.getDefects().then(defects => {
      const d = defects.find(x => x.id === defectId);
      if (d) {
        document.getElementById('melEditAircraft').value = d.aircraft;
        document.getElementById('melEditDefect').value = d.issue;
        document.getElementById('melEditCategory').value = d.melCategory || 'C';
        document.getElementById('melEditReference').value = d.melReference || '';
        document.getElementById('melEditExpiry').value = d.melExpiry || '';
        modal.style.display = 'flex';
      }
    });
  }

  function closeMELModal() {
    const modal = document.getElementById('melEditModal');
    if (modal) modal.style.display = 'none';
    currentEditingDefectId = null;
  }

  async function saveMELEdit() {
    if (!currentEditingDefectId) return;

    const category = document.getElementById('melEditCategory').value;
    const reference = document.getElementById('melEditReference').value.trim();
    const expiry = document.getElementById('melEditExpiry').value;

    if (!reference || !expiry) {
      showToast('Please fill in all MEL fields', 'error');
      return;
    }

    const defects = await data.getDefects();
    const d = defects.find(x => x.id === currentEditingDefectId);
    if (d) {
      d.isMEL = true;
      d.melCategory = category;
      d.melReference = reference;
      d.melExpiry = expiry;
      data.persistState();
      renderFleetView();
      renderCounters();
      closeMELModal();
      showToast('✓ MEL updated successfully!', 'success');
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

  async function init() {
    try {
      await renderCounters();
      await renderFleetView();

      // Auto-refresh every 30 seconds
      setInterval(async () => {
        await renderCounters();
        await renderFleetView();
      }, 30 * 1000);

      data.onDataChange(async () => {
        await renderCounters();
        await renderFleetView();
      });
    } catch (error) {
      console.error('Error initializing MCC Center:', error);
    }
  }

  return {
    init,
    renderCounters,
    renderFleetView,
    openMELEditModal,
    closeMELModal,
    saveMELEdit
  };
});
