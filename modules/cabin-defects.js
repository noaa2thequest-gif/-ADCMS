(function(root, factory) {
  const api = factory(root);
  root.ADCMSCabinDefects = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  let currentFilter = 'all';

  function populateAircraftSelect() {
    const select = document.getElementById('cabinAircraft');
    if (!select) return;

    const aircraft = data.getAircraft();
    select.innerHTML = '<option value="">-- Select Aircraft --</option>' + 
      aircraft.map(a => `<option value="${a.registration}">${a.registration} - ${a.model}</option>`).join('');
  }

  function openAddModal() {
    const modal = document.getElementById('addCabinDefectModal');
    if (modal) modal.classList.add('active');
  }

  function closeAddModal() {
    const modal = document.getElementById('addCabinDefectModal');
    if (modal) modal.classList.remove('active');
    clearAddForm();
  }

  function clearAddForm() {
    document.getElementById('cabinAircraft').value = '';
    document.getElementById('cabinArea').value = '';
    document.getElementById('cabinIssue').value = '';
    document.getElementById('cabinPriority').value = 'Medium';
    document.getElementById('cabinReportedBy').value = '';
  }

  function submitCabinDefect() {
    const aircraft = document.getElementById('cabinAircraft').value;
    const area = document.getElementById('cabinArea').value;
    const issue = document.getElementById('cabinIssue').value;
    const priority = document.getElementById('cabinPriority').value;
    const reportedBy = document.getElementById('cabinReportedBy').value;

    if (!aircraft || !area || !issue) {
      alert('Please fill in all required fields.');
      return;
    }

    const newCabinDefect = {
      id: 'CABIN-' + Date.now(),
      aircraft: aircraft,
      area: area,
      issue: issue,
      priority: priority,
      reportedBy: reportedBy || 'Unknown',
      status: 'Open',
      reportDate: new Date().toISOString().split('T')[0],
      actions: [],
      isCabinDefect: true
    };

    if (!data.workflowState.cabinDefects) data.workflowState.cabinDefects = [];
    data.workflowState.cabinDefects.push(newCabinDefect);
    data.persistState();

    closeAddModal();
    renderCabinDefects();
  }

  function renderCabinDefects() {
    const grid = document.getElementById('cabinDefectsGrid');
    if (!grid) return;

    const allCabinDefects = data.workflowState.cabinDefects || [];
    let filtered = allCabinDefects;

    if (currentFilter !== 'all') {
      filtered = allCabinDefects.filter(d => d.status === currentFilter);
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px; grid-column: 1/-1;">No cabin defects found.</div>';
      return;
    }

    grid.innerHTML = filtered.map(defect => `
      <div class="cabin-defect-card">
        <div class="cabin-card-header">
          <div>
            <h4>${defect.aircraft}</h4>
            <small>${defect.area}</small>
          </div>
          <span class="cabin-status-badge badge-${defect.status.toLowerCase()}">${defect.status}</span>
        </div>
        <div class="cabin-card-body">
          <p><strong>Issue:</strong> ${defect.issue}</p>
          
          <div class="cabin-card-meta">
            <div class="meta-item">
              <label>Priority</label>
              <span>${defect.priority}</span>
            </div>
            <div class="meta-item">
              <label>Reported By</label>
              <span>${defect.reportedBy}</span>
            </div>
            <div class="meta-item">
              <label>Date</label>
              <span>${defect.reportDate}</span>
            </div>
            <div class="meta-item">
              <label>Actions</label>
              <span>${(defect.actions || []).length}</span>
            </div>
          </div>

          <div class="cabin-card-actions">
            <button class="btn-view" onclick="ADCMSCabinDefects.viewDetails('${defect.id}')">View Details</button>
            ${defect.status === 'Open' ? `
              <button class="btn-close" onclick="ADCMSCabinDefects.closeCabinDefect('${defect.id}')">Close</button>
            ` : ''}
            <button class="btn-delete" onclick="ADCMSCabinDefects.deleteCabinDefect('${defect.id}')">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function filterByStatus(status) {
    currentFilter = status;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderCabinDefects();
  }

  function viewDetails(defectId) {
    const defect = (data.workflowState.cabinDefects || []).find(d => d.id === defectId);
    if (!defect) return;

    alert(`Cabin Defect Details:\n\nAircraft: ${defect.aircraft}\nArea: ${defect.area}\nIssue: ${defect.issue}\nStatus: ${defect.status}\nActions Taken: ${(defect.actions || []).length}`);
  }

  function closeCabinDefect(defectId) {
    const defect = (data.workflowState.cabinDefects || []).find(d => d.id === defectId);
    if (defect) {
      defect.status = 'Closed';
      defect.closedDate = new Date().toISOString().split('T')[0];
      data.persistState();
      renderCabinDefects();
      alert('Cabin defect closed successfully.');
    }
  }

  function deleteCabinDefect(defectId) {
    if (confirm('Are you sure you want to delete this cabin defect?')) {
      data.workflowState.cabinDefects = (data.workflowState.cabinDefects || []).filter(d => d.id !== defectId);
      data.persistState();
      renderCabinDefects();
    }
  }

  function init() {
    populateAircraftSelect();
    renderCabinDefects();

    // Close modal when clicking outside
    const modal = document.getElementById('addCabinDefectModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAddModal();
      });
    }
  }

  return {
    init,
    openAddModal,
    closeAddModal,
    submitCabinDefect,
    filterByStatus,
    viewDetails,
    closeCabinDefect,
    deleteCabinDefect,
    renderCabinDefects
  };
});
