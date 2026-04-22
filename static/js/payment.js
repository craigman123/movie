/* ─── payment.js ──────────────────────────────────────────────────────── */

// ── Order data ────────────────────────────────────────────────────────────
// Replace these with your server-injected template variables or
// pull from sessionStorage after the booking step.
const ORDER = {
  eventName:  typeof EVENT_NAME  !== 'undefined' ? EVENT_NAME  : 'Sample Event',
  eventMeta:  typeof EVENT_META  !== 'undefined' ? EVENT_META  : 'Cebu City · May 10, 2025 · 7:00 PM',
  seats:      typeof SEATS       !== 'undefined' ? SEATS       : ['C3', 'C4'],
  type:       typeof TICKET_TYPE !== 'undefined' ? TICKET_TYPE : 'standard',
  unitPrice:  typeof UNIT_PRICE  !== 'undefined' ? UNIT_PRICE  : 350,
  fee:        typeof CONV_FEE    !== 'undefined' ? CONV_FEE    : 30,
};

const FMT = n => `₱${n.toLocaleString()}`;
let currentMethod = 'gcash';

// ── QR SVG helpers ────────────────────────────────────────────────────────
function buildQR(color) {
  return `<svg viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="37" height="37" fill="white"/>
    <rect x="2"  y="2"  width="14" height="14" rx="1" fill="${color}"/>
    <rect x="4"  y="4"  width="10" height="10" rx=".5" fill="white"/>
    <rect x="6"  y="6"  width="6"  height="6"  fill="${color}"/>
    <rect x="21" y="2"  width="14" height="14" rx="1" fill="${color}"/>
    <rect x="23" y="4"  width="10" height="10" rx=".5" fill="white"/>
    <rect x="25" y="6"  width="6"  height="6"  fill="${color}"/>
    <rect x="2"  y="21" width="14" height="14" rx="1" fill="${color}"/>
    <rect x="4"  y="23" width="10" height="10" rx=".5" fill="white"/>
    <rect x="6"  y="25" width="6"  height="6"  fill="${color}"/>
    <rect x="21" y="21" width="4"  height="4"  fill="${color}"/>
    <rect x="27" y="21" width="4"  height="4"  fill="${color}"/>
    <rect x="21" y="27" width="4"  height="4"  fill="${color}"/>
    <rect x="27" y="27" width="4"  height="4"  fill="${color}"/>
    <rect x="33" y="21" width="2"  height="2"  fill="${color}"/>
    <rect x="21" y="33" width="2"  height="2"  fill="${color}"/>
    <rect x="25" y="25" width="2"  height="2"  fill="${color}"/>
  </svg>`;
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('qrGcash').innerHTML = buildQR('#007aff');
  document.getElementById('qrMaya').innerHTML  = buildQR('#00b96b');
  initSummary();
});

