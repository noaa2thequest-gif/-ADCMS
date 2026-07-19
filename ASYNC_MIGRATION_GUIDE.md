# Async Migration Guide for ADCMS Pages

## Overview
With the Supabase cloud integration, all data operations are now **asynchronous** (async/await). This guide explains how to update existing pages to work with the new async data layer.

## Key Changes

### Before (Synchronous)
```javascript
const aircraft = ADCMSData.getAircraft();
aircraft.forEach(ac => {
  // Process aircraft
});
```

### After (Asynchronous)
```javascript
const aircraft = await ADCMSData.getAircraft();
aircraft.forEach(ac => {
  // Process aircraft
});
```

## Migration Steps

### 1. Update Function Signatures
Make functions async if they call data operations:

```javascript
// Before
function loadAircraft() {
  const aircraft = ADCMSData.getAircraft();
  renderAircraft(aircraft);
}

// After
async function loadAircraft() {
  const aircraft = await ADCMSData.getAircraft();
  renderAircraft(aircraft);
}
```

### 2. Update Event Handlers
Event handlers calling async functions need special handling:

```javascript
// Before
document.getElementById('addBtn').addEventListener('click', function() {
  ADCMSData.addAircraft(data);
});

// After
document.getElementById('addBtn').addEventListener('click', async function() {
  await ADCMSData.addAircraft(data);
  await loadAircraft(); // Refresh list
});
```

### 3. Update Initialization Code
Module init() functions should be async:

```javascript
// Before
const MyModule = (() => {
  function init() {
    const data = ADCMSData.getAircraft();
    // ...
  }
  return { init };
})();

// After
const MyModule = (() => {
  async function init() {
    const data = await ADCMSData.getAircraft();
    // ...
  }
  return { init };
})();
```

### 4. Handle Loading States
Show loading indicators while fetching data:

```javascript
async function loadData() {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';
  
  try {
    const data = await ADCMSData.getAircraft();
    renderData(data);
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Failed to load data');
  } finally {
    loader.style.display = 'none';
  }
}
```

### 5. Update CRUD Operations
All CRUD operations are now async:

```javascript
// Create
const newAircraft = await ADCMSData.addAircraft(aircraftData);

// Read
const aircraft = await ADCMSData.getAircraft();

// Update
await ADCMSData.updateAircraft(id, updates);

// Delete
await ADCMSData.deleteAircraft(id);
```

## Pages That Need Updates

### Priority 1 (Critical)
- `admin.html` - Aircraft management (add/edit/delete)
- `new-defect.html` - Defect creation
- `mel.html` - MEL management
- `mcc-center.html` - MCC operations

### Priority 2 (Important)
- `index.html` - Dashboard
- `aircraft-status.html` - Fleet status
- `defect.html` - Defect details
- `cabin-defects.html` - Cabin defects

### Priority 3 (Nice to Have)
- `surveillance.html` - SAFA data
- `reports.html` - Report generation
- `stores.html` - Inventory management

## Common Patterns

### Pattern 1: Load and Render
```javascript
async function init() {
  try {
    const aircraft = await ADCMSData.getAircraft();
    if (aircraft && aircraft.length > 0) {
      renderTable(aircraft);
    } else {
      showEmptyState();
    }
  } catch (error) {
    showError('Failed to load aircraft');
  }
}
```

### Pattern 2: Add and Refresh
```javascript
async function handleAdd(formData) {
  try {
    await ADCMSData.addAircraft(formData);
    showSuccess('Aircraft added successfully');
    await init(); // Refresh list
  } catch (error) {
    showError('Failed to add aircraft');
  }
}
```

### Pattern 3: Update and Refresh
```javascript
async function handleUpdate(id, updates) {
  try {
    await ADCMSData.updateAircraft(id, updates);
    showSuccess('Aircraft updated');
    await init(); // Refresh list
  } catch (error) {
    showError('Failed to update aircraft');
  }
}
```

### Pattern 4: Delete with Confirmation
```javascript
async function handleDelete(id) {
  if (!confirm('Are you sure?')) return;
  
  try {
    await ADCMSData.deleteAircraft(id);
    showSuccess('Aircraft deleted');
    await init(); // Refresh list
  } catch (error) {
    showError('Failed to delete aircraft');
  }
}
```

## Error Handling

### Basic Error Handling
```javascript
try {
  const data = await ADCMSData.getAircraft();
} catch (error) {
  console.error('Error:', error);
}
```

### Advanced Error Handling
```javascript
try {
  const data = await ADCMSData.getAircraft();
} catch (error) {
  if (error.message.includes('network')) {
    showError('Network error - using local data');
  } else if (error.message.includes('permission')) {
    showError('Permission denied');
  } else {
    showError('Unknown error: ' + error.message);
  }
}
```

## Testing Async Code

### Test with Console
```javascript
// Open browser console (F12)
await ADCMSData.getAircraft().then(data => console.log(data));
```

### Test with Debugger
```javascript
async function testData() {
  debugger; // Breakpoint
  const data = await ADCMSData.getAircraft();
  console.log('Data:', data);
}
testData();
```

## Performance Tips

1. **Batch Operations**
   ```javascript
   // Good - parallel requests
   const [aircraft, defects] = await Promise.all([
     ADCMSData.getAircraft(),
     ADCMSData.getDefects()
   ]);
   ```

2. **Cache Results**
   ```javascript
   let cachedAircraft = null;
   async function getAircraftCached() {
     if (!cachedAircraft) {
       cachedAircraft = await ADCMSData.getAircraft();
     }
     return cachedAircraft;
   }
   ```

3. **Debounce Searches**
   ```javascript
   let searchTimeout;
   async function onSearch(query) {
     clearTimeout(searchTimeout);
     searchTimeout = setTimeout(async () => {
       const results = await ADCMSData.getAircraft();
       // Filter and render
     }, 300);
   }
   ```

## Troubleshooting

### Issue: "Cannot read property of undefined"
**Cause**: Trying to use data before it loads
**Solution**: Always await and check for null
```javascript
const data = await ADCMSData.getAircraft();
if (data && data.length > 0) {
  // Safe to use
}
```

### Issue: "Unexpected token 'await'"
**Cause**: Using await in non-async function
**Solution**: Make function async
```javascript
// Wrong
function load() {
  const data = await ADCMSData.getAircraft(); // Error!
}

// Right
async function load() {
  const data = await ADCMSData.getAircraft(); // OK
}
```

### Issue: Data not updating
**Cause**: Not awaiting async operations
**Solution**: Add await and refresh
```javascript
// Wrong
ADCMSData.addAircraft(data);
init(); // Runs before add completes

// Right
await ADCMSData.addAircraft(data);
await init(); // Waits for add to complete
```

## Migration Checklist

- [ ] Identify all pages using ADCMSData
- [ ] Make functions async where needed
- [ ] Add await to all data operations
- [ ] Add error handling
- [ ] Add loading indicators
- [ ] Test each page
- [ ] Test with network offline
- [ ] Test with slow network
- [ ] Update documentation
- [ ] Commit changes

## Next Steps

1. Start with Priority 1 pages
2. Test thoroughly after each page
3. Use browser DevTools to debug
4. Check console for errors
5. Verify data sync with Supabase
6. Get user feedback
7. Deploy to production

## Support

For issues during migration:
1. Check browser console (F12)
2. Review error messages
3. Check CLOUD_API_REFERENCE.md
4. Test in isolation
5. Contact system administrator
