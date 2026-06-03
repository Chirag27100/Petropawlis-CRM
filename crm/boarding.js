window.Auth.requireAuth();
window.Layout.init('boarding');

const CAPACITY = 20;
let allBoarding = [];

async function loadBoarding() {
  allBoarding = await window.DB.getBoarding();
  renderStats();
  renderCapacity();
  renderPaymentAlert();
  renderCheckoutAlert();
  renderBoarders();
}

function renderStats() {
  const active = allBoarding.filter(b => b.status === 'active' || b.status === 'checkout_today');
  const checkoutToday = allBoarding.filter(b => b.status === 'checkout_today');
  const pendingPayment = allBoarding.filter(b => (b.status==='active'||b.status==='checkout_today') && b.payment_status!=='paid');
  const revenue = allBoarding.reduce((s, b) => s + (b.final_total||b.total||0), 0);
  document.getElementById('boardingStats').innerHTML = `
    <div class="stat-card accent"><div class="stat-label">Currently Boarding</div><div class="stat-value">${active.length}</div><div class="stat-sub">of ${CAPACITY} capacity</div><div class="stat-icon">🐕</div></div>
    <div class="stat-card green"><div class="stat-label">Available Slots</div><div class="stat-value">${CAPACITY-active.length}</div><div class="stat-icon">🏠</div></div>
    <div class="stat-card ${checkoutToday.length>0?'accent':'blue'}"><div class="stat-label">Checkout Today</div><div class="stat-value">${checkoutToday.length}</div><div class="stat-icon">📤</div></div>
    <div class="stat-card ${pendingPayment.length>0?'purple':'green'}"><div class="stat-label">Boarding Revenue</div><div class="stat-value" style="font-size:20px;">${window.Utils.formatCurrency(revenue)}</div><div class="stat-sub">${pendingPayment.length>0?`<span style="color:var(--red)">${pendingPayment.length} unpaid</span>`:' all paid'}</div><div class="stat-icon">💰</div></div>
  `;
}

function renderCapacity() {
  const active = allBoarding.filter(b => b.status==='active'||b.status==='checkout_today').length;
  const pct = Math.round(active/CAPACITY*100);
  const color = pct>85?'var(--red)':pct>60?'var(--yellow)':'var(--green)';
  document.getElementById('capacitySection').innerHTML = `
    <div class="cap-row">
      <span style="font-size:14px;">${active} dogs currently boarding</span>
      <span style="font-size:14px;font-weight:600;color:${color};">${pct}% full</span>
    </div>
    <div style="height:12px;background:var(--border2);border-radius:8px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:8px;transition:width 0.6s ease;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--muted);"><span>0</span><span>${CAPACITY} max</span></div>
    <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
      ${Array.from({length:CAPACITY},(_,i)=>`<div style="width:24px;height:24px;border-radius:4px;background:${i<active?color:'var(--border2)'};font-size:10px;display:flex;align-items:center;justify-content:center;">${i<active?'🐕':''}</div>`).join('')}
    </div>
  `;
}

function renderPaymentAlert() {
  const unpaid = allBoarding.filter(b => (b.status==='active'||b.status==='checkout_today') && b.payment_status!=='paid');
  const totalUnpaid = unpaid.reduce((s,b)=>s+(b.total||0),0);
  if (unpaid.length === 0) { document.getElementById('paymentAlert').innerHTML=''; return; }
  document.getElementById('paymentAlert').innerHTML = `
    <div style="background:var(--red-dim);border:1px solid var(--red);border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <span style="font-size:13px;color:var(--red);">💰 <strong>${unpaid.length} unpaid boarding</strong> — ${window.Utils.formatCurrency(totalUnpaid)} pending collection</span>
      <div style="display:flex;gap:8px;">
        ${unpaid.map(b=>`<button class="btn btn-ghost btn-sm" style="border-color:var(--red);color:var(--red);" onclick="markBoardingPaid(${b.id})">Mark ${b.pet_name} Paid</button>`).join('')}
      </div>
    </div>
  `;
}

