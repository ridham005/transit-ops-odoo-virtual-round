// app.js
// Handles common UI functionality like sidebar active states and role checking

document.addEventListener('DOMContentLoaded', () => {
    // 1. Highlight current sidebar item based on URL
    const currentPath = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'dashboard.html')) {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add to current
            item.classList.add('active');
        }
    });

    // 2. Check RBAC Role from sessionStorage
    const role = sessionStorage.getItem('transitOpsRole');
    if (role) {
        // Display role next to username if we wanted to
        console.log(`Current session role: ${role}`);
        // Optionally update UI elements based on role here in future commits
    } else {
        // If no role and not on login page, redirect to login
        if (currentPath !== 'index.html' && currentPath !== '') {
            window.location.href = 'index.html';
        }
    }
});
