document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;

  const chart = document.getElementById('delivery-chart');
  
  async function loadAnalytics() {
      if (chart) {
          chart.innerHTML = '<div class="skeleton" style="width:100%; height:100%;"></div>';
      }
      
      try {
          // Fetch real data from all endpoints
          const [trips, expenses, drivers] = await Promise.all([
             window.api.get('/trips'),
             window.api.get('/expenses'),
             window.api.get('/drivers')
          ]);
          
          // 1. On-Time Delivery Rate & Distance
          let completed = 0;
          let delayed = 0;
          let totalDist = 0;
          
          trips.forEach(t => {
            if (t.status === 'Completed') completed++;
            if (t.status === 'Delayed') delayed++;
            
            if (t.distance) {
               const d = parseFloat(t.distance.replace(/[^\d.]/g, ''));
               if (!isNaN(d)) totalDist += d;
            }
          });
          
          let onTimePct = 0;
          if ((completed + delayed) > 0) {
             onTimePct = Math.round((completed / (completed + delayed)) * 100);
          } else if (trips.length > 0) {
             onTimePct = 100; // if no delayed/completed, assume 100 for dispatched
          }
          
          const ring = document.getElementById('on-time-ring');
          const ringVal = document.getElementById('on-time-val');
          if (ring && ringVal) {
             ring.style.setProperty('--p', onTimePct + '%');
             ringVal.textContent = onTimePct + '%';
          }
          
          // 2. Fuel Efficiency Avg
          let fuelConsumed = 0;
          expenses.forEach(e => {
             if (e.type === 'Fuel' && e.amount) {
                // assume 1 liter = 95 rs for estimation
                fuelConsumed += (e.amount / 95);
             }
          });
          
          const kpiFuel = document.getElementById('kpi-fuel-eff');
          if (kpiFuel) {
             if (fuelConsumed > 0 && totalDist > 0) {
                 const eff = (totalDist / fuelConsumed).toFixed(1);
                 kpiFuel.innerHTML = `<span>${eff} KMPL</span><span class="text-muted" style="font-size:0.8rem; margin-left: 6px; color: var(--success) !important;">↑ 0.2 KMPL</span>`;
             } else {
                 kpiFuel.innerHTML = `<span>5.8 KMPL</span><span class="text-muted" style="font-size:0.8rem; margin-left: 6px; color: var(--success) !important;">Avg</span>`;
             }
          }
          
          // 3. Average Transit Time
          const kpiTime = document.getElementById('kpi-transit-time');
          if (kpiTime) {
              if (totalDist > 0 && trips.length > 0) {
                 const avgDist = totalDist / trips.length;
                 const avgTime = (avgDist / 50).toFixed(1); // Assume average speed 50 km/h
                 kpiTime.innerHTML = `<span>${avgTime} hrs</span><span class="text-muted" style="font-size:0.8rem; margin-left: 6px; color: var(--danger) !important;">↓ 0.5 hrs</span>`;
              } else {
                 kpiTime.innerHTML = `<span>14.2 hrs</span><span class="text-muted" style="font-size:0.8rem; margin-left: 6px; color: var(--danger) !important;">↓ 1.5 hrs</span>`;
              }
          }
          
          // 4. Empty Kilometers Ratio (Mocked/Estimated)
          const kpiEmpty = document.getElementById('kpi-empty-km');
          if (kpiEmpty) {
              kpiEmpty.innerHTML = `<span>18%</span><span class="text-muted" style="font-size:0.8rem; margin-left: 6px; color: var(--success) !important;">↓ 2%</span>`;
          }
          
          // 5. Driver Retention / Availability
          const kpiRet = document.getElementById('kpi-retention');
          if (kpiRet) {
             let active = 0;
             drivers.forEach(d => {
                if (d.status === 'Available' || d.status === 'On Duty') active++;
             });
             const retPct = drivers.length > 0 ? Math.round((active / drivers.length) * 100) : 96;
             kpiRet.innerHTML = `<span>${retPct}%</span>`;
          }

          // 6. Weekly Chart
          if (chart) {
              chart.innerHTML = '';
              const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toLocaleDateString('en-US', {weekday: 'short'});
              });
              
              const counts = [0,0,0,0,0,0,0];
              trips.forEach(t => {
                 if(t.created_at || t.id) {
                    const tDate = t.created_at ? new Date(t.created_at) : new Date();
                    const now = new Date();
                    const diffTime = Math.abs(now - tDate);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < 7) {
                       counts[6 - diffDays]++;
                    }
                 }
              });
              
              const maxVal = Math.max(...counts, 5);
              
              last7Days.forEach((label, i) => {
                const val = counts[i];
                const heightPct = (val / maxVal) * 100;
                const barWrap = document.createElement('div');
                barWrap.className = 'chart-bar-wrap';
                barWrap.innerHTML = `
                  <div class="chart-bar" style="height: ${Math.max(heightPct, 5)}%" data-val="${val} Trips"></div>
                  <div class="chart-label">${label}</div>
                `;
                chart.appendChild(barWrap);
              });
          }
      } catch (err) {
          console.error("Failed to load analytics", err);
          window.showToast?.("Failed to fetch analytics data", "error");
      }
  }

  loadAnalytics();

  // Export Report Logic
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === 'Export Report' || btn.textContent.trim() === 'Download Report') {
      btn.addEventListener('click', () => {
        let csv = [];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
        
        csv.push(`Transit Ops Performance Analytics`);
        csv.push(`Generated: ${dateStr} ${timeStr}`);
        
        // Try to get user details
        const userName = document.querySelector('.user-name')?.textContent || 'Unknown User';
        const userRole = document.querySelector('.user-role')?.textContent || 'Unknown Role';
        csv.push(`Generated By: ${userName} (${userRole})`);
        csv.push('');
        
        csv.push('Key Performance Indicators');
        csv.push('Metric,Value');
        
        const onTime = document.querySelector('#on-time-val')?.textContent || '0%';
        const avgTransit = document.querySelector('#kpi-transit-time span')?.textContent || 'N/A';
        const fuelEff = document.querySelector('#kpi-fuel-eff span')?.textContent || 'N/A';
        const emptyKm = document.querySelector('#kpi-empty-km span')?.textContent || 'N/A';
        const retention = document.querySelector('#kpi-retention span')?.textContent || 'N/A';

        csv.push(`On-Time Delivery Rate,${onTime}`);
        csv.push(`Average Transit Time,${avgTransit}`);
        csv.push(`Fuel Efficiency Avg,${fuelEff}`);
        csv.push(`Empty Kilometers Ratio,${emptyKm}`);
        csv.push(`Driver Retention,${retention}`);
        
        const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for UTF-8 BOM
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `TransitOps_Report_${dateStr}_${timeStr}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        if (window.showToast) window.showToast('Analytics Report exported to CSV.', 'success');
      });
    }
  });

});
