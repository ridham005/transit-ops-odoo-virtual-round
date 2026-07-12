document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const tbody = document.getElementById('expenses-body');
  
  // Drawer logic
  const modal = document.getElementById('expenseModal');
  const createBtn = document.querySelector('button.saas-btn-primary'); // + Add Expense
  const closeBtn = document.getElementById('closeExpenseModal');
  const submitBtn = document.getElementById('submitBtn');
  const drawerTitle = document.getElementById('drawerTitle');
  const form = document.getElementById('expenseForm');

  // Input Fields
  const inputs = {
    id: document.getElementById('exp-id'),
    vehicle: document.getElementById('exp-vehicle'),
    category: document.getElementById('exp-category'),
    amount: document.getElementById('exp-amount'),
    date: document.getElementById('exp-date'),
    status: document.getElementById('exp-status')
  };

  let allExpenses = [];
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
      drawerTitle.textContent = 'Add Expense';
      submitBtn.textContent = 'Save Expense';
      submitBtn.style.display = 'flex';
      inputs.status.value = 'Pending';
      inputs.status.disabled = true; // Auto pending on creation
    } else if (mode === 'edit' && data) {
      drawerTitle.textContent = 'Edit Expense';
      submitBtn.textContent = 'Update Expense';
      submitBtn.style.display = 'flex';
      inputs.status.disabled = false;
      populateForm(data);
    } else if (mode === 'view' && data) {
      drawerTitle.textContent = 'View Expense';
      submitBtn.style.display = 'none';
      populateForm(data);
    }

    modal.classList.add('show');
  }

  function populateForm(data) {
    inputs.id.value = data.id || data.real_id || '';
    inputs.vehicle.value = data.vehicle_id || '';
    inputs.category.value = data.type || data.category || 'Other';
    inputs.amount.value = data.amount || '0';
    inputs.date.value = data.date || data.created_at?.split('T')[0] || '';
    inputs.status.value = data.status || 'Pending';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      clearValidation();
      let isValid = true;
      
      if (!inputs.category.value.trim()) { showError(inputs.category, 'Category is required'); isValid = false; }
      if (!inputs.date.value) { showError(inputs.date, 'Date is required'); isValid = false; }
      
      const amountVal = parseFloat(inputs.amount.value);
      if (isNaN(amountVal) || amountVal <= 0) {
          showError(inputs.amount, 'Valid positive amount is required');
          isValid = false;
      }
      
      if (!isValid) return;

      const payload = {
        vehicle_id: inputs.vehicle.value ? parseInt(inputs.vehicle.value) : null,
        type: inputs.category.value.trim(),
        amount: amountVal,
        date: inputs.date.value
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (currentMode === 'add') {
          await window.api.post('/expenses', payload, 'expenses');
          window.showToast?.('Expense added successfully', 'success');
        } else if (currentMode === 'edit') {
          const id = inputs.id.value;
          await window.api.put(`/expenses/${id}`, payload, 'expenses');
          window.showToast?.('Expense updated successfully', 'success');
        }
        
        closeDrawer();
        loadExpenses();
      } catch (err) {
         window.showToast?.('Error saving expense', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === 'add' ? 'Save Expense' : 'Update Expense';
      }
    };
  }

  function renderChart() {
    const chart = document.getElementById('expense-chart');
    if (!chart) return;
    chart.innerHTML = '';
    
    const last7Days = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days[dateStr] = { 
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            total: 0 
        };
    }
    
    allExpenses.forEach(e => {
        const eDate = e.date || (e.created_at ? e.created_at.split('T')[0] : null);
        if (eDate && last7Days[eDate]) {
            last7Days[eDate].total += parseFloat(e.amount) || 0;
        }
    });

    const maxVal = Math.max(...Object.values(last7Days).map(d => d.total), 100); 
    
    Object.values(last7Days).forEach(d => {
      const heightPct = (d.total / maxVal) * 100;
      const barWrap = document.createElement('div');
      barWrap.className = 'chart-bar-wrap';
      barWrap.innerHTML = `
        <div class="chart-bar" style="height: ${heightPct}%" data-val="₹${d.total.toLocaleString('en-IN')}"></div>
        <div class="chart-label">${d.dayName}</div>
      `;
      chart.appendChild(barWrap);
    });
  }

  async function loadExpenses() {
    const tbody = document.querySelector('tbody'); if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">Loading data...</td></tr>';
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td class="skeleton">Date</td>
        <td class="skeleton">Vehicle</td>
        <td class="skeleton">Category</td>
        <td class="skeleton">Amount</td>
        <td class="skeleton"><span class="badge badge-success">Status</span></td>
        <td class="skeleton">Action</td>
      </tr>
    `;

    try {
      const [expenses, vehicles, maintenance] = await Promise.all([
          window.api.get('/expenses', 'expenses'),
          window.api.get('/vehicles', 'vehicles'),
          window.api.get('/maintenance', 'maintenanceRecords').catch(() => [])
      ]);

      allExpenses = expenses;

      if (inputs.vehicle) {
          inputs.vehicle.innerHTML = '<option value="">General Expense</option>';
          vehicles.forEach(v => {
              inputs.vehicle.innerHTML += `<option value="${v.real_id || v.id}">${v.registration_number || v.regNumber} (${v.type})</option>`;
          });
      }

      let fuelCosts = 0;
      let otherCosts = 0;
      expenses.forEach(e => {
          const amt = parseFloat(e.amount) || 0;
          const eType = e.type || e.category;
          if (eType === 'Fuel') {
              fuelCosts += amt;
          } else if (eType !== 'Maintenance') {
              otherCosts += amt;
          }
      });
      
      let maintCosts = 0;
      if (maintenance) {
          maintenance.forEach(m => {
              maintCosts += parseFloat(m.cost) || 0;
          });
      }
      
      const totalCosts = fuelCosts + otherCosts + maintCosts;
      
      const kpiTotal = document.getElementById('kpi-total');
      const kpiFuel = document.getElementById('kpi-fuel');
      const kpiMaint = document.getElementById('kpi-maint');
      const kpiOther = document.getElementById('kpi-other');
      
      if (kpiTotal) kpiTotal.textContent = '₹' + totalCosts.toLocaleString('en-IN');
      if (kpiFuel) kpiFuel.textContent = '₹' + fuelCosts.toLocaleString('en-IN');
      if (kpiMaint) kpiMaint.textContent = '₹' + maintCosts.toLocaleString('en-IN');
      if (kpiOther) kpiOther.textContent = '₹' + otherCosts.toLocaleString('en-IN');

      renderTable();
      renderChart();
    } catch (err) {
       console.error('Failed to load expenses:', err);
    }
  }

  function renderTable() {
     if (!tbody) return;
     let filtered = allExpenses;
     
     const term = globalSearch ? globalSearch.value.toLowerCase() : '';
     
     if (term) {
        filtered = filtered.filter(e => 
            (e.vehicle_reg || e.vehicle || 'General').toLowerCase().includes(term) ||
            (e.type || e.category || '').toLowerCase().includes(term) ||
            (e.status || '').toLowerCase().includes(term) ||
            (e.date || e.created_at || '').toLowerCase().includes(term)
        );
     }
     
     tbody.innerHTML = '';
      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No expenses found</td></tr>';
      } else {
          filtered.forEach(exp => {
            let badgeClass = 'badge-success'; // Approved
            if (exp.status === 'Pending') badgeClass = 'badge-warning';
            if (exp.status === 'Rejected') badgeClass = 'badge-danger';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${exp.date || exp.created_at || 'Unknown'}</td>
              <td><strong>${exp.vehicle_reg || exp.vehicle || 'General'}</strong></td>
              <td>${exp.type || exp.category}</td>
              <td style="font-weight: 500;">₹${exp.amount}</td>
              <td><span class="badge ${badgeClass}">${exp.status}</span></td>
              <td>
                <div class="d-flex gap-2">
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="viewExpense(${exp.real_id || exp.id})" title="View">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="editExpense(${exp.real_id || exp.id})" title="Edit">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="saas-btn saas-btn-icon saas-btn-secondary" onclick="deleteExpense(${exp.real_id || exp.id})" title="Delete Expense">
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

  window.viewExpense = function(id) {
     const e = allExpenses.find(x => (x.id === id || x.real_id === id));
     if (e && e.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == e.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${e.vehicle_id}">${e.vehicle_reg || e.vehicle}</option>`;
     }
     if (e) openDrawer('view', e);
  };
  
  window.editExpense = function(id) {
     const e = allExpenses.find(x => (x.id === id || x.real_id === id));
     if (e && e.vehicle_id && ![...inputs.vehicle.options].find(o => o.value == e.vehicle_id)) {
         inputs.vehicle.innerHTML += `<option value="${e.vehicle_id}">${e.vehicle_reg || e.vehicle}</option>`;
     }
     if (e) openDrawer('edit', e);
  };

  window.deleteExpense = async function(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await window.api.delete(`/expenses/${id}`, 'expenses');
      window.showToast?.('Expense deleted successfully', 'success');
      loadExpenses();
    } catch (err) {
      // Handled in API
    }
  };

  loadExpenses();

  // Export Report Logic
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === 'Export CSV' || btn.textContent.trim() === 'Export Report' || btn.textContent.trim() === 'Download Report') {
      btn.addEventListener('click', () => {
        let csv = [];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
        
        csv.push(`Fuel & Expenses Report`);
        csv.push(`Generated: ${dateStr} ${timeStr}`);
        
        const userName = document.querySelector('.user-name')?.textContent || 'Unknown User';
        const userRole = document.querySelector('.user-role')?.textContent || 'Unknown Role';
        csv.push(`Generated By: ${userName} (${userRole})`);
        csv.push('');
        
        csv.push('Overview');
        csv.push('Fuel Costs,Other Expenses,Total Expenses');
        
        const kpiFuel = document.querySelector('#kpi-fuel')?.textContent || '0';
        const kpiOther = document.querySelector('#kpi-other')?.textContent || '0';
        const kpiTotal = document.querySelector('#kpi-total')?.textContent || '0';

        csv.push(`${kpiFuel},${kpiOther},${kpiTotal}`);
        csv.push('');

        csv.push('Expense Log');
        csv.push('Date,Vehicle,Type,Amount,Status');
        
        document.querySelectorAll('tbody tr').forEach(tr => {
            if (tr.textContent.includes('No expenses found') || tr.textContent.includes('Loading')) return;
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

        if (window.showToast) window.showToast('Expenses Report exported to CSV.', 'success');
      });
    }
  });

});