function renderCheckoutAlert() {
  const checkouts = allBoarding.filter(b => b.status==='checkout_today');
  if (checkouts.length===0) { document.getElementById('checkoutAlert').innerHTML=''; return; }
  document.getElementById('checkoutAlert').innerHTML = `
    <div style="background:var(--yellow-dim);border:1px solid var(--yellow);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;color:var(--yellow);margin-bottom:8px;">⚠️ ${checkouts.length} Checkout${checkouts.length>1?'s':''} Today</div>
      ${checkouts.map(b=>`<div style="font-size:13px;color:var(--text2);display:flex;align-items:center;gap:12px;margin-bottom:4px;">🐕 ${b.pet_name} (${b.client_name}) — ${window.Utils.formatCurrency(b.total)} due <span style="color:${b.payment_status==='paid'?'var(--green)':'var(--red)'};">${b.payment_status==='paid'?'✓ Paid':'⚠ Unpaid'}</span></div>`).join('')}
    </div>
  `;
}

function renderBoarders() {
  const active = allBoarding.filter(b => b.status==='active'||b.status==='checkout_today');
  document.getElementById('boarderCount').textContent = `${active.length} dogs`;
  if (active.length===0) {
    document.getElementById('boardingGrid').innerHTML='<div class="empty-state"><div class="icon">🏠</div><p>No dogs currently boarding</p></div>';
    return;
  }
  document.getElementById('boardingGrid').innerHTML = active.map(b => {
    const checkout = new Date(b.checkout+'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const daysLeft = Math.ceil((checkout-today)/(1000*60*60*24));
    return `
      <div class="boarding-card ${b.status==='checkout_today'?'checkout':''}">
        <div class="dog-top">
          <span class="dog-icon">🐕</span>
          <div style="flex:1;">
            <div class="dog-name">${b.pet_name}</div>
            <div class="dog-breed">${b.breed}</div>
          </div>
          ${window.Utils.getStatusBadge(b.status)}
        </div>
        <div class="dog-meta">
          <div><div class="dog-meta-label">Owner</div><div class="dog-meta-value">${b.client_name}</div></div>
          <div><div class="dog-meta-label">Rate/Day</div><div class="dog-meta-value">${window.Utils.formatCurrency(b.rate_per_day)}</div></div>
          <div><div class="dog-meta-label">Check-in</div><div class="dog-meta-value">${window.Utils.formatDate(b.checkin)}</div></div>
          <div><div class="dog-meta-label">Check-out</div><div class="dog-meta-value" style="color:${b.status==='checkout_today'?'var(--yellow)':'inherit'}">${window.Utils.formatDate(b.checkout)}</div></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:10px;">
          <div style="font-size:13px;color:var(--muted);">${daysLeft>0?`${daysLeft} day${daysLeft>1?'s':''} left`:'Checkout today'}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:15px;font-weight:600;color:var(--accent);">${window.Utils.formatCurrency(b.total)}</div>
            <span class="${b.payment_status==='paid'?'paid-badge':'unpaid-badge'}">${b.payment_status==='paid'?'✓ Paid':'⚠ Unpaid'}</span>
          </div>
        </div>
        <div class="card-actions">
          ${b.status==='checkout_today'?`<button class="btn btn-primary btn-sm" onclick="openCheckout(${b.id})" style="flex:1;">📤 Check Out</button>`:''}
          ${b.payment_status!=='paid'?`<button class="btn btn-ghost btn-sm" onclick="markBoardingPaid(${b.id})">💰 Mark Paid</button>`:''}
          <button class="btn-wa" onclick="whatsappUpdate('${b.phone||''}','${b.pet_name}')">💬</button>
          <button class="btn-cam" onclick="whatsappCamera('${b.phone||''}','${b.pet_name}')">📹</button>
          <button class="btn btn-ghost btn-sm" onclick="generateBoardingInvoice(${b.id})" title="Generate Invoice">🧾</button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Checkout Flow ────────────────────────────────────────────────
function openCheckout(id) {
  const b = allBoarding.find(x=>x.id===id);
  if(!b) return;
  const cin = new Date(b.checkin+'T00:00:00');
  const cout = new Date(); cout.setHours(0,0,0,0);
  const actualDays = Math.max(1, Math.ceil((cout-cin)/(1000*60*60*24)));
  const finalTotal = actualDays * b.rate_per_day;
  document.getElementById('checkoutModalContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">DOG</div><div style="font-weight:600;">${b.pet_name}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">OWNER</div><div>${b.client_name}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">CHECK-IN</div><div>${window.Utils.formatDate(b.checkin)}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">TODAY</div><div>${window.Utils.formatDate(new Date().toISOString().split('T')[0])}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">RATE/DAY</div><div>${window.Utils.formatCurrency(b.rate_per_day)}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">ACTUAL DAYS</div><div>${actualDays}</div></div>
    </div>
    <div style="background:var(--accent-dim);border:1px solid var(--accent);border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
      <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">FINAL BILL</div>
      <div style="font-size:28px;font-weight:700;color:var(--accent);">${window.Utils.formatCurrency(finalTotal)}</div>
      <div style="font-size:12px;color:var(--muted);">${actualDays} day${actualDays>1?'s':''} × ${window.Utils.formatCurrency(b.rate_per_day)}</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeCheckoutModal()">Cancel</button>
      <button class="btn-wa" onclick="whatsappBill('${b.phone||''}','${b.pet_name}',${finalTotal})">💬 WhatsApp Bill</button>
      <button class="btn btn-primary" onclick="confirmCheckout(${b.id},${finalTotal})">✓ Confirm Check-Out</button>
    </div>
  `;
  document.getElementById('checkoutModal').classList.add('open');
}

async function confirmCheckout(id, finalTotal) {
  const b = allBoarding.find(x=>x.id===id);
  if(b) { b.status='checked_out'; b.payment_status='paid'; b.final_total=finalTotal; }
  closeCheckoutModal();
  window.Utils.toast('Check-out complete! Bill auto-calculated ✓', 'success');
  await loadBoarding();
}

function closeCheckoutModal() { document.getElementById('checkoutModal').classList.remove('open'); }

async function markBoardingPaid(id) {
  await window.DB.updateBoardingPayment(id, 'paid');
  const b = allBoarding.find(x=>x.id===id);
  if(b) b.payment_status='paid';
  window.Utils.toast('Payment recorded ✓', 'success');
  renderStats(); renderPaymentAlert(); renderCheckoutAlert(); renderBoarders();
}

// ─── WhatsApp ─────────────────────────────────────────────────────
async function whatsappUpdate(phone, petName) {
  if(!phone) return window.Utils.toast('No phone on file', 'error');
  const msg = window.WA.templates.dailyUpdate(petName);
  await window.WA.send(phone, msg);
  window.Utils.toast(`Daily update sent for ${petName} ✅`, 'success');
}

function whatsappCamera(phone, petName) {
  if(!phone) return window.Utils.toast('No phone on file', 'error');
  window.open(`https://wa.me/91${phone}`,'_blank');
  window.Utils.toast(`WhatsApp opened for ${petName} — attach your photo or video 📸`, 'success');
}

function whatsappBill(phone, petName, amount) {
  if(!phone) return window.Utils.toast('No phone on file', 'error');
  const msg = encodeURIComponent(`Hi! 🐾 ${petName}'s stay at Pawsome Resort is complete. Your final bill is ₹${amount.toLocaleString('en-IN')}. Thank you for choosing us — we hope to see ${petName} again! 🐕`);
  window.open(`https://wa.me/91${phone}?text=${msg}`,'_blank');
}

async function generateBoardingInvoice(id) {
  const b = allBoarding.find(x => x.id === id);
  if (!b) return;
  const clients = await window.DB.getClients();
  const client = clients.find(c => c.id === b.client_id) || { name: b.client_name, phone: b.phone, pet_name: b.pet_name, pet_breed: b.breed };
  const lineItems = [{ service: `Boarding (${b.checkin} → ${b.checkout}, ${b.days} days)`, date: b.checkin, amount: b.final_total || b.total }];
  window.Utils.generateInvoicePDF(client, lineItems, b.payment_status);
}

// ─── Export PDF ───────────────────────────────────────────────────
async function exportBoardingPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.text('Pawsome Resort — Boarding List', 14, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(120);
  doc.text(dateStr, 14, 26); doc.setTextColor(0);
  let y=36;
  const headers=['Dog','Breed','Owner','Check-in','Check-out','Rate/Day','Total','Status','Payment'];
  const colW=[22,24,30,22,24,18,18,24,18];
  doc.setFillColor(40,40,40); doc.setTextColor(255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
  let x=14; headers.forEach((h,i)=>{doc.text(h,x+2,y+5);x+=colW[i];}); y+=10;
  doc.setTextColor(0); doc.setFont('helvetica','normal');
  const active=allBoarding.filter(b=>b.status==='active'||b.status==='checkout_today');
  active.forEach(b=>{
    let rx=14;
    [b.pet_name,b.breed,b.client_name,b.checkin,b.checkout,`Rs.${b.rate_per_day}`,`Rs.${b.total}`,b.status,b.payment_status].forEach((cell,i)=>{
      doc.text(String(cell).substring(0,12),rx+2,y+5);rx+=colW[i];
    });
    y+=8; if(y>270){doc.addPage();y=20;}
  });
  doc.save(`Boarding-${new Date().toISOString().split('T')[0]}.pdf`);
  window.Utils.toast('Boarding list exported!','success');
}

// ─── Check-In Modal ───────────────────────────────────────────────
function openCheckin() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ciCheckin').value = today;
  document.getElementById('ciCheckout').value = '';
  document.getElementById('ciClient').value = '';
  document.getElementById('ciPet').value = '';
  document.getElementById('ciBreed').value = '';
  document.getElementById('ciPhone').value = '';
  document.getElementById('totalPreview').style.display = 'none';
  document.getElementById('checkinModal').classList.add('open');
}
function closeCheckin() { document.getElementById('checkinModal').classList.remove('open'); }

// Client autofill in check-in
let ciTimer;
async function ciClientSearch() {
  clearTimeout(ciTimer);
  const q = document.getElementById('ciClient').value.trim();
  if (q.length < 2) { hideCiAutocomplete(); return; }
  ciTimer = setTimeout(async () => {
    const results = await window.DB.searchClients(q);
    if (!results.length) { hideCiAutocomplete(); return; }
    document.getElementById('ciClientSuggestions').style.display = 'block';
    document.getElementById('ciClientSuggestions').innerHTML = results.map(c => `
      <div class="autocomplete-item" onmousedown="fillCiClient(${c.id})">
        <strong>${c.name}</strong> <span style="color:var(--muted);">· ${c.pet_name} (${c.pet_breed})</span>
        <span style="float:right;color:var(--muted);font-size:11px;">${c.phone}</span>
      </div>
    `).join('');
  }, 200);
}

function fillCiClient(id) {
  const c = SYNTHETIC.clients.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('ciClient').value = c.name;
  document.getElementById('ciPet').value = c.pet_name;
  document.getElementById('ciBreed').value = c.pet_breed;
  document.getElementById('ciPhone').value = c.phone||'';
  hideCiAutocomplete();
}

function hideCiAutocomplete() {
  setTimeout(()=>document.getElementById('ciClientSuggestions').style.display='none', 150);
}

function calcTotal() {
  const cin=document.getElementById('ciCheckin').value;
  const cout=document.getElementById('ciCheckout').value;
  const rate=parseFloat(document.getElementById('ciRate').value)||0;
  if(cin&&cout&&rate){
    const days=Math.ceil((new Date(cout)-new Date(cin))/(1000*60*60*24));
    if(days>0){
      const total=days*rate;
      document.getElementById('totalPreview').style.display='block';
      document.getElementById('totalPreview').textContent=`${days} day${days>1?'s':''} × ${window.Utils.formatCurrency(rate)} = ${window.Utils.formatCurrency(total)}`;
    }
  }
}

async function saveCheckin() {
  const cin=document.getElementById('ciCheckin').value;
  const cout=document.getElementById('ciCheckout').value;
  const rate=parseFloat(document.getElementById('ciRate').value)||0;
  const client=document.getElementById('ciClient').value.trim();
  const pet=document.getElementById('ciPet').value.trim();
  const breed=document.getElementById('ciBreed').value.trim();
  const phone=document.getElementById('ciPhone').value.trim();
  if(!client||!pet||!cin||!cout||!rate){window.Utils.toast('Fill all required fields','error');return;}
  const days=Math.ceil((new Date(cout)-new Date(cin))/(1000*60*60*24));
  const today=new Date().toISOString().split('T')[0];
  const matchClient = SYNTHETIC.clients.find(c=>c.name.toLowerCase()===client.toLowerCase());
  const newEntry={
    id:Date.now(), client_id: matchClient?.id||null,
    client_name:client, pet_name:pet, breed, phone,
    checkin:cin, checkout:cout, days, rate_per_day:rate, total:days*rate,
    status: cout===today?'checkout_today':'active', payment_status:'pending'
  };
  window.SYNTHETIC.boarding.push(newEntry);
  closeCheckin();
  window.Utils.toast(`${pet} checked in successfully!`,'success');
  await loadBoarding();
}

loadBoarding();
