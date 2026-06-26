Auth.guardPage(['ADMIN']);
Nav.render();

let currentPage = 0;

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadUsers(page) {
    currentPage = page;
    const res = await API.get(`/admin/users?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load users.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('usersBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="6">${UI.emptyState('👥', 'No users found.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(u => `
        <tr>
            <td><strong>${escHtml(u.username)}</strong></td>
            <td style="font-size:0.88rem">${escHtml(u.email)}</td>
            <td>
                ${u.role === 'ADMIN'
                    ? '<span class="pv-badge pv-badge-admin">Admin</span>'
                    : '<span class="pv-badge pv-badge-private">User</span>'}
            </td>
            <td>
                ${u.enabled
                    ? '<span class="pv-badge pv-badge-enabled">Active</span>'
                    : '<span class="pv-badge pv-badge-disabled">Disabled</span>'}
            </td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(u.createdAt)}</td>
            <td>
                ${u.role !== 'ADMIN'
                    ? `<button class="button is-small ${u.enabled ? 'is-warning' : 'is-success'} is-light"
                            onclick="toggleUser(${u.id}, ${u.enabled})">
                           ${u.enabled ? 'Disable' : 'Enable'}
                       </button>`
                    : '<span style="color:#ccc;font-size:0.8rem">—</span>'}
            </td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadUsers);
    UI.bindPagination('paginationContainer', loadUsers);
}

async function toggleUser(id, currentlyEnabled) {
    const action = currentlyEnabled ? 'disable' : 'enable';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    const data = await API.call('PUT', `/admin/users/${id}/toggle`);
    if (data) { UI.notify('success', `User ${action}d.`); loadUsers(currentPage); }
}

loadUsers(0);
