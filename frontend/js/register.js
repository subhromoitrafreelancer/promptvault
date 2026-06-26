if (Auth.isLoggedIn()) {
    window.location.href = Auth.getRole() === 'ADMIN' ? '/admin/dashboard.html' : '/dashboard.html';
}

document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.classList.add('is-loading');
    UI.clear();

    const data = await API.call('POST', '/auth/register', {
        username: document.getElementById('username').value.trim(),
        email:    document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    });

    btn.classList.remove('is-loading');
    if (!data) return;

    Auth.login(data.token, data.role);
    window.location.href = '/dashboard.html';
});
