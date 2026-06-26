Auth.guardPage(['USER']);
Nav.render();

let currentPage = 0;

async function loadPrompts(page) {
    currentPage = page;
    const res = await API.get(`/prompts/mine?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load prompts.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('promptsBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="6">${UI.emptyState('✏️', 'No prompts yet. <a href="/prompt-form.html">Create your first one</a>.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(p => `
        <tr class="${p.flagged ? 'pv-flagged-row' : ''}">
            <td><a href="/prompt-detail.html?id=${p.id}" class="pv-title-link">${escHtml(p.title)}</a></td>
            <td>${escHtml(p.categoryName || '—')}</td>
            <td>${UI.visibilityBadge(p.visibility)}</td>
            <td>${UI.flaggedBadge(p.flagged)}</td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(p.createdAt)}</td>
            <td>
                <div class="buttons are-small">
                    <a href="/prompt-form.html?id=${p.id}" class="button is-light">Edit</a>
                    <button class="button is-info is-light" onclick="submitToAI(${p.id}, '${escHtml(p.title)}')">Submit to AI</button>
                    <button class="button is-danger is-light" onclick="deletePrompt(${p.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadPrompts);
    UI.bindPagination('paginationContainer', loadPrompts);
}

async function deletePrompt(id) {
    if (!confirm('Delete this prompt? This cannot be undone.')) return;
    const res = await API.del(`/prompts/${id}`);
    if (res && res.ok) { UI.notify('success', 'Prompt deleted.'); loadPrompts(currentPage); }
    else UI.notify('danger', 'Delete failed.');
}

async function submitToAI(id) {
    const res = await API.post(`/prompts/${id}/submit`);
    if (!res || !res.ok) { UI.notify('danger', 'Submission failed.'); return; }
    const data = await API.json(res);

    document.getElementById('aiWarning').innerHTML = data.flagged
        ? `<div class="notification pv-policy-warning mb-3">
               <span class="pv-policy-dot"></span>
               <strong>Policy warning:</strong> matched keyword(s): ${data.matchedKeywords.join(', ')}
           </div>`
        : '';
    document.getElementById('aiResponseText').textContent = data.aiResponse;
    document.getElementById('aiModal').classList.add('is-active');
    loadPrompts(currentPage);
}

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.getElementById('closeModal').addEventListener('click',    () => document.getElementById('aiModal').classList.remove('is-active'));
document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('aiModal').classList.remove('is-active'));
document.querySelector('#aiModal .modal-background').addEventListener('click', () => document.getElementById('aiModal').classList.remove('is-active'));

loadPrompts(0);
