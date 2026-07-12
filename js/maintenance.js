document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const tbody = document.getElementById('maintenance-body');
  
  // Drawer logic
  const modal = document.getElementById('maintenanceModal');
  const createBtn = document.querySelector('button.saas-btn-primary'); // + Log Maintenance
  const closeBtn = document.getElementById('closeMaintenanceModal');
  const submitBtn = document.getElementById('submitBtn');
  const drawerTitle = document.getElementById('drawerTitle');
  const form = document.getElementById('maintenanceForm');

  // Input Fields
  const inputs = {
    id: document.getElementById('mnt-id'),
    vehicle: document.getElementById('mnt-vehicle'),
    type: document.getElementById('mnt-type'),
    date: document.getElementById('mnt-date'),
    cost: document.getElementById('mnt-cost'),
    status: document.getElementById('mnt-status')
  };

  let allRecords = [];
  let currentMode = 'add';

  // Search/Filter Elements
  const globalSearch = document.getElementById('global-search');

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
      drawerTitle.textContent = 'Log Maintenance';
      submitBtn.textContent = 'Save Record';
      submitBtn.style.display = 'flex';
      inputs.status.value = 'Completed';
    } else if (mode === 'edit' && data) {
      drawerTitle.textContent = 'Edit Record';
      submitBtn.textContent = 'Update Record';
      submitBtn.style.display = 'flex';
      populateForm(data);
    } else if (mode === 'view' && data) {
      drawerTitle.textContent = 'View Record';
      submitBtn.style.display = 'none';
      populateForm(data);
    }

    modal.classList.add('show');
  }

  function populateForm(data) {
    inputs.id.value = data.id || data.real_id || '';
    inputs.vehicle.value = data.vehicle_id || '';
    inputs.type.value = data.type || '';
    inputs.date.value = data.date || '';
    inputs.cost.value = data.cost || '0';
    inputs.status.value = data.status || 'Completed';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      clearValidation();
      let isValid = true;
      
      if (!inputs.vehicle.value) { showError(inputs.vehicle, 'Vehicle is required'); isValid = false; }
      if (!inputs.type.value.trim()) { showError(inputs.type, 'Service Type is required'); isValid = false; }
      if (!inputs.date.value) { showError(inputs.date, 'Date is required'); isValid = false; }
      
      const costVal = parseFloat(inputs.cost.value);
      if (isNaN(costVal) || costVal < 0) {
          showError(inputs.cost, 'Valid positive cost is required');
          isValid = false;
      }
      
      if (!isValid) return;

      const payload = {
        vehicle_id: inputs.vehicle.value,
        type: inputs.type.value.trim(),
        date: inputs.date.value,
        cost: costVal,
        status: inputs.status.value
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (currentMode === 'add') {
          await window.api.post('/maintenance', payload, 'maintenanceRecords');
          window.showToast?.('Record logged successfully', 'success');
        } else if (currentMode === 'edit') {
          const id = inputs.id.value;
          await window.api.put(`/maintenance/${id}`, payload, 'maintenanceRecords');
          window.showToast?.('Record updated successfully', 'success');
        }
        
        closeDrawer();
        loadMaintenance();
      } catch (err) {
         window.showToast?.('Error saving record', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'add' ? 'Save Record' : 'Update Record';
      }
    };
  }

  async function loadMaintenance() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td class="skeleton">SRV-XXX</td>
        <td class="skeleton">Vehicle</td>
        <td class="skeleton">Type</td>
        <td class="skeleton">Date</td>
        <td class="skeleton">Cost</td>
        <td class="skeleton"><span class="badge badge-success">Status</span></td>
        <td class="skeleton">Action</td>
      </tr>
    `;

    try {
      const [records, vehicles] = await Promise.all([
         window.api.get('/maintenance', 'maintenanceRecords'),
         window.api.get('/vehicles', 'vehicles')
      ]);

      allRecords = records;

      if (inputs.vehicle) {
          inputs.vehicle.innerHTML = '<option value="">Select Vehicle</option>';
          vehicles.forEach(v => {
              inputs.vehicle.innerHTML += `<option value="${v.real_id || v.id}">${v.registration_number || v.regNumber} (${v.type})</option>`;
          });
      }

      // Action Needed Alerts
      const alertsGrid = document.getElementById('action-needed-alerts');
      if (alertsGrid) {
          alertsGrid.innerHTML = '';
          let alertsCount = 0;
          const today = new Date();
          today.setHours(0,0,0,0);
          
          allRecords.forEach(r => {
             // Check overdue
             if (r.status === 'Scheduled' || r.status === 'In Progress') {
                 const rDate = new Date(r.date);
                 if (rDate < today) {
                     alertsCount++;
                     alertsGrid.innerHTML += `
                        <div class="alert-card warning">
                          <div class="alert-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          </div>
                          <div class="alert-content">
                            <h4>Overdue Maintenance</h4>
                            <p>Vehicle <strong>${r.vehicle_reg || r.vehicle || 'Unknown'}</strong> maintenance (${r.type}) was scheduled for ${r.date} and is overdue.</p>
                            <button class="saas-btn saas-btn-secondary" style="font-size: 0.8rem; padding: 6px 12px" onclick="viewMaintenance(${r.id || r.real_id})">View Details</button>
                          </div>
                        </div>
                     `;
                 }
             }
             
             // Check engine fault
             if ((r.type || '').toLowerCase().includes('fault') || (r.type || '').toLowerCase().includes('engine')) {
                if (r.status !== 'Completed') {
                     alertsCount++;
                     alertsGrid.innerHTML += `
                        <div class="alert-card critical">
                          <div class="alert-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          </div>
                          <div class="alert-content">
                            <h4>Engine Fault Detected</h4>
                            <p>Vehicle <strong>${r.vehicle_reg || r.vehicle || 'Unknown'}</strong> has an unresolved engine fault (${r.type}).</p>
                            <button class="saas-btn saas-btn-secondary" style="font-size: 0.8rem; padding: 6px 12px" onclick="viewMaintenance(${r.id || r.real_id})">Schedule Repair</button>
                          </div>
                        </div>
                     `;
                }
             }
          });
          
          if (alertsCount === 0) {
             alertsGrid.innerHTML = '<div class="text-muted" style="grid-column: 1 / -1;">No action needed at this time.</div>';
          }
      }

      renderTable();
    } catch (err) {
       console.error('Failed to load maintenance records:', err);
    }
  }

  function renderTable() {
     if (!tbody) return;
     let filtered = allRecords;
     
     const term = globalSearch ? globalSearch.value.toLowerCase() : '';
     
     if (term) {
        filtered = filtered.filter(r => 
            (r.vehicle_reg || r.vehicle || '').toLowerCase().includes(term) ||
            (r.type || '').toLowerCase().includes(term) ||
            (r.status || '').toLowerCase().includes(term)
        );
     }
     
     tbody.innerHTML = '';
      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No maintenance records found</td></tr>';
      } else {
          filtered.forEach(record => {
            let badgeClass = 'badge-success';
            if (record.status === 'In Progress') badgeClass = 'badge-warning';
            if (record.status === 'Scheduled') badgeClass = 'badge-info';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>SRV-${record.real_id || record.id || 'XXX'}</strong></td>
              <td>${record.vehicle_reg || record.vehicle || 'Unknown'}</td>
              <td>${record.type}</td>
              <td>${record.date}</td>
              <td style="font-weight: 500;">₹${record.cost}</td>
              <td><span class="badge ${badgeClass}">${record.status}</span></td>
              <td>
                <div class="d-flex gap-2">
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="viewMaintenance(${record.real_id || record.id})" title="View">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="editMaintenance(${record.real_id || record.id})" title="Edit">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="deleteMaintenance(${record.real_id || record.id})" title="Delete Record">
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

  window.viewMaintenance = function(id) {
     const r = allRecords.find(x => (x.id === id || x.real_id === id));
     if (r && r.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == r.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${r.vehicle_id}">${r.vehicle_reg || r.vehicle}</option>`;
     }
     if (r) openDrawer('view', r);
  };
  
  window.editMaintenance = function(id) {
     const r = allRecords.find(x => (x.id === id || x.real_id === id));
     if (r && r.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == r.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${r.vehicle_id}">${r.vehicle_reg || r.vehicle}</option>`;
     }
     if (r) openDrawer('edit', r);
  };

  window.deleteMaintenance = async function(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await window.api.delete(`/maintenance/${id}`, 'maintenanceRecords');
      window.showToast?.('Record deleted successfully', 'success');
      loadMaintenance();
    } catch (err) {
      // Handled in API
    }
  };

  loadMaintenance();

  // Export Report Logic
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === 'Export Log' || btn.textContent.trim() === 'Export Report' || btn.textContent.trim() === 'Download Report') {
      btn.addEventListener('click', () => {
        let csv = [];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
        
        csv.push(`Maintenance Log Report`);
        csv.push(`Generated: ${dateStr} ${timeStr}`);
        
        const userName = document.querySelector('.user-name')?.textContent || 'Unknown User';
        const userRole = document.querySelector('.user-role')?.textContent || 'Unknown Role';
        csv.push(`Generated By: ${userName} (${userRole})`);
        csv.push('');
        
        csv.push('Overview');
        csv.push('Active Repairs,Scheduled,Critical Issues,Completed (30d)');
        
        const kpiAct = document.querySelector('#kpi-active')?.textContent || '0';
        const kpiSched = document.querySelector('#kpi-scheduled')?.textContent || '0';
        const kpiCrit = document.querySelector('#kpi-critical')?.textContent || '0';
        const kpiComp = document.querySelector('#kpi-completed')?.textContent || '0';

        csv.push(`${kpiAct},${kpiSched},${kpiCrit},${kpiComp}`);
        csv.push('');

        csv.push('Records');
        csv.push('Date,Vehicle,Service Type,Cost,Status');
        
        document.querySelectorAll('tbody tr').forEach(tr => {
            if (tr.textContent.includes('No maintenance records') || tr.textContent.includes('Loading')) return;
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 5) {
                csv.push(`"${tds[0].textContent.trim()}","${tds[1].textContent.trim()}","${tds[2].textContent.trim()}","${tds[3].textContent.trim()}","${tds[4].textContent.trim()}"`);
            }
        });

        const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `TransitOps_Report_${dateStr}_${timeStr}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        if (window.showToast) window.showToast('Maintenance Log exported to CSV.', 'success');
      });
    }
  });

});

