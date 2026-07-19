(function(root, factory) {
  const api = factory(root);
  root.ADCMSStores = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData || require('./data');

  let currentUser = { role: 'admin' }; // In production, this would come from auth system
  let editingPartId = null;

  function canEditInventory() {
    // Only MCC engineers and warehouse staff can edit
    return ['mcc', 'warehouse', 'admin'].includes(currentUser.role);
  }

  function initializeInventory() {
    if (!data.workflowState.inventory) {
      data.workflowState.inventory = [];
    }
  }

  function renderTable() {
    const tbody = document.getElementById('storesTableBody');
    if (!tbody) return;

    initializeInventory();
    const inventory = data.workflowState.inventory;

    if (inventory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No parts in inventory yet.</td></tr>';
      return;
    }

    tbody.innerHTML = inventory.map(part => {
      const qtyClass = part.quantity > 10 ? 'qty-high' : part.quantity > 5 ? 'qty-medium' : 'qty-low';
      const canEdit = canEditInventory();

      return `
        <tr>
          <td class="part-number">${part.partNumber}</td>
          <td>${part.description}</td>
          <td><span class="location-badge">${part.location}</span></td>
          <td><span class="quantity-badge ${qtyClass}">${part.quantity}</span></td>
          <td>${part.unit}</td>
          <td>${part.lastUpdated || 'N/A'}</td>
          <td class="table-actions">
            <button class="btn-edit" onclick="ADCMSStores.editPart('${part.id}')" ${!canEdit ? 'disabled' : ''}>Edit</button>
            <button class="btn-delete" onclick="ADCMSStores.deletePart('${part.id}')" ${!canEdit ? 'disabled' : ''}>Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterTable() {
    const searchTerm = document.getElementById('searchParts').value.toLowerCase();
    const locationFilter = document.getElementById('filterLocation').value;
    const rows = document.querySelectorAll('#storesTableBody tr');

    rows.forEach(row => {
      const partNumber = row.cells[0].textContent.toLowerCase();
      const description = row.cells[1].textContent.toLowerCase();
      const location = row.cells[2].textContent;

      const matchesSearch = partNumber.includes(searchTerm) || description.includes(searchTerm);
      const matchesLocation = !locationFilter || location.includes(locationFilter);

      row.style.display = (matchesSearch && matchesLocation) ? '' : 'none';
    });
  }

  function openAddModal() {
    if (!canEditInventory()) {
      alert('You do not have permission to add parts. Contact MCC or Warehouse team.');
      return;
    }

    editingPartId = null;
    document.getElementById('modalTitle').textContent = 'Add New Part';
    document.getElementById('partNumber').value = '';
    document.getElementById('partDescription').value = '';
    document.getElementById('partLocation').value = 'CAI';
    document.getElementById('partQuantity').value = '';
    document.getElementById('partUnit').value = 'Piece';

    const modal = document.getElementById('addPartModal');
    if (modal) modal.classList.add('active');
  }

  function closeAddModal() {
    const modal = document.getElementById('addPartModal');
    if (modal) modal.classList.remove('active');
  }

  function editPart(partId) {
    if (!canEditInventory()) {
      alert('You do not have permission to edit parts.');
      return;
    }

    initializeInventory();
    const part = data.workflowState.inventory.find(p => p.id === partId);
    if (!part) return;

    editingPartId = partId;
    document.getElementById('modalTitle').textContent = 'Edit Part';
    document.getElementById('partNumber').value = part.partNumber;
    document.getElementById('partDescription').value = part.description;
    document.getElementById('partLocation').value = part.location;
    document.getElementById('partQuantity').value = part.quantity;
    document.getElementById('partUnit').value = part.unit;

    const modal = document.getElementById('addPartModal');
    if (modal) modal.classList.add('active');
  }

  function submitPart() {
    const partNumber = document.getElementById('partNumber').value;
    const description = document.getElementById('partDescription').value;
    const location = document.getElementById('partLocation').value;
    const quantity = parseInt(document.getElementById('partQuantity').value) || 0;
    const unit = document.getElementById('partUnit').value;

    if (!partNumber || !description) {
      alert('Please fill in all required fields.');
      return;
    }

    initializeInventory();

    if (editingPartId) {
      // Edit existing part
      const part = data.workflowState.inventory.find(p => p.id === editingPartId);
      if (part) {
        part.partNumber = partNumber;
        part.description = description;
        part.location = location;
        part.quantity = quantity;
        part.unit = unit;
        part.lastUpdated = new Date().toLocaleDateString();
      }
    } else {
      // Add new part
      const newPart = {
        id: 'PART-' + Date.now(),
        partNumber: partNumber,
        description: description,
        location: location,
        quantity: quantity,
        unit: unit,
        lastUpdated: new Date().toLocaleDateString(),
        addedBy: currentUser.role,
        createdDate: new Date().toISOString()
      };
      data.workflowState.inventory.push(newPart);
    }

    data.persistState();
    closeAddModal();
    renderTable();
  }

  function deletePart(partId) {
    if (!canEditInventory()) {
      alert('You do not have permission to delete parts.');
      return;
    }

    if (confirm('Are you sure you want to delete this part?')) {
      initializeInventory();
      data.workflowState.inventory = data.workflowState.inventory.filter(p => p.id !== partId);
      data.persistState();
      renderTable();
    }
  }

  function init() {
    // Check permissions and show notice if read-only
    const addBtn = document.getElementById('addPartBtn');
    const permNotice = document.getElementById('permissionNotice');

    if (!canEditInventory()) {
      if (addBtn) addBtn.style.display = 'none';
      if (permNotice) permNotice.style.display = 'block';
    }

    renderTable();

    // Close modal when clicking outside
    const modal = document.getElementById('addPartModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAddModal();
      });
    }
  }

  return {
    init,
    openAddModal,
    closeAddModal,
    editPart,
    submitPart,
    deletePart,
    filterTable,
    renderTable
  };
});
