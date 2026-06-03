window.Auth.requireAuth();
window.Layout.init('dashboard');

const today = new Date();
document.getElementById('todayDate').textContent = today.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
document.getElementById('briefingDate').textContent = today.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

if (window.innerWidth < 640) {
  document.getElementById('midRow').style.gridTemplateColumns = '1fr';
}

async function loadDashboard() {
  const [revenue, boarding, appointments] = await Promise.all([
    window.DB.getRevenue(),
    window.DB.getBoarding(),
    window.DB.getAppointments(today.toISOString().split('T')[0])
  ]);

  const activeBoarding = boarding.filter(b => b.status === 'active' || b.status === 'checkout_today');
  const checkoutToday = boarding.filter(b => b.status === 'checkout_today');
  const capacity = 20;

  // ─── Daily Revenue Summary ───
  const paidAppts = appointments.filter(a => a.payment_status === 'paid');
  const pendingAppts = appointments.filter(a => a.payment_status !== 'paid' && a.status !== 'cancelled');
  const collectedToday = paidAppts.reduce((s, a) => s + (a.amount||0), 0);
  const pendingToday = pendingAppts.reduce((s, a) => s + (a.amount||0), 0);
  const boardingPending = boarding.filter(b => (b.status==='checkout_today') && b.payment_status!=='paid').reduce((s,b) => s+(b.total||0), 0);
  const totalPending = pendingToday + boardingPending;
  const totalDay = collectedToday + totalPending;

  document.getElementById('revCollected').textContent = window.Utils.formatCurrency(collectedToday);
  document.getElementById('revPending').textContent = window.Utils.formatCurrency(totalPending);
  document.getElementById('revTotal').textContent = window.Utils.formatCurrency(totalDay);

  // ─── Pending Alert ───
  const pendingCount = pendingAppts.length + boarding.filter(b=>b.status==='checkout_today'&&b.payment_status!=='paid').length;
  if (pendingCount > 0) {
    document.getElementById('pendingAlert').style.display = 'flex';
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('pendingAmount').textContent = window.Utils.formatCurrency(totalPending);
  }

  // ─── Vaccination Alert ───
  const vacDue = await window.DB.getVaccinationsDueSoon(30);
  if (vacDue.length > 0) {
    document.getElementById('vaccinationAlert').innerHTML = `
      <div style="background:var(--yellow-dim);border:1px solid var(--yellow);border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span style="font-size:13px;color:var(--yellow);">💉 <strong>${vacDue.length} vaccination${vacDue.length>1?'s':''} due</strong> in the next 30 days</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${vacDue.map(v => `<button class="btn btn-ghost btn-sm" style="border-color:var(--yellow);color:var(--yellow);" onclick="window.WA.send('${v.phone}', window.WA.templates.vaccinationReminder('${v.pet_name}','${v.vac_name}','${v.next_due}'))">Remind ${v.pet_name}</button>`).join('')}
        </div>
      </div>
    `;
  }

  // ─── Briefing Chips ───
  const nextTwoHours = appointments.filter(a => {
    const now = new Date();
    const [h,m] = a.start_time.split(':').map(Number);
    const apptMins = h*60+m;
    const nowMins = now.getHours()*60+now.getMinutes();
    return apptMins >= nowMins && apptMins <= nowMins+120 && a.status!=='cancelled' && a.status!=='completed';
  });
  const swimNow = appointments.filter(a => {
    const now = new Date();
    const [h,m] = a.start_time.split(':').map(Number);
    const apptMins = h*60+m;
    const nowMins = now.getHours()*60+now.getMinutes();
    return a.service_type==='swimming' && apptMins >= nowMins && apptMins <= nowMins+15;
  });

  document.getElementById('briefingChips').innerHTML = `
    <div class="briefing-chip chip-orange">🐕 ${activeBoarding.length} boarding</div>
    <div class="briefing-chip chip-green">📅 ${appointments.filter(a=>a.status!=='cancelled').length} apts today</div>
    ${checkoutToday.length > 0 ? `<div class="briefing-chip chip-red">📤 ${checkoutToday.length} checkout${checkoutToday.length>1?'s':''}</div>` : ''}
    ${nextTwoHours.length > 0 ? `<div class="briefing-chip chip-blue">⏰ ${nextTwoHours.length} in next 2hrs</div>` : ''}
    ${swimNow.length > 0 ? `<div class="briefing-chip chip-blue">🏊 Swimming starting soon!</div>` : ''}
  `;

  // ─── Stat Tiles ───
  document.getElementById('statMonth').textContent = window.Utils.formatCurrency(revenue.this_month);
  const growth = Math.round(((revenue.this_month - revenue.last_month) / revenue.last_month) * 100);
  document.getElementById('statMonthGrowth').innerHTML = `<span style="color:var(--green)">↑ ${growth}%</span> vs last month`;
  document.getElementById('statBoarding').textContent = activeBoarding.length;
  document.getElementById('statBoardingCap').innerHTML = `of ${capacity} — <span style="color:${activeBoarding.length/capacity>0.8?'var(--red)':'var(--green)'}">${Math.round(activeBoarding.length/capacity*100)}% full</span>`;
  document.getElementById('statAppts').textContent = appointments.filter(a=>a.service_type!=='boarding').length;
  document.getElementById('statCheckouts').textContent = checkoutToday.length;
  document.getElementById('statCheckoutSub').innerHTML = checkoutToday.length > 0
    ? `<span style="color:var(--yellow)">${window.Utils.formatCurrency(checkoutToday.reduce((s,b)=>s+b.total,0))} due</span>`
    : 'No checkouts today';

  // ─── Revenue by Service ───
  const rbs = revenue.by_service;
  const total = rbs.boarding + rbs.grooming + rbs.swimming;
  document.getElementById('revenueByService').innerHTML = ['boarding','grooming','swimming'].map(s => {
    const pct = Math.round(rbs[s]/total*100);
    const colors = { boarding:'var(--accent)', grooming:'var(--green)', swimming:'var(--teal)' };
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:var(--text2);">${window.Utils.getServiceIcon(s)} ${s.charAt(0).toUpperCase()+s.slice(1)}</span>
          <span style="font-size:13px;font-weight:500;color:var(--text);">${window.Utils.formatCurrency(rbs[s])}</span>
        </div>
        <div style="height:6px;background:var(--border2);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${colors[s]};border-radius:4px;transition:width 0.6s ease;"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">${pct}% of total</div>
      </div>
    `;
  }).join('');

  // ─── Boarding Status ───
  document.getElementById('boardingStatus').innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:13px;color:var(--muted);">Capacity</span>
        <span style="font-size:13px;font-weight:500;">${activeBoarding.length} / ${capacity}</span>
      </div>
      <div style="height:10px;background:var(--border2);border-radius:6px;overflow:hidden;">
        <div style="height:100%;width:${Math.round(activeBoarding.length/capacity*100)}%;background:${activeBoarding.length/capacity>0.8?'var(--red)':'var(--accent)'};border-radius:6px;"></div>
      </div>
    </div>
    ${checkoutToday.length > 0 ? `<div style="background:var(--accent-dim);border:1px solid var(--accent);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--accent);margin-bottom:12px;">⚠️ ${checkoutToday.length} checkout${checkoutToday.length>1?'s':''} today</div>` : ''}
    ${activeBoarding.slice(0,4).map(b => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:20px;">🐕</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:500;">${b.pet_name} <span style="color:var(--muted);font-weight:400;">· ${b.breed}</span></div>
          <div style="font-size:11px;color:var(--muted);">Checkout: ${window.Utils.formatDate(b.checkout)}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          ${window.Utils.getStatusBadge(b.status)}
          <button class="icon-btn wa" onclick="whatsappUpdate(event,'${b.phone||''}','${b.pet_name}')" title="WhatsApp update">💬</button>
          <button class="icon-btn cam" onclick="whatsappCamera(event,'${b.phone||''}')" title="Send photo/video">📹</button>
        </div>
      </div>
    `).join('')}
  `;

  // ─── Revenue Trend ───
  const monthly = revenue.monthly;
  const maxAmt = Math.max(...monthly.map(m=>m.amount));
  document.getElementById('revenueTrend').innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:8px;height:100%;padding-bottom:24px;">
      ${monthly.map((m,i) => {
        const heightPct = Math.round(m.amount/maxAmt*100);
        const isLast = i===monthly.length-1;
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;">
            <div style="font-size:10px;color:var(--muted);">${window.Utils.formatCurrency(m.amount).replace('₹','')}</div>
            <div style="flex:1;width:100%;display:flex;align-items:flex-end;">
              <div style="width:100%;height:${heightPct}%;background:${isLast?'var(--accent)':'var(--border2)'};border-radius:4px 4px 0 0;transition:height 0.6s ease;"></div>
            </div>
            <div style="font-size:11px;color:${isLast?'var(--accent)':'var(--muted)'};">${m.month}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // ─── Today's Schedule ───
  const sorted = [...appointments].sort((a,b) => a.start_time.localeCompare(b.start_time));
  if (sorted.length === 0) {
    document.getElementById('todayAppts').innerHTML = '<div class="empty-state"><div class="icon">📅</div><p>No appointments today</p></div>';
    return;
  }
  document.getElementById('todayAppts').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Time</th><th>Pet</th><th>Service</th><th>Client</th><th>Status</th><th>Payment</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${sorted.map(a => {
            const client = SYNTHETIC.clients.find(c=>c.id===a.client_id);
            const phone = client?.phone || '';
            return `
              <tr>
                <td style="font-weight:500;color:var(--accent);">${window.Utils.formatTime(a.start_time)}</td>
                <td>${a.pet_name}</td>
                <td>${window.Utils.getServiceIcon(a.service_type)} ${a.service_type}</td>
                <td style="color:var(--muted);">${a.client_name}</td>
                <td>${window.Utils.getStatusBadge(a.status)}</td>
                <td>${a.payment_status==='paid'
                  ? '<span class="badge badge-completed">Paid</span>'
                  : '<span class="badge badge-pending">Unpaid</span>'}</td>
                <td>
                  <div class="appt-row-actions">
                    ${phone ? `<button class="icon-btn wa" onclick="whatsappUpdate(event,'${phone}','${a.pet_name}')" title="WhatsApp">💬</button>` : ''}
                    ${phone ? `<button class="icon-btn cam" onclick="whatsappCamera(event,'${phone}')" title="Send photo/video">📹</button>` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  window._dashData = { appointments, boarding };
}

// ─── WhatsApp ────────────────────────────────────────────────────
function whatsappUpdate(e, phone, petName) {
  e.stopPropagation();
  if (!phone) return window.Utils.toast('No phone number on file', 'error');
  const msg = encodeURIComponent(`Hi! This is a daily update for ${petName} from Pawsome Resort 🐾. Your pup is happy and doing great! Let us know if you have any questions.`);
  window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
}

function whatsappCamera(e, phone) {
  e.stopPropagation();
  if (!phone) return window.Utils.toast('No phone number on file', 'error');
  // Opens WhatsApp chat — staff can then attach photo/video directly
  window.open(`https://wa.me/91${phone}`, '_blank');
  window.Utils.toast('WhatsApp opened — attach your photo or video 📸', 'success');
}

// ─── Export Day PDF ───────────────────────────────────────────────
async function exportDayPDF() {
  if (!window._dashData) return window.Utils.toast('Loading data...', 'error');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  const { appointments, boarding } = window._dashData;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Pawsome Resort — Daily Report', 14, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(dateStr, 14, 28);
  doc.setTextColor(0);

  // Revenue summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Revenue Summary', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const paid = appointments.filter(a=>a.payment_status==='paid').reduce((s,a)=>s+(a.amount||0),0);
  const pending = appointments.filter(a=>a.payment_status!=='paid'&&a.status!=='cancelled').reduce((s,a)=>s+(a.amount||0),0);
  doc.text(`Collected: Rs. ${paid.toLocaleString('en-IN')}`, 14, 50);
  doc.text(`Pending: Rs. ${pending.toLocaleString('en-IN')}`, 80, 50);
  doc.text(`Total: Rs. ${(paid+pending).toLocaleString('en-IN')}`, 146, 50);

  // Appointments table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("Today's Appointments", 14, 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const apptHeaders = ['Time', 'Pet', 'Service', 'Client', 'Status', 'Payment'];
  const apptRows = appointments.sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(a =>
    [a.start_time, a.pet_name, a.service_type, a.client_name, a.status, a.payment_status]
  );
  let y = 70;
  const colW = [22, 28, 25, 40, 25, 22];
  doc.setFillColor(40, 40, 40);
  doc.setTextColor(255);
  let x = 14;
  apptHeaders.forEach((h, i) => { doc.text(h, x+2, y+5); x+=colW[i]; });
  y += 10;
  doc.setTextColor(0);
  apptRows.forEach(row => {
    let rx = 14;
    row.forEach((cell, i) => { doc.text(String(cell).substring(0,18), rx+2, y+5); rx+=colW[i]; });
    y += 8;
    if (y > 250) { doc.addPage(); y = 20; }
  });

  // Boarding list
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Boarding List', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const bHeaders = ['Dog', 'Breed', 'Owner', 'Check-in', 'Check-out', 'Total', 'Status'];
  const bColW = [24, 26, 36, 22, 24, 20, 28];
  let bx = 14;
  doc.setFillColor(40,40,40); doc.setTextColor(255);
  bHeaders.forEach((h,i) => { doc.text(h, bx+2, y+5); bx+=bColW[i]; });
  y += 10;
  doc.setTextColor(0);
  const activeBoards = boarding.filter(b=>b.status==='active'||b.status==='checkout_today');
  activeBoards.forEach(b => {
    let bx2 = 14;
    [b.pet_name, b.breed, b.client_name, b.checkin, b.checkout, `Rs.${b.total}`, b.status].forEach((cell,i) => {
      doc.text(String(cell).substring(0,14), bx2+2, y+5); bx2+=bColW[i];
    });
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.save(`Pawsome-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  window.Utils.toast('Day report exported as PDF!', 'success');
}

loadDashboard();