// ── Order summary ─────────────────────────────────────────────────────────
function initSummary() {
  const { eventName, eventMeta, seats, type, unitPrice, fee } = ORDER;
  const subtotal = seats.length * unitPrice;
  const total    = subtotal + fee;

  document.getElementById('sumEventName').textContent  = eventName;
  document.getElementById('sumEventMeta').textContent  = eventMeta;
  document.getElementById('sumType').textContent       = type === 'premium' ? 'Premium ✦' : 'Standard';
  document.getElementById('sumCount').textContent      = `${seats.length} seat${seats.length !== 1 ? 's' : ''}`;
  document.getElementById('sumUnitPrice').textContent  = FMT(unitPrice);
  document.getElementById('sumFee').textContent        = FMT(fee);
  document.getElementById('sumTotal').textContent      = FMT(total);
  document.getElementById('payBtnText').textContent    = `Pay ${FMT(total)}`;

  const chipsEl = document.getElementById('sumSeats');
  chipsEl.innerHTML = '';
  const seatSVG = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 8h-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2v3h2v-3h12v3h2v-3h2c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M5 5h14v3h-1c-.55 0-1 .45-1 1v3H7V9c0-.55-.45-1-1-1H5zm16 12H3v-7h2v3c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3h2z"/>
  </svg>`;
  for (const s of seats) {
    const chip = document.createElement('div');
    chip.className = `pay-seat-chip${type === 'premium' ? ' premium' : ''}`;
    chip.innerHTML = `${seatSVG} ${s}`;
    chipsEl.appendChild(chip);
  }
}

// ── Method switching ──────────────────────────────────────────────────────
function selectMethod(m) {
  currentMethod = m;
  document.querySelectorAll('.pay-method-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.m === m));
  document.querySelectorAll('.pay-panel').forEach(p =>
    p.classList.toggle('active', p.id === `panel-${m}`));
}

// ── Card input formatting ─────────────────────────────────────────────────
function fmtCard(el) {
  const raw    = el.value.replace(/\D/g, '').slice(0, 16);
  el.value     = raw.replace(/(.{4})/g, '$1 ').trim();
  const masked = (raw + '················').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  document.getElementById('previewNumber').textContent =
    raw.length > 0 ? masked : '•••• •••• •••• ••••';
}

function fmtExpiry(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
  el.value = v;
  document.getElementById('previewExpiry').textContent = v || 'MM / YY';
}

// ── Copy number ───────────────────────────────────────────────────────────
function copyNumber(num) {
  navigator.clipboard.writeText(num.replace(/\s/g, '')).then(() => {
    showToast('Number copied to clipboard!');
  });
}

// ── Process payment ───────────────────────────────────────────────────────
function processPayment() {
  if (currentMethod === 'card') {
    const num  = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const name = document.getElementById('cardName').value.trim();
    const exp  = document.getElementById('cardExpiry').value.trim();
    const cvv  = document.getElementById('cardCvv').value.trim();
    if (num.length < 16 || !name || exp.length < 7 || cvv.length < 3) {
      showToast('Please fill in all card details.', 'error');
      return;
    }
  }

  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.classList.add('loading');

  // ── Replace this setTimeout with your real /api/pay fetch ──
  setTimeout(showReceipt, 2000);
}

// ── Show receipt modal ────────────────────────────────────────────────────
function showReceipt() {
  const { eventName, eventMeta, seats, type, unitPrice, fee } = ORDER;
  const total     = seats.length * unitPrice + fee;
  const bookingId = 'BK-' + Math.random().toString(36).slice(2, 9).toUpperCase();
  const methodMap = { gcash: 'GCash', maya: 'Maya', card: 'Credit / Debit Card' };

  document.getElementById('rcEventName').textContent = eventName;
  document.getElementById('rcEventMeta').textContent = eventMeta;
  document.getElementById('rcType').textContent      = type === 'premium' ? 'Premium ✦' : 'Standard';
  document.getElementById('rcMethod').textContent    = methodMap[currentMethod];
  document.getElementById('rcDate').textContent      =
    new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  document.getElementById('rcTotal').textContent     = FMT(total);
  document.getElementById('rcId').textContent        = `Booking ID: ${bookingId}`;

  const rcSeats = document.getElementById('rcSeats');
  rcSeats.innerHTML = '';
  for (const s of seats) {
    const chip = document.createElement('span');
    chip.className   = `pay-rc-chip${type === 'premium' ? ' premium' : ''}`;
    chip.textContent = s;
    rcSeats.appendChild(chip);
  }

  document.getElementById('receiptOverlay').classList.add('open');
}

// ── Navigation ────────────────────────────────────────────────────────────
function goHome() {
  window.location.href = '/';
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let t = document.getElementById('payToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'payToast';
    // Minimal inline positioning only — appearance comes from global toast styles if defined
    Object.assign(t.style, {
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)',
      padding: '11px 22px', borderRadius: '8px',
      fontSize: '13px', fontWeight: '500',
      zIndex: '9999', transition: 'opacity .3s',
      pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif",
    });
    document.body.appendChild(t);
  }
  t.textContent    = msg;
  t.style.background = type === 'error' ? 'rgba(224,85,85,.95)' : 'rgba(78,203,122,.95)';
  t.style.color      = '#fff';
  t.style.opacity    = '1';
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}
