(function(root, factory) {
  const api = factory(root);
  root.ADCMSUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function renderNav() {
    const nav = document.getElementById('mainNav') || document.querySelector('nav');
    if (!nav) return;
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = [
      { href: 'index.html', icon: '⌂', text: 'Fleet Overview' },
      { href: 'dashboard.html', icon: '◫', text: 'Dashboard' },
      { href: 'aircraft.html', icon: '✈', text: 'Aircraft' },
      { href: 'defect-control.html', icon: '▱', text: 'Defect Control' },
      { href: 'mel.html', icon: '▤', text: 'MEL Management' },
      { href: 'stores.html', icon: '📦', text: 'Stores & Inventory' },
      { href: 'mcc-center.html', icon: '🎛️', text: 'MCC Center' },
      { href: 'admin.html', icon: '⚙', text: 'Administration' }
    ];

    nav.innerHTML = menuItems.map(item => `
      <a href="${item.href}" class="${currentPage === item.href ? 'active' : ''}">
        ${item.icon} <span>${item.text}</span>
      </a>
    `).join('');
  }

  function bindShellInteractions() {
    const darkToggle = document.getElementById('darkToggle');
    if (darkToggle) darkToggle.onclick = () => document.body.classList.toggle('dark');
    
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
      menuBtn.onclick = () => sidebar.classList.toggle('open');
    }
  }

  function init() {
    renderNav();
    bindShellInteractions();
    const v = document.getElementById('appVersion');
    if (v) v.innerHTML = `Version 1.1 (Stable)<br>© 2026 ADCMS`;
  }

  return { init, renderNav, bindShellInteractions };
});
