   // Page navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const pageId = this.getAttribute('data-page');
        if (pageId) {
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked nav item
            this.classList.add('active');

            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));

            // Show selected page
            document.getElementById(pageId).classList.add('active');
        }
    });
});

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

    function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

    // Logout handling
    document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
    'Content-Type': 'application/json'
}
})
    .then(response => {
    if (response.redirected) {
    window.location.href = response.url;
} else {
    return response.json();
}
})
    .then(data => {
    if (data) {
    // Redirect to login page with logout parameter
    window.location.href = '/api/auth/login?logout=true';
}
})
    .catch(error => {
    console.error('Logout failed:', error);
    alert('An error occurred during logout. Please try again.');
});
});