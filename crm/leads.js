// leads.js
window.Auth.requireAuth();
window.Layout.init('leads');

let allLeads = [];
let filteredLeads = [];

const STAGES = ['new', 'contacted', 'qualified', 'lost'];
const STAGE_LABELS = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', lost: 'Lost' };

async function loadLeads() {
  allLeads = await window.DB.getLeads();
  filteredLeads = [...allLeads];
  renderStats();
  renderPipeline();
  renderTable();
}

function renderStats() {
  const counts = { new: 0, contacted: 0, qualified: 0, lost: 0 };
  allLeads.forEach(l => counts[l.status]++);
  document.getElementById('leadStats').innerHTML = `
    <div class="stat-card blue"><div class="stat-label">New</div><div class="stat-value">${counts.new}</div><div class="stat-icon">🆕</div></div>
    <div class="stat-card accent"><div class="stat-label">Contacted</div><div class="stat-value">${counts.contacted}</div><div class="stat-icon">📞</div></div>
    <div class="stat-card green"><div class="stat-label">Qualified</div><div class="stat-value">${counts.qualified}</div><div class="stat-icon">✅</div></div>
    <div class="stat-card" style="--c:var(--red);"><div class="stat-label">Lost</div><div class="stat-value" style="color:var(--red);">${counts.lost}</div><div class="stat-icon">❌</div></div>
  `;
}

function renderPipeline() {
  document.getElementById('pipelineBoard').innerHTML = STAGES.map(stage => {
    const leads = filteredLeads.filter(l => l.status === stage);
    return `
      <div class="pipeline-col stage-${stage}">
        <div class="pipeline-col-header">
          ${STAGE_LABELS[stage]} <span class="count">${leads.length}</span>
        </div>
        <div class="pipeline-col-body">
          ${leads.length === 0 ? `<div style="text-align:center;padding:16px;font-size:12px;color:var(--muted);">No leads</div>` :
            leads.map(l => `
              <div class="lead-card" onclick="showLeadDetail(${l.id})">
                <div class="lead-card-name">${l.name}</div>
                <div class="lead-card-pet">🐾 ${l.pet_name} · ${l.pet_breed}</div>
                <div class="lead-card-service">${window.Utils.getServiceIcon(l.service_interest)} ${l.service_interest}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }).join('');
}

function renderTable() {
  document.getElementById('leadTableCount').textContent = `${filteredLeads.length} leads`;
  if (filteredLeads.length === 0) {
    document.getElementById('leadsTable').innerHTML = '<div class="empty-state"><div class="icon">🎯</div><p>No leads found</p></div>';
    return;
  }
  document.getElementById('leadsTable').innerHTML = `
    <table>
      <thead><tr>
        <th>Name</th><th>Pet</th><th>Service</th><th>Source</th><th>Status</th><th>Date</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${filteredLeads.map(l => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar">${l.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                <div>
                  <div style="font-weight:500;">${l.name}</div>
                  <div style="font-size:12px;color:var(--muted);">${l.phone}</div>
                </div>
              </div>
            </td>
            <td>${l.pet_name} <span style="color:var(--muted);font-size:12px;">· ${l.pet_breed}</span></td>
            <td>${window.Utils.getServiceIcon(l.service_interest)} ${l.service_interest}</td>
            <td style="color:var(--muted);font-size:13px;">${l.source.replace('_',' ')}</td>
            <td>${window.Utils.getStatusBadge(l.status)}</td>
            <td style="color:var(--muted);font-size:13px;">${window.Utils.formatDate(l.created_at)}</td>
            <td>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm" onclick="moveStage(${l.id},event)">Move ›</button>
                <button class="btn btn-ghost btn-sm" onclick="showLeadDetail(${l.id})">View</button>
                <button class="btn btn-ghost btn-sm" onclick="waLead(${l.id})" title="WhatsApp" style="color:#25D366;">💬</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function filterLeads() {
  const q = document.getElementById('leadSearch').value.toLowerCase();
  filteredLeads = allLeads.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.pet_name.toLowerCase().includes(q) ||
    l.service_interest.toLowerCase().includes(q) ||
    l.pet_breed.toLowerCase().includes(q)
  );
  renderPipeline();
  renderTable();
}

function moveStage(id, e) {
  e.stopPropagation();
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;
  const idx = STAGES.indexOf(lead.status);
  const nextStage = STAGES[(idx + 1) % STAGES.length];
  lead.status = nextStage;
  window.DB.updateLeadStatus(id, nextStage);
  window.Utils.toast(`Lead moved to ${STAGE_LABELS[nextStage]}`, 'success');
  filteredLeads = [...allLeads];
  renderStats();
  renderPipeline();
  renderTable();
}

function showLeadDetail(id) {
  const l = allLeads.find(x => x.id === id);
  if (!l) return;
  document.getElementById('leadModalTitle').textContent = l.name;
  document.getElementById('leadModalContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">PHONE</div><div>${l.phone}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">EMAIL</div><div style="font-size:13px;">${l.email}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">PET</div><div>${l.pet_name} · ${l.pet_breed}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">SERVICE</div><div>${window.Utils.getServiceIcon(l.service_interest)} ${l.service_interest}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">SOURCE</div><div style="color:var(--muted);">${l.source.replace('_',' ')}</div></div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">STATUS</div>${window.Utils.getStatusBadge(l.status)}</div>
    </div>
    ${l.notes ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;color:var(--text2);margin-bottom:16px;">${l.notes}</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${STAGES.filter(s => s !== l.status).map(s => `
        <button class="btn btn-ghost btn-sm" onclick="setStage(${l.id},'${s}')">Move to ${STAGE_LABELS[s]}</button>
      `).join('')}
      <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="convertToClient(${l.id})">Convert to Client</button>
    </div>
  `;
  document.getElementById('leadModal').classList.add('open');
}

