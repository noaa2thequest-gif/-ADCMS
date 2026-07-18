if (typeof window !== 'undefined') {
  const { ADCMSUI } = window;
  const { ADCMSDashboard } = window;
  const { ADCMSWorkflow } = window;

  ADCMSUI.init();
  if (ADCMSDashboard) {
    ADCMSDashboard.init();
  }
  if (ADCMSWorkflow && typeof document !== 'undefined') {
    const shouldInitWorkflow = document.getElementById('workflowBadge') || document.getElementById('newDefectBtn') || document.getElementById('saveDefectBtn') || window.location.pathname.includes('new-defect.html');
    if (shouldInitWorkflow) {
      ADCMSWorkflow.init();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init() {
      if (typeof window !== 'undefined') {
        const { ADCMSUI } = window;
        const { ADCMSDashboard } = window;
        const { ADCMSWorkflow } = window;
        if (ADCMSUI) ADCMSUI.init();
        if (ADCMSDashboard) ADCMSDashboard.init();
        if (ADCMSWorkflow) ADCMSWorkflow.init();
      }
    }
  };
}
