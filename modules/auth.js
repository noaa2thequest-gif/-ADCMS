(function(root, factory) {
  const api = factory(root);
  root.ADCMSAuth = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  // Initial users if none exist
  const defaultUsers = [
    { email: 'hany@adcms.com', password: '123', name: 'Hany Omar', role: 'admin', approved: true },
    { email: 'mcc@adcms.com', password: '123', name: 'MCC Team', role: 'mcc', approved: true },
    { email: 'eng@adcms.com', password: '123', name: 'Engineer', role: 'engineer', approved: true }
  ];

  function getUsers() {
    const users = localStorage.getItem('adcms_users');
    return users ? JSON.parse(users) : defaultUsers;
  }

  function saveUsers(users) {
    localStorage.setItem('adcms_users', JSON.stringify(users));
  }

  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      if (!user.approved) {
        errorMsg.textContent = 'Account pending approval by Admin.';
        errorMsg.style.display = 'block';
        return;
      }
      localStorage.setItem('adcms_logged_in_user', JSON.stringify(user));
      window.location.href = 'index.html';
    } else {
      errorMsg.textContent = 'Invalid email or password.';
      errorMsg.style.display = 'block';
    }
  }

  function logout() {
    localStorage.removeItem('adcms_logged_in_user');
    window.location.href = 'login.html';
  }

  function getCurrentUser() {
    const user = localStorage.getItem('adcms_logged_in_user');
    return user ? JSON.parse(user) : null;
  }

  function checkAccess() {
    const user = getCurrentUser();
    const path = window.location.pathname;

    // Allow login page always
    if (path.includes('login.html')) return;

    // Redirect to login if not logged in
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Role-based restrictions
    const restrictions = {
      'mcc': ['admin.html', 'surveillance.html'],
      'engineer': ['mcc-center.html', 'admin.html', 'reports.html'],
      'cabin': ['mcc-center.html', 'admin.html', 'reports.html', 'mel.html', 'surveillance.html'],
      'auditor': ['admin.html', 'mcc-center.html', 'new-defect.html']
    };

    const userRestrictions = restrictions[user.role] || [];
    const isRestricted = userRestrictions.some(r => path.includes(r));

    if (isRestricted) {
      alert('Access Denied: You do not have permission to view this page.');
      window.location.href = 'index.html';
    }
  }

  return {
    login,
    logout,
    getCurrentUser,
    checkAccess,
    getUsers,
    saveUsers
  };
});
