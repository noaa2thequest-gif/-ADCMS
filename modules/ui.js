(function(root, factory) {
  const api = factory(root);
  root.ADCMSUI = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function updateVersionBadge(versionData) {
    const versionLabel = typeof document !== 'undefined' ? document.getElementById('appVersion') : null;
    if (!versionLabel || !versionData) return;
    versionLabel.innerHTML = `Version ${versionData.major}.${versionData.minor} (Build ${String(versionData.build).padStart(2, '0')})<br>© 2026 ADCMS`;
  }

  function bindShellInteractions() {
    if (typeof document === 'undefined') return;
    const darkToggle = document.getElementById('darkToggle');
    if (darkToggle) {
      darkToggle.onclick = () => document.body.classList.toggle('dark');
    }
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn) {
      menuBtn.onclick = () => {
        if (sidebar) {
          sidebar.classList.toggle('open');
        }
      };
    }
    document.addEventListener('click', e => {
      if (window.innerWidth < 700 && !e.target.closest('#sidebar') && !e.target.closest('#menuBtn')) {
        if (sidebar) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  function init() {
    const data = root.ADCMSData;
    if (data && data.appVersion) {
      updateVersionBadge(data.appVersion);
    }
    bindShellInteractions();
  }

  return { init, updateVersionBadge, bindShellInteractions };
});
