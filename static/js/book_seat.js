// ── Seat SVG ──────────────────────────────────────────────────────────────
const seatSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="95%" height="95%" fill="#A1A1A1" viewBox="0 0 24 24" transform="scale(-1,1)"><path d="M22 8h-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2v3h2v-3h12v3h2v-3h2c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M5 5h14v3h-1c-.55 0-1 .45-1 1v3H7V9c0-.55-.45-1-1-1H5zm16 12H3v-7h2v3c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3h2z"></path></svg>`;
 
// ── State ────────────────────────────────────────────────────────────────
let selectedSeats = new Set();   // supports multiple seat selections
let selectedType  = 'standard';
let bookedSeats   = {};          // { "A1": "standard", "B2": "premium", ... }
 
const PRICES      = { standard: 350, premium: 500 };
const MAX_SEATS   = 10;           // cap how many seats one order can have
// Premium rows: A and B (index 0,1)
const PREMIUM_ROWS = [0, 1];
 
// ── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadBookedSeats();
  renderSeatMap();
  updateSummary();
});
 
async function loadBookedSeats() {
  try {
    const res  = await fetch(`/api/booked_seats/${SCHEDULE_ID}`);
    const data = await res.json();
    bookedSeats = {};
    for (const b of data) bookedSeats[b.seat] = b.type;
  } catch (e) {
    console.error('Failed to load booked seats', e);
  }
}
 
// ── Seat map ─────────────────────────────────────────────────────────────
function renderSeatMap() {
  const container = document.getElementById('srows');
  container.innerHTML = '';
 
  for (let r = 0; r < VENUE_ROWS; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const rowEl    = document.createElement('div');
    rowEl.className = 'srow';
    if (r > 0 && ROW_GAP > 0 && r % ROW_GAP === 0) {
      rowEl.style.marginTop = '18px';
    }
 
    const lbl = document.createElement('div');
    lbl.className   = 'srlbl';
    lbl.textContent = rowLabel;
    rowEl.appendChild(lbl);
 
    for (let c = 0; c < VENUE_COLS; c++) {
      if (COL_GAP > 0 && c > 0 && c % COL_GAP === 0) {
        const gap = document.createElement('div');
        gap.className = 'sgap';
        rowEl.appendChild(gap);
      }
 
      const seatId     = `${rowLabel}${c + 1}`;
      const isPrem     = PREMIUM_ROWS.includes(r);
      const isTaken    = bookedSeats[seatId] !== undefined;
      const isSelected = selectedSeats.has(seatId);
 
      const seat = document.createElement('div');
      seat.className = 'seat';
      seat.dataset.id   = seatId;
      seat.dataset.prem = isPrem ? '1' : '0';
 
      if (isTaken) {
        seat.classList.add('taken');
      } else if (isPrem && selectedType === 'standard') {
        seat.classList.add('other-type');
      } else if (!isPrem && selectedType === 'premium') {
        seat.classList.add('other-type');
      } else {
        seat.addEventListener('click', () => pickSeat(seatId, isPrem));
      }
 
      if (isSelected) seat.classList.add('selected');
 
      seat.innerHTML = seatSVG;
      rowEl.appendChild(seat);
    }
 
    container.appendChild(rowEl);
  }
 
  // ── Column numbers ────────────────────────────────────────────────────
  const numRow = document.createElement('div');
  numRow.className = 'srow snums';
  numRow.style.marginTop = '6px';
 
  const spacer = document.createElement('div');
  spacer.className = 'srlbl';
  spacer.style.visibility = 'hidden';
  numRow.appendChild(spacer);
 
  for (let c = 0; c < VENUE_COLS; c++) {
    if (COL_GAP > 0 && c > 0 && c % COL_GAP === 0) {
      const gap = document.createElement('div');
      gap.className = 'sgap';
      numRow.appendChild(gap);
    }
    const num = document.createElement('div');
    num.className   = 'seatnum snum';
    num.textContent = c + 1;
    numRow.appendChild(num);
  }
 
  container.appendChild(numRow);
}
 
// ── Pick / deselect a seat ────────────────────────────────────────────────
function pickSeat(seatId, isPrem) {
  if (isPrem && selectedType === 'standard') return;
  if (!isPrem && selectedType === 'premium') return;
 
  if (selectedSeats.has(seatId)) {
    selectedSeats.delete(seatId);        // tap again to deselect
  } else {
    if (selectedSeats.size >= MAX_SEATS) {
      showToast(`Max ${MAX_SEATS} seats per order.`, 'error');
      return;
    }
    selectedSeats.add(seatId);
  }
 
  renderSeatMap();
  updateSummary();
}
 
// ── Ticket type ───────────────────────────────────────────────────────────
function selType(type) {
  selectedType  = type;
  selectedSeats = new Set();             // clear seats when switching type
 
  document.getElementById('tt-std').classList.toggle('on', type === 'standard');
  document.getElementById('tt-prm').classList.toggle('on', type === 'premium');
 
  renderSeatMap();
  updateSummary();
}
 
// ── Summary ───────────────────────────────────────────────────────────────
function updateSummary() {
  const count    = selectedSeats.size;
  const total    = count * PRICES[selectedType];
  const seatList = count > 0 ? [...selectedSeats].join(', ') : '—';
 
  document.getElementById('ss').textContent   = seatList;
  document.getElementById('sty').textContent  = selectedType === 'premium' ? 'Premium ✦' : 'Standard';
  document.getElementById('stot').textContent = `₱${total}`;
 
  const btn = document.getElementById('bbtn');
  if (count > 0) {
    btn.disabled    = false;
    btn.textContent = count === 1
      ? `Confirm — ${seatList} (₱${total})`
      : `Confirm — ${count} seats (₱${total})`;
  } else {
    btn.disabled    = true;
    btn.textContent = 'Select a Seat to Continue';
  }
}
 
// ── Book ──────────────────────────────────────────────────────────────────
// 1. Modified: Opens the modal and populates it with values
async function confirmBooking() {
    if (selectedSeats.size === 0) return;

    // Show the modal
    document.getElementById('paymentModal').style.display = 'flex';

    // Populate modal summary with current selection
    const seatsArray = [...selectedSeats];
    const total = seatsArray.length * PRICES[selectedType];
    
    document.getElementById('modalSeats').textContent = seatsArray.join(', ');
    document.getElementById('modalTotal').textContent = `₱${total}`;
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('confirmPin').value = ''; // Clear pin on close
}

// 2. New: The actual API call happens only after PIN is entered in the modal
async function processFinalBooking() {
    const pin = document.getElementById('confirmPin').value;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    if (pin.length < 4) {
        showToast("Please enter your 4-digit PIN", "error");
        return;
    }

    const seatsArray = [...selectedSeats];
    const btn = document.querySelector('.pay-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
        const res = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schedule_id: SCHEDULE_ID,
                seats: seatsArray,
                type: selectedType,
                payment_method: method,
                payment_pin: pin // Holding value until this moment
            }),
        });

        const data = await res.json();

        if (data.success) {
            showToast(`Success! ${seatsArray.join(', ')} booked via ${method}`, 'success');
            
            // Update local UI state
            for (const s of seatsArray) bookedSeats[s] = selectedType;
            selectedSeats = new Set();
            
            closePaymentModal();
            renderSeatMap();
            updateSummary();
        } else {
            showToast(data.error || 'Payment failed.', 'error');
            btn.disabled = false;
            btn.textContent = 'Confirm & Pay';
        }
    } catch (e) {
        showToast('Network error.', 'error');
        btn.disabled = false;
    }
}
 
// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3200);
}