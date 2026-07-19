if (typeof window !== 'undefined') {
  // Initialize Cloud Connection and App
  (async () => {
    try {
      // 1. Initialize Cloud Connection
      if (window.ADCMSData && typeof window.ADCMSData.initCloud === 'function') {
        try {
          await window.ADCMSData.initCloud();
          console.log('☁️ Cloud initialization completed');
        } catch (e) {
          console.warn('Cloud init failed, falling back to local');
        }
      }
      
      // 2. Security Check
      if (window.ADCMSAuth) {
        window.ADCMSAuth.checkAccess();
      }

      // 3. Initialize Modules based on presence in DOM
      const { ADCMSUI, ADCMSDashboard, ADCMSWorkflow, ADCMSAdmin, ADCMSNewDefect, 
              ADCMSMEL, ADCMSDefectDetails, ADCMSAircraftStatus, ADCMSSurveillance, 
              ADCMSReports, ADCMSCabinDefects, ADCMSMCCCenter, ADCMSStores } = window;

      if (ADCMSUI) ADCMSUI.init();

      // Dashboard
      if (ADCMSDashboard && document.getElementById('aircraftGrid')) {
        await ADCMSDashboard.init();
      }

      // Workflow & Defects
      if (ADCMSWorkflow) {
        const isDefectPage = document.getElementById('defectControlList') || 
                             document.getElementById('newDefectBtn') || 
                             window.location.pathname.includes('new-defect.html');
        if (isDefectPage) await ADCMSWorkflow.init();
      }

      // Administration
      if (ADCMSAdmin && (document.getElementById('addAircraftBtn') || window.location.pathname.includes('admin.html'))) {
        await ADCMSAdmin.init();
      }

      // New Defect
      if (ADCMSNewDefect && (document.getElementById('newDefectIsMel') || window.location.pathname.includes('new-defect.html'))) {
        await ADCMSNewDefect.init();
      }

      // MEL Management
      if (ADCMSMEL && (document.getElementById('melStats') || window.location.pathname.includes('mel.html'))) {
        await ADCMSMEL.init();
      }

      // Defect Details
      if (ADCMSDefectDetails && (document.getElementById('defectHeader') || window.location.pathname.includes('defect.html'))) {
        await ADCMSDefectDetails.init();
      }

      // Aircraft Status
      if (ADCMSAircraftStatus && (document.getElementById('aircraftHeader') || window.location.pathname.includes('aircraft-status.html'))) {
        await ADCMSAircraftStatus.init();
      }

      // Surveillance & SAFA
      if (ADCMSSurveillance && (document.getElementById('safaAircraft') || window.location.pathname.includes('surveillance.html'))) {
        await ADCMSSurveillance.init();
      }

      // Reports
      if (ADCMSReports && (document.getElementById('summaryGrid') || window.location.pathname.includes('reports.html'))) {
        await ADCMSReports.init();
      }

      // Cabin Defects
      if (ADCMSCabinDefects && (document.getElementById('cabinDefectsGrid') || window.location.pathname.includes('cabin-defects.html'))) {
        await ADCMSCabinDefects.init();
      }

      // MCC Center
      if (ADCMSMCCCenter && (document.getElementById('mccMelList') || window.location.pathname.includes('mcc-center.html'))) {
        await ADCMSMCCCenter.init();
      }

      // Stores
      if (ADCMSStores && (document.getElementById('storesTable') || window.location.pathname.includes('stores.html'))) {
        await ADCMSStores.init();
      }

      console.log('✅ ADCMS Modules Initialized');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    }
  })();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    async init() {
      if (typeof window !== 'undefined') {
        if (window.ADCMSData && typeof window.ADCMSData.initCloud === 'function') {
          await window.ADCMSData.initCloud();
        }
        if (window.ADCMSUI) window.ADCMSUI.init();
        if (window.ADCMSDashboard) await window.ADCMSDashboard.init();
      }
    }
  };
}
