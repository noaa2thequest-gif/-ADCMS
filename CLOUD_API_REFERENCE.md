# ADCMS Cloud API Reference

## Overview
The ADCMS system now supports cloud-based data synchronization using Supabase. All data operations are automatically synced to the cloud with fallback to localStorage.

## Data Module (modules/data.js)

### Aircraft Management

#### `async getAircraft()`
Fetches all aircraft from cloud or local storage.
```javascript
const aircraft = await ADCMSData.getAircraft();
```

#### `async addAircraft(aircraftData)`
Adds a new aircraft to cloud and local storage.
```javascript
const newAircraft = await ADCMSData.addAircraft({
  registration: 'SU-ABC',
  model: 'Boeing 737',
  msn: '12345',
  engines: 2,
  manufacturingDate: '2020-01-15',
  location: 'CAI',
  status: 'SERVICEABLE'
});
```

#### `async updateAircraft(aircraftId, updates)`
Updates an aircraft record.
```javascript
await ADCMSData.updateAircraft('ac-123456', {
  status: 'AOG',
  location: 'MUC'
});
```

#### `async deleteAircraft(aircraftId)`
Deletes an aircraft record.
```javascript
await ADCMSData.deleteAircraft('ac-123456');
```

### Defect Management

#### `async addDefect(defectData)`
Adds a new defect/issue.
```javascript
const newDefect = await ADCMSData.addDefect({
  aircraft: 'ac-123456',
  issue: 'Engine oil leak',
  source: 'High',
  description: 'Oil leaking from left engine',
  isMEL: true,
  melCategory: 'B',
  melExpiry: '2024-12-31'
});
```

#### `async getDefects()`
Fetches all defects from cloud or local storage.
```javascript
const defects = await ADCMSData.getDefects();
```

#### `async updateDefect(defectId, updates)`
Updates a defect record.
```javascript
await ADCMSData.updateDefect('def-123456', {
  status: 'closed',
  isMEL: false
});
```

### MEL Management

#### `async getMELs()`
Fetches all MEL items (defects with `isMEL: true`).
```javascript
const mels = await ADCMSData.getMELs();
```

### User Management

#### `async addUser(userData)`
Adds a new user.
```javascript
const newUser = await ADCMSData.addUser({
  email: 'pilot@adcms.com',
  name: 'Captain Ahmed',
  role: 'pilot',
  approved: false
});
```

#### `async getUsers()`
Fetches all users.
```javascript
const users = await ADCMSData.getUsers();
```

#### `async updateUser(userId, updates)`
Updates a user record.
```javascript
await ADCMSData.updateUser('user-123456', {
  role: 'admin',
  approved: true
});
```

### Spares/Inventory Management

#### `async addSpare(spareData)`
Adds a new spare part.
```javascript
const newSpare = await ADCMSData.addSpare({
  partNumber: 'CFM56-3-C1',
  description: 'Engine Fan',
  quantity: 5,
  location: 'Warehouse A'
});
```

#### `async getSpares()`
Fetches all spare parts.
```javascript
const spares = await ADCMSData.getSpares();
```

### Utility Methods

#### `async initCloud()`
Manually initialize cloud connection.
```javascript
await ADCMSData.initCloud();
```

#### `checkRepeatDefect(aircraft, issue)`
Checks if a defect is chronic (3 repeats in 10 days).
```javascript
const result = ADCMSData.checkRepeatDefect('ac-123456', 'Engine oil leak');
console.log(result.isChronic); // true/false
console.log(result.count); // number of repeats
```

## Auth Module (modules/auth.js)

### Authentication

#### `async login()`
Authenticates user (called from login form).
```javascript
await ADCMSAuth.login();
```

#### `logout()`
Logs out current user.
```javascript
ADCMSAuth.logout();
```

#### `getCurrentUser()`
Gets current logged-in user.
```javascript
const user = ADCMSAuth.getCurrentUser();
console.log(user.email, user.role);
```

#### `async getCurrentUserAsync()`
Gets current user from cloud if available.
```javascript
const user = await ADCMSAuth.getCurrentUserAsync();
```

#### `checkAccess()`
Verifies user has access to current page (role-based).
```javascript
ADCMSAuth.checkAccess();
```

#### `async getUsers()`
Fetches all users from cloud.
```javascript
const users = await ADCMSAuth.getUsers();
```

#### `async saveUsers(users)`
Saves users to cloud.
```javascript
await ADCMSAuth.saveUsers(userList);
```

## Error Handling

All cloud operations include automatic fallback to localStorage:

```javascript
try {
  const aircraft = await ADCMSData.getAircraft();
} catch (error) {
  console.warn('Cloud operation failed, using local storage');
  // System automatically uses localStorage
}
```

Console messages indicate status:
- `✅ Operation successful` - Cloud sync worked
- `⚠️ Cloud operation failed` - Fell back to localStorage
- `☁️ Cloud initialization completed` - Connection established

## Data Synchronization

### Real-time Updates
Data is synchronized in real-time between:
1. Browser (localStorage)
2. Supabase Cloud Database
3. Other connected users

### Conflict Resolution
In case of conflicts:
1. Cloud data takes precedence
2. Local changes are overwritten
3. User is notified in console

### Offline Support
When offline:
1. Data is stored in localStorage
2. Operations queue locally
3. Sync occurs when connection restored

## Best Practices

1. **Always await async operations**
   ```javascript
   const data = await ADCMSData.getAircraft();
   ```

2. **Check for null/undefined**
   ```javascript
   if (aircraft && aircraft.length > 0) {
     // Process data
   }
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     await ADCMSData.addAircraft(data);
   } catch (error) {
     console.error('Failed to add aircraft:', error);
   }
   ```

4. **Use unique identifiers**
   ```javascript
   // IDs are auto-generated with format: type-timestamp
   // e.g., 'ac-1703001234567', 'def-1703001234568'
   ```

## Performance Considerations

- Aircraft list is cached in memory
- Defects are fetched on demand
- Indexes are created for common queries
- RLS policies ensure data security

## Limitations

- Maximum 1000 records per query (paginate if needed)
- Real-time updates have ~1-2 second delay
- Offline mode limited to localStorage capacity (~5-10MB)

## Support

For issues or questions:
1. Check browser console (F12)
2. Review Supabase logs
3. Check SUPABASE_SETUP.md for troubleshooting
4. Contact system administrator
