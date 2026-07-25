// Firebase Configuration for ADCMS Real-time Sync
// This module handles all real-time database operations

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update,
  remove,
  push
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Firebase Configuration - UPDATED
const firebaseConfig = {
  apiKey: "AIzaSyDUMuUM-CSRsT4u8hlQ4YtWQNK69F3weSc",
  authDomain: "adcms-realtime.firebaseapp.com",
  databaseURL: "https://adcms-realtime-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "adcms-realtime",
  storageBucket: "adcms-realtime.firebasestorage.app",
  messagingSenderId: "197073995350",
  appId: "1:197073995350:web:74462049fc06b354dd9df7",
  measurementId: "G-E5VDB5XQCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Real-time Database Manager
class ADCMSRealtimeDB {
  constructor() {
    this.listeners = {};
    this.cache = {};
  }

  // Listen to Aircraft updates
  listenToAircraft(callback) {
    const aircraftRef = ref(database, 'aircraft');
    onValue(aircraftRef, (snapshot) => {
      const data = snapshot.val();
      this.cache.aircraft = data || {};
      callback(this.cache.aircraft);
    });
  }

  // Listen to Defects updates
  listenToDefects(callback) {
    const defectsRef = ref(database, 'defects');
    onValue(defectsRef, (snapshot) => {
      const data = snapshot.val();
      this.cache.defects = data || {};
      callback(this.cache.defects);
    });
  }

  // Listen to MEL Items updates
  listenToMEL(callback) {
    const melRef = ref(database, 'melItems');
    onValue(melRef, (snapshot) => {
      const data = snapshot.val();
      this.cache.mel = data || {};
      callback(this.cache.mel);
    });
  }

  // Listen to Cabin Defects updates
  listenToCabinDefects(callback) {
    const cabinRef = ref(database, 'cabinDefects');
    onValue(cabinRef, (snapshot) => {
      const data = snapshot.val();
      this.cache.cabinDefects = data || {};
      callback(this.cache.cabinDefects);
    });
  }

  // Listen to Stores/Inventory updates
  listenToStores(callback) {
    const storesRef = ref(database, 'stores');
    onValue(storesRef, (snapshot) => {
      const data = snapshot.val();
      this.cache.stores = data || {};
      callback(this.cache.stores);
    });
  }

  // Add Aircraft
  addAircraft(aircraftData) {
    const newAircraftRef = push(ref(database, 'aircraft'));
    set(newAircraftRef, {
      ...aircraftData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return newAircraftRef.key;
  }

  // Update Aircraft
  updateAircraft(aircraftId, updates) {
    update(ref(database, `aircraft/${aircraftId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Add Defect
  addDefect(defectData) {
    const newDefectRef = push(ref(database, 'defects'));
    set(newDefectRef, {
      ...defectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'OPEN'
    });
    return newDefectRef.key;
  }

  // Update Defect
  updateDefect(defectId, updates) {
    update(ref(database, `defects/${defectId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Add MEL Item
  addMELItem(melData) {
    const newMELRef = push(ref(database, 'melItems'));
    set(newMELRef, {
      ...melData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return newMELRef.key;
  }

  // Update MEL Item
  updateMELItem(melId, updates) {
    update(ref(database, `melItems/${melId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Add Cabin Defect
  addCabinDefect(cabinData) {
    const newCabinRef = push(ref(database, 'cabinDefects'));
    set(newCabinRef, {
      ...cabinData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return newCabinRef.key;
  }

  // Update Cabin Defect
  updateCabinDefect(cabinId, updates) {
    update(ref(database, `cabinDefects/${cabinId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Add Store Item
  addStoreItem(storeData) {
    const newStoreRef = push(ref(database, 'stores'));
    set(newStoreRef, {
      ...storeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return newStoreRef.key;
  }

  // Update Store Item
  updateStoreItem(storeId, updates) {
    update(ref(database, `stores/${storeId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Delete any item
  deleteItem(path, itemId) {
    remove(ref(database, `${path}/${itemId}`));
  }

  // Get cached data
  getCachedData(dataType) {
    return this.cache[dataType] || {};
  }
}

// Export singleton instance
export const realtimeDB = new ADCMSRealtimeDB();
