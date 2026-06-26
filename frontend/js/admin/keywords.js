Auth.guardPage(['ADMIN']);
Nav.render();

let editingId = null;
let currentPage = 0;

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadKeywords(page) {
    currentPage = page;
    const res = await API.get(`/admin/keywords?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load keywords.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('kwBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="3">${UI.emptyState('🔑', 'No policy keywords defined yet.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(k => `
        <tr>
            <td>
                <code style="background:#F7F8FF;padding:0.2rem 0.5rem;border-radius:3px;font-size:0.88rem">
                    ${escHtml(k.keyword)}
                </code>
            </td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(k.createdAt)}</td>
            <td>
                <div class="buttons are-small">
                    <button class="button is-light" onclick="startEdit(${k.id}, '${escHtml(k.keyword)}')">Edit</button>
                    <button class="button is-danger is-light" onclick="deleteKeyword(${k.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadKeywords);
    UI.bindPagination('paginationContainer', loadKeywords);
}

function startEdit(id, value) {
    editingId = id;
    document.getElementById('kwValue').value = value;
    document.getElementById('formLabel').textContent = 'Edit Keyword';
    document.getElementById('cancelBtn').style.display = '';
    document.getElementById('kwValue').focus();
}

function cancelEdit() {
    editingId = null;
    document.getElementById('kwValue').value = '';
    document.getElementById('formLabel').textContent = 'Add Keyword';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function saveKeyword() {
    const kw = document.getElementById('kwValue').value.trim();
    if (!kw) { UI.notify('warning', 'Keyword cannot be empty.'); return; }

    const method = editingId ? 'PUT' : 'POST';
    const path   = editingId ? `/admin/keywords/${editingId}` : '/admin/keywords';
    const data   = await API.call(method, path, { keyword: kw });
    if (!data) return;

    cancelEdit();
    UI.notify('success', editingId ? 'Keyword updated.' : 'Keyword added.');
    loadKeywords(currentPage);
}

async function deleteKeyword(id) {
    if (!confirm('Delete this keyword?')) return;
    const res = await API.del(`/admin/keywords/${id}`);
    if (res && res.ok) { UI.notify('success', 'Keyword deleted.'); loadKeywords(currentPage); }
    else UI.notify('danger', 'Delete failed.');
}

loadKeywords(0);
