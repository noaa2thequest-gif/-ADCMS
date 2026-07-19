(function(root, factory) {
  const api = factory(root);
  root.ADCMSAuth = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  
  // Supabase Configuration (Placeholders)
  const SUPABASE_URL = 'https://YOUR_PROJECT_URL.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
  
  let supabase = null;
  let useCloud = false;

  // Initial users if none exist
  const defaultUsers = [
    { email: 'hany@adcms.com', password: '123', name: 'Hany Omar', role: 'admin', approved: true },
    { email: 'mcc@adcms.com', password: '123', name: 'MCC Team', role: 'mcc', approved: true },
    { email: 'eng@adcms.com', password: '123', name: 'Engineer', role: 'engineer', approved: true }
  ];
  
  // Initialize Supabase
  const initSupabase = async () => {
    // Only try to init if we have valid credentials (not placeholders)
    if (window.supabase && SUPABASE_URL.includes('supabase.co') && !SUPABASE_URL.includes('YOUR_PROJECT_URL')) {
      try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useCloud = true;
        console.log('✅ Supabase Auth initialized');
        return true;
      } catch (error) {
        console.error('❌ Supabase Auth init failed:', error);
        useCloud = false;
        return false;
      }
    }
    useCloud = false;
    return false;
  };
  
  // Auto-initialize on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
      initSupabase();
    }
  }

  async function getUsers() {
    if (useCloud && supabase) {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (users && users.length > 0) return users;
      } catch (error) {
        console.warn('⚠️ Cloud user fetch failed:', error);
      }
    }
    
    // Fallback to localStorage
    const users = localStorage.getItem('adcms_users');
    return users ? JSON.parse(users) : defaultUsers;
  }

  async function saveUsers(users) {
    if (useCloud && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert(users, { onConflict: 'email' });
        
        if (error) throw error;
        console.log('✅ Users saved to cloud');
      } catch (error) {
        console.warn('⚠️ Cloud user save failed:', error);
      }
    }
    
    // Always save to localStorage as fallback
    localStorage.setItem('adcms_users', JSON.stringify(users));
  }

  async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMsg');
    const loginBtn = document.querySelector('button[onclick="ADCMSAuth.login()"]') || document.querySelector('.login-btn');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      if (errorMsg) {
        errorMsg.textContent = 'Please enter both email and password.';
        errorMsg.style.display = 'block';
      }
      return;
    }

    // Visual feedback
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
    }

    try {
      const users = await getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && String(u.password) === String(password));

      if (user) {
        if (!user.approved) {
          if (errorMsg) {
            errorMsg.textContent = 'Account pending approval by Admin.';
            errorMsg.style.display = 'block';
          }
        } else {
          localStorage.setItem('adcms_logged_in_user', JSON.stringify(user));
          window.location.href = 'index.html';
        }
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid email or password.';
          errorMsg.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (errorMsg) {
        errorMsg.textContent = 'An error occurred during login.';
        errorMsg.style.display = 'block';
      }
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login to Dashboard';
      }
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
  
  async function getCurrentUserAsync() {
    return getCurrentUser();
  }

  function checkAccess() {
    const user = getCurrentUser();
    const path = window.location.pathname;

    if (path.includes('login.html')) return;

    if (!user) {
      window.location.href = 'login.html';
      return;
    }

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
    getCurrentUserAsync,
    checkAccess,
    getUsers,
    saveUsers,
    initCloud: initSupabase
  };
});
