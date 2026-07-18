(function(root, factory) {
  const api = factory(root);
  root.ADCMSWorkflow = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  const workflowState = data.workflowState;

  function getWorkflowState() {
    return {
      activeDefect: {
        ...workflowState.activeDefect,
        troubleshooting: [...workflowState.activeDefect.troubleshooting],
        attachments: [...workflowState.activeDefect.attachments]
      },
      history: [...workflowState.history]
    };
  }

  function detectRepeatDefect(aircraftId, issueTitle) {
    const aircraftValue = (aircraftId || '').trim().toLowerCase();
    const issueValue = (issueTitle || '').trim().toLowerCase();
    return workflowState.history.some(entry => entry.aircraft.toLowerCase() === aircraftValue && entry.issue.toLowerCase() === issueValue);
  }

  function renderWorkflow() {
    if (typeof document === 'undefined') {
      return;
    }
    const workflowBadge = document.getElementById('workflowBadge');
    const repeatMessage = document.getElementById('repeatMessage');
    const workflowHistory = document.getElementById('workflowHistory');
    const workflowSteps = document.getElementById('workflowSteps');
    const attachmentList = document.getElementById('attachmentList');
    const workflowRootCause = document.getElementById('workflowRootCause');
    const workflowAircraft = document.getElementById('workflowAircraft');
    const workflowIssue = document.getElementById('workflowIssue');
    const workflowSeverity = document.getElementById('workflowSeverity');

    workflowState.activeDefect.repeatDefect = detectRepeatDefect(workflowState.activeDefect.aircraft, workflowState.activeDefect.issue);
    if (workflowBadge) {
      workflowBadge.textContent = workflowState.activeDefect.status;
      workflowBadge.classList.toggle('repeat', workflowState.activeDefect.repeatDefect || workflowState.activeDefect.status === 'Closed');
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
    if (workflowSeverity) workflowSeverity.value = workflowState.activeDefect.severity;
  }

  function addTroubleshootingStep(step) {
    const note = (step || '').trim();
    if (!note) return;
    workflowState.activeDefect.troubleshooting.push(note);
    workflowState.activeDefect.status = 'In Progress';
    renderWorkflow();
  }

  function addAttachment(fileName) {
    const attachment = (fileName || '').trim();
    if (!attachment) return;
    workflowState.activeDefect.attachments.push(attachment);
    renderWorkflow();
  }

  function closeDefect(rootCause) {
    const cause = (rootCause || workflowState.activeDefect.rootCause || '').trim();
    workflowState.activeDefect.rootCause = cause;
    workflowState.activeDefect.status = 'Closed';
    workflowState.history.push({
      aircraft: workflowState.activeDefect.aircraft,
      issue: workflowState.activeDefect.issue,
      status: 'Closed',
      rootCause: cause
    });
    renderWorkflow();
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
    const workflowSeverity = document.getElementById('workflowSeverity');
    const workflowNote = document.getElementById('workflowNote');
    const workflowAttachment = document.getElementById('workflowAttachment');
    const workflowRootCause = document.getElementById('workflowRootCause');

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
    [workflowAircraft, workflowIssue, workflowSeverity].forEach(input => {
      if (input) {
        input.onchange = () => {
          if (workflowAircraft) workflowState.activeDefect.aircraft = workflowAircraft.value || workflowState.activeDefect.aircraft;
          if (workflowIssue) workflowState.activeDefect.issue = workflowIssue.value || workflowState.activeDefect.issue;
          if (workflowSeverity) workflowState.activeDefect.severity = workflowSeverity.value || workflowState.activeDefect.severity;
          renderWorkflow();
        };
      }
    });
  }

  function init() {
    renderWorkflow();
    wireWorkflow();
  }

  return { init, getWorkflowState, detectRepeatDefect, addTroubleshootingStep, addAttachment, closeDefect };
});
