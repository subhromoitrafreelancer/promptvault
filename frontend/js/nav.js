// Nav — injects the navbar and provides the shared UI helper
const Nav = {
    render() {
        const username = Auth.getUsername() || '';
        const role     = Auth.getRole();
        const isAdmin  = role === 'ADMIN';

        const links = isAdmin ? `
            <a class="navbar-item" href="/admin/dashboard.html">Dashboard</a>
            <a class="navbar-item" href="/admin/users.html">Users</a>
            <a class="navbar-item" href="/admin/categories.html">Categories</a>
            <a class="navbar-item" href="/admin/keywords.html">Keywords</a>
            <a class="navbar-item" href="/admin/flagged.html">Flagged Prompts</a>
        ` : `
            <a class="navbar-item" href="/dashboard.html">Dashboard</a>
            <a class="navbar-item" href="/my-prompts.html">My Prompts</a>
            <a class="navbar-item" href="/shared.html">Browse Shared</a>
            <a class="navbar-item" href="/history.html">AI History</a>
        `;

        document.getElementById('navbar-container').innerHTML = `
        <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="container">
                <div class="navbar-brand">
                    <a class="navbar-item pv-brand" href="${isAdmin ? '/admin/dashboard.html' : '/dashboard.html'}">
                        PromptVault
                    </a>
                    <a role="button" class="navbar-burger" data-target="pvNavMenu" aria-expanded="false">
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a>
                </div>
                <div id="pvNavMenu" class="navbar-menu">
                    <div class="navbar-start">${links}</div>
                    <div class="navbar-end">
                        <span class="navbar-item pv-nav-user">${username}</span>
                        <a class="navbar-item" href="#" id="pvLogout">Logout</a>
                    </div>
                </div>
            </div>
        </nav>`;

        document.querySelector('.navbar-burger').addEventListener('click', function () {
            this.classList.toggle('is-active');
            document.getElementById('pvNavMenu').classList.toggle('is-active');
        });

        document.getElementById('pvLogout').addEventListener('click', e => {
            e.preventDefault();
            Auth.logout();
        });

        // Highlight active nav link
        const current = window.location.pathname;
        document.querySelectorAll('#pvNavMenu .navbar-item').forEach(a => {
            if (a.getAttribute('href') === current) a.classList.add('is-active');
        });
    }
};

// UI — shared notification + pagination helpers (loaded with nav.js on every page)
const UI = {
    notify(type, message, targetId = 'flash') {
        const el = document.getElementById(targetId);
        if (!el) return;
        el.innerHTML = `<div class="notification is-${type} is-light">
            <button class="delete" onclick="this.parentElement.remove()"></button>
            ${message}
        </div>`;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    clear(targetId = 'flash') {
        const el = document.getElementById(targetId);
        if (el) el.innerHTML = '';
    },

    pagination(data, onPage) {
        const { page, totalPages } = data;
        if (totalPages <= 1) return '';
        const prev = page > 0
            ? `<a class="pagination-previous" data-page="${page - 1}">Prev</a>`
            : `<a class="pagination-previous" disabled>Prev</a>`;
        const next = page < totalPages - 1
            ? `<a class="pagination-next" data-page="${page + 1}">Next</a>`
            : `<a class="pagination-next" disabled>Next</a>`;

        let pages = '';
        for (let i = 0; i < totalPages; i++) {
            pages += `<li><a class="pagination-link ${i === page ? 'is-current' : ''}" data-page="${i}">${i + 1}</a></li>`;
        }

        return `<nav class="pagination pv-pagination is-small" role="navigation">
            ${prev}${next}
            <ul class="pagination-list">${pages}</ul>
        </nav>`;
    },

    bindPagination(containerId, handler) {
        document.getElementById(containerId).addEventListener('click', e => {
            const a = e.target.closest('[data-page]');
            if (!a || a.hasAttribute('disabled')) return;
            e.preventDefault();
            handler(parseInt(a.dataset.page));
        });
    },

    flaggedBadge(flagged) {
        return flagged
            ? `<span class="pv-badge pv-badge-flagged">&#9888; Flagged</span>`
            : '';
    },

    visibilityBadge(v) {
        return v === 'PUBLIC'
            ? `<span class="pv-badge pv-badge-public">Public</span>`
            : `<span class="pv-badge pv-badge-private">Private</span>`;
    },

    emptyState(icon, message) {
        return `<div class="pv-empty">
            <div class="pv-empty-icon">${icon}</div>
            <p>${message}</p>
        </div>`;
    },

    formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }
};
