window.Auth.requireAuth();
window.Layout.init('appointments');

let currentDate = new Date().toISOString().split('T')[0];
let currentFilter = 'all';
let allAppointments = [];
let selectedIds = new Set();
let currentTab = 'schedule';

const SERVICE_DURATIONS = { grooming: 90, swimming: 60, boarding: 0 };
const HOURS = [8,9,10,11,12,13,14,15,16,17,18];

// ─── Tab switching ────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('scheduleTab').style.display = tab === 'schedule' ? '' : 'none';
  document.getElementById('pendingTab').style.display = tab === 'pending' ? '' : 'none';
  document.getElementById('tabSchedule').classList.toggle('active', tab === 'schedule');
  document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
  if (tab === 'pending') loadPendingPayments();
}

// Check URL param
if (window.location.search.includes('tab=pending')) switchTab('pending');

function dateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  if (dateStr === today) return 'Today — ' + d.toLocaleDateString('en-IN', {day:'numeric',month:'long'});
  if (dateStr === tomorrowStr) return 'Tomorrow — ' + d.toLocaleDateString('en-IN', {day:'numeric',month:'long'});
  return d.toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long'});
}

function shiftDate(dir) {
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() + dir);
  currentDate = d.toISOString().split('T')[0];
  loadAppointments();
}

function goToday() {
  currentDate = new Date().toISOString().split('T')[0];
  loadAppointments();
}

function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderTimeline(allAppointments);
}

async function loadAppointments() {
  document.getElementById('dateDisplay').textContent = dateDisplay(currentDate);
  allAppointments = await window.DB.getAppointments(currentDate);
  selectedIds.clear();
  updateBulkBar();
  renderTimeline(allAppointments);
  renderSummary(allAppointments);
}

