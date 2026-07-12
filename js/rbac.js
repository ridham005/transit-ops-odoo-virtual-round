const ROLE_PERMISSIONS = {
  'Fleet Manager': ['dashboard.html', 'vehicles.html', 'drivers.html', 'trips.html', 'maintenance.html', 'expenses.html', 'analytics.html', 'settings.html'],
  'Dispatcher': ['dashboard.html', 'drivers.html', 'trips.html', 'analytics.html'],
  'Safety Officer': ['dashboard.html', 'vehicles.html', 'drivers.html', 'maintenance.html', 'analytics.html'],
  'Financial Analyst': ['dashboard.html', 'expenses.html', 'analytics.html'],
  'System Admin': ['dashboard.html', 'vehicles.html', 'drivers.html', 'trips.html', 'maintenance.html', 'expenses.html', 'analytics.html', 'settings.html']
};

const MENU_ITEMS = [
  { href: 'dashboard.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>', label: 'Dashboard' },
  { href: 'vehicles.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="18" height="8" rx="2" ry="2"></rect><path d="M4 12V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5"></path><path d="M7 16h1"></path><path d="M16 16h1"></path></svg>', label: 'Vehicles' },
  { href: 'drivers.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', label: 'Drivers' },
  { href: 'trips.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>', label: 'Trips' },
  { href: 'maintenance.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>', label: 'Maintenance' },
  { href: 'expenses.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>', label: 'Fuel & Expenses' },
  { href: 'analytics.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>', label: 'Analytics' },
  { href: 'settings.html', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', label: 'Settings' }
];

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPath === 'index.html' || currentPath === '') return;

  const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
  if (!role || !ROLE_PERMISSIONS[role]) {
    window.location.href = 'index.html';
    return;
  }

  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed.includes(currentPath)) {
    alert('Access Denied: You do not have permission to view this page.');
    window.location.href = 'dashboard.html';
    return;
  }

  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.innerHTML = '';
    MENU_ITEMS.forEach(item => {
      if (allowed.includes(item.href)) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        if (item.href === currentPath) a.classList.add('active');
        a.innerHTML = item.icon + '<span>' + item.label + '</span>';
        li.appendChild(a);
        navLinks.appendChild(li);
      }
    });
  }
});
