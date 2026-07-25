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
      const aircraft = await data.getAircraft();
      
      if (!defects || defects.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No defects logged.</p>';
        return;
      }

      // Group defects by aircraft
      const defectsByAircraft = {};
      aircraft.forEach(ac => {
        defectsByAircraft[ac.registration] = {
          aircraft: ac,
          defects: defects.filter(d => d.aircraft === ac.registration)
        };
      });

      // Render aircraft cards with defects
      list.innerHTML = Object.entries(defectsByAircraft)
        .filter(([_, data]) => data.defects.length > 0)
        .map(([registration, { aircraft: ac, defects: acDefects }]) => {
          const openCount = acDefects.filter(d => d.status === 'open').length;
          const melCount = acDefects.filter(d => d.isMEL && d.status !== 'closed').length;
          const aogCount = acDefects.filter(d => d.status === 'AOG').length;
          const closedCount = acDefects.filter(d => d.status === 'closed').length;
          
          const cardId = `aircraft-card-${registration}`;
          const expandId = `expand-${registration}`;

          return `
            <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border-left: 5px solid ${aogCount > 0 ? '#ef4444' : (melCount > 0 ? '#f59e0b' : '#10b981')};">
              <!-- Aircraft Header Card -->
              <div onclick="document.getElementById('${expandId}').style.display = document.getElementById('${expandId}').style.display === 'none' ? 'block' : 'none';" style="padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; transition: all 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                  <div style="font-size: 32px;">✈</div>
                  <div>
                    <h3 style="margin: 0; font-size: 20px; color: #1e293b;">${registration}</h3>
                    <small style="color: #64748b;">${ac.model} • ${ac.location || 'N/A'}</small>
                  </div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: ${openCount > 0 ? '#ef4444' : '#10b981'};">${openCount}</div>
                    <small style="color: #64748b;">Open</small>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${melCount}</div>
                    <small style="color: #64748b;">MEL</small>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">${closedCount}</div>
                    <small style="color: #64748b;">Closed</small>
                  </div>
                  <div style="font-size: 20px; color: #64748b;">▼</div>
                </div>
              </div>

              <!-- Defects List (Expandable) -->
              <div id="${expandId}" style="display: none; padding: 20px; background: #ffffff; border-top: 1px solid #e2e8f0;">
                ${acDefects.map(d => {
                  const lastAction = d.maintenanceActionLog && d.maintenanceActionLog.length > 0 
                    ? d.maintenanceActionLog[d.maintenanceActionLog.length - 1] 
                    : null;
                  
                  return `
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${d.status === 'AOG' ? '#ef4444' : (d.status === 'closed' ? '#10b981' : '#f59e0b')};">
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                          <h4 style="margin: 0; font-size: 16px; color: #1e293b;">${d.issue}</h4>
                          <small style="color: #64748b; display: block; margin-top: 4px;">Source: ${d.defectSource || 'N/A'}</small>
                        </div>
                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: ${d.status === 'open' ? '#fecaca' : (d.status === 'AOG' ? '#fee2e2' : '#dcfce7')}; color: ${d.status === 'open' ? '#991b1b' : (d.status === 'AOG' ? '#7f1d1d' : '#166534')};">${d.status.toUpperCase()}</span>
                      </div>
                      
                      <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; border: 1px solid #e2e8f0;">
                        <div style="margin-bottom: 8px;">
                          <strong>Last Action:</strong> ${lastAction ? lastAction.action : 'Pending assessment...'}
                          <br><small style="color: #94a3b8;">By ${lastAction ? lastAction.by : 'N/A'} on ${lastAction ? lastAction.date : 'N/A'}</small>
                        </div>
                        ${lastAction && lastAction.nextAction ? `<div style="color: #2563eb; background: #eff6ff; padding: 8px; border-radius: 4px;"><strong>Next Step:</strong> ${lastAction.nextAction}</div>` : ''}
                      </div>

                      ${d.materialRequests && d.materialRequests.length > 0 ? `
                      <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #0284c7;">
                        <div style="font-weight: bold; color: #0c4a6e; margin-bottom: 8px;">📦 Material Requests (${d.materialRequests.length})</div>
                        ${d.materialRequests.map((mr, idx) => `
                          <div style="background: white; padding: 8px; border-radius: 4px; margin-bottom: 6px; font-size: 12px; border: 1px solid #bae6fd;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                              <strong style="color: #1e293b;">${mr.description}</strong>
                              <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: ${mr.status === 'PENDING' ? '#fef08a' : (mr.status === 'APPROVED' ? '#86efac' : '#c7d2fe')}; color: ${mr.status === 'PENDING' ? '#854d0e' : (mr.status === 'APPROVED' ? '#166534' : '#3730a3')};">${mr.status}</span>
                            </div>
                            <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">Qty: <strong>${mr.quantity}</strong> ${mr.partNumber && mr.partNumber !== 'N/A' ? `| PN: <strong>${mr.partNumber}</strong>` : ''}</div>
                            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">Requested: ${mr.requestDate} by ${mr.requestedBy}</div>
                            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                              ${mr.status === 'PENDING' ? `<button onclick="ADCMSWorkflow.updateMaterialRequestStatus('${d.id}', ${idx}, 'APPROVED')" style="background: #86efac; color: #166534; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold;">✓ Approve</button>` : ''}
                              ${mr.status !== 'RECEIVED' ? `<button onclick="ADCMSWorkflow.updateMaterialRequestStatus('${d.id}', ${idx}, 'RECEIVED')" style="background: #c7d2fe; color: #3730a3; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold;">📦 Received</button>` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                      ` : ''}

                      <div style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
                        ${d.isMEL ? `<span style="padding: 4px 12px; border-radius: 6px; background: #fffbeb; color: #92400e; font-size: 11px; font-weight: bold;">⚠️ MEL ${d.melCategory}: ${d.melReference} (Exp: ${d.melExpiry})</span>` : ''}
                        ${d.status !== 'closed' ? `<button onclick="ADCMSWorkflow.openActionModal('${d.id}')" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">+ Add Action</button>` : ''}
                        ${d.status !== 'closed' ? `<button onclick="ADCMSWorkflow.openMaterialRequestModal('${d.id}')" style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">📦 Material Request</button>` : ''}
                        ${d.status !== 'closed' ? `<button onclick="ADCMSWorkflow.closeDefect('${d.id}')" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">✓ Close</button>` : '<span style="color: #10b981; font-weight: bold; padding: 6px 12px;">✓ Closed</span>'}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');
      
      const badge = document.getElementById('defectCountBadge');
      if (badge) {
        const openCount = defects.filter(d => d.status === 'open' || d.status === 'AOG').length;
        badge.textContent = `${openCount} open`;
      }
    } catch (e) {
      console.error('Error in renderDefectControl:', e);
      list.innerHTML = '<p style="color: red; padding: 20px;">Error loading defects.</p>';
    }
  }

  async function populateAircraftDropdown(elementId) {
    const select = document.getElementById(elementId);
    if (!select) return;
    const aircrafts = await data.getAircraft();
    select.innerHTML = aircrafts.map(ac => `<option value="${ac.registration}">${ac.registration}</option>`).join('');
  }

  function openNewDefectModal() {
    const modal = document.getElementById('newDefectModal');
    if (modal) {
      modal.style.display = 'flex';
      populateAircraftDropdown('newDefectAircraft');
      document.getElementById('newDefectIssue').value = '';
      document.getElementById('newDefectSource').value = '';
      document.getElementById('newDefectIsMEL').value = 'false';
      document.getElementById('melFieldsContainer').style.display = 'none';
      document.getElementById('newDefectMaintenanceActionLog').value = '';
      document.getElementById('newDefectNextAction').value = '';
      document.getElementById('newDefectAircraft').focus();
    }
  }

  function closeNewDefectModal() {
    const modal = document.getElementById('newDefectModal');
    if (modal) modal.style.display = 'none';
  }

  function toggleMELFields() {
    const isMEL = document.getElementById('newDefectIsMEL').value === 'true';
    const container = document.getElementById('melFieldsContainer');
    if (container) container.style.display = isMEL ? 'block' : 'none';
  }

  async function submitNewDefect() {
    const aircraft = document.getElementById('newDefectAircraft').value;
    const issue = document.getElementById('newDefectIssue').value.trim();
    const source = document.getElementById('newDefectSource').value;
    const isMEL = document.getElementById('newDefectIsMEL').value === 'true';
    const action = document.getElementById('newDefectMaintenanceActionLog').value.trim();
    const nextAction = document.getElementById('newDefectNextAction').value.trim();

    if (!aircraft || !issue || !source) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newDefect = {
      id: 'defect-' + Date.now(),
      aircraft: aircraft,
      issue: issue,
      defectSource: source,
      status: 'open',
      reportedAt: new Date().toISOString(),
      isMEL: isMEL,
      maintenanceActionLog: action ? [{
        action: action,
        by: 'Hany Omar',
        date: new Date().toISOString().split('T')[0],
        nextAction: nextAction || ''
      }] : []
    };

    if (isMEL) {
      newDefect.melCategory = document.getElementById('newDefectMELCategory').value;
      newDefect.melReference = document.getElementById('newDefectMELReference').value;
      newDefect.melExpiry = document.getElementById('newDefectOpenDate').value;
    }

    const defects = await data.getDefects();
    defects.push(newDefect);
    data.persistState();
    renderDefectControl();
    closeNewDefectModal();
    showToast('✓ Defect created successfully!', 'success');
  }

  function openActionModal(id) {
    window.currentDefectId = id;
    const modal = document.getElementById('actionModal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('actionModalAction').value = '';
      document.getElementById('actionModalNextAction').value = '';
      document.getElementById('actionModalAction').focus();
    }
  }

  function closeActionModal() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.style.display = 'none';
    window.currentDefectId = null;
  }

  async function submitActionModal() {
    const action = document.getElementById('actionModalAction').value.trim();
    const next = document.getElementById('actionModalNextAction').value.trim();
    
    if (!action) {
      showToast('Please describe the action taken', 'error');
      return;
    }
    
    const defects = await data.getDefects();
    const d = defects.find(x => x.id === window.currentDefectId);
    if (d) {
      if (!d.maintenanceActionLog) d.maintenanceActionLog = [];
      d.maintenanceActionLog.push({
        action: action,
        by: 'Hany Omar',
        date: new Date().toISOString().split('T')[0],
        nextAction: next || ''
      });
      data.persistState();
      renderDefectControl();
      closeActionModal();
      showToast('✓ Maintenance log updated!', 'success');
    }
  }

  function openMaterialRequestModal(id) {
    window.currentDefectId = id;
    const modal = document.getElementById('materialRequestModal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('materialRequestDescription').value = '';
      document.getElementById('materialRequestQuantity').value = '';
      document.getElementById('materialRequestDescription').focus();
    }
  }

  function closeMaterialRequestModal() {
    const modal = document.getElementById('materialRequestModal');
    if (modal) modal.style.display = 'none';
    window.currentDefectId = null;
  }

  async function updateMaterialRequestStatus(defectId, requestIndex, newStatus) {
    try {
      // Call tRPC API to update Material Request status in database
      const response = await fetch('/api/trpc/materialRequest.updateStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            id: defectId,
            status: newStatus
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update material request status');
      }
      
      // Also update localStorage for offline support
      const defects = await data.getDefects();
      const defect = defects.find(d => d.id === defectId);
      
      if (defect && defect.materialRequests && defect.materialRequests[requestIndex]) {
        defect.materialRequests[requestIndex].status = newStatus;
        data.persistState();
      }
      
      renderDefectControl();
      showToast(`Material request status updated to ${newStatus}!`, 'success');
    } catch (error) {
      console.error('Error updating material request status:', error);
      showToast('Error updating material request status', 'error');
    }
  }

async function submitMaterialRequest() {
    const description = document.getElementById('materialRequestDescription').value.trim();
    const quantity = document.getElementById('materialRequestQuantity').value.trim();
    const partNumber = document.getElementById('materialRequestPartNumber').value.trim();
    
    if (!description) {
      showToast('Please describe the material needed', 'error');
      return;
    }
    
    if (!quantity) {
      showToast('Please enter quantity', 'error');
      return;
    }
    
    try {
      // Call tRPC API to save Material Request to database
      console.log('Submitting material request:', {
        defectId: window.currentDefectId,
        description,
        quantity,
        partNumber: partNumber || 'N/A'
      });
      
      const response = await fetch('/api/trpc/materialRequest.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            defectId: window.currentDefectId,
            description: description,
            quantity: quantity,
            partNumber: partNumber || 'N/A',
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, errorText);
        throw new Error('Failed to submit material request: ' + errorText);
      }
      
      const responseData = await response.text();
      console.log('API success response:', responseData);
      
      // Also update localStorage for offline support
      const defects = await data.getDefects();
      const d = defects.find(x => x.id === window.currentDefectId);
      if (d) {
        if (!d.materialRequests) d.materialRequests = [];
        d.materialRequests.push({
          description: description,
          quantity: quantity,
          partNumber: partNumber || 'N/A',
          requestedBy: 'Hany Omar',
          requestDate: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        });
        data.persistState();
      }
      
      renderDefectControl();
      closeMaterialRequestModal();
      showToast('Material request submitted!', 'success');
    } catch (error) {
      console.error('Error submitting material request:', error);
      showToast('Failed to submit material request', 'error');
    }
  }
  function openMELModal(id) {
    const cat = prompt("Enter MEL Category (A, B, C, D):", "C");
    if (!cat) return;
    const ref = prompt("Enter MEL Reference:", "MEL-");
    if (cat && ref) {
      this.convertToMEL(id, cat, ref);
    }
  }

  async function convertToMEL(id, category, reference) {
    const defects = await data.getDefects();
    const d = defects.find(x => x.id === id);
    if (d) {
      d.isMEL = true;
      d.melCategory = category;
      d.melReference = reference;
      d.melExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      data.persistState();
      renderDefectControl();
      alert("Defect converted to MEL successfully.");
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
      renderDefectControl();
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

  async function init() {
    await renderDefectControl();
    data.onDataChange(async () => {
      await renderDefectControl();
      populateAircraftDropdown("newDefectAircraft");
    });
  }

  return {
    init,
    renderDefectControl,
    openMELModal,
    convertToMEL,
    openActionModal,
    closeActionModal,
    submitActionModal,
    openMaterialRequestModal,
    updateMaterialRequestStatus,
    closeMaterialRequestModal,
    submitMaterialRequest,
    openNewDefectModal,
    closeNewDefectModal,
    toggleMELFields,
    submitNewDefect,
    populateAircraftDropdown,
    closeDefect,
    showToast
  };
});
