Auth.guardPage(['ADMIN']);
Nav.render();

async function loadStats() {
    const res = await API.get('/admin/stats');
    if (!res || !res.ok) return;
    const s = await API.json(res);
    document.getElementById('statUsers').textContent    = s.userCount;
    document.getElementById('statPrompts').textContent  = s.promptCount;
    document.getElementById('statFlagged').textContent  = s.flaggedCount;
    document.getElementById('statKeywords').textContent = s.keywordCount;
}

loadStats();
