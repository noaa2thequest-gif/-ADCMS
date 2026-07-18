if (typeof window !== 'undefined') {
  const { ADCMSUI } = window;
  const { ADCMSDashboard } = window;
  const { ADCMSWorkflow } = window;
  const { ADCMSAdmin } = window;

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
  if (ADCMSAdmin && typeof document !== 'undefined') {
    const shouldInitAdmin = document.getElementById('addAircraftBtn') || window.location.pathname.includes('admin.html');
    if (shouldInitAdmin) {
      ADCMSAdmin.init();
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
