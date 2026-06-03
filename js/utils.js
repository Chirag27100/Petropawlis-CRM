// ─── UTILS ────────────────────────────────────────────────────────

window.Utils = {
  formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  },

  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  },

  getStatusBadge(status) {
    const map = {
      new: { label: 'New', class: 'badge-new' },
      contacted: { label: 'Contacted', class: 'badge-contacted' },
      qualified: { label: 'Qualified', class: 'badge-qualified' },
      lost: { label: 'Lost', class: 'badge-lost' },
      confirmed: { label: 'Confirmed', class: 'badge-confirmed' },
      pending: { label: 'Pending', class: 'badge-pending' },
      cancelled: { label: 'Cancelled', class: 'badge-cancelled' },
      completed: { label: 'Completed', class: 'badge-completed' },
      active: { label: 'Active', class: 'badge-active' },
      inactive: { label: 'Inactive', class: 'badge-inactive' },
      checkout_today: { label: 'Checkout Today', class: 'badge-checkout' },
    };
    const s = map[status] || { label: status, class: 'badge-default' };
    return `<span class="badge ${s.class}">${s.label}</span>`;
  },

  getServiceIcon(service) {
    const icons = { boarding: '🏠', grooming: '✂️', swimming: '🏊' };
    return icons[service] || '🐾';
  },

  toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
  },

  debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  },

  generateInvoicePDF(client, lineItems, paidStatus) {
    if (!window.jspdf) { this.toast('PDF library not available', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const fileName = `PawlidayInn-Invoice-${(client.name || 'Client').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.setTextColor(232, 168, 124);
    doc.text('Pawliday Inn', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
    doc.text('Premium Pet Resort · Bengaluru, Karnataka', 14, 27);
    doc.text('GSTIN: 29XXXXX0000X1ZX', 14, 33);
    doc.text('Invoice Date: ' + dateStr, 140, 20);
    doc.setDrawColor(232, 168, 124);
    doc.line(14, 37, 196, 37);

    // Bill To
    doc.setFillColor(25, 27, 34); doc.roundedRect(14, 42, 182, 30, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text('BILL TO', 20, 50);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255);
    doc.text(client.name || '—', 20, 57);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(180);
    const contactLine = [client.phone, client.email].filter(Boolean).join('  ·  ');
    doc.text(contactLine, 20, 63);
    const petLine = client.pet_name ? `Pet: ${client.pet_name}${client.pet_breed ? ' (' + client.pet_breed + ')' : ''}` : '';
    if (petLine) doc.text(petLine, 20, 69);
    doc.setTextColor(0);

    // Line items table
    let y = 82;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(50);
    doc.text('Service Details', 14, y); y += 6;

    const cols = ['Service', 'Date', 'Amount'];
    const colW = [100, 44, 38];
    doc.setFillColor(40, 40, 40); doc.setTextColor(255); doc.setFontSize(9);
    let cx = 14;
    cols.forEach((h, i) => { doc.text(h, cx + 2, y + 5); cx += colW[i]; });
    y += 10; doc.setTextColor(0); doc.setFont('helvetica', 'normal');

    let total = 0;
    (lineItems || []).forEach(item => {
      let rx = 14;
      const cells = [
        String(item.service || '').substring(0, 40),
        String(item.date || ''),
        'Rs.' + (item.amount || 0).toLocaleString('en-IN')
      ];
      cells.forEach((cell, i) => { doc.text(cell, rx + 2, y + 5); rx += colW[i]; });
      total += (item.amount || 0);
      y += 8;
      if (y > 260) { doc.addPage(); y = 20; }
    });

    // Total row
    y += 4;
    doc.setDrawColor(200); doc.line(14, y, 196, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Total', 14, y);
    doc.text('Rs.' + total.toLocaleString('en-IN'), 158, y);
    y += 8;
    const isPaid = paidStatus === 'paid';
    doc.setTextColor(isPaid ? [126, 200, 160] : [248, 81, 73]);
    doc.setFontSize(10);
    doc.text(isPaid ? '✓ PAID' : '⚠ PAYMENT PENDING', 14, y);
    doc.setTextColor(0);

    // Footer
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
    doc.text('Thank you for choosing Pawliday Inn 🐾  |  www.pawlidayinn.com', 14, 285);

    doc.save(fileName);
    this.toast('Invoice downloaded!', 'success');
  }
};
