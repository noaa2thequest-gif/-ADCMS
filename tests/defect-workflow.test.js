const assert = require('assert');
const workflow = require('../modules/workflow');

const state = workflow.getWorkflowState();
assert.ok(state.activeDefect, 'workflow should initialize with an active defect');
assert.strictEqual(state.activeDefect.status, 'Open');

const repeatFlag = workflow.detectRepeatDefect('SU-SKD', 'Hydraulic pump noise');
assert.strictEqual(repeatFlag, true, 'repeat defect should be detected for the same aircraft and issue');

workflow.addTroubleshootingStep('Inspected hydraulic lines and confirmed pressure drop');
workflow.addAttachment('photo-1.jpg');
workflow.closeDefect('Pump seal wear identified as the root cause');

const updatedState = workflow.getWorkflowState();
assert.ok(updatedState.activeDefect.troubleshooting.length >= 1, 'troubleshooting history should be recorded');
assert.ok(updatedState.activeDefect.attachments.includes('photo-1.jpg'), 'attachments should be stored');
assert.strictEqual(updatedState.activeDefect.status, 'Closed', 'closing action should update the workflow state');
assert.ok(updatedState.activeDefect.rootCause.includes('Pump seal wear'), 'root cause should be captured when closing');

console.log('defect workflow tests passed');