function setStage(id, stage) {
  const lead = allLeads.find(l => l.id === id);
  if (lead) {
    lead.status = stage;
    window.DB.updateLeadStatus(id, stage);
  }
  closeLeadModal();
  filteredLeads = [...allLeads];
  renderStats(); renderPipeline(); renderTable();
  window.Utils.toast(`Lead moved to ${STAGE_LABELS[stage]}`, 'success');
}

function convertToClient(id) {
  closeLeadModal();
  window.Utils.toast('Lead converted to client!', 'success');
}

function closeLeadModal() { document.getElementById('leadModal').classList.remove('open'); }

async function waLead(id) {
  const l = allLeads.find(x => x.id === id);
  if (!l?.phone) return window.Utils.toast('No phone number', 'error');
  const msg = window.WA.templates.leadFollowup(l.name, l.pet_name, l.service_interest);
  await window.WA.send(l.phone, msg);
  if (l.status === 'new') {
    await window.DB.updateLeadStatus(l.id, 'contacted');
    l.status = 'contacted';
    filteredLeads = [...allLeads];
    renderStats(); renderPipeline(); renderTable();
    window.Utils.toast(`WhatsApp sent + moved to Contacted ✅`, 'success');
  } else {
    window.Utils.toast(`WhatsApp sent to ${l.name}`, 'success');
  }
}

function openAddLead() { document.getElementById('addLeadModal').classList.add('open'); }
function closeAddLead() { document.getElementById('addLeadModal').classList.remove('open'); }

async function saveLead() {
  const lead = {
    name: document.getElementById('lName').value.trim(),
    phone: document.getElementById('lPhone').value.trim(),
    email: document.getElementById('lEmail').value.trim(),
    pet_name: document.getElementById('lPetName').value.trim(),
    pet_breed: document.getElementById('lBreed').value.trim(),
    service_interest: document.getElementById('lService').value,
    source: document.getElementById('lSource').value,
    notes: document.getElementById('lNotes').value.trim(),
  };
  if (!lead.name || !lead.phone) { window.Utils.toast('Name and phone required', 'error'); return; }
  const newLead = await window.DB.addLead(lead);
  allLeads = await window.DB.getLeads();
  filteredLeads = [...allLeads];
  closeAddLead();
  window.Utils.toast('Lead added!', 'success');
  renderStats(); renderPipeline(); renderTable();
}

loadLeads();
