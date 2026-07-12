document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const grid = document.getElementById('drivers-grid');
  
  // Drawer logic
  const modal = document.getElementById('driverModal');
  const createBtn = document.getElementById('create-driver-btn');
  const closeBtn = document.getElementById('closeDriverModal');
  const submitBtn = document.getElementById('submitBtn');
  const drawerTitle = document.getElementById('drawerTitle');
  const form = document.getElementById('driverForm');

  // Input Fields
  const inputs = {
    id: document.getElementById('drv-id'),
    name: document.getElementById('drv-name'),
    license: document.getElementById('drv-license'),
    phone: document.getElementById('drv-phone'),
    status: document.getElementById('drv-status')
  };

  let allDrivers = [];
  let currentMode = 'add';

  // Search/Filter Elements
  const globalSearch = document.getElementById('global-search');
  const nameFilter = document.querySelector('input[placeholder="Filter by name..."]');
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
      drawerTitle.textContent = 'Add Driver';
      submitBtn.textContent = 'Save Driver';
      submitBtn.style.display = 'flex';
      inputs.status.value = 'Available';
      inputs.status.disabled = true;
    } else if (mode === 'edit' && data) {
      drawerTitle.textContent = 'Edit Driver';
      submitBtn.textContent = 'Update Driver';
      submitBtn.style.display = 'flex';
      populateForm(data);
    } else if (mode === 'view' && data) {
      drawerTitle.textContent = 'View Driver';
      submitBtn.style.display = 'none';
      populateForm(data);
    }

    modal.classList.add('show');
  }

  function populateForm(data) {
    inputs.id.value = data.id || data.real_id || '';
    inputs.name.value = data.name || '';
    inputs.license.value = data.license_number || data.license || '';
    inputs.phone.value = data.phone || '';
    inputs.status.value = data.status || 'Available';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      clearValidation();
      let isValid = true;
      
      if (!inputs.name.value.trim()) { showError(inputs.name, 'Full Name is required'); isValid = false; }
      if (!inputs.license.value.trim()) { showError(inputs.license, 'License Number is required'); isValid = false; }
      if (!inputs.phone.value.trim()) { showError(inputs.phone, 'Contact Number is required'); isValid = false; }
      
      if (!isValid) return;

      const payload = {
        name: inputs.name.value.trim(),
        license_number: inputs.license.value.trim(),
        phone: inputs.phone.value.trim(),
        status: inputs.status.value,
        hours_worked: 0,
        performance_score: 100
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (currentMode === 'add') {
          const exists = allDrivers.some(d => (d.license_number || d.license) === payload.license_number);
          if (exists) {
             showError(inputs.license, 'License number already exists');
             throw new Error('Duplicate License');
          }
          await window.api.post('/drivers', payload, 'drivers');
          window.showToast?.('Driver added successfully', 'success');
        } else if (currentMode === 'edit') {
          const id = inputs.id.value;
          await window.api.put(`/drivers/${id}`, payload, 'drivers');
          window.showToast?.('Driver updated successfully', 'success');
        }
        
        closeDrawer();
        loadDrivers();
      } catch (err) {
        if (err.message !== 'Duplicate License') {
            window.showToast?.('Error saving driver', 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'add' ? 'Save Driver' : 'Update Driver';
      }
    };
  }

  async function loadDrivers() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    if (!grid) return;
    
    grid.innerHTML = `
      <div class="card driver-card skeleton" style="height: 200px;"></div>
      <div class="card driver-card skeleton" style="height: 200px;"></div>
      <div class="card driver-card skeleton" style="height: 200px;"></div>
    `;

    try {
      allDrivers = await window.api.get('/drivers', 'drivers');
      renderGrid();
    } catch (err) {
       console.error('Failed to load drivers:', err);
    }
  }

  function renderGrid() {
      if (!grid) return;
      let filtered = allDrivers;
      
      const term = globalSearch ? globalSearch.value.toLowerCase() : '';
      const nameTerm = nameFilter ? nameFilter.value.toLowerCase() : '';
      const statTerm = statusFilter ? statusFilter.value : 'All Statuses';

      if (term) {
        filtered = filtered.filter(d => 
            (d.name || '').toLowerCase().includes(term) ||
            (d.license_number || d.license || '').toLowerCase().includes(term) ||
            (d.phone || '').toLowerCase().includes(term)
        );
      }
      if (nameTerm) {
         filtered = filtered.filter(d => (d.name || '').toLowerCase().includes(nameTerm));
      }
      if (statTerm !== 'All Statuses') {
         filtered = filtered.filter(d => d.status === statTerm);
      }

      grid.innerHTML = '';
      
      if (filtered.length === 0) {
          grid.innerHTML = '<div class="text-center text-muted" style="grid-column: 1 / -1;">No drivers found</div>';
      } else {
          filtered.forEach(d => {
            let badgeClass = 'badge-success';
            if (d.status === 'On Duty') badgeClass = 'badge-info';
            if (d.status === 'Off Duty') badgeClass = 'badge-secondary';
            if (d.status === 'Terminated') badgeClass = 'badge-danger';
            
            const initials = (d.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'card driver-card';
            card.innerHTML = `
              <div class="driver-header">
                <div class="driver-avatar">${initials}</div>
                <div class="driver-info">
                  <h3>${d.name}</h3>
                  <span class="badge ${badgeClass}">${d.status}</span>
                </div>
                <div class="d-flex gap-2" style="margin-left:auto;">
                   <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="viewDriver(${d.real_id || d.id})" title="View">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   </button>
                   <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="editDriver(${d.real_id || d.id})" title="Edit">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                   </button>
                   <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="deleteDriver(${d.real_id || d.id})" title="Delete">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                   </button>
                </div>
              </div>
              
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                <div class="d-flex justify-between mb-2">
                  <span>License</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${d.license_number || d.license}</span>
                </div>
                <div class="d-flex justify-between">
                  <span>Contact</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${d.phone}</span>
                </div>
              </div>

              <div class="driver-stats">
                <div class="stat-box">
                  <div class="stat-label">Hours (Wk)</div>
                  <div class="stat-val">${d.hours_worked || d.hoursWorked || 0}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Score</div>
                  <div class="stat-val" style="color: var(--success-color)">${d.performance_score || d.performanceScore || 100}/100</div>
                </div>
              </div>
            `;
            grid.appendChild(card);
          });
      }
  }

  if (globalSearch) globalSearch.addEventListener('input', renderGrid);
  if (nameFilter) nameFilter.addEventListener('input', renderGrid);
  if (statusFilter) statusFilter.addEventListener('change', renderGrid);

  window.viewDriver = function(id) {
     const d = allDrivers.find(x => (x.id === id || x.real_id === id));
     if (d) openDrawer('view', d);
  };
  
  window.editDriver = function(id) {
     const d = allDrivers.find(x => (x.id === id || x.real_id === id));
     if (d) openDrawer('edit', d);
  };

  window.deleteDriver = async function(id) {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await window.api.delete(`/drivers/${id}`, 'drivers');
      window.showToast?.('Driver deleted successfully', 'success');
      loadDrivers();
    } catch (err) {
      // Handled in API
    }
  };

  loadDrivers();
});