function renderSummary(appts) {
  const counts = { grooming: 0, swimming: 0, boarding: 0 };
  appts.forEach(a => counts[a.service_type]++);
  const colors = { grooming: 'var(--green)', swimming: 'var(--blue)', boarding: 'var(--accent)' };
  document.getElementById('apptSummary').innerHTML = Object.entries(counts).map(([s, c]) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 16px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;">${window.Utils.getServiceIcon(s)}</span>
      <div>
        <div style="font-size:18px;font-weight:600;color:${colors[s]};">${c}</div>
        <div style="font-size:11px;color:var(--muted);text-transform:capitalize;">${s}</div>
      </div>
    </div>
  `).join('');
}

function renderTimeline(appts) {
  const filtered = currentFilter === 'all' ? appts : appts.filter(a => a.service_type === currentFilter);
  document.getElementById('apptCount').textContent = `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    document.getElementById('timeline').innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>No appointments${currentFilter !== 'all' ? ' for ' + currentFilter : ''} on this day</p></div>`;
    return;
  }

  const now = new Date();
  const nowMins = now.getHours()*60+now.getMinutes();
  const isToday = currentDate === new Date().toISOString().split('T')[0];

  const byHour = {};
  HOURS.forEach(h => byHour[h] = []);
  filtered.forEach(a => {
    const h = parseInt(a.start_time.split(':')[0]);
    if (byHour[h] !== undefined) byHour[h].push(a);
    else {
      const closestHour = HOURS.reduce((prev, curr) => Math.abs(curr-h) < Math.abs(prev-h) ? curr : prev);
      byHour[closestHour].push(a);
    }
  });

  const serviceColor = { grooming:'var(--green)', swimming:'var(--teal)', boarding:'var(--accent)' };

  document.getElementById('timeline').innerHTML = `<div class="timeline">
    ${HOURS.map(h => {
      const slots = byHour[h];
      const label = h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h-12}PM`;
      return `
        <div class="tl-hour">
          <div class="tl-hour-label">${label}</div>
          <div class="tl-line"></div>
          <div class="tl-slots">
            ${slots.map(a => {
              const [ah,am] = a.start_time.split(':').map(Number);
              const apptMins = ah*60+am;
              const swimSoon = isToday && a.service_type==='swimming' && apptMins >= nowMins && apptMins <= nowMins+15;
              const isChecked = selectedIds.has(a.id);
              return `
                <div class="appt-block ${a.service_type}${swimSoon?' soon':''}" style="border-left-color:${serviceColor[a.service_type]};">
                  <input type="checkbox" class="appt-checkbox" ${isChecked?'checked':''} onclick="toggleSelect(event,${a.id})">
                  <div class="appt-info" onclick="showDetail(${a.id})" style="cursor:pointer;">
                    <div class="appt-pet">${a.pet_name} <span style="color:var(--muted);font-weight:400;font-size:13px;">— ${a.client_name}</span>
                      ${swimSoon ? '<span style="color:var(--blue);font-size:11px;margin-left:6px;">🔔 Starting soon!</span>' : ''}
                    </div>
                    <div class="appt-service">${window.Utils.getServiceIcon(a.service_type)} ${a.service_type} · ${window.Utils.formatTime(a.start_time)}${a.end_time ? ' – '+window.Utils.formatTime(a.end_time) : ''}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${window.Utils.getStatusBadge(a.status)}
                    ${a.payment_status==='paid'
                      ? '<span style="font-size:11px;color:var(--green);">✓ Paid</span>'
                      : '<span style="font-size:11px;color:var(--yellow);">⚠ Unpaid</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  </div>`;
}

// ─── Bulk select ──────────────────────────────────────────────────
function toggleSelect(e, id) {
  e.stopPropagation();
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  updateBulkBar();
}

function toggleSelectAll(cb) {
  const filtered = currentFilter === 'all' ? allAppointments : allAppointments.filter(a => a.service_type === currentFilter);
  if (cb.checked) filtered.forEach(a => selectedIds.add(a.id));
  else selectedIds.clear();
  updateBulkBar();
  renderTimeline(allAppointments);
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  if (selectedIds.size > 0) {
    bar.style.display = 'flex';
    document.getElementById('bulkCount').textContent = selectedIds.size;
  } else {
    bar.style.display = 'none';
  }
}

function clearSelection() {
  selectedIds.clear();
  document.getElementById('selectAll').checked = false;
  updateBulkBar();
  renderTimeline(allAppointments);
}

async function bulkMarkComplete() {
  if (selectedIds.size === 0) return;
  await window.DB.bulkUpdateAppointmentStatus([...selectedIds], 'completed');
  allAppointments.forEach(a => { if (selectedIds.has(a.id)) a.status = 'completed'; });
  window.Utils.toast(`${selectedIds.size} appointment${selectedIds.size>1?'s':''} marked complete`, 'success');
  clearSelection();
  renderTimeline(allAppointments);
}

async function bulkMarkCancelled() {
  if (selectedIds.size === 0) return;
  await window.DB.bulkUpdateAppointmentStatus([...selectedIds], 'cancelled');
  allAppointments.forEach(a => { if (selectedIds.has(a.id)) a.status = 'cancelled'; });
  window.Utils.toast(`${selectedIds.size} appointment${selectedIds.size>1?'s':''} cancelled`, 'success');
  clearSelection();
  renderTimeline(allAppointments);
}

// ─── Pending Payments ─────────────────────────────────────────────
async function loadPendingPayments() {
  const allAppts = await window.DB.getAppointments();
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = allAppts.filter(a => a.date === today);
  const unpaid = todayAppts.filter(a => a.payment_status !== 'paid' && a.status !== 'cancelled');
  const paid = todayAppts.filter(a => a.payment_status === 'paid');
  const totalPending = unpaid.reduce((s,a) => s+(a.amount||0), 0);
  const totalPaid = paid.reduce((s,a) => s+(a.amount||0), 0);

  document.getElementById('pendingPaymentsContent').innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <div style="flex:1;min-width:150px;background:var(--red-dim);border:1px solid var(--red);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Pending Today</div>
        <div style="font-size:22px;font-weight:700;color:var(--red);">${window.Utils.formatCurrency(totalPending)}</div>
        <div style="font-size:12px;color:var(--muted);">${unpaid.length} transaction${unpaid.length!==1?'s':''}</div>
      </div>
      <div style="flex:1;min-width:150px;background:var(--green-dim);border:1px solid var(--green);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Collected Today</div>
        <div style="font-size:22px;font-weight:700;color:var(--green);">${window.Utils.formatCurrency(totalPaid)}</div>
        <div style="font-size:12px;color:var(--muted);">${paid.length} paid</div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header"><span class="section-title">Today's Transactions</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Pet</th><th>Service</th><th>Client</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${todayAppts.sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(a => `
              <tr class="${a.payment_status==='paid'?'payment-row-paid':''}">
                <td style="color:var(--accent);font-weight:500;">${window.Utils.formatTime(a.start_time)}</td>
                <td>${a.pet_name}</td>
                <td>${window.Utils.getServiceIcon(a.service_type)} ${a.service_type}</td>
                <td>${a.client_name}</td>
                <td style="font-weight:500;">${window.Utils.formatCurrency(a.amount||0)}</td>
                <td>${a.payment_status==='paid'
                  ? '<span class="payment-badge-paid">✓ Paid</span>'
                  : '<span class="payment-badge-unpaid">⚠ Unpaid</span>'}</td>
                <td>${a.payment_status!=='paid' && a.status!=='cancelled'
                  ? `<button class="btn btn-ghost btn-sm" onclick="markPaid(${a.id})">Mark Paid</button>`
                  : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function markPaid(id) {
  await window.DB.updateAppointmentPayment(id, 'paid');
  window.Utils.toast('Marked as paid ✓', 'success');
  loadPendingPayments();
}

// ─── Detail Modal ─────────────────────────────────────────────────
function showDetail(id) {
  const a = allAppointments.find(x => x.id === id);
  if (!a) return;
  document.getElementById('detailContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">PET</div><div style="font-weight:500;">${a.pet_name}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">CLIENT</div><div style="font-weight:500;">${a.client_name}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">SERVICE</div><div>${window.Utils.getServiceIcon(a.service_type)} ${a.service_type}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">STATUS</div>${window.Utils.getStatusBadge(a.status)}</div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">START</div><div>${window.Utils.formatTime(a.start_time)}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">AMOUNT</div><div style="color:var(--accent);font-weight:600;">${window.Utils.formatCurrency(a.amount||0)}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">PAYMENT</div><div style="color:${a.payment_status==='paid'?'var(--green)':'var(--red);'}font-weight:500;">${a.payment_status==='paid'?'✓ Paid':'⚠ Unpaid'}</div></div>
    </div>
    ${a.notes ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;color:var(--text2);margin-bottom:16px;">${a.notes}</div>` : ''}
    <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;justify-content:flex-end;">
      <button class="btn btn-ghost btn-sm" onclick="bookAgain(${a.id})">🔁 Book Again</button>
      ${a.payment_status!=='paid' ? `<button class="btn btn-ghost btn-sm" onclick="markPaidFromDetail(${a.id})">💰 Mark Paid</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="generateApptInvoice(${a.id})">🧾 Invoice</button>
      <button class="btn btn-ghost btn-sm" onclick="updateStatus(${a.id},'cancelled')">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="updateStatus(${a.id},'completed')">Mark Complete</button>
    </div>
  `;
  document.getElementById('detailModal').classList.add('open');
}

async function markPaidFromDetail(id) {
  await window.DB.updateAppointmentPayment(id, 'paid');
  const a = allAppointments.find(x=>x.id===id);
  if(a) a.payment_status='paid';
  window.Utils.toast('Marked as paid ✓', 'success');
  closeDetailModal();
  renderTimeline(allAppointments);
  if (a) {
    const clients = await window.DB.getClients();
    const cl = clients.find(c => c.id === a.client_id);
    if (cl?.phone && confirm(`Send payment receipt to ${a.client_name} via WhatsApp?`)) {
      const msg = window.WA.templates.paymentReceipt(a.client_name, a.pet_name, a.amount, a.service_type);
      await window.WA.send(cl.phone, msg);
    }
  }
}

// ─── Book Again ───────────────────────────────────────────────────
function bookAgain(id) {
  const a = allAppointments.find(x => x.id === id);
  if (!a) return;
  closeDetailModal();
  openAddModal();
  // Pre-fill
  document.getElementById('aClientName').value = a.client_name;
  document.getElementById('aPetName').value = a.pet_name;
  document.getElementById('aService').value = a.service_type;
  document.getElementById('aAmount').value = a.amount || '';
  document.getElementById('aNotes').value = a.notes || '';
  const client = SYNTHETIC.clients.find(c => c.id === a.client_id);
  if (client) document.getElementById('aPhone').value = client.phone || '';
  updateEndTime();
  // Set date to tomorrow
  const d = new Date(); d.setDate(d.getDate()+1);
  document.getElementById('aDate').value = d.toISOString().split('T')[0];
  window.Utils.toast('Details pre-filled! Adjust date & time', 'success');
}

async function updateStatus(id, status) {
  await window.DB.updateAppointmentStatus(id, status);
  const a = allAppointments.find(x => x.id === id);
  if (a) a.status = status;
  renderTimeline(allAppointments);
  closeDetailModal();
  window.Utils.toast(`Appointment marked as ${status}`, 'success');
}

function closeDetailModal() { document.getElementById('detailModal').classList.remove('open'); }

async function generateApptInvoice(id) {
  const a = allAppointments.find(x => x.id === id);
  if (!a) return;
  const clients = await window.DB.getClients();
  const client = clients.find(c => c.id === a.client_id) || { name: a.client_name, pet_name: a.pet_name };
  const lineItems = [{ service: `${a.service_type} appointment`, date: a.date, amount: a.amount || 0 }];
  window.Utils.generateInvoicePDF(client, lineItems, a.payment_status);
}

// ─── Add Modal ────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('aDate').value = currentDate;
  document.getElementById('aStart').value = '09:00';
  document.getElementById('aClientName').value = '';
  document.getElementById('aPetName').value = '';
  document.getElementById('aPhone').value = '';
  document.getElementById('aAmount').value = '';
  document.getElementById('aNotes').value = '';
  updateEndTime();
  document.getElementById('conflictWarning').style.display = 'none';
  document.getElementById('addModal').classList.add('open');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
  hideAutocomplete();
}

function updateEndTime() {
  const start = document.getElementById('aStart').value;
  const service = document.getElementById('aService').value;
  if (!start) return;
  const [h, m] = start.split(':').map(Number);
  const duration = SERVICE_DURATIONS[service];
  if (duration > 0) {
    const endMins = h*60+m+duration;
    document.getElementById('aEnd').value = window.Utils.minutesToTime(endMins);
  }
  // Auto-set default amount
  const defaults = { grooming: 850, swimming: 600, boarding: 0 };
  if (!document.getElementById('aAmount').value) {
    document.getElementById('aAmount').value = defaults[service] || '';
  }
}

// ─── Client Autocomplete ──────────────────────────────────────────
let autocompleteTimer;
async function clientSearch() {
  clearTimeout(autocompleteTimer);
  const q = document.getElementById('aClientName').value.trim();
  if (q.length < 2) { hideAutocomplete(); return; }
  autocompleteTimer = setTimeout(async () => {
    const results = await window.DB.searchClients(q);
    if (results.length === 0) { hideAutocomplete(); return; }
    document.getElementById('clientSuggestions').style.display = 'block';
    document.getElementById('clientSuggestions').innerHTML = results.map(c => `
      <div class="autocomplete-item" onmousedown="fillClient(${c.id})">
        <strong>${c.name}</strong> <span style="color:var(--muted);">· ${c.pet_name} (${c.pet_breed})</span>
        <span style="float:right;color:var(--muted);font-size:11px;">${c.phone}</span>
      </div>
    `).join('');
  }, 200);
}

function fillClient(id) {
  const c = SYNTHETIC.clients.find(x => x.id === id);
  if (!c) return;
  document.getElementById('aClientName').value = c.name;
  document.getElementById('aPetName').value = c.pet_name;
  document.getElementById('aPhone').value = c.phone || '';
  hideAutocomplete();
}

function hideAutocomplete() {
  setTimeout(() => {
    document.getElementById('clientSuggestions').style.display = 'none';
  }, 150);
}

async function saveAppointment() {
  const appt = {
    client_name: document.getElementById('aClientName').value.trim(),
    pet_name: document.getElementById('aPetName').value.trim(),
    service_type: document.getElementById('aService').value,
    date: document.getElementById('aDate').value,
    start_time: document.getElementById('aStart').value,
    end_time: document.getElementById('aEnd').value,
    notes: document.getElementById('aNotes').value.trim(),
    amount: parseFloat(document.getElementById('aAmount').value) || 0,
    payment_status: 'pending',
    // try to link client_id
    client_id: (() => {
      const n = document.getElementById('aClientName').value.trim().toLowerCase();
      const c = SYNTHETIC.clients.find(x => x.name.toLowerCase() === n);
      return c ? c.id : null;
    })()
  };
  if (!appt.client_name || !appt.pet_name || !appt.date || !appt.start_time) {
    window.Utils.toast('Fill in all required fields', 'error'); return;
  }
  const result = await window.DB.addAppointment(appt);
  if (result.error) {
    document.getElementById('conflictWarning').style.display = 'block';
    document.getElementById('conflictWarning').textContent = '⚠️ ' + result.error + '. Please choose a different time slot.';
    return;
  }
  closeAddModal();
  window.Utils.toast('Appointment booked!', 'success');
  if (appt.date === currentDate) loadAppointments();
}

// ─── Export PDF ───────────────────────────────────────────────────
async function exportDayPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  const appts = allAppointments.sort((a,b) => a.start_time.localeCompare(b.start_time));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text("Pawsome Resort — Appointments", 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(dateStr, 14, 26);
  doc.setTextColor(0);

  let y = 36;
  const headers = ['Time', 'Pet', 'Service', 'Client', 'Amount', 'Status', 'Payment'];
  const colW = [22, 28, 24, 38, 22, 24, 22];
  doc.setFillColor(40,40,40); doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  let x = 14;
  headers.forEach((h,i) => { doc.text(h, x+2, y+5); x+=colW[i]; });
  y += 10;
  doc.setTextColor(0); doc.setFont('helvetica','normal');
  appts.forEach(a => {
    let rx = 14;
    [a.start_time, a.pet_name, a.service_type, a.client_name, `Rs.${a.amount||0}`, a.status, a.payment_status].forEach((cell,i) => {
      doc.text(String(cell).substring(0,16), rx+2, y+5); rx+=colW[i];
    });
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Summary
  y += 8;
  const totalAmt = appts.reduce((s,a)=>s+(a.amount||0),0);
  const paidAmt = appts.filter(a=>a.payment_status==='paid').reduce((s,a)=>s+(a.amount||0),0);
  doc.setFont('helvetica','bold');
  doc.text(`Total: Rs.${totalAmt.toLocaleString('en-IN')}  |  Paid: Rs.${paidAmt.toLocaleString('en-IN')}  |  Pending: Rs.${(totalAmt-paidAmt).toLocaleString('en-IN')}`, 14, y+5);

  doc.save(`Appointments-${currentDate}.pdf`);
  window.Utils.toast('Exported as PDF!', 'success');
}

// ─── Init ─────────────────────────────────────────────────────────
loadAppointments();
