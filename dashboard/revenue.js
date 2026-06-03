window.Auth.requireAuth();
window.Layout.init('revenue');

// ── Period state ──────────────────────────────────────────────
let currentPeriod = 'month';

document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPeriod = btn.dataset.period;
    renderAll();
  });
});

// ── Data helpers ──────────────────────────────────────────────
function getPeriodData(revenue) {
  // Build period-specific views from synthetic revenue data
  if (currentPeriod === 'month') {
    return {
      label: 'This Month',
      total: revenue.this_month,
      prev:  revenue.last_month,
      bars:  revenue.monthly.slice(-6),
      by_service: revenue.by_service,
    };
  }
  if (currentPeriod === 'quarter') {
    const last3 = revenue.monthly.slice(-3);
    const prev3 = revenue.monthly.slice(-6, -3);
    return {
      label: 'This Quarter',
      total: last3.reduce((s,m) => s + m.amount, 0),
      prev:  prev3.reduce((s,m) => s + m.amount, 0),
      bars:  last3,
      by_service: {
        boarding: Math.round(revenue.by_service.boarding * 2.8),
        grooming: Math.round(revenue.by_service.grooming * 2.8),
        swimming: Math.round(revenue.by_service.swimming * 2.8),
      },
    };
  }
  // year
  const total = revenue.monthly.reduce((s,m) => s + m.amount, 0);
  return {
    label: 'This Year',
    total,
    prev: Math.round(total * 0.82),
    bars: revenue.monthly,
    by_service: {
      boarding: Math.round(revenue.by_service.boarding * 11),
      grooming: Math.round(revenue.by_service.grooming * 11),
      swimming: Math.round(revenue.by_service.swimming * 11),
    },
  };
}

