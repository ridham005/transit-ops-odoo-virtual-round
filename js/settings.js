document.addEventListener('DOMContentLoaded', () => {
  const role = sessionStorage.getItem('userRole') || 'System Admin';
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.textContent = role;
  
  const themeToggle = document.getElementById('settings-theme-toggle');
  if(themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Trigger the main theme toggle logic
      const mainToggle = document.getElementById('theme-toggle');
      if(mainToggle) mainToggle.click();
    });
  }

  // Toggles persistence
  const toggles = ['toggle-fleet', 'toggle-trip', 'toggle-report'];
  toggles.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      const saved = localStorage.getItem(id);
      if(saved !== null) {
        el.checked = saved === 'true';
      }
      el.addEventListener('change', (e) => {
        localStorage.setItem(id, e.target.checked);
      });
    }
  });

  // Avatar preview
  const avatarUpload = document.getElementById('avatar-upload');
  if(avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(file) {
        if (file.size > 5 * 1024 * 1024) {
          window.showToast?.('File size exceeds 5MB limit.', 'error');
          e.target.value = '';
          return;
        }
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
          window.showToast?.('Invalid file type. Only JPG, PNG, GIF, WebP allowed.', 'error');
          e.target.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('avatar-preview');
          if (preview) {
            preview.style.backgroundImage = `url(${e.target.result})`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.textContent = ''; // hide initials
          }
          window.pendingProfilePicture = e.target.result;
        }
        reader.readAsDataURL(file);
      }
    });
  }

  // Load user data into form
  const userStr = sessionStorage.getItem('user');
  if(userStr) {
    try {
      const user = JSON.parse(userStr);
      if(user.name) {
        const parts = user.name.split(' ');
        document.getElementById('profile-fname').value = parts[0] || '';
        document.getElementById('profile-lname').value = parts.slice(1).join(' ') || '';
      }
      if(user.email) {
        document.getElementById('profile-email').value = user.email;
      }
    } catch(e) {}
  }

  // Profile save
  const saveBtn = document.querySelector('button.saas-btn-primary');
  if (saveBtn) {
     saveBtn.addEventListener('click', async () => {
        const fnameEl = document.getElementById('profile-fname');
        const lnameEl = document.getElementById('profile-lname');
        const emailEl = document.getElementById('profile-email');
        
        const fname = fnameEl.value.trim();
        const lname = lnameEl.value.trim();
        const email = emailEl.value.trim();

        if (!fname || !lname || !email) {
          window.showToast?.('Please fill out all fields.', 'error');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          window.showToast?.('Please enter a valid email address.', 'error');
          return;
        }

        const userStr = sessionStorage.getItem('user');
        if(!userStr) return;
        const user = JSON.parse(userStr);
        
        const payload = {
          name: `${fname} ${lname}`.trim(),
          email: email
        };

        if (window.pendingProfilePicture) {
          payload.profile_picture = window.pendingProfilePicture;
        }

        try {
          const updatedUser = await window.api.put(`/users/${user.id}`, payload);
          
          if (updatedUser && !updatedUser.error) {
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            window.dispatchEvent(new Event('userProfileUpdated'));
            window.showToast?.('Profile updated successfully', 'success');
          } else {
            window.showToast?.(updatedUser?.error || 'Failed to update profile', 'error');
          }
        } catch(e) {
          window.showToast?.(e.message || 'Network error', 'error');
        }
     });
  }

  // Scrollspy for settings nav
  const sections = document.querySelectorAll('.settings-section');
  const navLinks = document.querySelectorAll('.settings-nav a');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5 // Trigger when 50% of the section is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if(link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Smooth scroll for nav clicks
  navLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if(targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
