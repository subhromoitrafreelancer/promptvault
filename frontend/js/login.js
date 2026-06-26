// Redirect already-logged-in users
if (Auth.isLoggedIn()) {
    window.location.href = Auth.getRole() === 'ADMIN' ? '/admin/dashboard.html' : '/dashboard.html';
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.classList.add('is-loading');
    UI.clear();

    const data = await API.call('POST', '/auth/login', {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    });

    btn.classList.remove('is-loading');
    if (!data) return;

    Auth.login(data.token, data.role);
    window.location.href = data.role === 'ADMIN' ? '/admin/dashboard.html' : '/dashboard.html';
});
