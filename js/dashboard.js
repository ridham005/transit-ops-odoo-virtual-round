document.addEventListener('DOMContentLoaded', () => {
  // RBAC filters for dashboard
  const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
  if (role === 'Dispatcher') {
    const expCard = document.querySelector('.kpi-card:nth-child(4)');
    if (expCard) expCard.style.display = 'none';
  }
  if (role === 'Safety Officer') {
    const revCard = document.querySelector('.kpi-card:nth-child(2)');
    const expCard = document.querySelector('.kpi-card:nth-child(4)');
    if (revCard) revCard.style.display = 'none';
    if (expCard) expCard.style.display = 'none';
  }
  if (role === 'Financial Analyst') {
    const dispCard = document.querySelector('.kpi-card:nth-child(3)');
    if (dispCard) dispCard.style.display = 'none';
  }

  // Display role
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  // Drawer logic
  const modal = document.getElementById('tripModal');
  const createBtn = document.getElementById('create-trip-btn');
  const closeBtn = document.getElementById('closeTripModal');

  if (createBtn) createBtn.onclick = () => modal.classList.add('show');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');
  window.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };

  const submitBtn = document.getElementById('submitBtn');
  const form = document.getElementById('tripForm');

  const inputs = {
    source: document.getElementById('trp-source'),
    dest: document.getElementById('trp-dest'),
    vehicle: document.getElementById('trp-vehicle'),
    driver: document.getElementById('trp-driver'),
    weight: document.getElementById('trp-weight'),
    distance: document.getElementById('trp-distance')
  };

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

  if (createBtn) {
    createBtn.onclick = () => {
      clearValidation();
      form.reset();
      modal.classList.add('show');
    };
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
        status: 'Draft',
        trip_cost: 0
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        await window.api.post('/trips', payload, 'trips');
        window.showToast?.('Trip saved as Draft', 'success');
        modal.classList.remove('show');
        form.reset();
        loadDashboardData(); // Refresh UI
      } catch (err) {
         window.showToast?.('Error saving trip', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Trip';
      }
    };
  }

  // Load Dashboard Data
  async function loadDashboardData() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    try {
      // Add skeleton classes
      const kpis = ['kpi-active-vehicles', 'kpi-available-vehicles', 'kpi-inshop-vehicles', 'kpi-utilization'];
      kpis.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('skeleton');
      });
      
      const tripsTbody = document.querySelector('.saas-table tbody');
      if (tripsTbody) {
         tripsTbody.innerHTML = `
           <tr><td class="skeleton">#TRP-XXXX</td><td class="skeleton">Driver Name</td><td class="skeleton">Destination</td><td class="skeleton">Status</td></tr>
           <tr><td class="skeleton">#TRP-XXXX</td><td class="skeleton">Driver Name</td><td class="skeleton">Destination</td><td class="skeleton">Status</td></tr>
         `;
      }
      
      const activityContainer = document.querySelector('.card .d-flex.flex-direction-column') || document.querySelector('.card > div[style*="flex-direction: column"]');
      if (activityContainer) {
         activityContainer.innerHTML = `
           <div class="d-flex gap-4"><div style="width: 10px; height: 10px; border-radius: 50%;" class="skeleton"></div><div><div class="skeleton">Loading activity title</div><div class="skeleton">Loading time</div></div></div>
         `;
      }

      // Fetch Data
      const [stats, activities, trips, vehicles, drivers] = await Promise.all([
        window.api.get('/dashboard/stats', 'dashboardStats'),
        window.api.get('/activities', 'activities'),
        window.api.get('/trips?status=In Transit', 'trips'),
        window.api.get('/vehicles?status=Available', 'vehicles'),
        window.api.get('/drivers?status=Available', 'drivers')
      ]);

      // Populate KPIs
      const active = stats.active_vehicles || stats.activeVehicles || 0;
      const inshop = stats.inshop_vehicles || stats.inShopVehicles || 0;
      const totalRev = stats.total_revenue || 0;
      
      document.getElementById('kpi-active-vehicles').textContent = active;
      document.getElementById('kpi-available-vehicles').textContent = vehicles.length || stats.availableVehicles || 0;
      document.getElementById('kpi-inshop-vehicles').textContent = inshop;
      
      const utilization = (active > 0) ? Math.round((active / (active + (vehicles.length || 1) + inshop)) * 100) : (stats.fleetUtilization || '0%');
      document.getElementById('kpi-utilization').textContent = typeof utilization === 'string' ? utilization : `${utilization}%`;
      
      kpis.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('skeleton');
      });

      // Populate Active Trips
      if (tripsTbody) {
        tripsTbody.innerHTML = '';
        if (trips.length === 0) {
            tripsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No active trips</td></tr>';
        } else {
            trips.slice(0, 4).forEach(t => {
                const tr = document.createElement('tr');
                const badgeClass = t.status === 'In Transit' ? 'badge-success' : (t.status === 'Delayed' ? 'badge-warning' : 'badge-info');
                tr.innerHTML = `
                    <td>#${t.id || 'TRP'}</td>
                    <td>${t.driver_name || t.driver || 'Unassigned'}</td>
                    <td>${t.destination}</td>
                    <td><span class="badge ${badgeClass}">${t.status}</span></td>
                `;
                tripsTbody.appendChild(tr);
            });
        }
      }

      // Populate Recent Activity
      if (activityContainer) {
        activityContainer.innerHTML = '';
        if (activities.length === 0) {
            activityContainer.innerHTML = '<div class="text-center text-muted">No recent activity</div>';
        } else {
            activities.slice(0, 3).forEach(a => {
                const div = document.createElement('div');
                div.className = 'd-flex gap-4';
                // Simple color hash based on action
                const color = a.action.includes('Delete') ? 'var(--campus-danger, #e74c3c)' : 
                              (a.action.includes('Create') || a.action.includes('Add') ? 'var(--campus-success, #2ecc71)' : 'var(--campus-info, #3498db)');
                
                div.innerHTML = `
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; margin-top: 6px;"></div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">${a.action}</div>
                    <div class="text-muted">${a.description} â€¢ ${a.user_name || 'System'}</div>
                  </div>
                `;
                activityContainer.appendChild(div);
            });
        }
      }

      // Populate selects for New Trip form
      const vehicleSelect = document.getElementById('trp-vehicle');
      const driverSelect = document.getElementById('trp-driver');
      
      if (vehicleSelect) {
          vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
          vehicles.forEach(v => {
              vehicleSelect.innerHTML += `<option value="${v.real_id || v.id}">${v.reg_number || v.regNumber}</option>`;
          });
      }
      
      if (driverSelect) {
          driverSelect.innerHTML = '<option value="">Select Driver</option>';
          drivers.forEach(d => {
              driverSelect.innerHTML += `<option value="${d.real_id || d.id}">${d.name}</option>`;
          });
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  loadDashboardData();

  // Export Report Logic
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === 'Export Report' || btn.textContent.trim() === 'Download Report') {
      btn.addEventListener('click', () => {
        let csv = [];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
        
        csv.push(`TransitOps Global Dashboard Report`);
        csv.push(`Generated: ${dateStr} ${timeStr}`);
        
        const userName = document.querySelector('.user-name')?.textContent || 'Unknown User';
        const userRole = document.querySelector('.user-role')?.textContent || 'Unknown Role';
        csv.push(`Generated By: ${userName} (${userRole})`);
        csv.push('');
        
        csv.push('Dashboard KPIs');
        csv.push('Active Trips,Vehicles on Road,Maintenance Alerts,Total Revenue (INR)');
        
        const trips = document.querySelector('#kpi-trips')?.textContent || '0';
        const vehicles = document.querySelector('#kpi-vehicles')?.textContent || '0';
        const alerts = document.querySelector('#kpi-alerts')?.textContent || '0';
        let revenue = document.querySelector('#kpi-revenue')?.textContent || '0';
        revenue = revenue.replace(/[^0-9.]/g, ''); // strip non-numeric
        
        csv.push(`${trips},${vehicles},${alerts},â‚¹${revenue}`);
        csv.push('');

        csv.push('Active Trips');
        csv.push('Vehicle,Route,Status,ETA');
        const tripCards = document.querySelectorAll('.trip-card');
        tripCards.forEach(tc => {
            const lines = tc.innerText.split('\n').filter(l => l.trim() !== '');
            const id = lines[0] || '';
            const route = lines[1] || '';
            const status = lines[lines.length-1] || '';
            csv.push(`"${id}","${route}","${status}","-"`);
        });
        csv.push('');
        
        csv.push('Recent Activity');
        csv.push('Time,Activity');
        const activities = document.querySelectorAll('.activity-item');
        activities.forEach(ac => {
            const t = ac.querySelector('.time')?.textContent || '';
            const desc = ac.querySelector('.desc')?.textContent || '';
            csv.push(`"${t}","${desc}"`);
        });

        const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `TransitOps_Report_${dateStr}_${timeStr}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        if (window.showToast) window.showToast('Dashboard Report exported to CSV.', 'success');
      });
    }
  });

});

