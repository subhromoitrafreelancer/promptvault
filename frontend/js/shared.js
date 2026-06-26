Auth.guardPage(['USER']);
Nav.render();

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadShared(page) {
    const res = await API.get(`/prompts/shared?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load shared prompts.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('sharedBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="5">${UI.emptyState('🌐', 'No public prompts yet.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(p => `
        <tr class="pv-row-link" onclick="if(!event.target.closest('a,.button'))window.location.href='/prompt-detail.html?id=${p.id}'">
            <td><a href="/prompt-detail.html?id=${p.id}" class="pv-title-link">${escHtml(p.title)}</a></td>
            <td style="max-width:280px">
                <span style="font-family:monospace;font-size:0.8rem;color:#6B7280">
                    ${escHtml(p.body.substring(0, 100))}${p.body.length > 100 ? '…' : ''}
                </span>
            </td>
            <td>${escHtml(p.categoryName || '—')}</td>
            <td><span style="font-weight:600">${escHtml(p.ownerUsername)}</span></td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(p.createdAt)}</td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadShared);
    UI.bindPagination('paginationContainer', loadShared);
}

loadShared(0);
