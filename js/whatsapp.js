// ─── WhatsApp Integration Module ────────────────────────────────────
window.WA = {
  API_URL: '',
  API_KEY: '',
  FROM_NUMBER: '',

  async send(toPhone, message) {
    if (!this.API_URL || !this.API_KEY) {
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/91${toPhone}?text=${encoded}`, '_blank');
      return { fallback: true };
    }
    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-maytapi-key': this.API_KEY },
        body: JSON.stringify({ to_number: `91${toPhone}`, type: 'text', message })
      });
      return await res.json();
    } catch (e) {
      window.Utils.toast('WhatsApp send failed', 'error');
      return { error: e.message };
    }
  },

  templates: {
    dailyUpdate: (petName, staffName = 'Team') =>
      `🐾 Hi! Daily update on *${petName}* from *Pawliday Inn*\n\n` +
      `Your pup is happy, healthy & well-fed today! 🌟\n` +
      `We'll send another update this evening.\n\n` +
      `Any questions? Reply here anytime 😊\n— ${staffName}, Pawliday Inn`,

    checkoutReminder: (petName, date, amount) =>
      `🏠 Reminder: *${petName}*'s checkout is scheduled for *${date}*.\n` +
      `Amount due: *₹${amount}*\n\n` +
      `Please arrive by 11 AM. See you soon! 🐶\n— Pawliday Inn`,

    appointmentConfirm: (petName, service, date, time) =>
      `✅ Appointment Confirmed!\n\n` +
      `*Pet:* ${petName}\n*Service:* ${service}\n*Date:* ${date}\n*Time:* ${time}\n\n` +
      `See you then! 🐾 — Pawliday Inn`,

    paymentReceipt: (clientName, petName, amount, service) =>
      `🧾 *Payment Receipt — Pawliday Inn*\n\n` +
      `Client: ${clientName}\nPet: ${petName}\nService: ${service}\n` +
      `Amount Paid: *₹${amount}*\nDate: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `Thank you! 🐾`,

    vaccinationReminder: (petName, vaccineName, dueDate) =>
      `💉 Vaccination Reminder!\n\n` +
      `*${petName}*'s *${vaccineName}* vaccine is due on *${dueDate}*.\n\n` +
      `Please consult your vet soon. 🏥\n— Pawliday Inn`,

    leadFollowup: (name, petName, service) =>
      `Hi ${name}! 👋 This is Pawliday Inn.\n\n` +
      `We noticed you were interested in *${service}* for *${petName}*.\n` +
      `We'd love to have you both visit! 🐾\n\n` +
      `Reply here to book or ask questions.`,

    bookingEnquiry: (name) =>
      `Hi ${name}! 👋 Thanks for reaching out to *Pawliday Inn*!\n\n` +
      `We offer premium *boarding*, *grooming*, and *swimming* for your pet.\n\n` +
      `Tell us:\n1. Your pet's name & breed?\n2. Which service are you interested in?\n3. Preferred dates?\n\nWe'll get back to you right away! 🐶`
  }
};

// Hydrate from localStorage
(function () {
  try {
    const cfg = JSON.parse(localStorage.getItem('WA_CONFIG') || '{}');
    window.WA.API_URL = cfg.api_url || '';
    window.WA.API_KEY = cfg.api_key || '';
    window.WA.FROM_NUMBER = cfg.from_number || '';
  } catch (_) {}
})();
