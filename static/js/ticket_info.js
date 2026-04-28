/* ticket_info.js — Refund modal logic for LUMA ticket detail page */

(() => {
  /* ── Helpers ─────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── State ───────────────────────────────────────────── */
  let refundMode = 'full';          // 'full' | 'partial'
  let selectedSeats = new Set();    // seat_labels chosen for partial refund

  /* ── DOM refs (resolved after DOMContentLoaded) ──────── */
  let modal, overlay, modeFullBtn, modePartialBtn,
      seatPickerSection, seatCheckboxes,
      summaryFull, summaryPartial, summaryAmount,
      confirmBtn, cancelBtn, openRefundBtn,
      confirmModal, confirmOverlay, confirmYes, confirmNo,
      confirmText;

  /* ── Boot ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    modal              = $('#refund-modal');
    overlay            = $('#refund-overlay');
    modeFullBtn        = $('#refund-mode-full');
    modePartialBtn     = $('#refund-mode-partial');
    seatPickerSection  = $('#seat-picker-section');
    seatCheckboxes     = $$('.seat-checkbox');
    summaryFull        = $('#summary-full');
    summaryPartial     = $('#summary-partial');
    summaryAmount      = $('#summary-amount');
    confirmBtn         = $('#refund-confirm-btn');
    cancelBtn          = $('#refund-cancel-btn');
    openRefundBtn      = $('#open-refund-btn');

    confirmModal       = $('#confirm-modal');
    confirmOverlay     = $('#confirm-overlay');
    confirmYes         = $('#confirm-yes');
    confirmNo          = $('#confirm-no');
    confirmText        = $('#confirm-details-text');

    if (!modal) return; // page doesn't have refund UI

    /* Open refund modal */
    openRefundBtn?.addEventListener('click', openModal);
    overlay?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    /* Mode toggle */
    modeFullBtn?.addEventListener('click',    () => setMode('full'));
    modePartialBtn?.addEventListener('click', () => setMode('partial'));

    /* Seat checkboxes */
    seatCheckboxes.forEach(cb => {
      cb.addEventListener('change', onSeatToggle);
    });

    /* Confirm step */
    confirmBtn?.addEventListener('click', openConfirmModal);
    confirmOverlay?.addEventListener('click', closeConfirmModal);
    confirmNo?.addEventListener('click', closeConfirmModal);
    confirmYes?.addEventListener('click', submitRefund);

    /* Initial render */
    setMode('full');
  });

  /* ── Open / close main modal ─────────────────────────── */
  function openModal() {
    modal.classList.add('open');
    overlay.classList.add('open');
    setMode('full');
  }

  function closeModal() {
    modal.classList.remove('open');
    overlay.classList.remove('open');
  }

  /* ── Open / close confirm modal ─────────────────────── */
  function openConfirmModal() {
    if (refundMode === 'partial' && selectedSeats.size === 0) {
      shakeElement(confirmBtn);
      showInlineError('Please select at least one seat to refund.');
      return;
    }

    clearInlineError();

    // Build human-readable summary
    const amount = getRefundAmount();
    if (refundMode === 'full') {
      confirmText.textContent = `You are about to request a full refund of PHP ${amount}. All seats will be cancelled.`;
    } else {
      const seatList = [...selectedSeats].join(', ');
      confirmText.textContent = `You are about to refund seat(s) ${seatList} for a total of PHP ${amount}.`;
    }

    confirmModal.classList.add('open');
    confirmOverlay.classList.add('open');
  }

  function closeConfirmModal() {
    confirmModal.classList.remove('open');
    confirmOverlay.classList.remove('open');
  }

  /* ── Mode switching ──────────────────────────────────── */
  function setMode(mode) {
    refundMode = mode;
    selectedSeats.clear();
    seatCheckboxes.forEach(cb => (cb.checked = false));

    if (mode === 'full') {
      modeFullBtn.classList.add('active');
      modePartialBtn.classList.remove('active');
      seatPickerSection.classList.add('hidden');
      summaryFull.classList.remove('hidden');
      summaryPartial.classList.add('hidden');
    } else {
      modePartialBtn.classList.add('active');
      modeFullBtn.classList.remove('active');
      seatPickerSection.classList.remove('hidden');
      summaryFull.classList.add('hidden');
      summaryPartial.classList.remove('hidden');
      updatePartialSummary();
    }

    updateConfirmBtn();
  }

  /* ── Seat checkbox handler ───────────────────────────── */
  function onSeatToggle(e) {
    const label = e.target.dataset.seat;
    if (e.target.checked) selectedSeats.add(label);
    else                   selectedSeats.delete(label);

    updatePartialSummary();
    updateConfirmBtn();
    clearInlineError();
  }

  /* ── Summary helpers ─────────────────────────────────── */
  function getRefundAmount() {
    if (refundMode === 'full') {
      return parseInt(summaryAmount.dataset.total, 10);
    }
    let total = 0;
    selectedSeats.forEach(seat => {
      const cb = $(`.seat-checkbox[data-seat="${seat}"]`);
      if (cb) total += parseInt(cb.dataset.price, 10);
    });
    return total;
  }

  function updatePartialSummary() {
    const amount = getRefundAmount();
    const count  = selectedSeats.size;
    summaryPartial.innerHTML =
      count === 0
        ? '<span class="refund-hint">Select seats above to see refund amount.</span>'
        : `<span class="refund-partial-label">${count} seat${count > 1 ? 's' : ''} selected</span>
           <span class="refund-partial-val">PHP ${amount}</span>`;
  }

  function updateConfirmBtn() {
    if (refundMode === 'partial' && selectedSeats.size === 0) {
      confirmBtn.disabled = true;
      confirmBtn.classList.add('disabled');
    } else {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('disabled');
    }
  }

  /* ── Submit refund ───────────────────────────────────── */
  async function submitRefund() {
    confirmYes.disabled = true;
    confirmYes.textContent = 'Processing…';

    const userId     = document.body.dataset.userId;
    const scheduleId = document.body.dataset.scheduleId;

    const payload = {
      user_id:     parseInt(userId, 10),
      schedule_id: parseInt(scheduleId, 10),
      refund_type: refundMode,
      seats:       refundMode === 'partial' ? [...selectedSeats] : [],
    };

    try {
      const res  = await fetch('/api/refund', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        closeConfirmModal();
        closeModal();
        showToast('Refund request submitted! You will be notified shortly.', 'success');
        setTimeout(() => { window.location.href = '/view_tickets'; }, 2200);
      } else {
        showToast(data.error || 'Refund failed. Please try again.', 'error');
        confirmYes.disabled = false;
        confirmYes.textContent = 'Yes, Refund';
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
      confirmYes.disabled = false;
      confirmYes.textContent = 'Yes, Refund';
    }
  }

  /* ── UI micro-helpers ────────────────────────────────── */
  function showInlineError(msg) {
    let el = $('#refund-inline-error');
    if (!el) {
      el = document.createElement('p');
      el.id = 'refund-inline-error';
      el.className = 'refund-inline-error';
      confirmBtn.insertAdjacentElement('beforebegin', el);
    }
    el.textContent = msg;
  }

  function clearInlineError() {
    $('#refund-inline-error')?.remove();
  }

  function shakeElement(el) {
    el.classList.remove('shake');
    void el.offsetWidth; // reflow
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `luma-toast luma-toast--${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2000);
  }
})();