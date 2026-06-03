// ─── AUTH ─────────────────────────────────────────────────────────

window.Auth = {
  SESSION_KEY: 'pawsome_session',

  isLoggedIn() {
    const s = sessionStorage.getItem(this.SESSION_KEY);
    return s === 'authenticated';
  },

  async login(pin) {
    const valid = await window.DB.checkPin(pin);
    if (valid) {
      sessionStorage.setItem(this.SESSION_KEY, 'authenticated');
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = '../index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '../index.html';
    }
  }
};
