# Pawsome Resort — Staff Portal

Full-featured internal CRM + operations portal for a pet resort.

## Features

### Dashboard
- Daily revenue summary: collected, pending, total
- Pending payments alert banner
- Boarding headcount + occupancy
- Revenue trend (6 months)
- Daily briefing link + WhatsApp update buttons
- Export day report as PDF

### Daily Briefing (`/dashboard/briefing.html`)
- Staff-first morning screen
- Dogs checking out today
- Appointments in next 2 hours
- 15-min swimming session alerts
- Boarding headcount (4 tiles)
- Send daily update / photo-video via WhatsApp (one tap per dog)

### Appointments
- Timeline view by date
- **Client name autocomplete** — type to autofill pet name, breed, phone
- **Bulk status update** — checkbox select → mark all complete or cancel
- **Book Again** button on any appointment — pre-fills all details
- **Pending Payments tab** — see all unpaid, mark paid in one click
- Swimming session 15-min notification highlight
- Export day's appointments as PDF

### Boarding
- Boarding cards with **one-tap Check Out** button
- Auto-calculates final bill on checkout
- **Payment status tracker** — unpaid alert banner + mark paid per card
- WhatsApp daily update button (pre-filled message)
- WhatsApp camera button (opens chat to attach photo/video)
- Send bill via WhatsApp on checkout
- Export boarding list as PDF
- Client autofill on check-in form

### Clients
- **Full bill visibility** inside client detail modal
- Appointment history + boarding history with payment status
- Outstanding balance highlighted
- **Send bill via WhatsApp** (pre-filled message)
- **Download bill as PDF** (formatted invoice)
- Video camera button links directly to WhatsApp

### Leads Pipeline
- Kanban-style pipeline

## Tech
- Vanilla JS + CSS (no framework)
- Supabase-ready (swap DEMO_MODE = false + fill credentials)
- jsPDF for PDF export
- WhatsApp deep links (wa.me)

## Setup
1. Open `index.html` in browser
2. PIN: `1234`
3. For real data: edit `js/supabase.js` → set SUPABASE_URL, SUPABASE_ANON_KEY, DEMO_MODE = false
