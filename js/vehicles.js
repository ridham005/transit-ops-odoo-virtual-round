document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const tbody = document.getElementById('vehicles-body');
  
  // Drawer logic
  const modal = document.getElementById('vehicleModal');
  const createBtn = document.getElementById('create-vehicle-btn');
  const closeBtn = document.getElementById('closeVehicleModal');
  const submitBtn = document.getElementById('submitBtn');
  const drawerTitle = document.getElementById('drawerTitle');
  const form = document.getElementById('vehicleForm');

  // Input Fields
  const inputs = {
    id: document.getElementById('veh-id'),
    reg: document.getElementById('veh-reg'),
    make: document.getElementById('veh-make'),
    model: document.getElementById('veh-model'),
    type: document.getElementById('veh-type'),
    year: document.getElementById('veh-year'),
    capacity: document.getElementById('veh-capacity'),
    status: document.getElementById('veh-status')
  };

  // State
  let allVehicles = [];
  let currentMode = 'add'; // 'add', 'edit', 'view'

  // Search/Filter Elements
  const globalSearch = document.getElementById('global-search');
  const typeFilter = document.querySelector('input[placeholder="Filter by type..."]');
  const statusFilter = document.querySelector('select.saas-input'); // The one for filtering

  if (createBtn) createBtn.onclick = () => openDrawer('add');
  if (closeBtn) closeBtn.onclick = () => closeDrawer();
  window.onclick = (e) => { if (e.target === modal) closeDrawer(); };

  function closeDrawer() {
    modal.classList.remove('show');
    clearValidation();
  }

  function clearValidation() {
    form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    form.querySelectorAll('.saas-input').forEach(el => el.style.borderColor = '');
  }

  function showError(inputEl, msg) {
    inputEl.style.borderColor = '#dc3545';
    const errSpan = inputEl.nextElementSibling;
    if (errSpan && errSpan.classList.contains('error-msg')) {
      errSpan.textContent = msg;
      errSpan.style.display = 'block';
    }
  }

  function openDrawer(mode, data = null) {
    currentMode = mode;
    clearValidation();
    form.reset();
    
    // Enable/Disable inputs
    const disabled = mode === 'view';
    Object.values(inputs).forEach(input => {
      if (input) input.disabled = disabled;
    });

    if (mode === 'add') {
      drawerTitle.textContent = 'Add Vehicle';
      submitBtn.textContent = 'Save Vehicle';
      submitBtn.style.display = 'flex';
      inputs.status.value = 'Available';
      inputs.status.disabled = true; // Status set automatically on Add
    } else if (mode === 'edit' && data) {
      drawerTitle.textContent = 'Edit Vehicle';
      submitBtn.textContent = 'Update Vehicle';
      submitBtn.style.display = 'flex';
      populateForm(data);
    } else if (mode === 'view' && data) {
      drawerTitle.textContent = 'View Vehicle';
      submitBtn.style.display = 'none';
      populateForm(data);
    }

    modal.classList.add('show');
  }

  function populateForm(data) {
    inputs.id.value = data.id || data.real_id || '';
    inputs.reg.value = data.registration_number || data.regNumber || '';
    inputs.make.value = data.make || '';
    inputs.model.value = data.model || '';
    inputs.type.value = data.type || '';
    inputs.year.value = data.year || '';
    inputs.capacity.value = data.capacity || '';
    inputs.status.value = data.status || 'Available';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      clearValidation();
      let isValid = true;
      
      // Validation
      if (!inputs.reg.value.trim()) { showError(inputs.reg, 'Registration Number is required'); isValid = false; }
      if (!inputs.make.value.trim()) { showError(inputs.make, 'Make is required'); isValid = false; }
      if (!inputs.model.value.trim()) { showError(inputs.model, 'Model is required'); isValid = false; }
      if (!inputs.type.value) { showError(inputs.type, 'Type is required'); isValid = false; }
      
      const yearVal = parseInt(inputs.year.value);
      if (!yearVal || yearVal < 1980 || yearVal > new Date().getFullYear() + 1) { 
        showError(inputs.year, 'Enter a valid year'); isValid = false; 
      }
      
      if (!inputs.capacity.value.trim()) { showError(inputs.capacity, 'Capacity is required'); isValid = false; }
      
      if (!isValid) return;

      const payload = {
        registration_number: inputs.reg.value.trim(),
        make: inputs.make.value.trim(),
        model: inputs.model.value.trim(),
        type: inputs.type.value,
        year: yearVal,
        capacity: inputs.capacity.value.trim(),
        status: inputs.status.value,
        mileage: 0
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (currentMode === 'add') {
          // Check duplicate locally if data exists
          const exists = allVehicles.some(v => (v.registration_number || v.regNumber) === payload.registration_number);
          if (exists) {
             showError(inputs.reg, 'Registration number already exists');
             throw new Error('Duplicate Registration');
          }
          await window.api.post('/vehicles', payload, 'vehicles');
          window.showToast?.('Vehicle added successfully', 'success');
        } else if (currentMode === 'edit') {
          const id = inputs.id.value;
          await window.api.put(`/vehicles/${id}`, payload, 'vehicles');
          window.showToast?.('Vehicle updated successfully', 'success');
        }
        
        closeDrawer();
        loadVehicles();
      } catch (err) {
        if (err.message !== 'Duplicate Registration') {
            window.showToast?.('Error saving vehicle', 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'add' ? 'Save Vehicle' : 'Update Vehicle';
      }
    };
  }

  async function loadVehicles() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    if (!tbody) return;
    
    // Skeleton Loader
    tbody.innerHTML = `
      <tr>
        <td class="skeleton">V-1001</td>
        <td class="skeleton">Tata Signa</td>
        <td class="skeleton">Heavy Truck</td>
        <td class="skeleton">2023</td>
        <td class="skeleton"><span class="badge badge-success">Available</span></td>
        <td class="skeleton">Action</td>
      </tr>
    `;

    try {
      allVehicles = await window.api.get('/vehicles', 'vehicles');
      renderTable();
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  }
  
  function renderTable() {
     if (!tbody) return;
     let filtered = allVehicles;
     
     const term = globalSearch ? globalSearch.value.toLowerCase() : '';
     const typeTerm = typeFilter ? typeFilter.value.toLowerCase() : '';
     const statTerm = statusFilter ? statusFilter.value : 'All Statuses';
     
     if (term) {
        filtered = filtered.filter(v => 
            (v.registration_number || v.regNumber || '').toLowerCase().includes(term) ||
            (v.make || '').toLowerCase().includes(term) ||
            (v.model || '').toLowerCase().includes(term)
        );
     }
     if (typeTerm) {
        filtered = filtered.filter(v => (v.type || '').toLowerCase().includes(typeTerm));
     }
     if (statTerm !== 'All Statuses') {
        filtered = filtered.filter(v => v.status === statTerm);
     }
     
     tbody.innerHTML = '';
      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No vehicles found</td></tr>';
      } else {
          filtered.forEach(v => {
            let badgeClass = 'badge-success';
            if (v.status === 'On Trip') badgeClass = 'badge-info';
            if (v.status === 'In Shop' || v.status === 'Maintenance Due') badgeClass = 'badge-warning';
            if (v.status === 'Retired') badgeClass = 'badge-danger';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong style="color: var(--primary-color)">V-${v.id || v.real_id || 'XXX'}</strong><br><small class="text-muted">${v.registration_number || v.regNumber}</small></td>
              <td>${v.make || ''} ${v.model}</td>
              <td>${v.type}</td>
              <td>${v.year || '-'}</td>
              <td><span class="badge ${badgeClass}">${v.status}</span></td>
              <td>
                <div class="d-flex gap-2">
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="viewVehicle(${v.real_id || v.id})" title="View">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="editVehicle(${v.real_id || v.id})" title="Edit">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="deleteVehicle(${v.real_id || v.id})" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
      }
  }

  // Attach event listeners for live filtering
  if (globalSearch) globalSearch.addEventListener('input', renderTable);
  if (typeFilter) typeFilter.addEventListener('input', renderTable);
  if (statusFilter) statusFilter.addEventListener('change', renderTable);

  // Global functions for inline onclick handlers
  window.viewVehicle = function(id) {
     const v = allVehicles.find(x => (x.id === id || x.real_id === id));
     if (v) openDrawer('view', v);
  };
  
  window.editVehicle = function(id) {
     const v = allVehicles.find(x => (x.id === id || x.real_id === id));
     if (v) openDrawer('edit', v);
  };

  window.deleteVehicle = async function(id) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await window.api.delete(`/vehicles/${id}`, 'vehicles');
      window.showToast?.('Vehicle deleted successfully', 'success');
      loadVehicles();
    } catch (err) {
      // Handled in API
    }
  };

  loadVehicles();
});

