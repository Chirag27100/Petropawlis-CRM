// widget.js — Pawsome Resort Chatbot
// Groq API key: replace with actual key in production
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are Paws, the friendly AI assistant for Pawsome Resort — a premium pet boarding and grooming resort in Bengaluru. You help pet owners book appointments, answer questions about services, and capture their details.

Services offered:
- Boarding: ₹700–₹1000/day depending on dog size. Max 20 dogs at a time.
- Grooming: Full bath + haircut from ₹800. Takes 1.5 hours.  
- Swimming/Hydrotherapy: ₹500/session. 1 hour. Great for active/large breeds.

Your job:
1. Greet warmly, ask about their pet
2. Understand what service they need
3. Help them understand pricing/availability
4. Collect: owner name, phone number, pet name, breed, service needed, preferred date
5. Confirm the booking request

Keep responses SHORT (2-3 sentences max). Be warm, friendly, and use dog/pet emojis occasionally. 
Never make up availability — say slots are subject to confirmation.
When you have collected all lead details, end your message with: LEAD_CAPTURED`;

let chatOpen = false;
let messages = [];
let leadData = {};
let leadCaptured = false;
let awaitingField = null;

// ─── CONVERSATION FLOW ────────────────────────────────────────────
const WELCOME_MSG = "Hi there! 🐾 Welcome to Pawsome Resort! I'm Paws, your furry assistant. What brings you here today — are you looking to book **boarding**, **grooming**, or **swimming** for your pup?";
const QUICK_START = ['Boarding 🏠', 'Grooming ✂️', 'Swimming 🏊', 'Pricing & Info'];

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWindow').classList.toggle('open', chatOpen);
  document.getElementById('launcher').classList.toggle('open', chatOpen);
  if (chatOpen && messages.length === 0) initChat();
}

function initChat() {
  addBotMessage(WELCOME_MSG);
  setQuickReplies(QUICK_START);
}

function addBotMessage(text) {
  messages.push({ role: 'assistant', content: text });
  renderMessage('bot', text);
  scrollBottom();
}

function addUserMessage(text) {
  messages.push({ role: 'user', content: text });
  renderMessage('user', text);
  scrollBottom();
}

function renderMessage(role, text) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  const formatted = text.replace(/LEAD_CAPTURED/g, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  el.innerHTML = `
    ${role === 'bot' ? '<div class="msg-avatar">🐾</div>' : ''}
    <div class="msg-bubble">${formatted}</div>
    ${role === 'user' ? '<div class="msg-avatar" style="background:rgba(43,126,193,0.2);">👤</div>' : ''}
  `;
  document.getElementById('chatMessages').appendChild(el);
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg bot'; el.id = 'typingIndicator';
  el.innerHTML = `<div class="msg-avatar">🐾</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  document.getElementById('chatMessages').appendChild(el);
  scrollBottom();
}

function removeTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function setQuickReplies(options) {
  const qr = document.getElementById('quickReplies');
  qr.innerHTML = options.map(o => `<button class="qr-btn" onclick="quickReply('${o}')">${o}</button>`).join('');
}

function clearQuickReplies() { document.getElementById('quickReplies').innerHTML = ''; }

function scrollBottom() {
  const msgs = document.getElementById('chatMessages');
  setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  clearQuickReplies();
  addUserMessage(text);

  // Check if collecting lead fields directly
  if (awaitingField) {
    handleLeadField(awaitingField, text);
    return;
  }

  await getAIResponse(text);
}

function handleKey(e) { if (e.key === 'Enter') sendMessage(); }

function quickReply(text) {
  clearQuickReplies();
  addUserMessage(text);
  getAIResponse(text);
}

async function getAIResponse(userMsg) {
  showTyping();
  try {
    // Build context with lead data so far
    const context = Object.keys(leadData).length > 0
      ? `\n[Collected so far: ${JSON.stringify(leadData)}]`
      : '';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + context },
          ...messages.slice(-8) // last 8 messages for context
        ]
      })
    });

    const data = await response.json();
    removeTyping();

    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content;
      addBotMessage(reply);

      // Check if lead captured
      if (reply.includes('LEAD_CAPTURED') && !leadCaptured) {
        leadCaptured = true;
        setTimeout(() => showLeadForm(), 500);
      } else {
        // Set contextual quick replies
        if (reply.toLowerCase().includes('boarding')) setQuickReplies(['Tell me more', 'Book boarding', 'What\'s the price?']);
        else if (reply.toLowerCase().includes('grooming')) setQuickReplies(['Book grooming', 'How long does it take?', 'Pricing?']);
        else if (reply.toLowerCase().includes('swimming')) setQuickReplies(['Book swimming', 'Good for large breeds?', 'Pricing?']);
      }
    }
  } catch (err) {
    removeTyping();
    // Fallback: rule-based response if Groq key not set
    handleFallback(userMsg);
  }
}

