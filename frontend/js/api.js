const API = {
    BASE: '/api',

    async _fetch(path, options = {}) {
        const token = Auth.getToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        let res;
        try {
            res = await fetch(this.BASE + path, { ...options, headers });
        } catch (_) {
            UI.notify('danger', 'Network error — could not reach the server.');
            return null;
        }

        if (res.status === 401) { Auth.logout(); return null; }
        return res;
    },

    async get(path)         { return this._fetch(path); },
    async post(path, body)  { return this._fetch(path, { method: 'POST',   body: JSON.stringify(body) }); },
    async put(path, body)   { return this._fetch(path, { method: 'PUT',    body: JSON.stringify(body) }); },
    async del(path)         { return this._fetch(path, { method: 'DELETE' }); },

    async json(res) {
        if (!res) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    },

    // Returns parsed body; calls UI.notify on non-2xx automatically.
    async call(method, path, body) {
        const res = await this._fetch(path, { method, body: body ? JSON.stringify(body) : undefined });
        if (!res) return null;
        const data = await this.json(res);
        if (!res.ok) {
            UI.notify('danger', data?.message || 'An error occurred.');
            return null;
        }
        return data;
    }
};
