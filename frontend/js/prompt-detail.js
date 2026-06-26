Auth.guardPage(['USER']);
Nav.render();

const promptId = new URLSearchParams(window.location.search).get('id');

if (!promptId) {
    window.location.href = '/my-prompts.html';
}

function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function metaItem(label, value) {
    return `<span><span style="font-weight:600;color:#374151">${label}:</span> ${value}</span>`;
}

async function loadDetail() {
    const res = await API.get(`/prompts/${promptId}`);

    document.getElementById('loadingState').style.display = 'none';

    if (!res || res.status === 403 || res.status === 404) {
        document.getElementById('errorState').style.display = '';
        return;
    }

    if (!res.ok) {
        UI.notify('danger', 'Failed to load prompt.');
        return;
    }

    const p = await API.json(res);
    const isOwner = p.ownerUsername === Auth.getUsername();

    // Title
    document.title = escHtml(p.title) + ' — PromptVault';
    document.getElementById('promptTitle').textContent = p.title;

    // Meta strip
    document.getElementById('metaStrip').innerHTML = [
        metaItem('Category', escHtml(p.categoryName || '—')),
        metaItem('Visibility', UI.visibilityBadge(p.visibility)),
        metaItem('Author', `<strong>${escHtml(p.ownerUsername)}</strong>`),
        metaItem('Created', UI.formatDate(p.createdAt)),
        p.updatedAt !== p.createdAt ? metaItem('Updated', UI.formatDate(p.updatedAt)) : '',
        p.flagged ? `<span>${UI.flaggedBadge(true)}</span>` : ''
    ].filter(Boolean).join('');

    // Flagged warning
    if (p.flagged) {
        document.getElementById('flaggedWarning').style.display = '';
    }

    // Body
    document.getElementById('promptBody').textContent = p.body;

    // Action bar — only for owner
    if (isOwner) {
        document.getElementById('actionBar').innerHTML = `
            <a href="/prompt-form.html?id=${p.id}" class="button is-light is-small">Edit</a>
            <button class="button is-info is-light is-small" id="submitAIBtn">Submit to AI</button>
            <button class="button is-danger is-light is-small" id="deleteBtn">Delete</button>
        `;

        document.getElementById('submitAIBtn').addEventListener('click', () => submitToAI(p.id));
        document.getElementById('deleteBtn').addEventListener('click', () => deletePrompt(p.id));
    }

    document.getElementById('detailContent').style.display = '';
}

async function submitToAI(id) {
    const btn = document.getElementById('submitAIBtn');
    btn.classList.add('is-loading');
    btn.disabled = true;

    const res = await API.post(`/prompts/${id}/submit`);

    btn.classList.remove('is-loading');
    btn.disabled = false;

    if (!res || !res.ok) {
        UI.notify('danger', 'Submission failed.');
        return;
    }

    const data = await API.json(res);

    document.getElementById('aiWarning').innerHTML = data.flagged
        ? `<div class="notification pv-policy-warning mb-3">
               <span class="pv-policy-dot"></span>
               <strong>Policy warning:</strong> matched keyword(s): ${data.matchedKeywords.map(escHtml).join(', ')}
           </div>`
        : '';

    document.getElementById('aiResponseText').textContent = data.aiResponse;
    document.getElementById('aiSection').style.display = '';
    document.getElementById('aiSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Refresh flagged state in case it changed on submit
    if (data.flagged && document.getElementById('flaggedWarning').style.display === 'none') {
        document.getElementById('flaggedWarning').style.display = '';
    }
}

async function deletePrompt(id) {
    if (!confirm('Delete this prompt? This cannot be undone.')) return;
    const res = await API.del(`/prompts/${id}`);
    if (res && res.ok) {
        window.location.href = '/my-prompts.html';
    } else {
        UI.notify('danger', 'Delete failed.');
    }
}

loadDetail();
