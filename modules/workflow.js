(function(root, factory) {
  const api = factory(root);
  root.ADCMSWorkflow = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  const workflowState = data.workflowState;

  async function updateDashboardCounters() {
    if (root.ADCMSDashboard && typeof root.ADCMSDashboard.refreshCounters === 'function') {
      await root.ADCMSDashboard.refreshCounters();
    }
  }

  function isWithinDays(referenceDate, compareDate, days) {
    if (!referenceDate || !compareDate) return false;
    const refDate = new Date(referenceDate);
    const compDate = new Date(compareDate);
    const diff = refDate.getTime() - compDate.getTime();
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
  }

  async function detectRepeatDefect(aircraftId, issueTitle, defectSource = '', days = 10, referenceDate = new Date().toISOString()) {
    const aircraftValue = (aircraftId || '').trim().toLowerCase();
    const issueValue = (issueTitle || '').trim().toLowerCase();
    
    const defects = await data.getDefects();
    // In a real scenario, we'd also fetch historical/closed defects from a 'history' table
    const entries = defects; 
    
    const related = entries.filter(entry => {
      if (!entry || entry.aircraft.toLowerCase() !== aircraftValue || entry.issue.toLowerCase() !== issueValue) {
        return false;
      }
      return isWithinDays(referenceDate, entry.reportedAt || entry.date, days);
    });

    return {
      isRepeat: related.length >= 1,
      isChronic: related.length >= 3,
      count: related.length
    };
  }

  async function renderDefectControl() {
    if (typeof document === 'undefined') return;
    const list = document.getElementById('defectControlList');
    if (!list) return;
    
    try {
      const defects = await data.getDefects();
      if (!defects || !defects.length) {
        list.innerHTML = '<p class="empty-state">No defects logged yet.</p>';
        return;
      }
      
      list.innerHTML = defects.map(defect => `
        <article class="defect-control-item">
          <div class="defect-control-head">
            <strong>${defect.aircraft} • ${defect.issue}</strong>
            <span class="tag ${defect.status === 'Closed' || defect.status === 'closed' ? 'serviceable' : 'aog'}">${defect.status}</span>
          </div>
          <div class="defect-meta">
            <span>${defect.source || 'Maintenance Observation'}</span>
            <span>${new Date(defect.reportedAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <p>${defect.description || 'No description provided yet.'}</p>
        </article>
      `).join('');
    } catch (error) {
      console.error('Error rendering defect control:', error);
    }
  }

  async function saveNewDefect(payload) {
    const aircraftValue = (payload.aircraft || '').trim();
    const issueValue = (payload.issue || '').trim();
    const sourceValue = payload.source || payload.severity || 'Medium';
    const descriptionValue = payload.description || '';
    const reportDate = payload.reportedAt || new Date().toISOString();
    
    const repeatInfo = await detectRepeatDefect(aircraftValue, issueValue, sourceValue, 10, reportDate);

    const defectData = {
      aircraft: aircraftValue,
      issue: issueValue,
      source: sourceValue,
      description: descriptionValue,
      reportedAt: reportDate,
      status: 'open',
      isMEL: payload.isMEL || false,
      melCategory: payload.melCategory || null,
      melExpiry: payload.melExpiry || null
    };

    try {
      const newDefect = await data.addDefect(defectData);
      await updateDashboardCounters();
      await renderDefectControl();
      
      if (repeatInfo.isChronic) {
        alert(`🚨 CHRONIC DEFECT DETECTED!\nThis is the ${repeatInfo.count + 1}th occurrence in 10 days.`);
      }
      
      return newDefect;
    } catch (error) {
      console.error('Error saving new defect:', error);
      throw error;
    }
  }

  async function updateRepeatHint() {
    if (typeof document === 'undefined') return;
    const aircraftInput = document.getElementById('newDefectAircraft');
    const issueInput = document.getElementById('newDefectIssue');
    const hintBadge = document.getElementById('repeatHint');
    
    if (!aircraftInput || !issueInput || !hintBadge) return;
    
    const aircraft = aircraftInput.value;
    const issue = issueInput.value;
    
    if (aircraft && issue.length > 3) {
      const repeatInfo = await detectRepeatDefect(aircraft, issue);
      if (repeatInfo.isChronic) {
        hintBadge.textContent = 'CHRONIC ALERT';
        hintBadge.className = 'tag aog';
      } else if (repeatInfo.isRepeat) {
        hintBadge.textContent = 'REPEAT DEFECT';
        hintBadge.className = 'tag deferred';
      } else {
        hintBadge.textContent = 'NEW DEFECT';
        hintBadge.className = 'tag serviceable';
      }
    }
  }

  async function init() {
    await renderDefectControl();
    await updateDashboardCounters();
    
    // Bind UI elements if they exist
    const aircraftInput = document.getElementById('newDefectAircraft');
    const issueInput = document.getElementById('newDefectIssue');
    if (aircraftInput) aircraftInput.addEventListener('input', updateRepeatHint);
    if (issueInput) issueInput.addEventListener('input', updateRepeatHint);
  }

  return {
    init,
    renderDefectControl,
    saveNewDefect,
    detectRepeatDefect,
    updateRepeatHint
  };
});
