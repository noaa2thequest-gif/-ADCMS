(function(root, factory) {
  const api = factory(root);
  root.ADCMSStores = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const data = root.ADCMSData;

  async function renderTable() {
    const tbody = document.getElementById('storesTableBody');
    if (!tbody) return;

    const inventory = await data.getInventory();
    tbody.innerHTML = inventory.map(part => `
      <tr>
        <td style="color: #5f2bbd; font-weight: bold;">${part.partNumber}</td>
        <td>${part.description}</td>
        <td>${part.location}</td>
        <td><span class="qty-badge ${part.quantity > 5 ? 'qty-ok' : 'qty-low'}">${part.quantity}</span></td>
        <td>${part.unit}</td>
        <td><button class="btn-delete" onclick="ADCMSStores.deletePart('${part.id}')">Delete</button></td>
      </tr>
    `).join('');
  }

  async function submitPart() {
    const partNumber = document.getElementById('pNumber').value;
    const description = document.getElementById('pDesc').value;
    const location = document.getElementById('pLoc').value;
    const quantity = parseInt(document.getElementById('pQty').value) || 0;
    const unit = document.getElementById('pUnit').value;

    if (!partNumber || !description) return alert('Fill all fields');

    await data.addInventory({ partNumber, description, location, quantity, unit });
    closeAddModal();
    renderTable();
  }

  async function deletePart(id) {
    if (confirm('Delete this part?')) {
      await data.deleteInventory(id);
      renderTable();
    }
  }

  function filterTable() {
    const q = document.getElementById('searchParts').value.toLowerCase();
    const rows = document.querySelectorAll('#storesTableBody tr');
    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  }

  function openAddModal() { document.getElementById('addPartModal').classList.add('active'); }
  function closeAddModal() { document.getElementById('addPartModal').classList.remove('active'); }

  return { init: renderTable, openAddModal, closeAddModal, submitPart, deletePart, filterTable };
});
