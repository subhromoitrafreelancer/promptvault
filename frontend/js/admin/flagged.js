Auth.guardPage(['ADMIN']);
Nav.render();

const bodyCache = {};

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadFlagged(page) {
    const res = await API.get(`/admin/flagged?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load flagged prompts.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('flaggedBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="5">${UI.emptyState('✅', 'No flagged prompts. All clear.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(f => `
        <tr id="row-${f.id}" data-prompt-id="${f.promptId}">
            <td>
                <strong>${escHtml(f.promptTitle)}</strong>
                ${!f.promptFlagged
                    ? '<span class="pv-badge pv-badge-enabled" style="margin-left:0.4rem">Reviewed</span>'
                    : ''}
            </td>
            <td>${escHtml(f.ownerUsername)}</td>
            <td>
                <code style="background:#FEF3C7;color:#92400E;padding:0.15rem 0.45rem;border-radius:3px;font-size:0.82rem">
                    ${escHtml(f.keyword)}
                </code>
            </td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(f.flaggedAt)}</td>
            <td>
                <div class="buttons are-small" style="flex-wrap:nowrap">
                    <button class="button is-light is-small" onclick="toggleBody(${f.promptId}, this)">View</button>
                    ${f.promptFlagged
                        ? `<button class="button is-warning is-light is-small" onclick="clearFlag(${f.promptId})">Clear Flag</button>`
                        : ''}
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadFlagged);
    UI.bindPagination('paginationContainer', loadFlagged);
}

async function toggleBody(promptId, btn) {
    const expandId = `expand-${promptId}`;
    const existing = document.getElementById(expandId);

    if (existing) {
        existing.style.display = existing.style.display === 'none' ? '' : 'none';
        btn.textContent = existing.style.display === 'none' ? 'View' : 'Hide';
        return;
    }

    if (!bodyCache[promptId]) {
        btn.classList.add('is-loading');
        const res = await API.get(`/admin/prompts/${promptId}`);
        btn.classList.remove('is-loading');
        if (!res || !res.ok) { UI.notify('danger', 'Could not load prompt body.'); return; }
        const p = await API.json(res);
        bodyCache[promptId] = p.body;
    }

    // Insert expand row after the last row sharing this promptId
    const allRows = [...document.querySelectorAll(`[data-prompt-id="${promptId}"]`)];
    const lastRow = allRows[allRows.length - 1];

    const expandRow = document.createElement('tr');
    expandRow.id = expandId;
    expandRow.innerHTML = `
        <td colspan="5" style="padding:0.5rem 0.75rem 0.75rem">
            <div class="pv-prompt-body-full" style="max-height:180px;overflow-y:auto;font-size:0.8rem">
                ${escHtml(bodyCache[promptId])}
            </div>
        </td>`;
    lastRow.insertAdjacentElement('afterend', expandRow);
    btn.textContent = 'Hide';
}

async function clearFlag(promptId) {
    if (!confirm('Mark this prompt as reviewed? The flag will clear, but audit rows are kept.')) return;
    const res = await API.put(`/admin/prompts/${promptId}/unflag`);
    if (res && res.ok) {
        UI.notify('success', 'Flag cleared. Prompt marked as reviewed.');
        // Remove cached body so re-opening re-fetches updated state
        delete bodyCache[promptId];
        loadFlagged(0);
    } else {
        UI.notify('danger', 'Failed to clear flag.');
    }
}

loadFlagged(0);
