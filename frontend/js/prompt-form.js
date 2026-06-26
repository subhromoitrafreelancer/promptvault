Auth.guardPage(['USER']);
Nav.render();

const urlParams = new URLSearchParams(window.location.search);
const editId    = urlParams.get('id');
const isEdit    = !!editId;

if (isEdit) document.getElementById('formTitle').textContent = 'Edit Prompt';

// Load categories into dropdown
async function loadCategories(selectedId) {
    const res = await API.get('/categories');
    if (!res || !res.ok) return;
    const list = await API.json(res);
    const sel = document.getElementById('categoryId');
    list.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (selectedId && c.id == selectedId) opt.selected = true;
        sel.appendChild(opt);
    });
}

// Load existing prompt for edit mode
async function loadPrompt() {
    const res = await API.get(`/prompts/${editId}`);
    if (!res || !res.ok) { UI.notify('danger', 'Prompt not found.'); return; }
    const p = await API.json(res);
    document.getElementById('title').value = p.title;
    document.getElementById('body').value  = p.body;
    document.querySelector(`input[name="visibility"][value="${p.visibility}"]`).checked = true;
    await loadCategories(p.categoryId);
    if (p.flagged) showPolicyWarning(p.matchedKeywords || []);
}

function showPolicyWarning(keywords) {
    const warn = document.getElementById('policyWarning');
    if (keywords && keywords.length) {
        document.getElementById('matchedKeywords').textContent = keywords.join(', ');
        warn.style.display = '';
    } else {
        warn.style.display = 'none';
    }
}

// Live policy scan with 600ms debounce
let scanTimer;
document.getElementById('body').addEventListener('input', function () {
    clearTimeout(scanTimer);
    const body = this.value.trim();
    if (!body) { showPolicyWarning([]); return; }
    scanTimer = setTimeout(async () => {
        const res = await API.post('/prompts/scan', { body });
        if (!res || !res.ok) return;
        const data = await API.json(res);
        showPolicyWarning(data.flagged ? data.matchedKeywords : []);
    }, 600);
});

document.getElementById('promptForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.classList.add('is-loading');
    UI.clear();

    const payload = {
        title:      document.getElementById('title').value.trim(),
        body:       document.getElementById('body').value.trim(),
        categoryId: document.getElementById('categoryId').value || null,
        visibility: document.querySelector('input[name="visibility"]:checked').value
    };

    const method = isEdit ? 'PUT' : 'POST';
    const path   = isEdit ? `/prompts/${editId}` : '/prompts';
    const data   = await API.call(method, path, payload);

    btn.classList.remove('is-loading');
    if (!data) return;

    if (data.flagged) {
        showPolicyWarning(data.matchedKeywords);
        UI.notify('warning', '⚠ Prompt saved with policy warning. Review the highlighted keywords.', 'flash');
    } else {
        window.location.href = '/my-prompts.html';
    }
});

// Init
if (isEdit) {
    loadPrompt();
} else {
    loadCategories(null);
}
