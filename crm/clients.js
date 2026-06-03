window.Auth.requireAuth();
window.Layout.init('clients');

let allClients = [];
let filteredClients = [];
let viewMode = 'grid';

async function loadClients() {
  allClients = await window.DB.getClients();
  filteredClients = [...allClients];
  renderStats();
  renderClients();
}

function renderStats() {
  const active = allClients.filter(c => c.status === 'active').length;
  const totalLTV = allClients.reduce((s, c) => s + c.ltv, 0);
  const avgLTV = Math.round(totalLTV / allClients.length);
  const multiService = allClients.filter(c => c.active_services.length > 1).length;
  document.getElementById('clientStats').innerHTML = `
    <div class="stat-card green"><div class="stat-label">Active Clients</div><div class="stat-value">${active}</div><div class="stat-icon">👥</div></div>
    <div class="stat-card accent"><div class="stat-label">Total LTV</div><div class="stat-value" style="font-size:22px;">${window.Utils.formatCurrency(totalLTV)}</div><div class="stat-icon">💰</div></div>
    <div class="stat-card blue"><div class="stat-label">Avg LTV</div><div class="stat-value" style="font-size:22px;">${window.Utils.formatCurrency(avgLTV)}</div><div class="stat-icon">📊</div></div>
    <div class="stat-card purple"><div class="stat-label">Multi-Service</div><div class="stat-value">${multiService}</div><div class="stat-sub">Upsell opportunities</div><div class="stat-icon">⭐</div></div>
  `;
}

