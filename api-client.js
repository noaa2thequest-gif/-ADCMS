// API Client for ADCMS - Replaces localStorage with real API calls
(function(root, factory) {
  const api = factory(root);
  root.ADCMSApi = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const API_BASE = '/api/trpc';
  
  // Helper to make tRPC calls
  async function callApi(procedure, input = {}) {
    try {
      const response = await fetch(`${API_BASE}/${procedure}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle tRPC response format
      if (data.result && data.result.data) {
        return data.result.data;
      }
      
      return data;
    } catch (error) {
      console.error(`API call failed for ${procedure}:`, error);
      throw error;
    }
  }

  return {
    // Aircraft operations
    aircraft: {
      async list() {
        return callApi('aircraft.list');
      },
      
      async get(id) {
        return callApi('aircraft.get', { id });
      },
      
      async create(data) {
        return callApi('aircraft.create', data);
      },
      
      async updateStatus(id, status) {
        return callApi('aircraft.updateStatus', { id, status });
      },
      
      async delete(id) {
        return callApi('aircraft.delete', { id });
      }
    },

    // Defect operations
    defect: {
      async list(aircraftId) {
        return callApi('defect.list', aircraftId ? { aircraftId } : {});
      },
      
      async get(id) {
        return callApi('defect.get', { id });
      },
      
      async create(data) {
        return callApi('defect.create', data);
      },
      
      async updateStatus(id, status) {
        return callApi('defect.updateStatus', { id, status });
      },
      
      async delete(id) {
        return callApi('defect.delete', { id });
      }
    },

    // MEL operations
    mel: {
      async list(defectId) {
        return callApi('mel.list', defectId ? { defectId } : {});
      },
      
      async create(data) {
        return callApi('mel.create', data);
      },
      
      async delete(id) {
        return callApi('mel.delete', { id });
      }
    },

    // Cabin defects operations
    cabinDefect: {
      async list(aircraftId) {
        return callApi('cabinDefect.list', aircraftId ? { aircraftId } : {});
      },
      
      async create(data) {
        return callApi('cabinDefect.create', data);
      },
      
      async delete(id) {
        return callApi('cabinDefect.delete', { id });
      }
    },

    // Spare parts operations
    spareParts: {
      async list() {
        return callApi('spareParts.list');
      },
      
      async create(data) {
        return callApi('spareParts.create', data);
      },
      
      async updateQuantity(id, quantity) {
        return callApi('spareParts.updateQuantity', { id, quantity });
      },
      
      async delete(id) {
        return callApi('spareParts.delete', { id });
      }
    },

    // Action logs
    actionLog: {
      async list(defectId) {
        return callApi('actionLog.list', { defectId });
      },
      
      async create(data) {
        return callApi('actionLog.create', data);
      }
    }
  };
});
