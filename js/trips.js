document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const tbody = document.getElementById('trip-table-body');
  
  // Drawer logic
  const modal = document.getElementById('tripModal');
  const createBtn = document.getElementById('create-trip-btn');
  const closeBtn = document.getElementById('closeTripModal');
  const submitBtn = document.getElementById('submitBtn');
  const drawerTitle = document.getElementById('drawerTitle');
  const form = document.getElementById('tripForm');

  // Input Fields
  const inputs = {
    id: document.getElementById('trp-id'),
    source: document.getElementById('trp-source'),
    dest: document.getElementById('trp-dest'),
    vehicle: document.getElementById('trp-vehicle'),
    driver: document.getElementById('trp-driver'),
    weight: document.getElementById('trp-weight'),
    distance: document.getElementById('trp-distance'),
    status: document.getElementById('trp-status')
  };

  let allTrips = [];
  let currentMode = 'add';

  // Search/Filter Elements
  const globalSearch = document.getElementById('global-search');
  const destFilter = document.querySelector('input[placeholder="Filter by destination..."]');
  const statusFilter = document.querySelector('select.saas-input');

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
    
    const disabled = mode === 'view';
    Object.values(inputs).forEach(input => {
      if (input) input.disabled = disabled;
    });

    if (mode === 'add') {
      drawerTitle.textContent = 'Create New Trip';
      submitBtn.textContent = 'Save Trip';
      submitBtn.style.display = 'flex';
      inputs.status.value = 'Draft';
      inputs.status.disabled = true;
    } else if (mode === 'edit' && data) {
      drawerTitle.textContent = 'Edit Trip';
      submitBtn.textContent = 'Update Trip';
      submitBtn.style.display = 'flex';
      populateForm(data);
    } else if (mode === 'view' && data) {
      drawerTitle.textContent = 'View Trip';
      submitBtn.style.display = 'none';
      populateForm(data);
    }

    modal.classList.add('show');
  }

  function populateForm(data) {
    inputs.id.value = data.id || data.real_id || '';
    inputs.source.value = data.source || '';
    inputs.dest.value = data.destination || data.dest || '';
    inputs.vehicle.value = data.vehicle_id || '';
    inputs.driver.value = data.driver_id || '';
    inputs.weight.value = data.weight || '';
    inputs.distance.value = data.distance || '';
    inputs.status.value = data.status || 'Draft';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      clearValidation();
      let isValid = true;
      
      if (!inputs.source.value.trim()) { showError(inputs.source, 'Source is required'); isValid = false; }
      if (!inputs.dest.value.trim()) { showError(inputs.dest, 'Destination is required'); isValid = false; }
      if (!inputs.vehicle.value) { showError(inputs.vehicle, 'Vehicle is required'); isValid = false; }
      if (!inputs.driver.value) { showError(inputs.driver, 'Driver is required'); isValid = false; }
      
      if (!isValid) return;

      const payload = {
        source: inputs.source.value.trim(),
        destination: inputs.dest.value.trim(),
        vehicle_id: inputs.vehicle.value,
        driver_id: inputs.driver.value,
        weight: inputs.weight.value.trim() || '0t',
        distance: inputs.distance.value.trim() || '0 km',
        status: inputs.status.value,
        trip_cost: 0
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (currentMode === 'add') {
          await window.api.post('/trips', payload, 'trips');
          window.showToast?.('Trip added successfully', 'success');
        } else if (currentMode === 'edit') {
          const id = inputs.id.value;
          await window.api.put(`/trips/${id}`, payload, 'trips');
          window.showToast?.('Trip updated successfully', 'success');
        }
        
        closeDrawer();
        loadTrips();
      } catch (err) {
         window.showToast?.('Error saving trip', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'add' ? 'Save Trip' : 'Update Trip';
      }
    };
  }

  async function loadTrips() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td class="skeleton">#TRP-XXXX</td>
        <td class="skeleton">Source</td>
        <td class="skeleton">Destination</td>
        <td class="skeleton">Vehicle</td>
        <td class="skeleton">Driver</td>
        <td class="skeleton">Weight</td>
        <td class="skeleton">Dist</td>
        <td class="skeleton"><span class="badge badge-success">Status</span></td>
        <td class="skeleton">Action</td>
      </tr>
      <tr>
        <td class="skeleton">#TRP-XXXX</td>
        <td class="skeleton">Source</td>
        <td class="skeleton">Destination</td>
        <td class="skeleton">Vehicle</td>
        <td class="skeleton">Driver</td>
        <td class="skeleton">Weight</td>
        <td class="skeleton">Dist</td>
        <td class="skeleton"><span class="badge badge-info">Status</span></td>
        <td class="skeleton">Action</td>
      </tr>
    `;

    try {
      const [trips, vehicles, drivers] = await Promise.all([
        window.api.get('/trips', 'trips'),
        window.api.get('/vehicles?status=Available', 'vehicles'),
        window.api.get('/drivers?status=Available', 'drivers')
      ]);

      allTrips = trips;

      // Populate Selects
      if (inputs.vehicle) {
          inputs.vehicle.innerHTML = '<option value="">Select Vehicle</option>';
          vehicles.forEach(v => {
              inputs.vehicle.innerHTML += `<option value="${v.real_id || v.id}">${v.registration_number || v.regNumber} (${v.type})</option>`;
          });
      }
      if (inputs.driver) {
          inputs.driver.innerHTML = '<option value="">Select Driver</option>';
          drivers.forEach(d => {
              inputs.driver.innerHTML += `<option value="${d.real_id || d.id}">${d.name}</option>`;
          });
      }

      renderTable();
    } catch (err) {
       console.error('Failed to load trips:', err);
    }
  }

  function renderTable() {
     if (!tbody) return;
     let filtered = allTrips;
     
     const term = globalSearch ? globalSearch.value.toLowerCase() : '';
     const destTerm = destFilter ? destFilter.value.toLowerCase() : '';
     const statTerm = statusFilter ? statusFilter.value : 'All Statuses';
     
     if (term) {
        filtered = filtered.filter(t => 
            (t.source || '').toLowerCase().includes(term) ||
            (t.destination || t.dest || '').toLowerCase().includes(term) ||
            (t.vehicle_reg || t.vehicle || '').toLowerCase().includes(term) ||
            (t.driver_name || t.driver || '').toLowerCase().includes(term)
        );
     }
     if (destTerm) {
        filtered = filtered.filter(t => (t.destination || t.dest || '').toLowerCase().includes(destTerm));
     }
     if (statTerm !== 'All Statuses') {
        filtered = filtered.filter(t => t.status === statTerm);
     }
     
     tbody.innerHTML = '';
      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No trips found</td></tr>';
      } else {
          filtered.forEach(t => {
            let badgeClass = 'badge-success';
            if (t.status === 'Completed') badgeClass = 'badge-primary';
            if (t.status === 'Delayed') badgeClass = 'badge-warning';
            if (t.status === 'Draft' || t.status === 'Loading') badgeClass = 'badge-info';
            if (t.status === 'Cancelled') badgeClass = 'badge-danger';
            if (t.status === 'In Transit') badgeClass = 'badge-success';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>#TRP-${t.real_id || t.id || 'XXX'}</strong></td>
              <td>${t.source}</td>
              <td>${t.destination || t.dest}</td>
              <td>${t.vehicle_reg || t.vehicle || 'Unknown'}</td>
              <td>${t.driver_name || t.driver || 'Unknown'}</td>
              <td>${t.weight || '0t'}</td>
              <td>${t.distance || '0 km'}</td>
              <td><span class="badge ${badgeClass}">${t.status}</span></td>
              <td>
                <div class="d-flex gap-2">
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="viewTrip(${t.real_id || t.id})" title="View">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="editTrip(${t.real_id || t.id})" title="Edit">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="deleteTrip(${t.real_id || t.id})" title="Delete Trip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
      }
  }

  if (globalSearch) globalSearch.addEventListener('input', renderTable);
  if (destFilter) destFilter.addEventListener('input', renderTable);
  if (statusFilter) statusFilter.addEventListener('change', renderTable);

  window.viewTrip = function(id) {
     const t = allTrips.find(x => (x.id === id || x.real_id === id));
     if (t && t.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == t.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${t.vehicle_id}">${t.vehicle_reg || t.vehicle}</option>`;
     }
     if (t && t.driver_id && ![...inputs.driver.options].find(o => o.value == t.driver_id)) {
         inputs.driver.innerHTML += `<option value="${t.driver_id}">${t.driver_name || t.driver}</option>`;
     }
     if (t) openDrawer('view', t);
  };
  
  window.editTrip = function(id) {
     const t = allTrips.find(x => (x.id === id || x.real_id === id));
     if (t && t.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == t.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${t.vehicle_id}">${t.vehicle_reg || t.vehicle}</option>`;
     }
     if (t && t.driver_id && ![...inputs.driver.options].find(o => o.value == t.driver_id)) {
         inputs.driver.innerHTML += `<option value="${t.driver_id}">${t.driver_name || t.driver}</option>`;
     }
     if (t) openDrawer('edit', t);
  };

  window.deleteTrip = async function(id) {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      await window.api.delete(`/trips/${id}`, 'trips');
      window.showToast?.('Trip deleted successfully', 'success');
      loadTrips();
    } catch (err) {
      // Handled in API
    }
  };

  loadTrips();
});

