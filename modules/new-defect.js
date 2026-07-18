(function(root, factory) {
  const api = factory(root);
  root.ADCMSNewDefect = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  // MEL Category durations (in days)
  const MEL_DURATIONS = {
    B: 3,
    C: 10,
    D: 120
  };

  function populateAircraftList() {
    const aircraftSelect = document.getElementById('newDefectAircraft');
    if (!aircraftSelect) return;

    const aircraft = data.getAircraft();
    aircraftSelect.innerHTML = '<option value="">-- Select Aircraft --</option>';
    
    aircraft.forEach(ac => {
      const option = document.createElement('option');
      option.value = ac.registration;
      option.textContent = `${ac.registration} (${ac.model})`;
      aircraftSelect.appendChild(option);
    });
  }

  function calculateMelExpiry(category, reportDate) {
    if (!category || !reportDate || category === 'A') {
      return null;
    }

    const startDate = new Date(reportDate);
    const durationDays = MEL_DURATIONS[category] || 0;
    
    // Add duration days (excluding the report date itself)
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    
    return expiryDate.toISOString().split('T')[0];
  }

  function calculateExtensionExpiry(expiryDate, extensionType) {
    if (!expiryDate || !extensionType) {
      return null;
    }

    const baseDate = new Date(expiryDate);
    const category = document.getElementById('newDefectMelCategory').value;
    const durationDays = MEL_DURATIONS[category] || 0;
    
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + durationDays);
    
    return newExpiryDate.toISOString().split('T')[0];
  }

  function setupMelToggle() {
    const isMelCheckbox = document.getElementById('newDefectIsMel');
    const melSection = document.getElementById('melSection');
    const melCategory = document.getElementById('newDefectMelCategory');
    const reportDate = document.getElementById('newDefectDate');
    const melExpiry = document.getElementById('newDefectMelExpiry');
    const hasExtension = document.getElementById('newDefectHasExtension');
    const extensionSection = document.getElementById('extensionSection');
    const extensionType = document.getElementById('newDefectExtensionType');
    const melExpiryExtended = document.getElementById('newDefectMelExpiryExtended');

    if (!isMelCheckbox) return;

    // Toggle MEL section visibility
    isMelCheckbox.addEventListener('change', () => {
      melSection.style.display = isMelCheckbox.checked ? 'block' : 'none';
      if (!isMelCheckbox.checked) {
        melCategory.value = '';
        melExpiry.value = '';
        hasExtension.checked = false;
        extensionSection.style.display = 'none';
      }
    });

    // Calculate expiry when category or date changes
    const updateExpiry = () => {
      if (melCategory.value && reportDate.value) {
        const expiry = calculateMelExpiry(melCategory.value, reportDate.value);
        melExpiry.value = expiry || '';
        
        // Reset extension if category changes
        hasExtension.checked = false;
        extensionSection.style.display = 'none';
        extensionType.value = '';
        melExpiryExtended.value = '';
      }
    };

    melCategory.addEventListener('change', updateExpiry);
    reportDate.addEventListener('change', updateExpiry);

    // Toggle extension section
    hasExtension.addEventListener('change', () => {
      extensionSection.style.display = hasExtension.checked ? 'block' : 'none';
      if (!hasExtension.checked) {
        extensionType.value = '';
        melExpiryExtended.value = '';
      }
    });

    // Calculate extension expiry
    extensionType.addEventListener('change', () => {
      if (extensionType.value && melExpiry.value) {
        const newExpiry = calculateExtensionExpiry(melExpiry.value, extensionType.value);
        melExpiryExtended.value = newExpiry || '';
      }
    });
  }

  function saveDefect() {
    const aircraft = document.getElementById('newDefectAircraft').value;
    const issue = document.getElementById('newDefectIssue').value;
    const source = document.getElementById('newDefectSource').value;
    const description = document.getElementById('newDefectDescription').value;
    const reportDate = document.getElementById('newDefectDate').value;
    const isMel = document.getElementById('newDefectIsMel').checked;
    const melCategory = document.getElementById('newDefectMelCategory').value;
    const melExpiry = document.getElementById('newDefectMelExpiry').value;
    const hasExtension = document.getElementById('newDefectHasExtension').checked;
    const extensionType = document.getElementById('newDefectExtensionType').value;
    const melExpiryExtended = document.getElementById('newDefectMelExpiryExtended').value;
    const sparePartsStatus = document.getElementById('newDefectSparePartsStatus').value;
    const proposedAction = document.getElementById('newDefectProposedAction').value;

    // Validation
    if (!aircraft || !issue || !description || !reportDate) {
      alert('Please fill in all required fields (Aircraft, Title, Description, Date)');
      return;
    }

    if (isMel && !melCategory) {
      alert('Please select a MEL Category');
      return;
    }

    // Create defect object
    const newDefect = {
      id: 'defect-' + Date.now(),
      aircraft: aircraft,
      issue: issue,
      source: source,
      description: description,
      reportDate: reportDate,
      status: 'Open',
      isMel: isMel,
      melCategory: isMel ? melCategory : null,
      melExpiry: isMel ? melExpiry : null,
      hasExtension: isMel && hasExtension,
      extensionType: isMel && hasExtension ? extensionType : null,
      melExpiryExtended: isMel && hasExtension ? melExpiryExtended : null,
      sparePartsStatus: sparePartsStatus,
      proposedAction: proposedAction,
      actions: [],
      rootCause: null,
      createdAt: new Date().toISOString()
    };

    // Save to data store
    if (!data.workflowState.defects) {
      data.workflowState.defects = [];
    }
    data.workflowState.defects.push(newDefect);
    data.persistState();

    // Show success message
    alert('✅ Defect saved successfully!\n\nAircraft: ' + aircraft + '\nIssue: ' + issue + (isMel ? '\n\nMEL Category: ' + melCategory + '\nExpiry: ' + melExpiry : ''));

    // Redirect to defect workflow
    setTimeout(() => {
      window.location.href = 'defect.html?defectId=' + newDefect.id;
    }, 500);
  }

  function init() {
    populateAircraftList();
    setupMelToggle();

    const saveBtn = document.getElementById('saveDefectBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveDefect);
    }

    // Set today's date as default
    const reportDateInput = document.getElementById('newDefectDate');
    if (reportDateInput && !reportDateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      reportDateInput.value = today;
    }
  }

  return {
    init,
    calculateMelExpiry,
    calculateExtensionExpiry,
    saveDefect
  };
});