// ── Render all ────────────────────────────────────────────────
async function renderAll() {
  const [revenue, boarding, appointments, clients] = await Promise.all([
    window.DB.getRevenue(),
    window.DB.getBoarding(),
    window.DB.getAppointments(),
    window.DB.getClients(),
  ]);

  const pd = getPeriodData(revenue);
  const growth = pd.prev > 0 ? Math.round(((pd.total - pd.prev) / pd.prev) * 100) : 0;

  // Compute derived metrics
  const allAppts = appointments;
  const paidAppts = allAppts.filter(a => a.payment_status === 'paid');
  const pendingAppts = allAppts.filter(a => a.payment_status !== 'paid' && a.status !== 'cancelled');
  const pendingAmt = pendingAppts.reduce((s,a) => s + (a.amount||0), 0)
    + boarding.filter(b => b.payment_status !== 'paid' && b.status !== 'checked_out').reduce((s,b) => s + (b.total||0), 0);
  const totalTransactions = allAppts.filter(a => a.status !== 'cancelled').length;
  const avgBooking = totalTransactions > 0 ? Math.round(pd.total / Math.max(totalTransactions, 1)) : 0;
  const capacity = 20;
  const avgOcc = Math.round((boarding.filter(b => b.status === 'active' || b.status === 'checkout_today').length / capacity) * 100);
  const prevAvgBooking = pd.prev > 0 ? Math.round(pd.prev / Math.max(totalTransactions - 2, 1)) : 0;

  // ── KPI Cards ────────────────────────────────────────────
  document.getElementById('kpiRevenue').textContent = window.Utils.formatCurrency(pd.total);
  const revDelta = document.getElementById('kpiRevenueDelta');
  revDelta.textContent = `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}% vs prev`;
  revDelta.className = `kpi-delta ${growth >= 0 ? 'up' : 'down'}`;

  document.getElementById('kpiAvgBooking').textContent = window.Utils.formatCurrency(avgBooking);
  const avgDelta = document.getElementById('kpiAvgDelta');
  const avgDiff = avgBooking - prevAvgBooking;
  avgDelta.textContent = `${avgDiff >= 0 ? '↑' : '↓'} ${window.Utils.formatCurrency(Math.abs(avgDiff))} vs prev`;
  avgDelta.className = `kpi-delta ${avgDiff >= 0 ? 'up' : 'down'}`;

  document.getElementById('kpiOccupancy').textContent = `${avgOcc}%`;
  const occDelta = document.getElementById('kpiOccDelta');
  occDelta.textContent = `of ${capacity} max capacity`;
  occDelta.className = `kpi-delta ${avgOcc > 70 ? 'up' : avgOcc > 40 ? 'flat' : 'down'}`;

  document.getElementById('kpiPending').textContent = window.Utils.formatCurrency(pendingAmt);
  const pendDelta = document.getElementById('kpiPendingDelta');
  pendDelta.textContent = `${pendingAppts.length} open transactions`;
  pendDelta.className = `kpi-delta ${pendingAppts.length > 3 ? 'down' : 'flat'}`;

  // ── Insights Chips ───────────────────────────────────────
  const bestService = Object.entries(pd.by_service).sort((a,b) => b[1]-a[1])[0];
  const topClient = [...clients].sort((a,b) => b.ltv - a.ltv)[0];
  const collectionRate = Math.round((paidAppts.reduce((s,a)=>s+(a.amount||0),0) / Math.max(pd.total,1)) * 100);

  document.getElementById('insightsRow').innerHTML = `
    <div class="insight-chip">
      <span class="ic-icon">🏆</span>
      <div class="ic-text">
        <strong>${bestService[0].charAt(0).toUpperCase()+bestService[0].slice(1)} leads revenue</strong>
        ${Math.round(bestService[1]/Object.values(pd.by_service).reduce((a,b)=>a+b,0)*100)}% of total service mix
      </div>
    </div>
    <div class="insight-chip">
      <span class="ic-icon">⚡</span>
      <div class="ic-text">
        <strong>${collectionRate}% collection rate</strong>
        ${100-collectionRate}% revenue still pending collection
      </div>
    </div>
    <div class="insight-chip">
      <span class="ic-icon">🐾</span>
      <div class="ic-text">
        <strong>${topClient.pet_name} (${topClient.name})</strong>
        Highest LTV at ${window.Utils.formatCurrency(topClient.ltv)}
      </div>
    </div>
    <div class="insight-chip">
      <span class="ic-icon">📊</span>
      <div class="ic-text">
        <strong>${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}% growth</strong>
        ${window.Utils.formatCurrency(Math.abs(pd.total - pd.prev))} ${growth >= 0 ? 'more' : 'less'} than previous period
      </div>
    </div>
  `;

  // ── Bar Chart ────────────────────────────────────────────
  const bars = pd.bars;
  const maxAmt = Math.max(...bars.map(m => m.amount));
  document.getElementById('trendSub').textContent = currentPeriod === 'month' ? 'Last 6 months' : currentPeriod === 'quarter' ? 'Last 3 months' : 'Monthly breakdown';

  document.getElementById('barChart').innerHTML = bars.map((m, i) => {
    const isLast = i === bars.length - 1;
    const heightPct = Math.max(Math.round(m.amount / maxAmt * 100), 4);
    const color = isLast ? 'var(--accent)' : `rgba(43,126,193,${0.2 + (i / bars.length) * 0.4})`;
    return `
      <div class="bar-col ${isLast ? 'active' : ''}" style="position:relative;">
        <div class="bar-amount">${window.Utils.formatCurrency(m.amount).replace('₹','₹')}</div>
        <div class="bar-fill-wrap">
          <div class="bar-fill ${isLast ? 'current' : ''}"
               style="height:${heightPct}%;background:${color};"
               title="${m.month}: ${window.Utils.formatCurrency(m.amount)}">
          </div>
        </div>
        <div class="bar-label">${m.month}</div>
      </div>
    `;
  }).join('');

  // ── Donut Chart ──────────────────────────────────────────
  const svc = pd.by_service;
  const svcTotal = svc.boarding + svc.grooming + svc.swimming;
  const svcData = [
    { label: 'Boarding',  val: svc.boarding, color: 'var(--accent)', hex: '#2B7EC1' },
    { label: 'Grooming',  val: svc.grooming, color: 'var(--green)',  hex: '#4DAF35' },
    { label: 'Swimming',  val: svc.swimming, color: 'var(--teal)',   hex: '#32BEC8' },
  ];

  // Build SVG donut
  const cx = 70, cy = 70, r = 52, stroke = 20;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = svcData.map(d => {
    const pct = d.val / svcTotal;
    const seg = { ...d, pct, dashArray: pct * circumference, dashOffset: -offset * circumference };
    offset += pct;
    return seg;
  });

  document.getElementById('donutSvg').innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
    ${segments.map(s => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${s.hex}" stroke-width="${stroke}"
        stroke-dasharray="${s.dashArray} ${circumference}"
        stroke-dashoffset="${s.dashOffset}"
        transform="rotate(-90 ${cx} ${cy})"
        style="transition: stroke-dasharray 0.7s ease;"
      />
    `).join('')}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="DM Sans,sans-serif">Total</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)" font-family="Nunito,sans-serif">₹${Math.round(svcTotal/1000)}K</text>
  `;

  document.getElementById('donutLegend').innerHTML = svcData.map(d => `
    <div class="donut-item">
      <div class="donut-name">
        <span class="donut-dot" style="background:${d.hex};"></span>
        ${d.label}
      </div>
      <div>
        <span class="donut-val">${window.Utils.formatCurrency(d.val)}</span>
        <span class="donut-pct">${Math.round(d.val/svcTotal*100)}%</span>
      </div>
    </div>
  `).join('');

  // ── Key Metrics ──────────────────────────────────────────
  const completedAppts = allAppts.filter(a => a.status === 'completed').length;
  const cancelledAppts = allAppts.filter(a => a.status === 'cancelled').length;
  const cancelRate = totalTransactions > 0 ? Math.round(cancelledAppts / (totalTransactions + cancelledAppts) * 100) : 0;
  const boardingRevShare = Math.round(svc.boarding / svcTotal * 100);

  document.getElementById('keyMetrics').innerHTML = [
    { label: 'Total Transactions',   val: totalTransactions },
    { label: 'Completed Sessions',   val: completedAppts },
    { label: 'Cancellation Rate',    val: `${cancelRate}%` },
    { label: 'Boarding Rev Share',   val: `${boardingRevShare}%` },
    { label: 'Avg Daily Revenue',    val: window.Utils.formatCurrency(Math.round(pd.total / 30)) },
    { label: 'Active Clients',       val: clients.filter(c => c.status === 'active').length },
    { label: 'Revenue / Client',     val: window.Utils.formatCurrency(Math.round(pd.total / Math.max(clients.length, 1))) },
  ].map(m => `
    <div class="metric-item">
      <span class="metric-label">${m.label}</span>
      <span class="metric-val">${m.val}</span>
    </div>
  `).join('');

  document.getElementById('metricsLabel').textContent = pd.label;

  // ── Occupancy History ────────────────────────────────────
  const occHistory = [
    { month: 'Nov', pct: 45 }, { month: 'Dec', pct: 70 },
    { month: 'Jan', pct: 55 }, { month: 'Feb', pct: 65 },
    { month: 'Mar', pct: 72 }, { month: 'Apr', pct: avgOcc },
  ];
  document.getElementById('occupancyHistory').innerHTML = occHistory.map(o => {
    const color = o.pct > 80 ? 'var(--red)' : o.pct > 60 ? 'var(--green)' : 'var(--teal)';
    return `
      <div class="occ-row">
        <span class="occ-month">${o.month}</span>
        <div class="occ-bar-wrap">
          <div class="occ-bar-fill" style="width:${o.pct}%;background:${color};"></div>
        </div>
        <span class="occ-pct" style="color:${color};">${o.pct}%</span>
      </div>
    `;
  }).join('');

  // ── Top Clients ──────────────────────────────────────────
  const ranked = [...clients].sort((a, b) => b.ltv - a.ltv).slice(0, 6);
  const rankClasses = ['gold', 'silver', 'bronze', '', '', ''];
  document.getElementById('topClients').innerHTML = ranked.map((c, i) => `
    <div class="client-rank">
      <div class="rank-num ${rankClasses[i]}">${i + 1}</div>
      <div>
        <div class="rank-pet">${c.pet_name}</div>
        <div class="rank-owner">${c.name} · ${c.pet_breed}</div>
      </div>
      <div class="rank-ltv">${window.Utils.formatCurrency(c.ltv)}</div>
    </div>
  `).join('');

  // store for export
  window._revenueData = { revenue, boarding, appointments, clients, pd, growth, avgBooking, avgOcc, pendingAmt };
}

// ── Export CSV ────────────────────────────────────────────────
function exportCSV() {
  const d = window._revenueData;
  if (!d) return window.Utils.toast('Data loading...', 'error');

  const rows = [
    ['Petropawlis Revenue Report — ' + d.pd.label],
    [],
    ['KPI', 'Value'],
    ['Total Revenue', d.pd.total],
    ['Avg Booking Value', d.avgBooking],
    ['Occupancy Rate', d.avgOcc + '%'],
    ['Pending / Uncollected', d.pendingAmt],
    [],
    ['Service', 'Revenue', '% Share'],
    ...Object.entries(d.pd.by_service).map(([s, v]) => [
      s.charAt(0).toUpperCase() + s.slice(1),
      v,
      Math.round(v / Object.values(d.pd.by_service).reduce((a,b)=>a+b,0) * 100) + '%'
    ]),
    [],
    ['Month', 'Revenue'],
    ...d.pd.bars.map(m => [m.month, m.amount]),
  ];

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Petropawlis-Revenue-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  window.Utils.toast('CSV exported!', 'success');
}

// ── Export PDF ────────────────────────────────────────────────
function exportPDF() {
  const d = window._revenueData;
  if (!d) return window.Utils.toast('Data loading...', 'error');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

  // Header
  doc.setFillColor(43, 126, 193);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Petropawlis — Revenue Report', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${d.pd.label}  ·  Generated ${dateStr}`, 14, 21);

  doc.setTextColor(0, 0, 0);

  // KPIs
  let y = 38;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Key Performance Indicators', 14, y); y += 7;

  const kpis = [
    ['Total Revenue', `Rs. ${d.pd.total.toLocaleString('en-IN')}`],
    ['Growth vs Previous', `${d.growth >= 0 ? '+' : ''}${d.growth}%`],
    ['Avg Booking Value', `Rs. ${d.avgBooking.toLocaleString('en-IN')}`],
    ['Occupancy Rate', `${d.avgOcc}%`],
    ['Pending Collections', `Rs. ${d.pendingAmt.toLocaleString('en-IN')}`],
  ];
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  kpis.forEach(([label, val]) => {
    doc.setTextColor(100); doc.text(label, 14, y);
    doc.setTextColor(0);   doc.setFont('helvetica','bold'); doc.text(val, 100, y);
    doc.setFont('helvetica','normal');
    y += 7;
  });

  // Revenue by service
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(0);
  doc.text('Revenue by Service', 14, y); y += 7;
  doc.setFontSize(10);
  const svcTotal = Object.values(d.pd.by_service).reduce((a,b)=>a+b,0);
  Object.entries(d.pd.by_service).forEach(([s, v]) => {
    const pct = Math.round(v/svcTotal*100);
    doc.setFont('helvetica','normal'); doc.setTextColor(100); doc.text(s.charAt(0).toUpperCase()+s.slice(1), 14, y);
    doc.setTextColor(0); doc.setFont('helvetica','bold');
    doc.text(`Rs. ${v.toLocaleString('en-IN')}  (${pct}%)`, 80, y);
    doc.setFont('helvetica','normal');
    y += 7;
  });

  // Monthly trend
  y += 6;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0);
  doc.text('Monthly Revenue Trend', 14, y); y += 7;
  doc.setFontSize(10);
  d.pd.bars.forEach(m => {
    doc.setFont('helvetica','normal'); doc.setTextColor(100); doc.text(m.month, 14, y);
    doc.setTextColor(0); doc.setFont('helvetica','bold');
    doc.text(`Rs. ${m.amount.toLocaleString('en-IN')}`, 50, y);
    doc.setFont('helvetica','normal');
    y += 7;
  });

  // Top clients
  y += 6;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(0);
  doc.text('Top Clients by LTV', 14, y); y += 7;
  doc.setFontSize(9);
  [...d.clients].sort((a,b)=>b.ltv-a.ltv).slice(0,5).forEach((c,i) => {
    doc.setFont('helvetica','normal'); doc.setTextColor(100);
    doc.text(`${i+1}. ${c.pet_name} (${c.name})`, 14, y);
    doc.setTextColor(0); doc.setFont('helvetica','bold');
    doc.text(`Rs. ${c.ltv.toLocaleString('en-IN')}`, 130, y);
    doc.setFont('helvetica','normal');
    y += 6;
  });

  // Footer
  doc.setTextColor(150); doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text('Generated by Petropawlis CRM · Confidential', 14, 285);

  doc.save(`Petropawlis-Revenue-${new Date().toISOString().split('T')[0]}.pdf`);
  window.Utils.toast('PDF report exported!', 'success');
}

renderAll();
