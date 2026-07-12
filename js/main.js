document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle setup
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme == "dark") {
    document.body.setAttribute("data-theme", "dark");
  } else if (currentTheme == "light") {
    document.body.setAttribute("data-theme", "light");
  } else if (prefersDarkScheme.matches) {
    document.body.setAttribute("data-theme", "dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      let theme = document.body.getAttribute("data-theme");
      if (theme == "dark") {
        document.body.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      } else {
        document.body.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    });
  }

  // Sidebar setup
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') && path.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
});
