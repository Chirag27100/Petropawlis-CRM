window.Auth.requireAuth();
window.Layout.init('settings', '../');

function loadSettings() {
  const cfg = JSON.parse(localStorage.getItem('WA_CONFIG') || '{}');
  document.getElementById('waApiUrl').value = cfg.api_url || '';
  document.getElementById('waApiKey').value = cfg.api_key || '';
  document.getElementById('waFromNumber').value = cfg.from_number || '';

  const res = JSON.parse(localStorage.getItem('RESORT_CONFIG') || '{}');
  document.getElementById('resortName').value = res.resort_name || 'Pawliday Inn';
  document.getElementById('resortAddress').value = res.resort_address || '';
  document.getElementById('boardingCapacity').value = res.boarding_capacity || 20;

  const notif = JSON.parse(localStorage.getItem('NOTIF_CONFIG') || '{}');
  document.getElementById('autoCheckoutReminder').checked = notif.auto_checkout_reminder !== false;
  document.getElementById('autoApptConfirm').checked = notif.auto_appt_confirm !== false;
}

function saveWAConfig() {
  const cfg = {
    api_url: document.getElementById('waApiUrl').value.trim(),
    api_key: document.getElementById('waApiKey').value.trim(),
    from_number: document.getElementById('waFromNumber').value.trim()
  };
  localStorage.setItem('WA_CONFIG', JSON.stringify(cfg));
  if (window.WA) {
    window.WA.API_URL = cfg.api_url;
    window.WA.API_KEY = cfg.api_key;
    window.WA.FROM_NUMBER = cfg.from_number;
  }
  window.Utils.toast('WhatsApp config saved ✅', 'success');
}

async function testWASend() {
  const phone = document.getElementById('waTestPhone').value.trim();
  if (!phone) return window.Utils.toast('Enter a test phone number', 'error');
  const msg = '🐾 Test message from Pawliday Inn CRM. WhatsApp integration is working!';
  const result = await window.WA.send(phone, msg);
  if (result?.fallback) {
    window.Utils.toast('No API configured — opened wa.me fallback', 'success');
  } else if (result?.error) {
    window.Utils.toast('Send failed: ' + result.error, 'error');
  } else {
    window.Utils.toast('Test message sent ✅', 'success');
  }
}

function saveResortConfig() {
  const cfg = {
    resort_name: document.getElementById('resortName').value.trim(),
    resort_address: document.getElementById('resortAddress').value.trim(),
    boarding_capacity: parseInt(document.getElementById('boardingCapacity').value) || 20
  };
  localStorage.setItem('RESORT_CONFIG', JSON.stringify(cfg));
  window.Utils.toast('Resort config saved ✅', 'success');
}

function saveNotifConfig() {
  const cfg = {
    auto_checkout_reminder: document.getElementById('autoCheckoutReminder').checked,
    auto_appt_confirm: document.getElementById('autoApptConfirm').checked
  };
  localStorage.setItem('NOTIF_CONFIG', JSON.stringify(cfg));
  window.Utils.toast('Notification preferences saved ✅', 'success');
}

loadSettings();