// ─── FALLBACK (no API key / error) ───────────────────────────────
function handleFallback(msg) {
  const m = msg.toLowerCase();
  let reply = '';
  let qr = [];

  if (m.includes('boarding') || m.includes('board')) {
    reply = "Our boarding service is ₹700–₹1000/day depending on your dog's size 🏠 We have a cozy, safe environment with 24/7 supervision. Want to check availability for specific dates?";
    qr = ['Check availability', 'Book now', 'Pricing details'];
  } else if (m.includes('groom')) {
    reply = "Our grooming service includes full bath, haircut, nail trimming and ear cleaning ✂️ Starting from ₹800. Sessions take about 1.5 hours. Want to book a slot?";
    qr = ['Book grooming', 'What\'s included?', 'Pricing'];
  } else if (m.includes('swim') || m.includes('hydro')) {
    reply = "Swimming / hydrotherapy is ₹500 per session 🏊 It's wonderful for active breeds and dogs with joint issues. 1-hour sessions. Shall I help you book one?";
    qr = ['Book swimming', 'Is it safe?', 'See availability'];
  } else if (m.includes('price') || m.includes('cost') || m.includes('rate')) {
    reply = "Here's our pricing 🐾\n\n• **Boarding**: ₹700–₹1000/day\n• **Grooming**: from ₹800\n• **Swimming**: ₹500/session\n\nWhich service interests you?";
    qr = ['Book boarding', 'Book grooming', 'Book swimming'];
  } else if (m.includes('book') || m.includes('appoint')) {
    reply = "I'd love to help you book! 🐾 Could you share your name and your dog's name to get started?";
    awaitingField = 'name';
    qr = [];
  } else {
    reply = "Thanks for reaching out to Pawsome Resort! 🐾 We offer boarding, grooming, and swimming for your furry friend. How can I help you today?";
    qr = ['Boarding 🏠', 'Grooming ✂️', 'Swimming 🏊', 'Pricing'];
  }

  addBotMessage(reply);
  if (qr.length) setQuickReplies(qr);
}

// ─── LEAD COLLECTION ─────────────────────────────────────────────
const LEAD_FIELDS = [
  { key: 'name', label: 'Your name', placeholder: 'Priya Sharma' },
  { key: 'phone', label: 'Phone number', placeholder: '98450XXXXX' },
  { key: 'pet_name', label: 'Your dog\'s name', placeholder: 'Bruno' },
  { key: 'service', label: 'Service needed', placeholder: 'boarding / grooming / swimming' },
];

function handleLeadField(field, value) {
  leadData[field] = value;
  awaitingField = null;
  const idx = LEAD_FIELDS.findIndex(f => f.key === field);
  if (idx < LEAD_FIELDS.length - 1) {
    const next = LEAD_FIELDS[idx + 1];
    awaitingField = next.key;
    addBotMessage(`Got it! And ${next.label}?`);
  } else {
    submitLead();
  }
}

function showLeadForm() {
  document.getElementById('leadFormArea').innerHTML = `
    <div class="lead-form">
      <h4>📋 Complete your booking request</h4>
      <input class="lf-input" id="lfName" placeholder="Your name" type="text">
      <input class="lf-input" id="lfPhone" placeholder="Phone number" type="tel">
      <input class="lf-input" id="lfPet" placeholder="Dog's name & breed" type="text">
      <button class="lf-btn" onclick="submitLeadForm()">Send Booking Request 🐾</button>
    </div>
  `;
}

async function submitLeadForm() {
  const name = document.getElementById('lfName').value.trim();
  const phone = document.getElementById('lfPhone').value.trim();
  const pet = document.getElementById('lfPet').value.trim();
  if (!name || !phone) { return; }

  // Push to CRM
  await window.DB.addLead({
    name, phone,
    email: leadData.email || '',
    pet_name: pet.split(' ')[0] || pet,
    pet_breed: pet.split(' ').slice(1).join(' ') || 'Unknown',
    service_interest: leadData.service || 'boarding',
    source: 'website_chat',
    notes: 'Lead from chatbot widget'
  });

  document.getElementById('leadFormArea').innerHTML = '';
  addBotMessage(`Thank you ${name}! 🎉 We've received your booking request for ${pet}. Our team will call you at ${phone} within 2 hours to confirm. See you at Pawsome Resort! 🐾`);
}

async function submitLead() {
  await window.DB.addLead({
    ...leadData,
    source: 'website_chat',
    notes: 'Captured via chatbot conversation'
  });
  addBotMessage(`Perfect! We've got all your details, ${leadData.name || 'there'}! 🎉 Our team will call you shortly to confirm your ${leadData.service || 'booking'} for ${leadData.pet_name || 'your pup'}. See you at Pawsome Resort! 🐾`);
}
