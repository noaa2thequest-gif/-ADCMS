# ADCMS Project Debug Log - Jul 19, 2026

## Current Status
- Project: ADCMS (Aircraft Defect & Maintenance Control System)
- Environment: Sandbox with Python HTTP Server on port 8080.
- Repository: https://github.com/noaa2thequest-gif/-ADCMS
- Key Modules Migrated: `data.js`, `auth.js`, `dashboard.js`, `admin.js`, `workflow.js`, `mel.js`, `mcc-center.js`, `stores.js`.
- UI Features: Company Logo (Sky Vision Airlines), Credits (Eng. Hany Omar, Eng. Akram El-Gendy).
- Connectivity: Supabase ready but using local fallback with Demo Data.

## Known Issues
- User reporting "Nothing works" on iPad.
- Suspected issues:
  1. Port exposure/caching issues in the browser.
  2. JavaScript errors during async initialization in `app.js`.
  3. UI/CSS layout issues on iPad/Safari.
  4. Server path misconfiguration (fixed but needs verification).

## Demo Data Injected
- Aircraft: SU-SKY, SU-VIS, SU-ION.
- Defects: Left Landing Light Inop, Engine #1 Fuel Leak.
- Login: hany@adcms.com / 123 (Auto-filled).

## Next Steps
- Verify console errors if possible.
- Ensure all relative paths in HTML point correctly to modules.
- Check `app.js` for silent failures.
