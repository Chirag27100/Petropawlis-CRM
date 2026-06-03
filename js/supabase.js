// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const DEMO_MODE = true;

const SYNTHETIC = {
  leads: [
    { id: 1, name: 'Priya Sharma', phone: '9845012345', email: 'priya@gmail.com', pet_name: 'Bruno', pet_breed: 'Labrador', service_interest: 'boarding', source: 'website_chat', status: 'new', notes: 'Needs boarding for 5 days next week', created_at: '2025-04-20T09:15:00' },
    { id: 2, name: 'Rahul Menon', phone: '9731234567', email: 'rahul.m@yahoo.com', pet_name: 'Coco', pet_breed: 'Golden Retriever', service_interest: 'grooming', source: 'website_chat', status: 'contacted', notes: 'Interested in full grooming package', created_at: '2025-04-21T11:30:00' },
    { id: 3, name: 'Anjali Nair', phone: '8056789012', email: 'anjali.n@gmail.com', pet_name: 'Max', pet_breed: 'Beagle', service_interest: 'swimming', source: 'referral', status: 'qualified', notes: 'Dog is hyperactive, vet recommended swimming', created_at: '2025-04-22T14:00:00' },
    { id: 4, name: 'Kiran Reddy', phone: '9900123456', email: 'kiran.r@gmail.com', pet_name: 'Luna', pet_breed: 'Poodle', service_interest: 'grooming', source: 'instagram', status: 'new', notes: 'Wants monthly grooming subscription', created_at: '2025-04-23T10:00:00' },
    { id: 5, name: 'Deepak Iyer', phone: '9123456789', email: 'deepak.i@gmail.com', pet_name: 'Rocky', pet_breed: 'German Shepherd', service_interest: 'boarding', source: 'website_chat', status: 'lost', notes: 'Went with competitor', created_at: '2025-04-18T08:00:00' },
    { id: 6, name: 'Meera Pillai', phone: '9876543210', email: 'meera.p@gmail.com', pet_name: 'Daisy', pet_breed: 'Shih Tzu', service_interest: 'swimming', source: 'google', status: 'qualified', notes: 'Looking for weekend slots', created_at: '2025-04-24T16:00:00' },
  ],
  clients: [
    { id: 1, name: 'Suresh Kumar', phone: '9845099001', email: 'suresh.k@gmail.com', pet_name: 'Buddy', pet_breed: 'Labrador', pet_age: 3, active_services: ['boarding', 'grooming'], ltv: 18500, joined_date: '2024-10-01', status: 'active', avatar: 'SK', pet_dob: '2022-03-15', vaccinations: [{ name: 'Rabies', date: '2024-11-01', next_due: '2025-11-01' }, { name: 'DHPPiL', date: '2024-08-15', next_due: '2025-08-15' }], medical_notes: 'Allergic to chicken-based food', vet_name: 'Dr. Ravi Shankar', vet_phone: '9876543210', weight_kg: 28, tags: ['vip', 'boarding_regular'] },
    { id: 2, name: 'Lakshmi Rao', phone: '9731099002', email: 'lakshmi.r@gmail.com', pet_name: 'Bella', pet_breed: 'Golden Retriever', pet_age: 2, active_services: ['grooming'], ltv: 7200, joined_date: '2024-12-15', status: 'active', avatar: 'LR', pet_dob: '2023-06-20', vaccinations: [{ name: 'Rabies', date: '2024-06-20', next_due: '2025-06-20' }, { name: 'DHPPiL', date: '2024-06-20', next_due: '2025-06-20' }], medical_notes: 'No known allergies', vet_name: 'Dr. Priya Nair', vet_phone: '9845123456', weight_kg: 24, tags: ['grooming_regular'] },
    { id: 3, name: 'Arun Krishnan', phone: '8056099003', email: 'arun.k@gmail.com', pet_name: 'Tiger', pet_breed: 'Rottweiler', pet_age: 5, active_services: ['boarding', 'swimming'], ltv: 24000, joined_date: '2024-08-20', status: 'active', avatar: 'AK', pet_dob: '2020-01-10', vaccinations: [{ name: 'Rabies', date: '2024-01-10', next_due: '2025-01-10' }, { name: 'DHPPiL', date: '2023-12-01', next_due: '2024-12-01' }], medical_notes: 'Hip dysplasia — avoid hard floor surfaces', vet_name: 'Dr. Ravi Shankar', vet_phone: '9876543210', weight_kg: 48, tags: ['vip', 'high_ltv', 'boarding_regular'] },
    { id: 4, name: 'Pooja Menon', phone: '9900099004', email: 'pooja.m@gmail.com', pet_name: 'Mochi', pet_breed: 'Pomeranian', pet_age: 1, active_services: ['grooming', 'swimming'], ltv: 9800, joined_date: '2025-01-10', status: 'active', avatar: 'PM', pet_dob: '2024-05-05', vaccinations: [{ name: 'Rabies', date: '2025-05-05', next_due: '2026-05-05' }, { name: 'DHPPiL', date: '2025-03-01', next_due: '2026-03-01' }], medical_notes: 'Very anxious around loud noises', vet_name: 'Dr. Anita Varma', vet_phone: '9900112233', weight_kg: 3, tags: ['new_client', 'grooming_regular'] },
    { id: 5, name: 'Vijay Nambiar', phone: '9123099005', email: 'vijay.n@gmail.com', pet_name: 'Rex', pet_breed: 'Doberman', pet_age: 4, active_services: ['boarding'], ltv: 31000, joined_date: '2024-06-01', status: 'active', avatar: 'VN', pet_dob: '2021-09-12', vaccinations: [{ name: 'Rabies', date: '2024-09-12', next_due: '2025-09-12' }, { name: 'DHPPiL', date: '2024-07-01', next_due: '2025-07-01' }], medical_notes: 'On daily joint supplement — Flexadin', vet_name: 'Dr. Suresh Pillai', vet_phone: '9123456780', weight_kg: 36, tags: ['high_ltv', 'boarding_regular'] },
    { id: 6, name: 'Sneha Pillai', phone: '9876099006', email: 'sneha.p@gmail.com', pet_name: 'Lulu', pet_breed: 'Maltese', pet_age: 2, active_services: ['grooming'], ltv: 5400, joined_date: '2025-02-20', status: 'inactive', avatar: 'SP', pet_dob: '2023-11-30', vaccinations: [{ name: 'Rabies', date: '2024-11-30', next_due: '2025-11-30' }, { name: 'DHPPiL', date: '2024-10-01', next_due: '2025-10-01' }], medical_notes: 'No known allergies', vet_name: 'Dr. Priya Nair', vet_phone: '9845123456', weight_kg: 4, tags: ['at_risk'] },
  ],
  appointments: [
    { id: 1, client_id: 1, client_name: 'Suresh Kumar', pet_name: 'Buddy', service_type: 'grooming', date: getTodayStr(), start_time: '09:00', end_time: '10:30', status: 'completed', notes: 'Full bath + haircut', payment_status: 'paid', amount: 850 },
    { id: 2, client_id: 3, client_name: 'Arun Krishnan', pet_name: 'Tiger', service_type: 'swimming', date: getTodayStr(), start_time: '11:00', end_time: '12:00', status: 'confirmed', notes: 'Hydrotherapy session', payment_status: 'pending', amount: 600 },
    { id: 3, client_id: 2, client_name: 'Lakshmi Rao', pet_name: 'Bella', service_type: 'grooming', date: getTodayStr(), start_time: '14:00', end_time: '15:30', status: 'pending', notes: 'Just trim', payment_status: 'pending', amount: 700 },
    { id: 4, client_id: 4, client_name: 'Pooja Menon', pet_name: 'Mochi', service_type: 'swimming', date: getTodayStr(), start_time: '16:00', end_time: '17:00', status: 'confirmed', notes: '', payment_status: 'pending', amount: 600 },
    { id: 5, client_id: 5, client_name: 'Vijay Nambiar', pet_name: 'Rex', service_type: 'boarding', date: getTodayStr(), start_time: '10:00', end_time: '10:00', status: 'confirmed', notes: 'Check-in for 3 days', payment_status: 'pending', amount: 3000 },
    { id: 6, client_id: 1, client_name: 'Suresh Kumar', pet_name: 'Buddy', service_type: 'grooming', date: getTomorrowStr(), start_time: '10:00', end_time: '11:30', status: 'confirmed', notes: '', payment_status: 'pending', amount: 850 },
    { id: 7, client_id: 3, client_name: 'Arun Krishnan', pet_name: 'Tiger', service_type: 'swimming', date: getTodayStr(), start_time: '09:30', end_time: '10:30', status: 'completed', notes: 'Morning session', payment_status: 'paid', amount: 600 },
  ],
  boarding: [
    { id: 1, client_id: 1, client_name: 'Suresh Kumar', pet_name: 'Buddy', breed: 'Labrador', phone: '9845099001', checkin: getPastDateStr(3), checkout: getTodayStr(), days: 4, rate_per_day: 800, total: 3200, status: 'checkout_today', payment_status: 'pending' },
    { id: 2, client_id: 3, client_name: 'Arun Krishnan', pet_name: 'Tiger', breed: 'Rottweiler', phone: '8056099003', checkin: getPastDateStr(2), checkout: getFutureDateStr(2), days: 4, rate_per_day: 1000, total: 4000, status: 'active', payment_status: 'pending' },
    { id: 3, client_id: 5, client_name: 'Vijay Nambiar', pet_name: 'Rex', breed: 'Doberman', phone: '9123099005', checkin: getPastDateStr(1), checkout: getFutureDateStr(3), days: 4, rate_per_day: 1000, total: 4000, status: 'active', payment_status: 'pending' },
    { id: 4, client_id: 6, client_name: 'Sneha Pillai', pet_name: 'Lulu', breed: 'Maltese', phone: '9876099006', checkin: getPastDateStr(5), checkout: getTodayStr(), days: 5, rate_per_day: 700, total: 3500, status: 'checkout_today', payment_status: 'pending' },
    { id: 5, client_id: 2, client_name: 'Lakshmi Rao', pet_name: 'Bella', breed: 'Golden Retriever', phone: '9731099002', checkin: getPastDateStr(1), checkout: getFutureDateStr(4), days: 5, rate_per_day: 900, total: 4500, status: 'active', payment_status: 'paid' },
  ],
  revenue: {
    today: 12600, this_week: 42000, this_month: 168000, last_month: 145000, pending_today: 5950,
    by_service: { boarding: 89000, grooming: 52000, swimming: 27000 },
    monthly: [
      { month: 'Nov', amount: 98000 }, { month: 'Dec', amount: 125000 },
      { month: 'Jan', amount: 110000 }, { month: 'Feb', amount: 132000 },
      { month: 'Mar', amount: 145000 }, { month: 'Apr', amount: 168000 },
    ]
  },
  settings: { resort_name: 'Pawsome Resort', boarding_capacity: 20, pin: '1234' }
};

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getTomorrowStr() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function getFutureDateStr(days) { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; }
function getPastDateStr(days) { const d = new Date(); d.setDate(d.getDate()-days); return d.toISOString().split('T')[0]; }

