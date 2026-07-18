const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'new-defect.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/new-defect.html' });
const { window } = dom;

window.localStorage.clear();
const scripts = [
  'modules/data.js',
  'modules/ui.js',
  'modules/dashboard.js',
  'modules/workflow.js',
  'app.js'
];

scripts.forEach(file => {
  const scriptPath = path.join(__dirname, '..', file);
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  const scriptElement = window.document.createElement('script');
  scriptElement.textContent = scriptContent;
  window.document.body.appendChild(scriptElement);
});

const aircraftInput = window.document.getElementById('newDefectAircraft');
const issueInput = window.document.getElementById('newDefectIssue');
const sourceSelect = window.document.getElementById('newDefectSource');
const descriptionInput = window.document.getElementById('newDefectDescription');
const dateInput = window.document.getElementById('newDefectDate');
const saveButton = window.document.getElementById('saveDefectBtn');

aircraftInput.value = 'SU-ABC';
issueInput.value = 'Brake system chatter';
sourceSelect.value = 'Captain Entry';
descriptionInput.value = 'Initial inspection required';
dateInput.value = '2026-07-18';
saveButton.click();

const state = window.ADCMSWorkflow.getWorkflowState();
assert.strictEqual(state.defects.length, 1, 'new defect should be added to the defect list');
assert.strictEqual(state.activeDefect.aircraft, 'SU-ABC', 'new defect should become the active defect');
assert.strictEqual(state.activeDefect.issue, 'Brake system chatter', 'issue should be saved');
console.log('new defect page flow test passed');
