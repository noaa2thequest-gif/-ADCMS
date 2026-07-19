# Cloud Integration Testing Guide

## Quick Test Checklist

### 1. Browser Console Test
1. Open ADCMS in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Check for these messages:
   - ✅ `Supabase Cloud initialized successfully`
   - ✅ `Cloud initialization completed`

### 2. Add Aircraft Test
1. Go to Admin page
2. Click "Add Aircraft"
3. Fill in form:
   - Registration: `SU-TEST-001`
   - Model: `Boeing 737-800`
   - MSN: `TEST123`
   - Engines: `2`
   - Manufacturing Date: `2020-01-01`
   - Location: `CAI`
4. Click Save
5. Check console for: `✅ Aircraft added to cloud`
6. Verify aircraft appears in list

### 3. Supabase Verification
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Table Editor
4. Select `aircraft` table
5. Verify your test aircraft appears

### 4. Add Defect Test
1. Go to New Defect page
2. Select aircraft: `SU-TEST-001`
3. Enter defect:
   - Issue: `Test Engine Noise`
   - Source: `High`
   - Description: `Testing cloud sync`
4. Click Save
5. Check console for: `✅ Defect added to cloud`

### 5. MEL Test
1. Go to New Defect page
2. Check "Is MEL Item"
3. Select Category: `B`
4. Set Expiry: `2024-12-31`
5. Add defect
6. Go to MEL page
7. Verify defect appears in MEL list

### 6. Chronic Defect Test
1. Add same defect 3 times within 10 days
2. Check console for chronic detection
3. Verify defect marked as chronic

### 7. User Management Test
1. Go to Admin page
2. Add new user:
   - Email: `test@adcms.com`
   - Name: `Test User`
   - Role: `engineer`
3. Check console for: `✅ User added to cloud`
4. Verify in Supabase users table

### 8. Offline Test
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to add aircraft
5. Should still work (using localStorage)
6. Go back online
7. Data should sync

### 9. Multi-User Test
1. Open ADCMS in two browser tabs
2. Add aircraft in Tab 1
3. Go to Tab 2 and refresh
4. New aircraft should appear (if real-time sync works)

### 10. Error Handling Test
1. Disable internet
2. Try to add aircraft
3. Should show error but still save locally
4. Enable internet
5. Data should sync

## Detailed Test Scenarios

### Scenario 1: Complete Workflow
```
1. Login as admin
2. Add aircraft (SU-ABC)
3. Add defect to aircraft
4. Mark as MEL Category B
5. Set MEL expiry
6. Verify in reports
7. Logout and login as engineer
8. Verify can see data
9. Logout
```

### Scenario 2: Data Consistency
```
1. Add 5 aircraft
2. Add 10 defects
3. Add 3 MEL items
4. Refresh page
5. Verify all data still there
6. Check Supabase dashboard
7. Verify counts match
```

### Scenario 3: Role-Based Access
```
1. Login as admin - should see all
2. Logout
3. Login as engineer - should see limited
4. Logout
5. Login as cabin crew - should see cabin only
6. Verify restrictions work
```

### Scenario 4: Chronic Defect Detection
```
1. Add defect "Engine Oil Leak" on Day 1
2. Add same defect on Day 3
3. Add same defect on Day 7
4. System should mark as chronic
5. Check console for confirmation
```

## Performance Tests

### Load Test
```javascript
// In browser console
async function loadTest() {
  console.time('Load Aircraft');
  const aircraft = await ADCMSData.getAircraft();
  console.timeEnd('Load Aircraft');
  console.log('Loaded:', aircraft.length, 'aircraft');
}
loadTest();
```

Expected: < 1 second for < 100 records

### Add Test
```javascript
// In browser console
async function addTest() {
  console.time('Add Aircraft');
  await ADCMSData.addAircraft({
    registration: 'SU-PERF-' + Date.now(),
    model: 'Boeing 737',
    msn: 'TEST',
    engines: 2,
    manufacturingDate: '2020-01-01',
    location: 'CAI'
  });
  console.timeEnd('Add Aircraft');
}
addTest();
```

Expected: < 2 seconds

## Console Commands for Testing

```javascript
// Get all aircraft
await ADCMSData.getAircraft()

// Add test aircraft
await ADCMSData.addAircraft({
  registration: 'SU-TEST',
  model: 'Boeing 737',
  msn: 'TEST123',
  engines: 2,
  manufacturingDate: '2020-01-01',
  location: 'CAI'
})

// Get all defects
await ADCMSData.getDefects()

// Get all MELs
await ADCMSData.getMELs()

// Get all users
await ADCMSData.getUsers()

// Get current user
ADCMSAuth.getCurrentUser()

// Check repeat defect
ADCMSData.checkRepeatDefect('SU-TEST', 'Engine Oil Leak')
```

## Expected Results

### Successful Cloud Sync
- Console shows ✅ messages
- Data appears in Supabase
- Data persists across refreshes
- Multi-user sync works

### Fallback to Local
- Console shows ⚠️ warnings
- Data stored in localStorage
- Works offline
- Syncs when online

### Error Handling
- Errors logged to console
- User sees friendly messages
- App doesn't crash
- Data not lost

## Troubleshooting Failed Tests

### Test: Cloud init failed
**Check**:
- Supabase URL correct
- API Key correct
- Supabase project active
- Network connection

### Test: Data not syncing
**Check**:
- RLS policies enabled
- Tables created in Supabase
- No permission errors
- Check Supabase logs

### Test: Offline mode not working
**Check**:
- localStorage enabled
- Sufficient storage space
- No quota exceeded
- Data format correct

### Test: Multi-user sync not working
**Check**:
- Real-time subscriptions enabled
- Both users logged in
- Same project
- Network latency

## Performance Baseline

| Operation | Expected Time | Actual Time | Status |
|-----------|---------------|------------|--------|
| Load Aircraft | < 1s | | |
| Add Aircraft | < 2s | | |
| Get Defects | < 1s | | |
| Get MELs | < 1s | | |
| Update Aircraft | < 2s | | |
| Delete Aircraft | < 2s | | |

## Sign-Off

- [ ] All 10 basic tests passed
- [ ] All 4 scenarios completed
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Documentation complete
- [ ] Ready for production

## Next Steps

1. Run all tests
2. Document results
3. Fix any issues
4. Get stakeholder approval
5. Deploy to production
6. Monitor in production
7. Gather user feedback

## Support

For test failures:
1. Check browser console
2. Review error messages
3. Check Supabase logs
4. Test in isolation
5. Contact administrator
