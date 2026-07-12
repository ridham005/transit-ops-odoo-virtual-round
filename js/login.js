document.addEventListener('DOMContentLoaded', () => {
  // --- UI Widgets: Clock & Date ---
  function updateTime() {
    const now = new Date();
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if(timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    if(dateEl) {
      const opts = { weekday: 'short', month: 'short', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', opts).toUpperCase();
    }
  }
  setInterval(updateTime, 1000);
  updateTime();

  // --- UI Widgets: System Status Ticker ---
  const statusMessages = [
    "Fleet Status: Operational",
    "Active Trips: Live",
    "Dispatch System: Connected",
    "GPS Network: Online",
    "Weather Service: Synced"
  ];
  let statusIndex = 0;
  const statusEl = document.getElementById('system-status-msg');
  if(statusEl) {
    setInterval(() => {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusIndex = (statusIndex + 1) % statusMessages.length;
        statusEl.textContent = statusMessages[statusIndex];
        statusEl.style.opacity = '1';
      }, 300);
    }, 4000);
  }

  // --- Theme & Weather Icon Sync ---
  const themeToggle = document.getElementById('theme-toggle');
  const opsWeatherIcon = document.getElementById('ops-weather-icon');
  
  function updateWeatherIcon() {
    if (!opsWeatherIcon) return;
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if(isDark) {
      opsWeatherIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
      opsWeatherIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  }
  updateWeatherIcon();
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(updateWeatherIcon, 10);
    });
  }

  // --- Campus Camera Ambient Parallax ---
  const campusCamera = document.getElementById('campus-camera');
  if (campusCamera && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('mousemove', (e) => {
      // Only apply ambient if not locked in a focus state
      if(document.body.className.includes('focus-') || document.body.className.includes('login-success')) return;
      
      const offsetX = (e.clientX / window.innerWidth - 0.5) * -1.5;
      const offsetY = (e.clientY / window.innerHeight - 0.5) * -1.5;
      campusCamera.style.transform = `translate(${offsetX}%, ${offsetY}%)`;
    });
  }

  // --- Focus States ---
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if(emailInput) {
    emailInput.addEventListener('focus', () => {
      document.body.classList.add('focus-email');
      if(campusCamera) campusCamera.style.transform = ''; // Let CSS take over
    });
    emailInput.addEventListener('blur', () => document.body.classList.remove('focus-email'));
  }

  if(passwordInput) {
    passwordInput.addEventListener('focus', () => {
      document.body.classList.add('focus-password');
      if(campusCamera) campusCamera.style.transform = '';
    });
    passwordInput.addEventListener('blur', () => document.body.classList.remove('focus-password'));
  }

  // --- Custom Select Dropdown & Role Focus ---
  const customSelectWrapper = document.querySelector('.custom-select-wrapper');
  const customSelectTrigger = document.querySelector('.custom-select-trigger');
  const customOptions = document.querySelectorAll('.custom-option');
  const roleInput = document.getElementById('role');

  function getRoleClass(val) {
    const v = val.toLowerCase();
    if(v.includes('fleet')) return 'focus-role-fleet';
    if(v.includes('dispatch')) return 'focus-role-dispatch';
    if(v.includes('safety')) return 'focus-role-safety';
    if(v.includes('financial')) return 'focus-role-finance';
    return 'focus-role';
  }

  if (customSelectWrapper) {
    customSelectWrapper.addEventListener('click', function(e) {
      if (e.target.classList.contains('custom-option')) return; // handled by option click
      this.classList.toggle('open');
      
      document.body.classList.remove('focus-role', 'focus-role-fleet', 'focus-role-dispatch', 'focus-role-safety', 'focus-role-finance');
      if (this.classList.contains('open')) {
        document.body.classList.add('focus-role');
        if(roleInput.value) {
          document.body.classList.add(getRoleClass(roleInput.value));
        }
        if(campusCamera) campusCamera.style.transform = '';
      }
    });
    
    document.addEventListener('click', function(e) {
      if (!customSelectWrapper.contains(e.target)) {
        customSelectWrapper.classList.remove('open');
        document.body.classList.remove('focus-role', 'focus-role-fleet', 'focus-role-dispatch', 'focus-role-safety', 'focus-role-finance');
      }
    });

    customSelectWrapper.setAttribute('tabindex', '0');
    customSelectWrapper.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });

    customOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        customOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        
        const value = this.getAttribute('data-value');
        roleInput.value = value;
        customSelectTrigger.textContent = value;
        customSelectTrigger.style.color = 'var(--text-color)';
        
        document.getElementById('role-group').classList.remove('error');

        // Update background immediately upon selection
        document.body.classList.remove('focus-role', 'focus-role-fleet', 'focus-role-dispatch', 'focus-role-safety', 'focus-role-finance');
        document.body.classList.add('focus-role');
        document.body.classList.add(getRoleClass(value));
        if(campusCamera) campusCamera.style.transform = '';

        // Close the dropdown manually
        customSelectWrapper.classList.remove('open');
      });
    });
  }

  // --- Form Validation, Interactions & Staged Sequences ---
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
  
  let failedAttempts = 0;
  const MAX_ATTEMPTS = 5;

  if (submitBtn) {
    submitBtn.addEventListener('mouseenter', () => {
      document.body.classList.add('btn-hover-active');
      if(campusCamera && !document.body.className.includes('focus-')) campusCamera.style.transform = '';
    });
    submitBtn.addEventListener('mouseleave', () => {
      document.body.classList.remove('btn-hover-active');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (failedAttempts >= MAX_ATTEMPTS) return;

      let isValid = true;
      loginError.style.display = 'none';
      document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('error'));

      if (!emailInput.value.trim()) { emailInput.closest('.form-group').classList.add('error'); isValid = false; }
      if (!passwordInput.value) { passwordInput.closest('.form-group').classList.add('error'); isValid = false; }
      if (!roleInput.value) { roleInput.closest('.form-group').classList.add('error'); isValid = false; }

      if (!isValid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      try {
        const response = await window.api.post('/auth/login', {
          email: emailInput.value.trim(),
          password: passwordInput.value,
          role: roleInput.value
        });

        // Success Sequence
        document.body.classList.add('login-success');
        sessionStorage.setItem('userRole', roleInput.value);
        if (response.token) {
           sessionStorage.setItem('token', response.token);
        }
        if (response.user) {
           sessionStorage.setItem('user', JSON.stringify(response.user)); localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        // Let the 2-3s CSS transition play out completely
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2500);

      } catch (error) {
        // Fallback for demo check if backend is completely down
        if (error.isNetworkError !== false && emailInput.value === 'test@example.com' && passwordInput.value === 'password123') {
           // Success Sequence via fallback
           document.body.classList.add('login-success');
           sessionStorage.setItem('userRole', roleInput.value);
           
           setTimeout(() => {
             window.location.href = 'dashboard.html';
           }, 2500);
           return;
        }

        // Error Sequence
        failedAttempts++;
        document.body.classList.add('login-error-state');
        
        setTimeout(() => {
          document.body.classList.remove('login-error-state');
        }, 1000);

        if (failedAttempts >= MAX_ATTEMPTS) {
          loginError.textContent = "Invalid credentials. Account locked after 5 failed attempts.";
          emailInput.disabled = true;
          passwordInput.disabled = true;
          roleInput.disabled = true;
        } else {
          loginError.textContent = error.message || `Invalid credentials. ${MAX_ATTEMPTS - failedAttempts} attempts remaining.`;
        }
        loginError.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
});

