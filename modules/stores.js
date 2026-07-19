(function(root, factory) {
  const api = factory(root);
  root.ADCMSStores = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

  async function renderTable() {
    const tbody = document.getElementById('storesTableBody');
    if (!tbody) return;

    const inventory = await data.getInventory();
    
    if (!inventory || inventory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No parts in inventory yet.</td></tr>';
      return;
    }

    tbody.innerHTML = inventory.map(part => `
      <tr>
        <td class="part-number">${part.partNumber}</td>
        <td>${part.description}</td>
        <td><span class="location-badge">${part.location}</span></td>
        <td><span class="quantity-badge ${part.quantity > 5 ? 'qty-high' : 'qty-low'}">${part.quantity}</span></td>
        <td>${part.unit}</td>
        <td>${part.lastUpdated}</td>
        <td class="table-actions">
          <button class="btn-delete" onclick="ADCMSStores.deletePart('${part.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async function submitPart() {
    const partNumber = document.getElementById('partNumber').value;
    const description = document.getElementById('partDescription').value;
    const location = document.getElementById('partLocation').value;
    const quantity = parseInt(document.getElementById('partQuantity').value) || 0;
    const unit = document.getElementById('partUnit').value;

    if (!partNumber || !description) {
      alert('Please fill in all fields');
      return;
    }

    await data.addInventory({ partNumber, description, location, quantity, unit });
    closeAddModal();
    renderTable();
  }

  async function deletePart(id) {
    if (confirm('Are you sure?')) {
      await data.deleteInventory(id);
      renderTable();
    }
  }

  function openAddModal() {
    document.getElementById('addPartModal').classList.add('active');
  }

  function closeAddModal() {
    document.getElementById('addPartModal').classList.remove('active');
  }

  return {
    init: renderTable,
    openAddModal,
    closeAddModal,
    submitPart,
    deletePart
  };
});
