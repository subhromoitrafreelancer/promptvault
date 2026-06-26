const Auth = {
    TOKEN_KEY: 'pv_token',
    ROLE_KEY:  'pv_role',

    login(token, role) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.ROLE_KEY, role);
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ROLE_KEY);
        window.location.href = '/login.html';
    },

    getToken() { return localStorage.getItem(this.TOKEN_KEY); },
    getRole()  { return localStorage.getItem(this.ROLE_KEY); },

    getUsername() {
        const token = this.getToken();
        if (!token) return null;
        try {
            return JSON.parse(atob(token.split('.')[1])).sub;
        } catch (_) { return null; }
    },

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            return exp * 1000 > Date.now();
        } catch (_) { return false; }
    },

    // Redirect to login if not logged in, or to home if wrong role.
    // allowedRoles: e.g. ['USER'] or ['ADMIN']. Pass null to allow any role.
    guardPage(allowedRoles) {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        const role = this.getRole();
        if (allowedRoles && !allowedRoles.includes(role)) {
            window.location.href = role === 'ADMIN' ? '/admin/dashboard.html' : '/dashboard.html';
            return false;
        }
        return true;
    }
};
