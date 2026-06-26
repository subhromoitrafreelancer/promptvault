Auth.guardPage(['ADMIN']);
Nav.render();

let editingId = null;

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadCategories() {
    const res = await API.get('/categories');
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load categories.'); return; }
    const list = await API.json(res);

    const tbody = document.getElementById('catsBody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4">${UI.emptyState('🗂', 'No categories yet.')}</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong>${escHtml(c.name)}</strong></td>
            <td style="font-size:0.88rem;color:#6B7280">${escHtml(c.description || '—')}</td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(c.createdAt)}</td>
            <td>
                <div class="buttons are-small">
                    <button class="button is-light" onclick="startEdit(${c.id}, '${escHtml(c.name)}', '${escHtml(c.description || '')}')">Edit</button>
                    <button class="button is-danger is-light" onclick="deleteCategory(${c.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function startEdit(id, name, desc) {
    editingId = id;
    document.getElementById('catName').value = name;
    document.getElementById('catDesc').value = desc;
    document.getElementById('formLabel').textContent = 'Edit Category';
    document.getElementById('cancelBtn').style.display = '';
    document.getElementById('catName').focus();
}

function cancelEdit() {
    editingId = null;
    document.getElementById('catName').value = '';
    document.getElementById('catDesc').value = '';
    document.getElementById('formLabel').textContent = 'Add Category';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function saveCategory() {
    const name = document.getElementById('catName').value.trim();
    const desc = document.getElementById('catDesc').value.trim();
    if (!name) { UI.notify('warning', 'Category name is required.'); return; }

    const method = editingId ? 'PUT' : 'POST';
    const path   = editingId ? `/categories/${editingId}` : '/categories';
    const data   = await API.call(method, path, { name, description: desc || null });
    if (!data) return;

    cancelEdit();
    UI.notify('success', editingId ? 'Category updated.' : 'Category added.');
    loadCategories();
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? Prompts using it cannot be reassigned automatically.')) return;
    const res = await API.del(`/categories/${id}`);
    if (res && res.ok) { UI.notify('success', 'Category deleted.'); loadCategories(); }
    else {
        const err = await API.json(res);
        UI.notify('danger', err?.message || 'Delete failed.');
    }
}

loadCategories();
