const assert = require('assert');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/' });
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

const button = window.document.getElementById('newDefectBtn');
assert.strictEqual(button.getAttribute('href'), 'new-defect.html', 'new defect button should point to the creation page');
button.click();
console.log('new defect button click test passed');