window.DB = {
  async getLeads() { return [...SYNTHETIC.leads]; },
  async getClients() { return [...SYNTHETIC.clients]; },
  async getAppointments(date) {
    if (date) return SYNTHETIC.appointments.filter(a=>a.date===date).map(a=>({...a}));
    return SYNTHETIC.appointments.map(a=>({...a}));
  },
  async getBoarding() { return SYNTHETIC.boarding.map(b=>({...b})); },
  async getRevenue() { return JSON.parse(JSON.stringify(SYNTHETIC.revenue)); },
  async getSettings() { return {...SYNTHETIC.settings}; },

  async searchClients(query) {
    const q = query.toLowerCase();
    return SYNTHETIC.clients.filter(c => c.name.toLowerCase().includes(q) || c.pet_name.toLowerCase().includes(q));
  },

  async addLead(lead) {
    const n = {...lead, id: Date.now(), created_at: new Date().toISOString(), status: 'new'};
    SYNTHETIC.leads.unshift(n); return n;
  },
  async updateLeadStatus(id, status) {
    const l = SYNTHETIC.leads.find(x=>x.id===id); if(l) l.status=status; return l;
  },
  async addAppointment(appt) {
    const conflicts = SYNTHETIC.appointments.filter(a =>
      a.date===appt.date && a.service_type===appt.service_type && a.service_type!=='boarding' &&
      a.status!=='cancelled' &&
      ((appt.start_time>=a.start_time&&appt.start_time<a.end_time)||(appt.end_time>a.start_time&&appt.end_time<=a.end_time))
    );
    if(conflicts.length>0) return {error:'Time slot conflict for this service'};
    const n = {...appt, id: Date.now(), status:'pending', payment_status: appt.payment_status||'pending', amount: appt.amount||0};
    SYNTHETIC.appointments.push(n); return n;
  },
  async updateAppointmentStatus(id, status) {
    const a = SYNTHETIC.appointments.find(x=>x.id===id); if(a) a.status=status; return a;
  },
  async updateAppointmentPayment(id, ps) {
    const a = SYNTHETIC.appointments.find(x=>x.id===id); if(a) a.payment_status=ps; return a;
  },
  async bulkUpdateAppointmentStatus(ids, status) {
    ids.forEach(id=>{ const a=SYNTHETIC.appointments.find(x=>x.id===id); if(a) a.status=status; });
    return {updated: ids.length};
  },
  async checkoutBoarding(id) {
    const b = SYNTHETIC.boarding.find(x=>x.id===id);
    if(b) {
      b.status='checked_out'; b.payment_status='paid';
      const cin = new Date(b.checkin+'T00:00:00');
      b.actual_days = Math.max(1, Math.ceil((new Date()-cin)/(1000*60*60*24)));
      b.final_total = b.actual_days * b.rate_per_day;
    }
    return b;
  },
  async updateBoardingPayment(id, ps) {
    const b = SYNTHETIC.boarding.find(x=>x.id===id); if(b) b.payment_status=ps; return b;
  },
  async getClientBills(clientId) {
    return {
      appointments: SYNTHETIC.appointments.filter(a=>a.client_id===clientId),
      boarding: SYNTHETIC.boarding.filter(b=>b.client_id===clientId)
    };
  },
  async checkPin(pin) { return pin===SYNTHETIC.settings.pin; },

  async updateClientHealth(id, healthData) {
    const c = SYNTHETIC.clients.find(x => x.id === id);
    if (c) Object.assign(c, healthData);
    return c;
  },

  async getVaccinationsDueSoon(days = 30) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + days);
    const results = [];
    SYNTHETIC.clients.forEach(c => {
      (c.vaccinations || []).forEach(v => {
        const due = new Date(v.next_due + 'T00:00:00');
        if (due >= now && due <= cutoff) {
          results.push({ client_id: c.id, client_name: c.name, pet_name: c.pet_name, phone: c.phone, vac_name: v.name, next_due: v.next_due });
        }
      });
    });
    return results;
  }
};

window.SYNTHETIC = SYNTHETIC;
