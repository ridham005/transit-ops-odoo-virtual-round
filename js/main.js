// js/main.js

// Toast System
window.showToast = function(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    Object.assign(toastContainer.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '8px'
    });
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `card`;
  Object.assign(toast.style, {
    padding: '12px 24px', background: type === 'error' ? 'var(--campus-warning)' : 'var(--primary-color)', color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', transition: 'all 0.3s ease',
    transform: 'translateY(20px)', opacity: '0', border: 'none'
  });
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar & RBAC Setup ---
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') && path.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });

  const userRole = sessionStorage.getItem('userRole') || 'Fleet Manager';
  if (userRole === 'Driver') {
    navLinks.forEach(link => {
      if (['expenses.html', 'analytics.html', 'drivers.html'].includes(link.getAttribute('href'))) {
        link.parentElement.style.display = 'none';
      }
    });
  }

  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (themeToggle) {
      if (theme === 'dark') {
        themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      } else {
        themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      }
    }
  }

  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  let currentTheme = localStorage.getItem("theme");
  if (!currentTheme) {
    currentTheme = prefersDarkScheme.matches ? 'dark' : 'light';
  }
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      let theme = document.body.getAttribute("data-theme") === 'dark' ? 'light' : 'dark';
      localStorage.setItem("theme", theme);
      applyTheme(theme);
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      applyTheme(e.newValue);
    }
  });

  // --- Notification Toggle ---
  const notifToggle = document.getElementById('notif-toggle');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifList = document.getElementById('notif-list');
  const notifBadge = document.querySelector('.notif-badge');

  if (notifToggle && notifDropdown && notifList) {
    if (notifBadge) notifBadge.style.display = 'block';

    notifToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isHidden = notifDropdown.style.display === 'none';
      notifDropdown.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        if (notifBadge) notifBadge.style.display = 'none';
        notifList.innerHTML = '<div style="padding: 12px 16px; text-align: center; color: var(--text-secondary);">Loading...</div>';
        try {
          const acts = await window.api.get('/activities', 'activities');
          notifList.innerHTML = '';
          if (acts && acts.length > 0) {
            acts.slice(0, 5).forEach(act => {
              const div = document.createElement('div');
              div.style.padding = '12px 16px';
              div.style.borderBottom = '1px solid var(--border-color)';
              div.style.fontSize = '0.9rem';
              div.innerHTML = `<div style="font-weight: 500; margin-bottom: 4px;">${act.description}</div><div style="font-size: 0.8rem; color: var(--text-secondary);">${act.timestamp}</div>`;
              notifList.appendChild(div);
            });
          } else {
            notifList.innerHTML = '<div style="padding: 12px 16px; text-align: center; color: var(--text-secondary);">No new notifications</div>';
          }
        } catch (error) {
          notifList.innerHTML = '<div style="padding: 12px 16px; text-align: center; color: var(--text-secondary);">Failed to load</div>';
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = 'none';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && notifDropdown.style.display === 'block') {
        notifDropdown.style.display = 'none';
        notifToggle.focus();
      }
    });
  }

  // --- Global Search Proxy ---
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      const tbody = document.querySelector('tbody');
      if(tbody) {
        Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
          const text = tr.textContent.toLowerCase();
          tr.style.display = text.includes(val) ? '' : 'none';
        });
      } else {
        const settingItems = document.querySelectorAll('.setting-item');
        if(settingItems.length > 0) {
          settingItems.forEach(item => {
             const text = item.textContent.toLowerCase();
             item.style.display = text.includes(val) ? '' : 'none';
             const parentCard = item.closest('.card');
             if(parentCard) {
                const visibleItems = Array.from(parentCard.querySelectorAll('.setting-item')).some(i => i.style.display !== 'none');
                parentCard.style.display = visibleItems ? '' : 'none';
             }
          });
        }
      }
    });
  }

  // --- Profile UI Sync ---
  window.updateUserUI = function() {
    let userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      let nameStr = user.name || 'Unknown User';
      let initials = 'UU';
      
      const parts = nameStr.trim().split(' ');
      if (parts.length > 1) {
        initials = (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      } else if (parts[0].length > 0) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
      
      document.querySelectorAll('.user-name').forEach(el => el.textContent = nameStr);
      
      document.querySelectorAll('.user-avatar, .user-initials').forEach(el => {
        if (user.profile_picture) {
          el.style.backgroundImage = `url(${user.profile_picture})`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.textContent = '';
        } else {
          el.style.backgroundImage = 'none';
          el.textContent = initials;
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
        }
      });
    } catch (e) {
      console.error('Error syncing user UI:', e);
    }
  };

  window.updateUserUI();
  window.addEventListener('userProfileUpdated', window.updateUserUI);

});

