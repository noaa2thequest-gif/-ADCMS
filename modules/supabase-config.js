// Supabase Configuration
const SUPABASE_URL = 'https://tfgioiziknxqrfrodkkc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9hZupGiWDWs2k5p_rJYt7g_x6aezzRl';

// Initialize Supabase Client
const supabaseClient = (() => {
  if (typeof window === 'undefined') return null;
  
  // Check if supabase is already loaded
  if (window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  // Fallback: create a simple client
  return {
    from: (table) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    supabaseClient
  };
}
