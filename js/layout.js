window.Layout = {
  _activePage: null,

  init(activePage, basePath = '../') {
    this._activePage = activePage;
    this._basePath = basePath;

    if (!document.querySelector('link[data-gf]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-gf', '1');
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap';
      document.head.prepend(link);
    }

    this._nav = [
      { id: 'dashboard',    label: 'Dashboard',         icon: '📊', href: basePath + 'dashboard/dashboard.html' },
      { id: 'briefing',     label: 'Daily Briefing',    icon: '☀️', href: basePath + 'dashboard/briefing.html' },
      { id: 'appointments', label: 'Appointments',      icon: '📅', href: basePath + 'appointments/appointments.html' },
      { id: 'boarding',     label: 'Boarding',          icon: '🏠', href: basePath + 'crm/boarding.html' },
      { id: 'clients',      label: 'Clients',           icon: '👥', href: basePath + 'crm/clients.html' },
      { id: 'leads',        label: 'Leads Pipeline',    icon: '🎯', href: basePath + 'crm/leads.html' },
      { id: 'revenue',      label: 'Revenue & Reports', icon: '📈', href: basePath + 'dashboard/revenue.html' },
      { id: 'settings',     label: 'Settings',          icon: '⚙️', href: basePath + 'settings/settings.html' },
    ];

    this._renderSidebar(activePage);
    this._bindHamburger();
    this._bindPopState();
    this._updateTopbarTitle(activePage);
  },

  _renderSidebar(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:30px;">🐾</span>
          <div>
            <div class="brand-name">
              <span class="petro">Petro</span><span class="pawlis">pawlis</span>
            </div>
            <div class="brand-tagline">Pet Resort · Staff Portal</div>
          </div>
        </div>
        <div class="paw-dots" style="margin-top:12px;">
          <span class="pd-red"></span><span class="pd-green"></span>
          <span class="pd-teal"></span><span class="pd-orange"></span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>
        ${this._nav.map(n => `
          <a href="${n.href}" class="nav-item ${activePage === n.id ? 'active' : ''}"
             data-page="${n.id}" data-href="${n.href}">
            <span class="icon">${n.icon}</span>${n.label}
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-item" style="width:100%;border:none;background:none;" onclick="window.Auth.logout()">
          <span class="icon">🚪</span> Logout
        </button>
      </div>
    `;

    // SPA nav: intercept all nav-item clicks
    sidebar.querySelectorAll('a.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href = link.dataset.href;
        const pageId = link.dataset.page;
        if (pageId === this._activePage) return; // already here
        this._navigate(href, pageId);
      });
    });
  },

  _navigate(href, pageId) {
    // Show loading shimmer
    const main = document.querySelector('.main');
    const pc = document.querySelector('.page-content');
    if (pc) { pc.style.opacity = '0'; pc.style.transform = 'translateY(6px)'; pc.style.transition = 'opacity 0.15s ease, transform 0.15s ease'; }

    fetch(href)
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // Swap <title>
        document.title = newDoc.title;

        // Swap page-content
        const newContent = newDoc.querySelector('.page-content');
        const oldContent = document.querySelector('.page-content');
        if (newContent && oldContent) {
          oldContent.innerHTML = newContent.innerHTML;
          // Copy any page-specific <style> tags
          newDoc.querySelectorAll('style').forEach(s => {
            const existing = [...document.querySelectorAll('style[data-page-style]')];
            existing.forEach(e => e.remove());
            const clone = s.cloneNode(true);
            clone.setAttribute('data-page-style', '1');
            document.head.appendChild(clone);
          });
        }

        // Swap topbar title
        const newTopbarRight = newDoc.querySelector('.topbar-right');
        const oldTopbarRight = document.querySelector('.topbar-right');
        if (newTopbarRight && oldTopbarRight) oldTopbarRight.innerHTML = newTopbarRight.innerHTML;

        // Update active state
        this._activePage = pageId;
        this._renderSidebar(pageId);
        this._bindHamburger();
        this._updateTopbarTitle(pageId);

        // Run page scripts
        newDoc.querySelectorAll('script:not([src])').forEach(s => {
          // skip Layout.init calls — we handle routing
          if (s.textContent.includes('Layout.init')) return;
          try { new Function(s.textContent)(); } catch(e) { console.warn('Script exec:', e); }
        });

        // Load external page script (e.g. dashboard.js, revenue.js)
        const pageScripts = [...newDoc.querySelectorAll('script[src]')]
          .filter(s => !s.src.includes('/js/') && !s.src.includes('cdnjs'));
        if (pageScripts.length) {
          const scriptSrc = pageScripts[pageScripts.length - 1].getAttribute('src');
          // Resolve relative to href
          const base = href.substring(0, href.lastIndexOf('/') + 1);
          const fullSrc = scriptSrc.startsWith('http') ? scriptSrc : base + scriptSrc;
          // Remove old page script if present
          document.querySelectorAll('script[data-page-script]').forEach(s => s.remove());
          const newScript = document.createElement('script');
          newScript.src = fullSrc + '?t=' + Date.now();
          newScript.setAttribute('data-page-script', '1');
          document.body.appendChild(newScript);
        }

        // Push history
        history.pushState({ href, pageId }, '', href);

        // Animate in
        requestAnimationFrame(() => {
          const pc2 = document.querySelector('.page-content');
          if (pc2) {
            pc2.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            pc2.style.opacity = '1';
            pc2.style.transform = 'translateY(0)';
          }
        });

        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
      })
      .catch(() => {
        // Fallback: hard navigate
        window.location.href = href;
      });
  },

  _bindHamburger() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      // Clone to remove old listeners
      const fresh = hamburger.cloneNode(true);
      hamburger.parentNode.replaceChild(fresh, hamburger);
      fresh.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('open');
      });
    }
    if (overlay) {
      const fresh = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(fresh, overlay);
      fresh.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        fresh.classList.remove('open');
      });
    }
  },

  _bindPopState() {
    window.addEventListener('popstate', e => {
      if (e.state?.href) this._navigate(e.state.href, e.state.pageId);
    });
  },

  _updateTopbarTitle(pageId) {
    const entry = (this._nav || []).find(n => n.id === pageId);
    const el = document.querySelector('.topbar-title');
    if (el && entry) el.textContent = entry.label;
  }
};
