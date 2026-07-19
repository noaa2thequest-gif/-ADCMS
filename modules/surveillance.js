(function(root, factory) {
  const api = factory(root);
  root.ADCMSSurveillance = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  let uploadedFiles = [];

  function populateAircraftSelect() {
    const select = document.getElementById('safaAircraft');
    if (!select) return;

    const aircraft = data.getAircraft();
    select.innerHTML = '<option value="">-- Select Aircraft --</option>' + 
      aircraft.map(a => `<option value="${a.registration}">${a.registration} - ${a.model}</option>`).join('');
  }

  function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('safaFiles');
    const uploadedFilesDiv = document.getElementById('uploadedFiles');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.backgroundColor = 'rgba(var(--accent-rgb), 0.2)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.backgroundColor = 'rgba(var(--accent-rgb), 0.05)';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.backgroundColor = 'rgba(var(--accent-rgb), 0.05)';
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });

    function handleFiles(files) {
      uploadedFiles = [];
      uploadedFilesDiv.innerHTML = '';

      Array.from(files).forEach(file => {
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type
        });

        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
          ${file.type.includes('image') ? '🖼️' : '📄'} ${file.name}
          <button onclick="this.parentElement.remove()">×</button>
        `;
        uploadedFilesDiv.appendChild(chip);
      });
    }
  }

  function submitFinding() {
    const aircraft = document.getElementById('safaAircraft').value;
    const category = document.getElementById('safaCategory').value;
    const description = document.getElementById('safaDescription').value;
    const system = document.getElementById('safaSystem').value;
    const correctiveAction = document.getElementById('safaCorrectiveAction').value;

    if (!aircraft || !description || !system) {
      alert('Please fill in all required fields.');
      return;
    }

    // Create a new defect from SAFA finding
    const newDefect = {
      id: 'SAFA-' + Date.now(),
      aircraft: aircraft,
      issue: `[SAFA] ${system}: ${description.substring(0, 50)}...`,
      source: 'SAFA Finding',
      reportDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      isMel: false,
      sparePartsStatus: 'no',
      proposedAction: correctiveAction,
      actions: [],
      attachments: uploadedFiles,
      safaCategory: category,
      safaFinding: true
    };

    // Add to defects
    if (!data.workflowState.defects) data.workflowState.defects = [];
    data.workflowState.defects.push(newDefect);
    data.persistState();

    // Clear form
    document.getElementById('safaAircraft').value = '';
    document.getElementById('safaCategory').value = 'observation';
    document.getElementById('safaDescription').value = '';
    document.getElementById('safaSystem').value = '';
    document.getElementById('safaCorrectiveAction').value = '';
    document.getElementById('uploadedFiles').innerHTML = '';
    uploadedFiles = [];

    alert('Finding submitted successfully! It will appear in the defect system.');
    renderSafaItems();
  }

  function renderSafaItems() {
    const list = document.getElementById('safaItemsList');
    const badge = document.getElementById('safaCountBadge');

    if (!list) return;

    const safaFindings = (data.workflowState.defects || []).filter(d => d.safaFinding);

    if (badge) badge.textContent = `${safaFindings.length} items`;

    if (safaFindings.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 40px; grid-column: 1/-1;">No SAFA findings submitted yet.</p>';
      return;
    }

    list.innerHTML = safaFindings.map(finding => `
      <div class="safa-item-card ${finding.safaCategory}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="safa-category-badge badge-${finding.safaCategory}">
            ${finding.safaCategory}
          </span>
          <span class="safa-status status-${finding.status.toLowerCase()}">
            ${finding.status}
          </span>
        </div>
        
        <h4 style="margin: 10px 0 5px 0;">${finding.issue}</h4>
        <p style="font-size: 12px; color: var(--text-dim); margin: 0 0 10px 0;">
          Aircraft: <strong>${finding.aircraft}</strong> | Reported: ${finding.reportDate}
        </p>
        
        <div style="background-color: var(--bg-primary); padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 12px;">
          <strong>Corrective Action:</strong> ${finding.proposedAction || 'Not specified'}
        </div>

        ${finding.attachments && finding.attachments.length > 0 ? `
          <div style="margin: 10px 0; font-size: 11px;">
            <strong>Attachments:</strong> ${finding.attachments.length} file(s)
          </div>
        ` : ''}

        <div class="safa-actions">
          <button class="close" onclick="ADCMSSurveillance.closeFinding('${finding.id}')">Close Finding</button>
          <button class="delete" onclick="ADCMSSurveillance.deleteFinding('${finding.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function closeFinding(findingId) {
    const finding = (data.workflowState.defects || []).find(d => d.id === findingId);
    if (finding) {
      finding.status = 'Closed';
      data.persistState();
      renderSafaItems();
    }
  }

  function deleteFinding(findingId) {
    if (confirm('Are you sure you want to delete this finding?')) {
      data.workflowState.defects = (data.workflowState.defects || []).filter(d => d.id !== findingId);
      data.persistState();
      renderSafaItems();
    }
  }

  function init() {
    populateAircraftSelect();
    setupFileUpload();
    renderSafaItems();

    const submitBtn = document.getElementById('submitSafaBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitFinding);
    }
  }

  return {
    init,
    closeFinding,
    deleteFinding,
    renderSafaItems
  };
});
