(function(root, factory) {
  const api = factory(root);
  root.ADCMSAdmin = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');
  let editingAircraftId = null;

  function renderAircraftTable() {
    const tbody = document.getElementById('aircraftTableBody');
    const badge = document.getElementById('aircraftCountBadge');
    if (!tbody) return;

    const aircraft = data.getAircraft();
    badge.textContent = `${aircraft.length} aircraft`;

    tbody.innerHTML = aircraft
      .map(
        (ac) => `
      <tr style="border-bottom: 1px solid var(--line);">
        <td style="padding: 12px; font-weight: 700;">${ac.registration}</td>
        <td style="padding: 12px;">${ac.model}</td>
        <td style="padding: 12px;">${ac.msn}</td>
        <td style="padding: 12px;">${ac.engines}</td>
        <td style="padding: 12px;">${ac.manufacturingDate}</td>
        <td style="padding: 12px;">
          <span class="tag ${ac.status === 'SERVICEABLE' ? 'serviceable' : ac.status === 'DEFERRED' ? 'deferred' : 'aog'}">
            ${ac.status}
          </span>
        </td>
        <td style="padding: 12px;">${ac.location}</td>
        <td style="padding: 12px; text-align: center;">
          <button class="edit-btn" data-id="${ac.id}" style="background: #2477df; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; margin-right: 6px;">Edit</button>
          <button class="delete-btn" data-id="${ac.id}" style="background: #e52d3d; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    // Bind edit and delete buttons
    bindTableActions();
  }

  function bindTableActions() {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const aircraftId = e.target.dataset.id;
        editAircraft(aircraftId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const aircraftId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this aircraft?')) {
          data.deleteAircraft(aircraftId);
          renderAircraftTable();
        }
      });
    });
  }

  function editAircraft(aircraftId) {
    const aircraft = data.getAircraft().find((ac) => ac.id === aircraftId);
    if (!aircraft) return;

    editingAircraftId = aircraftId;
    document.getElementById('formTitle').textContent = `Edit Aircraft - ${aircraft.registration}`;
    document.getElementById('aircraftReg').value = aircraft.registration;
    document.getElementById('aircraftModel').value = aircraft.model;
    document.getElementById('aircraftMsn').value = aircraft.msn;
    document.getElementById('aircraftEngines').value = aircraft.engines;
    document.getElementById('aircraftMfgDate').value = aircraft.manufacturingDate;
    document.getElementById('aircraftLocation').value = aircraft.location;

    document.getElementById('addAircraftPanel').hidden = false;
  }

  function showAddForm() {
    editingAircraftId = null;
    document.getElementById('formTitle').textContent = 'Add New Aircraft';
    document.getElementById('aircraftReg').value = '';
    document.getElementById('aircraftModel').value = '';
    document.getElementById('aircraftMsn').value = '';
    document.getElementById('aircraftEngines').value = '';
    document.getElementById('aircraftMfgDate').value = '';
    document.getElementById('aircraftLocation').value = '';
    document.getElementById('addAircraftPanel').hidden = false;
  }

  function hideForm() {
    document.getElementById('addAircraftPanel').hidden = true;
    editingAircraftId = null;
  }

  function saveAircraft() {
    const registration = document.getElementById('aircraftReg').value.trim();
    const model = document.getElementById('aircraftModel').value.trim();
    const msn = document.getElementById('aircraftMsn').value.trim();
    const engines = document.getElementById('aircraftEngines').value.trim();
    const manufacturingDate = document.getElementById('aircraftMfgDate').value;
    const location = document.getElementById('aircraftLocation').value.trim();

    if (!registration || !model || !msn || !engines || !manufacturingDate || !location) {
      alert('Please fill in all fields');
      return;
    }

    if (editingAircraftId) {
      // Update existing aircraft
      data.updateAircraft(editingAircraftId, {
        registration,
        model,
        msn,
        engines,
        manufacturingDate,
        location
      });
    } else {
      // Add new aircraft
      data.addAircraft({
        registration,
        model,
        msn,
        engines,
        manufacturingDate,
        location
      });
    }

    hideForm();
    renderAircraftTable();
  }

  function init() {
    renderAircraftTable();

    // Bind buttons
    const addBtn = document.getElementById('addAircraftBtn');
    const saveBtn = document.getElementById('saveAircraftBtn');
    const cancelBtn = document.getElementById('cancelAircraftBtn');
    const closeBtn = document.getElementById('closeFormBtn');

    if (addBtn) addBtn.addEventListener('click', showAddForm);
    if (saveBtn) saveBtn.addEventListener('click', saveAircraft);
    if (cancelBtn) cancelBtn.addEventListener('click', hideForm);
    if (closeBtn) closeBtn.addEventListener('click', hideForm);
  }

  return {
    init,
    renderAircraftTable,
    showAddForm,
    hideForm,
    saveAircraft,
    editAircraft
  };
});
