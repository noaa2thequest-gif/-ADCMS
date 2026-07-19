(function(root, factory) {
  const api = factory(root);
  root.ADCMSAuth = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  
  // Supabase Configuration
  const SUPABASE_URL = 'https://tfgioiziknxqrfrodkkc.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_9hZupGiWDWs2k5p_rJYt7g_x6aezzRl';
  
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
    if (window.supabase && !supabase) {
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
    return false;
  };
  
  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const users = await getUsers();
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
    if (useCloud && supabase) {
      supabase.auth.signOut().catch(e => console.warn('Signout warning:', e));
    }
    window.location.href = 'login.html';
  }

  function getCurrentUser() {
    const user = localStorage.getItem('adcms_logged_in_user');
    return user ? JSON.parse(user) : null;
  }
  
  async function getCurrentUserAsync() {
    const user = getCurrentUser();
    if (user) return user;
    
    if (useCloud && supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();
          return userData;
        }
      } catch (error) {
        console.warn('⚠️ Cloud user fetch failed:', error);
      }
    }
    return null;
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
    getCurrentUserAsync,
    checkAccess,
    getUsers,
    saveUsers,
    initCloud: initSupabase
  };
});
