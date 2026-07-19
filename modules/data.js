(function(root, factory) {
  const api = factory(root);
  root.ADCMSData = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const storageKey = 'adcms-workflow-state-v1';
  const aircraftStorageKey = 'adcms-aircraft-fleet-v1';
  
  // Supabase Cloud Configuration
  const SUPABASE_URL = 'https://tfgioiziknxqrfrodkkc.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_9hZupGiWDWs2k5p_rJYt7g_x6aezzRl';
  
  let supabase = null;
  let useCloud = false;
  
  // Initialize Supabase
  const initSupabase = async () => {
    if (window.supabase && !supabase) {
      try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useCloud = true;
        console.log('✅ Supabase Cloud initialized successfully');
        return true;
      } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
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
  
  const defaultWorkflowState = {
    activeDefect: null,
    history: [],
    defects: []
  };

  // Default aircraft data - Empty by default, user adds their own
  const defaultAircraft = [];

  function loadState() {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function loadAircraft() {
    if (typeof localStorage === 'undefined') {
      return defaultAircraft;
    }
    try {
      const raw = localStorage.getItem(aircraftStorageKey);
      return raw ? JSON.parse(raw) : defaultAircraft;
    } catch (error) {
      return defaultAircraft;
    }
  }

  function normalizeState(savedState) {
    const state = savedState || defaultWorkflowState;
    return {
      activeDefect: { ...defaultWorkflowState.activeDefect, ...(state.activeDefect || {}) },
      history: Array.isArray(state.history) ? state.history : [...defaultWorkflowState.history],
      defects: Array.isArray(state.defects) ? state.defects : []
    };
  }

  const workflowState = normalizeState(loadState());
  let aircraftFleet = loadAircraft();

  // Defect sources for breakdown - Reset to zero
  const defectSources = [
    { source: 'AOG', count: 0, color: 'red-dot', percentage: 0 },
    { source: 'High', count: 0, color: 'orange-dot', percentage: 0 },
    { source: 'Medium', count: 0, color: 'yellow-dot', percentage: 0 },
    { source: 'Low', count: 0, color: 'green-dot', percentage: 0 }
  ];

  // Fleet status breakdown - Reset to zero
  const fleetStatus = {
    serviceable: { count: 0, percentage: 0, status: 'Serviceable' },
    deferred: { count: 0, percentage: 0, status: 'Deferred' },
    aog: { count: 0, percentage: 0, status: 'AOG' },
    maintenance: { count: 0, percentage: 0, status: 'In Maintenance' }
  };

  return {
    // Initialize cloud connection
    async initCloud() {
      return await initSupabase();
    },
    
    // Aircraft management - Cloud-first with fallback
    async getAircraft() {
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('aircraft')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data && data.length > 0) {
            aircraftFleet = data.map(d => ({
              id: d.id,
              registration: d.registration,
              model: d.model,
              msn: d.msn,
              engines: d.engines,
              manufacturingDate: d.manufacturing_date,
              status: d.status || 'SERVICEABLE',
              location: d.location || 'CAI',
              openDefects: 0,
              melItems: 0,
              lastUpdate: 'Just now'
            }));
            return aircraftFleet;
          }
        } catch (error) {
          console.warn('⚠️ Cloud fetch failed, using local:', error);
        }
      }
      return aircraftFleet;
    },

    async addAircraft(aircraftData) {
      const newAircraft = {
        id: 'ac-' + Date.now(),
        registration: aircraftData.registration,
        model: aircraftData.model,
        msn: aircraftData.msn,
        engines: aircraftData.engines,
        manufacturingDate: aircraftData.manufacturingDate,
        status: aircraftData.status || 'SERVICEABLE',
        location: aircraftData.location || 'CAI',
        openDefects: 0,
        melItems: 0,
        lastUpdate: 'Just now'
      };
      
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('aircraft')
            .insert([{
              registration: newAircraft.registration,
              model: newAircraft.model,
              msn: newAircraft.msn,
              engines: newAircraft.engines,
              manufacturing_date: newAircraft.manufacturingDate,
              location: newAircraft.location,
              status: newAircraft.status,
              created_at: new Date().toISOString()
            }]);
          
          if (error) throw error;
          console.log('✅ Aircraft added to cloud');
        } catch (error) {
          console.warn('⚠️ Cloud insert failed, saving locally:', error);
        }
      }
      
      aircraftFleet.push(newAircraft);
      this.persistAircraft();
      return newAircraft;
    },

    async updateAircraft(aircraftId, updates) {
      const aircraft = aircraftFleet.find(a => a.id === aircraftId);
      if (aircraft) {
        Object.assign(aircraft, updates);
        
        if (useCloud && supabase) {
          try {
            const { error } = await supabase
              .from('aircraft')
              .update({
                registration: updates.registration || aircraft.registration,
                status: updates.status || aircraft.status,
                location: updates.location || aircraft.location
              })
              .eq('id', aircraftId);
            
            if (error) throw error;
            console.log('✅ Aircraft updated in cloud');
          } catch (error) {
            console.warn('⚠️ Cloud update failed:', error);
          }
        }
        
        this.persistAircraft();
        return aircraft;
      }
      return null;
    },

    async deleteAircraft(aircraftId) {
      const index = aircraftFleet.findIndex(a => a.id === aircraftId);
      if (index > -1) {
        aircraftFleet.splice(index, 1);
        
        if (useCloud && supabase) {
          try {
            const { error } = await supabase
              .from('aircraft')
              .delete()
              .eq('id', aircraftId);
            
            if (error) throw error;
            console.log('✅ Aircraft deleted from cloud');
          } catch (error) {
            console.warn('⚠️ Cloud delete failed:', error);
          }
        }
        
        this.persistAircraft();
        return true;
      }
      return false;
    },

    getAircraftByRegistration(registration) {
      return aircraftFleet.find(a => a.registration === registration);
    },

    persistAircraft() {
      if (typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.setItem(aircraftStorageKey, JSON.stringify(aircraftFleet));
      } catch (error) {
        console.error('Error persisting aircraft:', error);
      }
    },

    // Legacy properties for compatibility
    aircraft: aircraftFleet,
    defectSources: defectSources,
    fleetStatus: fleetStatus,
    appVersion: { major: 1, minor: 0, build: 1 },
    workflowState,

    persistState() {
      if (typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(workflowState));
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    },

    // Defect management - Cloud-first with fallback
    async addDefect(defectData) {
      const newDefect = {
        id: 'def-' + Date.now(),
        aircraft: defectData.aircraft,
        issue: defectData.issue,
        source: defectData.source || 'Medium',
        reportedAt: new Date().toISOString(),
        reportDate: new Date().toISOString(),
        status: defectData.status || 'open',
        isMEL: defectData.isMEL || false,
        melCategory: defectData.melCategory,
        melExpiry: defectData.melExpiry
      };
      
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('defects')
            .insert([{
              aircraft_id: defectData.aircraft,
              title: defectData.issue,
              description: defectData.description || '',
              source: newDefect.source,
              date_reported: newDefect.reportedAt,
              is_mel: newDefect.isMEL,
              mel_category: newDefect.melCategory,
              mel_expiry: newDefect.melExpiry,
              status: 'open',
              created_at: newDefect.reportedAt
            }]);
          
          if (error) throw error;
          console.log('✅ Defect added to cloud');
        } catch (error) {
          console.warn('⚠️ Cloud defect insert failed:', error);
        }
      }
      
      workflowState.defects.push(newDefect);
      this.persistState();
      return newDefect;
    },
    
    async getDefects() {
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('defects')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data && data.length > 0) {
            // Map cloud data to local format
            workflowState.defects = data.map(d => ({
              id: d.id,
              aircraft: d.aircraft_id,
              issue: d.title,
              source: d.source,
              reportedAt: d.date_reported,
              reportDate: d.date_reported,
              status: d.status,
              isMEL: d.is_mel,
              melCategory: d.mel_category,
              melExpiry: d.mel_expiry
            }));
            return workflowState.defects;
          }
        } catch (error) {
          console.warn('⚠️ Cloud defect fetch failed:', error);
        }
      }
      return workflowState.defects || [];
    },
    
    async updateDefect(defectId, updates) {
      const defect = workflowState.defects.find(d => d.id === defectId);
      if (defect) {
        Object.assign(defect, updates);
        
        if (useCloud && supabase) {
          try {
            const { error } = await supabase
              .from('defects')
              .update({
                status: updates.status || defect.status,
                is_mel: updates.isMEL !== undefined ? updates.isMEL : defect.isMEL,
                mel_category: updates.melCategory || defect.melCategory,
                mel_expiry: updates.melExpiry || defect.melExpiry
              })
              .eq('id', defectId);
            
            if (error) throw error;
            console.log('✅ Defect updated in cloud');
          } catch (error) {
            console.warn('⚠️ Cloud defect update failed:', error);
          }
        }
        
        this.persistState();
        return defect;
      }
      return null;
    },
    
    // MEL management
    async getMELs() {
      const allDefects = await this.getDefects();
      return allDefects.filter(d => d.isMEL);
    },
    
    // User management - Cloud-first with fallback
    async addUser(userData) {
      const newUser = {
        id: 'user-' + Date.now(),
        email: userData.email,
        name: userData.name,
        role: userData.role || 'viewer',
        approved: userData.approved || false,
        createdAt: new Date().toISOString()
      };
      
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([{
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              approved: newUser.approved,
              created_at: newUser.createdAt
            }]);
          
          if (error) throw error;
          console.log('✅ User added to cloud');
        } catch (error) {
          console.warn('⚠️ Cloud user insert failed:', error);
        }
      }
      
      return newUser;
    },
    
    async getUsers() {
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data) return data;
        } catch (error) {
          console.warn('⚠️ Cloud user fetch failed:', error);
        }
      }
      return [];
    },
    
    async updateUser(userId, updates) {
      if (useCloud && supabase) {
        try {
          const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);
          
          if (error) throw error;
          console.log('✅ User updated in cloud');
          return true;
        } catch (error) {
          console.warn('⚠️ Cloud user update failed:', error);
        }
      }
      return false;
    },
    
    // Spares/Inventory management - Cloud-first with fallback
    async addSpare(spareData) {
      const newSpare = {
        id: 'spare-' + Date.now(),
        partNumber: spareData.partNumber,
        description: spareData.description,
        quantity: spareData.quantity,
        location: spareData.location,
        createdAt: new Date().toISOString()
      };
      
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('spares')
            .insert([{
              part_number: newSpare.partNumber,
              description: newSpare.description,
              quantity: newSpare.quantity,
              location: newSpare.location,
              created_at: newSpare.createdAt
            }]);
          
          if (error) throw error;
          console.log('✅ Spare added to cloud');
        } catch (error) {
          console.warn('⚠️ Cloud spare insert failed:', error);
        }
      }
      
      return newSpare;
    },
    
    async getSpares() {
      if (useCloud && supabase) {
        try {
          const { data, error } = await supabase
            .from('spares')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data) return data;
        } catch (error) {
          console.warn('⚠️ Cloud spare fetch failed:', error);
        }
      }
      return [];
    },

    checkRepeatDefect(aircraft, issue) {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      const allDefects = workflowState.defects || [];
      const history = workflowState.history || [];
      
      // Combine active and historical defects for analysis
      const combined = [...allDefects, ...history];
      
      const related = combined.filter(d => 
        d.aircraft === aircraft && 
        d.issue.toLowerCase().includes(issue.toLowerCase()) && 
        new Date(d.reportDate || d.reportedAt) >= tenDaysAgo
      );
      
      return {
        isRepeat: related.length >= 1,
        isChronic: related.length >= 3,
        count: related.length
      };
    }
  };
});
