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
  const { ADCMSNewDefect } = window;
  if (ADCMSNewDefect && typeof document !== 'undefined') {
    const shouldInitNewDefect = document.getElementById('newDefectIsMel') || window.location.pathname.includes('new-defect.html');
    if (shouldInitNewDefect) {
      ADCMSNewDefect.init();
    }
  }
  const { ADCMSMEL } = window;
  if (ADCMSMEL && typeof document !== 'undefined') {
    const shouldInitMEL = document.getElementById('melStats') || window.location.pathname.includes('mel.html');
    if (shouldInitMEL) {
      ADCMSMEL.init();
    }
  }
  const { ADCMSDefectDetails } = window;
  if (ADCMSDefectDetails && typeof document !== 'undefined') {
    const shouldInitDetails = document.getElementById('defectHeader') || window.location.pathname.includes('defect.html');
    if (shouldInitDetails) {
      ADCMSDefectDetails.init();
    }
  }
  const { ADCMSAircraftStatus } = window;
  if (ADCMSAircraftStatus && typeof document !== 'undefined') {
    const shouldInitStatus = document.getElementById('aircraftHeader') || window.location.pathname.includes('aircraft-status.html');
    if (shouldInitStatus) {
      ADCMSAircraftStatus.init();
    }
  }
  const { ADCMSSurveillance } = window;
  if (ADCMSSurveillance && typeof document !== 'undefined') {
    const shouldInitSurveillance = document.getElementById('safaAircraft') || window.location.pathname.includes('surveillance.html');
    if (shouldInitSurveillance) {
      ADCMSSurveillance.init();
    }
  }
  const { ADCMSReports } = window;
  if (ADCMSReports && typeof document !== 'undefined') {
    const shouldInitReports = document.getElementById('summaryGrid') || window.location.pathname.includes('reports.html');
    if (shouldInitReports) {
      ADCMSReports.init();
    }
  }
  const { ADCMSCabinDefects } = window;
  if (ADCMSCabinDefects && typeof document !== 'undefined') {
    const shouldInitCabin = document.getElementById('cabinDefectsGrid') || window.location.pathname.includes('cabin-defects.html');
    if (shouldInitCabin) {
      ADCMSCabinDefects.init();
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