function renderClients() {
  if (filteredClients.length === 0) {
    document.getElementById('clientGrid').innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">👥</div><p>No clients found</p></div>';
    return;
  }
  if (viewMode === 'grid') {
    document.getElementById('clientGrid').style.display = 'grid';
    document.getElementById('clientGrid').innerHTML = filteredClients.map(c => `
      <div class="client-card" onclick="showClientDetail(${c.id})">
        <div class="client-card-top">
          <div class="avatar" style="width:44px;height:44px;font-size:15px;">${c.avatar}</div>
          <div class="client-card-info">
            <h3>${c.name}</h3>
            <p>🐾 ${c.pet_name} · ${c.pet_breed} · ${c.pet_age}yr</p>
          </div>
          ${window.Utils.getStatusBadge(c.status)}
        </div>
        <div class="client-services">
          ${c.active_services.map(s => `<span class="service-tag">${window.Utils.getServiceIcon(s)} ${s}</span>`).join('')}
        </div>
        ${(c.tags||[]).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${c.tags.map(t=>`<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--muted);">${t.replace(/_/g,' ')}</span>`).join('')}</div>` : ''}
        <div class="client-ltv">LTV: <strong>${window.Utils.formatCurrency(c.ltv)}</strong> · Since ${window.Utils.formatDate(c.joined_date)}</div>
      </div>
    `).join('');
  } else {
    document.getElementById('clientGrid').style.display = 'block';
    document.getElementById('clientGrid').innerHTML = `
      <div class="section-card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Pet</th><th>Services</th><th>LTV</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>
              ${filteredClients.map(c => `
                <tr onclick="showClientDetail(${c.id})" style="cursor:pointer;">
                  <td><div style="display:flex;align-items:center;gap:10px;"><div class="avatar">${c.avatar}</div><span style="font-weight:500;">${c.name}</span></div></td>
                  <td>${c.pet_name} <span style="color:var(--muted);font-size:12px;">· ${c.pet_breed}</span></td>
                  <td>${c.active_services.map(s => `${window.Utils.getServiceIcon(s)}`).join(' ')}</td>
                  <td style="color:var(--accent);font-weight:500;">${window.Utils.formatCurrency(c.ltv)}</td>
                  <td style="color:var(--muted);font-size:13px;">${window.Utils.formatDate(c.joined_date)}</td>
                  <td>${window.Utils.getStatusBadge(c.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

function filterClients() {
  const q = document.getElementById('clientSearch').value.toLowerCase();
  const svc = document.getElementById('serviceFilter').value;
  const tag = document.getElementById('tagFilter').value;
  filteredClients = allClients.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.pet_name.toLowerCase().includes(q) || c.pet_breed.toLowerCase().includes(q);
    const matchS = !svc || c.active_services.includes(svc);
    const matchT = !tag || (c.tags || []).includes(tag);
    return matchQ && matchS && matchT;
  });
  renderClients();
}

function toggleView() {
  viewMode = viewMode === 'grid' ? 'list' : 'grid';
  document.getElementById('viewToggle').textContent = viewMode === 'grid' ? '☰ List' : '⊞ Grid';
  renderClients();
}

async function showClientDetail(id) {
  const c = allClients.find(x => x.id === id);
  if (!c) return;

  // Fetch bills
  const bills = await window.DB.getClientBills(id);
  const apptTotal = bills.appointments.reduce((s,a) => s+(a.amount||0), 0);
  const boardTotal = bills.boarding.reduce((s,b) => s+(b.total||0), 0);
  const totalBill = apptTotal + boardTotal;
  const unpaidAppts = bills.appointments.filter(a => a.payment_status !== 'paid' && a.status !== 'cancelled');
  const unpaidBoarding = bills.boarding.filter(b => b.payment_status !== 'paid' && b.status !== 'checked_out');
  const totalUnpaid = unpaidAppts.reduce((s,a)=>s+(a.amount||0),0) + unpaidBoarding.reduce((s,b)=>s+(b.total||0),0);

  document.getElementById('clientModalTitle').textContent = c.name;
  document.getElementById('clientModalContent').innerHTML = `
    <!-- Profile -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);">
      <div class="avatar" style="width:52px;height:52px;font-size:18px;">${c.avatar}</div>
      <div>
        <div style="font-size:16px;font-weight:500;">${c.name}</div>
        <div style="font-size:13px;color:var(--muted);">${c.pet_name} · ${c.pet_breed} · ${c.pet_age} years old</div>
      </div>
      ${window.Utils.getStatusBadge(c.status)}
    </div>

    <!-- Contact Info -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">PHONE</div><div style="font-weight:500;">${c.phone}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">EMAIL</div><div style="font-size:13px;">${c.email}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">LTV</div><div style="color:var(--accent);font-family:var(--font-head);font-size:18px;">${window.Utils.formatCurrency(c.ltv)}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">MEMBER SINCE</div><div>${window.Utils.formatDate(c.joined_date)}</div></div>
    </div>

    <!-- Services -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">ACTIVE SERVICES</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${c.active_services.map(s => `<span style="padding:6px 14px;background:var(--accent-dim);border:1px solid var(--accent);border-radius:20px;font-size:13px;color:var(--accent);">${window.Utils.getServiceIcon(s)} ${s}</span>`).join('')}
      </div>
    </div>

    <!-- Tab Switcher -->
    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px;">
      <button id="tabBtnBilling" class="btn btn-ghost btn-sm" style="border-color:var(--accent);color:var(--accent);" onclick="switchClientTab('billing')">💳 Billing</button>
      <button id="tabBtnHealth" class="btn btn-ghost btn-sm" onclick="switchClientTab('health')">🏥 Health</button>
    </div>

    <!-- Health Tab -->
    <div id="tabHealth" style="display:none;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="background:var(--accent-dim);border:1px solid var(--accent);color:var(--accent);padding:4px 12px;border-radius:20px;font-size:13px;">⚖️ ${c.weight_kg || '—'} kg</span>
        ${c.pet_dob ? `<span style="background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:4px 12px;border-radius:20px;font-size:12px;">🎂 Born ${window.Utils.formatDate(c.pet_dob)}</span>` : ''}
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Vaccinations</div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:var(--bg);">
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:500;font-size:11px;">Name</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:500;font-size:11px;">Given</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:500;font-size:11px;">Next Due</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:500;font-size:11px;">Status</th>
            </tr></thead>
            <tbody>
              ${(c.vaccinations || []).map(v => {
                const today = new Date(); today.setHours(0,0,0,0);
                const due = new Date(v.next_due + 'T00:00:00');
                const diff = Math.ceil((due - today) / (1000*60*60*24));
                const statusHtml = diff < 0 ? '<span style="color:var(--red);">🔴 Overdue</span>' : diff <= 30 ? '<span style="color:var(--yellow);">⚠️ Due soon</span>' : '<span style="color:var(--green);">✅ OK</span>';
                return `<tr style="border-top:1px solid var(--border);">
                  <td style="padding:8px 12px;font-weight:500;">${v.name}</td>
                  <td style="padding:8px 12px;color:var(--muted);">${window.Utils.formatDate(v.date)}</td>
                  <td style="padding:8px 12px;">${window.Utils.formatDate(v.next_due)}</td>
                  <td style="padding:8px 12px;">${statusHtml}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Medical Notes</div>
        <textarea id="medNotesArea" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:13px;color:var(--text);resize:vertical;min-height:64px;font-family:inherit;" onblur="saveMedNotes(${c.id})">${c.medical_notes || ''}</textarea>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Vet Contact</div>
        <div style="font-size:14px;font-weight:500;">${c.vet_name || '—'}</div>
        ${c.vet_phone ? `<div style="font-size:13px;color:var(--muted);margin-top:3px;">📞 ${c.vet_phone}</div>` : ''}
      </div>
    </div>

    <!-- Billing Tab -->
    <div id="tabBilling">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px;">
      <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Bill Summary</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
        <div style="text-align:center;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Appointments</div>
          <div style="font-weight:600;color:var(--green);">${window.Utils.formatCurrency(apptTotal)}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Boarding</div>
          <div style="font-weight:600;color:var(--teal);">${window.Utils.formatCurrency(boardTotal)}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Outstanding</div>
          <div style="font-weight:600;color:${totalUnpaid>0?'var(--red)':'var(--green)'};">${window.Utils.formatCurrency(totalUnpaid)}</div>
        </div>
      </div>

      <!-- Appointment bills -->
      ${bills.appointments.length > 0 ? `
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Appointments</div>
        ${bills.appointments.map(a => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span>${window.Utils.getServiceIcon(a.service_type)} ${a.service_type} · ${a.date}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:500;">${window.Utils.formatCurrency(a.amount||0)}</span>
              <span style="font-size:11px;color:${a.payment_status==='paid'?'var(--green)':'var(--red)'};">${a.payment_status==='paid'?'✓ Paid':'⚠ Unpaid'}</span>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- Boarding bills -->
      ${bills.boarding.length > 0 ? `
        <div style="font-size:11px;color:var(--muted);margin:10px 0 6px;text-transform:uppercase;letter-spacing:1px;">Boarding</div>
        ${bills.boarding.map(b => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span>🏠 ${b.checkin} → ${b.checkout} (${b.days}d)</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:500;">${window.Utils.formatCurrency(b.total)}</span>
              <span style="font-size:11px;color:${b.payment_status==='paid'?'var(--green)':'var(--red)'};">${b.payment_status==='paid'?'✓ Paid':'⚠ Unpaid'}</span>
            </div>
          </div>
        `).join('')}
      ` : ''}
    </div>

    <!-- Actions -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
      <button class="btn btn-ghost btn-sm" onclick="whatsappBillPDF('${c.phone}','${c.name}','${c.pet_name}',${totalUnpaid})">💬 Send Bill via WhatsApp</button>
      <button class="btn btn-ghost btn-sm" onclick="exportClientBillPDF(${c.id})">📥 Download Bill PDF</button>
      <button class="btn btn-ghost btn-sm" onclick="generateClientInvoice(${c.id})">🧾 Full Invoice</button>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='../appointments/appointments.html'">Book Appointment</button>
    </div>
    </div>
  `;
  document.getElementById('clientModal').classList.add('open');
  // Store for PDF export
  window._currentClientBills = { client: c, bills, apptTotal, boardTotal, totalUnpaid };
}

function whatsappBillPDF(phone, clientName, petName, outstanding) {
  if (!phone) return window.Utils.toast('No phone number', 'error');
  const msg = encodeURIComponent(`Hi ${clientName}! 🐾 Here's a quick bill summary for ${petName} at Pawsome Resort.\n\nOutstanding balance: ₹${outstanding.toLocaleString('en-IN')}\n\nPlease let us know if you have any questions. Thank you! 🙏`);
  window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  window.Utils.toast('Bill summary sent via WhatsApp!', 'success');
}

async function exportClientBillPDF(clientId) {
  if (!window._currentClientBills) return;
  const { jsPDF } = window.jspdf;
  const { client: c, bills, apptTotal, boardTotal, totalUnpaid } = window._currentClientBills;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'});

  // Header
  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Pawsome Resort', 14, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(120);
  doc.text('Client Bill — Generated ' + dateStr, 14, 26);
  doc.setTextColor(0);

  // Client info box
  doc.setFillColor(25, 27, 34); doc.roundedRect(14, 32, 182, 28, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(232,168,124);
  doc.text(c.name, 20, 42);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(200);
  doc.text(`Pet: ${c.pet_name} (${c.pet_breed})  |  Phone: ${c.phone}  |  Email: ${c.email}`, 20, 51);
  doc.setTextColor(0);

  let y = 70;

  // Summary
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  doc.text('Bill Summary', 14, y); y += 8;
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(`Appointments Total:  Rs. ${apptTotal.toLocaleString('en-IN')}`, 14, y); y += 7;
  doc.text(`Boarding Total:      Rs. ${boardTotal.toLocaleString('en-IN')}`, 14, y); y += 7;
  doc.text(`Grand Total:         Rs. ${(apptTotal+boardTotal).toLocaleString('en-IN')}`, 14, y); y += 7;
  doc.setTextColor(totalUnpaid > 0 ? [248,81,73] : [126,200,160]);
  doc.setFont('helvetica','bold');
  doc.text(`Outstanding:         Rs. ${totalUnpaid.toLocaleString('en-IN')}`, 14, y);
  doc.setTextColor(0); doc.setFont('helvetica','normal'); y += 12;

  // Appointment details
  if (bills.appointments.length > 0) {
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('Appointments', 14, y); y += 8;
    const ah = ['Date','Service','Status','Amount','Payment'];
    const aw = [30,30,30,28,28];
    doc.setFillColor(40,40,40); doc.setTextColor(255); doc.setFontSize(9);
    let ax=14; ah.forEach((h,i)=>{doc.text(h,ax+2,y+5);ax+=aw[i];}); y+=10;
    doc.setTextColor(0);
    bills.appointments.forEach(a=>{
      let rx=14;
      [a.date,a.service_type,a.status,`Rs.${a.amount||0}`,a.payment_status].forEach((cell,i)=>{
        doc.text(String(cell).substring(0,14),rx+2,y+5);rx+=aw[i];
      });
      y+=8; if(y>265){doc.addPage();y=20;}
    });
    y += 4;
  }

  // Boarding details
  if (bills.boarding.length > 0) {
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('Boarding', 14, y); y += 8;
    const bh = ['Check-in','Check-out','Days','Rate/Day','Total','Payment'];
    const bw = [28,28,16,22,24,28];
    doc.setFillColor(40,40,40); doc.setTextColor(255); doc.setFontSize(9);
    let bx=14; bh.forEach((h,i)=>{doc.text(h,bx+2,y+5);bx+=bw[i];}); y+=10;
    doc.setTextColor(0);
    bills.boarding.forEach(b=>{
      let rx=14;
      [b.checkin,b.checkout,String(b.days),`Rs.${b.rate_per_day}`,`Rs.${b.total}`,b.payment_status].forEach((cell,i)=>{
        doc.text(String(cell),rx+2,y+5);rx+=bw[i];
      });
      y+=8; if(y>265){doc.addPage();y=20;}
    });
  }

  // Footer
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text('Thank you for choosing Pawsome Resort 🐾', 14, 285);

  doc.save(`Bill-${c.name.replace(/\s+/g,'-')}.pdf`);
  window.Utils.toast('Bill PDF downloaded!', 'success');
}

function closeClientModal() { document.getElementById('clientModal').classList.remove('open'); }

function switchClientTab(tab) {
  document.getElementById('tabBilling').style.display = tab === 'billing' ? '' : 'none';
  document.getElementById('tabHealth').style.display = tab === 'health' ? '' : 'none';
  document.getElementById('tabBtnBilling').style.borderColor = tab === 'billing' ? 'var(--accent)' : 'var(--border)';
  document.getElementById('tabBtnBilling').style.color = tab === 'billing' ? 'var(--accent)' : 'var(--text2)';
  document.getElementById('tabBtnHealth').style.borderColor = tab === 'health' ? 'var(--accent)' : 'var(--border)';
  document.getElementById('tabBtnHealth').style.color = tab === 'health' ? 'var(--accent)' : 'var(--text2)';
}

async function saveMedNotes(id) {
  const val = document.getElementById('medNotesArea')?.value;
  if (val === undefined) return;
  await window.DB.updateClientHealth(id, { medical_notes: val });
  window.Utils.toast('Medical notes saved', 'success');
}

async function generateClientInvoice(id) {
  const c = allClients.find(x => x.id === id);
  if (!c) return;
  const bills = await window.DB.getClientBills(id);
  const lineItems = [
    ...bills.appointments.map(a => ({ service: `${a.service_type} (${a.date})`, date: a.date, amount: a.amount || 0 })),
    ...bills.boarding.map(b => ({ service: `Boarding ${b.checkin}→${b.checkout}`, date: b.checkin, amount: b.total || 0 }))
  ];
  const allPaid = [...bills.appointments, ...bills.boarding].every(x => x.payment_status === 'paid');
  window.Utils.generateInvoicePDF(c, lineItems, allPaid ? 'paid' : 'pending');
}

async function segmentBlast(tag) {
  const targets = allClients.filter(c => (c.tags || []).includes(tag) && c.phone);
  if (targets.length === 0) { window.Utils.toast('No clients with tag: ' + tag, 'error'); return; }
  if (!confirm(`Send WhatsApp to ${targets.length} ${tag.replace(/_/g,' ')} clients?`)) return;
  for (const c of targets) {
    const msg = window.WA.templates.bookingEnquiry(c.name);
    await window.WA.send(c.phone, msg);
  }
  window.Utils.toast(`Sent to ${targets.length} clients ✅`, 'success');
}

loadClients();
