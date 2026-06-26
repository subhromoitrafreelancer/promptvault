Auth.guardPage(['USER']);
Nav.render();

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadHistory(page) {
    const res = await API.get(`/prompts/history?page=${page}&size=10`);
    if (!res || !res.ok) { UI.notify('danger', 'Failed to load history.'); return; }
    const data = await API.json(res);

    const tbody = document.getElementById('historyBody');
    if (!data.content.length) {
        tbody.innerHTML = `<tr><td colspan="3">${UI.emptyState('🤖', 'No submissions yet. Submit a prompt from My Prompts.')}</td></tr>`;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.content.map(h => `
        <tr>
            <td><strong>${escHtml(h.promptTitle)}</strong></td>
            <td>
                <div class="pv-ai-response" style="max-height:80px;overflow:hidden;font-size:0.82rem">
                    ${escHtml(h.aiResponse)}
                </div>
            </td>
            <td style="font-size:0.82rem;white-space:nowrap">${UI.formatDate(h.submittedAt)}</td>
        </tr>
    `).join('');

    document.getElementById('paginationContainer').innerHTML = UI.pagination(data, loadHistory);
    UI.bindPagination('paginationContainer', loadHistory);
}

loadHistory(0);
