(function(root, factory) {
  const api = factory(root);
  root.ADCMSWorkflow = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  const workflowState = data.workflowState;

  function saveState() {
    if (data.persistState) {
      data.persistState();
    }
  }

  function updateDashboardCounters() {
    if (root.ADCMSDashboard && typeof root.ADCMSDashboard.refreshCounters === 'function') {
      root.ADCMSDashboard.refreshCounters();
    }
  }

  function getWorkflowState() {
    return {
      activeDefect: {
        ...workflowState.activeDefect,
        troubleshooting: [...workflowState.activeDefect.troubleshooting],
        attachments: [...workflowState.activeDefect.attachments]
      },
      history: [...workflowState.history],
      defects: [...(workflowState.defects || [])]
    };
  }

  function isWithinDays(referenceDate, compareDate, days) {
    if (!referenceDate || !compareDate) return false;
    const refDate = new Date(referenceDate);
    const compDate = new Date(compareDate);
    const diff = refDate.getTime() - compDate.getTime();
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
  }

  function detectRepeatDefect(aircraftId, issueTitle, defectSource = '', days = 10, referenceDate = new Date().toISOString()) {
    const aircraftValue = (aircraftId || '').trim().toLowerCase();
    const issueValue = (issueTitle || '').trim().toLowerCase();
    const sourceValue = (defectSource || '').trim().toLowerCase();
    const entries = [...(workflowState.history || []), ...(workflowState.defects || [])];
    return entries.some(entry => {
      if (!entry || entry.aircraft.toLowerCase() !== aircraftValue || entry.issue.toLowerCase() !== issueValue) {
        return false;
      }
      const entrySourceValue = (entry.defectSource || entry.severity || '').trim().toLowerCase();
      if (sourceValue && entrySourceValue && entrySourceValue !== sourceValue) {
        return false;
      }
      return isWithinDays(referenceDate, entry.reportedAt || entry.date, days);
    });
  }

  function renderDefectControl() {
    if (typeof document === 'undefined') return;
    const list = document.getElementById('defectControlList');
    if (!list) return;
    const defects = workflowState.defects || [];
    if (!defects.length) {
      list.innerHTML = '<p class="empty-state">No defects logged yet.</p>';
      return;
    }
    list.innerHTML = defects.map(defect => `
      <article class="defect-control-item">
        <div class="defect-control-head">
          <strong>${defect.aircraft} • ${defect.issue}</strong>
          <span class="tag ${defect.status === 'Closed' ? 'serviceable' : 'aog'}">${defect.status}</span>
        </div>
        <div class="defect-meta">
          <span>${defect.defectSource || defect.severity || 'Maintenance Observation'}</span>
          <span>${defect.repeatDefect ? 'Repeat within 10 days' : 'New'}</span>
          <span>${new Date(defect.reportedAt || Date.now()).toLocaleDateString()}</span>
        </div>
        <p>${defect.description || 'No description provided yet.'}</p>
      </article>
    `).join('');
  }

  function renderWorkflow() {
    if (typeof document === 'undefined') {
      return;
    }
    const workflowBadge = document.getElementById('workflowBadge');
    const workflowHeading = document.getElementById('workflowHeading');
    const repeatMessage = document.getElementById('repeatMessage');
    const workflowHistory = document.getElementById('workflowHistory');
    const workflowSteps = document.getElementById('workflowSteps');
    const attachmentList = document.getElementById('attachmentList');
    const workflowRootCause = document.getElementById('workflowRootCause');
    const workflowAircraft = document.getElementById('workflowAircraft');
    const workflowIssue = document.getElementById('workflowIssue');
    const workflowDefectSource = document.getElementById('workflowDefectSource');

    workflowState.activeDefect.repeatDefect = detectRepeatDefect(workflowState.activeDefect.aircraft, workflowState.activeDefect.issue, workflowState.activeDefect.defectSource);
    if (workflowBadge) {
      workflowBadge.textContent = workflowState.activeDefect.status;
      workflowBadge.classList.toggle('repeat', workflowState.activeDefect.repeatDefect || workflowState.activeDefect.status === 'Closed');
    }
    if (workflowHeading) {
      workflowHeading.textContent = `${workflowState.activeDefect.aircraft} • ${workflowState.activeDefect.issue}`;
    }
    if (repeatMessage) {
      repeatMessage.textContent = workflowState.activeDefect.repeatDefect ? 'Repeat defect flagged from prior maintenance history.' : 'No prior occurrence found for this aircraft and defect title.';
    }
    if (workflowHistory) {
      workflowHistory.innerHTML = workflowState.history.map(entry => `<li>${entry.aircraft} — ${entry.issue} (${entry.status})</li>`).join('');
    }
    if (workflowSteps) {
      workflowSteps.innerHTML = workflowState.activeDefect.troubleshooting.length ? workflowState.activeDefect.troubleshooting.map(step => `<li>${step}</li>`).join('') : '<li>No troubleshooting steps logged yet.</li>';
    }
    if (attachmentList) {
      attachmentList.innerHTML = workflowState.activeDefect.attachments.length ? workflowState.activeDefect.attachments.map(fileName => `<span class="chip">${fileName}</span>`).join('') : '<span class="chip">No attachments</span>';
    }
    if (workflowRootCause) workflowRootCause.value = workflowState.activeDefect.rootCause;
    if (workflowAircraft) workflowAircraft.value = workflowState.activeDefect.aircraft;
    if (workflowIssue) workflowIssue.value = workflowState.activeDefect.issue;
    if (workflowDefectSource) workflowDefectSource.value = workflowState.activeDefect.defectSource || workflowState.activeDefect.severity || 'Maintenance Observation';
    renderDefectControl();
    updateDashboardCounters();
  }

  function addTroubleshootingStep(step) {
    const note = (step || '').trim();
    if (!note) return;
    workflowState.activeDefect.troubleshooting.push(note);
    workflowState.activeDefect.status = 'In Progress';
    const activeDefect = (workflowState.defects || []).find(defect => defect.id === workflowState.activeDefect.id);
    if (activeDefect) {
      activeDefect.troubleshooting = [...workflowState.activeDefect.troubleshooting];
      activeDefect.status = workflowState.activeDefect.status;
    }
    saveState();
    renderWorkflow();
  }

  function addAttachment(fileName) {
    const attachment = (fileName || '').trim();
    if (!attachment) return;
    workflowState.activeDefect.attachments.push(attachment);
    const activeDefect = (workflowState.defects || []).find(defect => defect.id === workflowState.activeDefect.id);
    if (activeDefect) {
      activeDefect.attachments = [...workflowState.activeDefect.attachments];
    }
    saveState();
    renderWorkflow();
  }

  function closeDefect(rootCause) {
    const cause = (rootCause || workflowState.activeDefect.rootCause || '').trim();
    workflowState.activeDefect.rootCause = cause;
    workflowState.activeDefect.status = 'Closed';
    const activeDefect = (workflowState.defects || []).find(defect => defect.id === workflowState.activeDefect.id);
    if (activeDefect) {
      activeDefect.status = 'Closed';
      activeDefect.rootCause = cause;
      activeDefect.closedAt = new Date().toISOString();
    }
    workflowState.history.push({
      aircraft: workflowState.activeDefect.aircraft,
      issue: workflowState.activeDefect.issue,
      status: 'Closed',
      rootCause: cause,
      reportedAt: new Date().toISOString()
    });
    saveState();
    renderWorkflow();
  }

  function saveNewDefect(payload) {
    const aircraftValue = (payload && payload.aircraft ? payload.aircraft : workflowState.activeDefect.aircraft || '').trim();
    const issueValue = (payload && payload.issue ? payload.issue : workflowState.activeDefect.issue || '').trim();
    const defectSourceValue = (payload && (payload.defectSource || payload.source || payload.severity) ? (payload.defectSource || payload.source || payload.severity) : (workflowState.activeDefect.defectSource || workflowState.activeDefect.severity || 'Maintenance Observation'));
    const descriptionValue = payload && payload.description ? payload.description : '';
    const reportDate = payload && payload.reportedAt ? payload.reportedAt : (payload && payload.date ? payload.date : new Date().toISOString());
    const repeatFlag = detectRepeatDefect(aircraftValue, issueValue, defectSourceValue, 10, reportDate);
    const defect = {
      id: `${Date.now()}`,
      aircraft: aircraftValue,
      issue: issueValue,
      defectSource: defectSourceValue,
      description: descriptionValue,
      reportedAt: reportDate,
      status: 'Open',
      repeatDefect: repeatFlag,
      troubleshooting: [],
      attachments: [],
      rootCause: ''
    };
    workflowState.defects = workflowState.defects || [];
    workflowState.defects.push(defect);
    workflowState.activeDefect = { ...defect, defectSource: defectSourceValue, repeatDefect: repeatFlag, troubleshooting: [], attachments: [], rootCause: '' };
    workflowState.history.push({ aircraft: aircraftValue, issue: issueValue, defectSource: defectSourceValue, status: 'Open', rootCause: '', reportedAt: reportDate });
    saveState();
    renderWorkflow();
    return defect;
  }

  function openWorkflowForDefect(defect) {
    if (typeof window === 'undefined') return;
    const targetPath = defect && defect.id ? `defect.html?id=${defect.id}` : 'defect.html';
    window.location.href = targetPath;
  }

  function updateRepeatHint() {
    if (typeof document === 'undefined') return;
    const aircraftInput = document.getElementById('newDefectAircraft');
    const issueInput = document.getElementById('newDefectIssue');
    const hintBadge = document.getElementById('repeatHint');
    const message = document.getElementById('newDefectMessage');
    if (!aircraftInput || !issueInput) return;
    const defectSourceInput = document.getElementById('newDefectSource');
    const repeatFlag = detectRepeatDefect(aircraftInput.value, issueInput.value, defectSourceInput ? defectSourceInput.value : '', 10, new Date().toISOString());
    if (hintBadge) {
      hintBadge.textContent = repeatFlag ? 'Repeat within 10 days' : 'Ready';
      hintBadge.classList.toggle('repeat', repeatFlag);
    }
    if (message) {
      message.textContent = repeatFlag ? 'A repeat defect was found within 10 days for this aircraft and issue.' : 'A repeat defect will be flagged within 10 days for the same aircraft and issue.';
    }
  }

  function wireWorkflow() {
    if (typeof document === 'undefined') {
      return;
    }
    const recordBtn = document.getElementById('workflowRecordBtn');
    const attachBtn = document.getElementById('workflowAttachBtn');
    const closeBtn = document.getElementById('workflowCloseBtn');
    const workflowAircraft = document.getElementById('workflowAircraft');
    const workflowIssue = document.getElementById('workflowIssue');
    const workflowDefectSource = document.getElementById('workflowDefectSource');
    const workflowNote = document.getElementById('workflowNote');
    const workflowAttachment = document.getElementById('workflowAttachment');
    const workflowRootCause = document.getElementById('workflowRootCause');
    const newDefectBtn = document.getElementById('newDefectBtn');
    const newDefectPanel = document.getElementById('newDefectPanel');
    const saveDefectBtn = document.getElementById('saveDefectBtn');
    const cancelDefectBtn = document.getElementById('cancelDefectBtn');
    const newDefectMessage = document.getElementById('newDefectMessage');
    const newDefectAircraft = document.getElementById('newDefectAircraft');
    const newDefectIssue = document.getElementById('newDefectIssue');
    const newDefectSource = document.getElementById('newDefectSource');
    const newDefectDescription = document.getElementById('newDefectDescription');
    const newDefectDate = document.getElementById('newDefectDate');

    if (recordBtn) {
      recordBtn.onclick = () => {
        addTroubleshootingStep(workflowNote ? workflowNote.value : '');
        if (workflowNote) workflowNote.value = '';
      };
    }
    if (attachBtn) {
      attachBtn.onclick = () => {
        addAttachment(workflowAttachment ? workflowAttachment.value : '');
        if (workflowAttachment) workflowAttachment.value = '';
      };
    }
    if (closeBtn) {
      closeBtn.onclick = () => {
        closeDefect(workflowRootCause ? workflowRootCause.value : '');
      };
    }
    [workflowAircraft, workflowIssue, workflowDefectSource].forEach(input => {
      if (input) {
        input.onchange = () => {
          if (workflowAircraft) workflowState.activeDefect.aircraft = workflowAircraft.value || workflowState.activeDefect.aircraft;
          if (workflowIssue) workflowState.activeDefect.issue = workflowIssue.value || workflowState.activeDefect.issue;
          if (workflowDefectSource) workflowState.activeDefect.defectSource = workflowDefectSource.value || workflowState.activeDefect.defectSource;
          renderWorkflow();
        };
      }
    });

    if (newDefectBtn && newDefectPanel) {
      newDefectBtn.addEventListener('click', event => {
        event.preventDefault();
        window.location.href = 'new-defect.html';
      });
      newDefectBtn.onclick = event => {
        event.preventDefault();
        window.location.href = 'new-defect.html';
      };
    }
    if (cancelDefectBtn && newDefectPanel) {
      cancelDefectBtn.onclick = () => {
        newDefectPanel.hidden = true;
      };
    }
    if (saveDefectBtn) {
      saveDefectBtn.onclick = () => {
        const defect = saveNewDefect({
          aircraft: newDefectAircraft ? newDefectAircraft.value : '',
          issue: newDefectIssue ? newDefectIssue.value : '',
          defectSource: newDefectSource ? newDefectSource.value : 'Maintenance Observation',
          description: newDefectDescription ? newDefectDescription.value : '',
          reportedAt: newDefectDate && newDefectDate.value ? new Date(newDefectDate.value).toISOString() : new Date().toISOString()
        });
        if (newDefectPanel) newDefectPanel.hidden = true;
        if (newDefectMessage) {
          newDefectMessage.textContent = `Saved defect ${defect.aircraft} — ${defect.issue}`;
        }
        openWorkflowForDefect(defect);
      };
    }
    [newDefectAircraft, newDefectIssue].forEach(input => {
      if (input) {
        input.oninput = updateRepeatHint;
        input.onchange = updateRepeatHint;
      }
    });
    if (newDefectSource) {
      newDefectSource.oninput = updateRepeatHint;
      newDefectSource.onchange = updateRepeatHint;
    }
  }

  function init() {
    renderWorkflow();
    wireWorkflow();
  }

  return { init, getWorkflowState, detectRepeatDefect, addTroubleshootingStep, addAttachment, closeDefect, saveNewDefect, openWorkflowForDefect };
});
