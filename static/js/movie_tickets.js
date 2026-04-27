document.addEventListener("DOMContentLoaded", () => {
    (function () {
  const list = document.getElementById('tlist');
  const sub  = document.getElementById('ticket-sub');

  if (!TICKETS || TICKETS.length === 0) {
    sub.textContent = 'No tickets yet';
    list.innerHTML = `
      <div class="empty">
        <div class="eico">🎟️</div>
        <div class="etit">No tickets yet</div>
        <div class="esub">Book a seat to see your tickets here.</div>
        <a href="${dashboardUrl}" class="pbtn" style="text-decoration:none;">Browse Movies</a>
      </div>`;
    return;
  }

  // ── Group by movie + date + time (one card per booking session) ──────
  const groups = {};
  for (const t of TICKETS) {
    const key = `${t.movie_name}||${t.date}||${t.start_time}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const groupList = Object.values(groups);
  const totalSeats = TICKETS.length;
  sub.textContent = `${totalSeats} seat${totalSeats !== 1 ? 's' : ''} across ${groupList.length} booking${groupList.length !== 1 ? 's' : ''}`;

  for (const group of groupList) {
    const ref    = group[0];
    const isPast = ref.is_past;
    const total  = group.reduce((sum, t) => sum + (t.ticket_type === 'premium' ? 500 : 350), 0);

    // Accent bar colour
    const allPrem = group.every(t => t.ticket_type === 'premium');
    const anyPrem = group.some(t  => t.ticket_type === 'premium');
    const barClass = allPrem ? 'premium' : (anyPrem ? 'mixed' : '');

    // Seat pills — one per seat, coloured by type
    const pillsHTML = group.map(t => {
      const p = t.ticket_type === 'premium';
      return `<div class="tseat-pill ${p ? 'premium' : ''}">
        ${t.seat_label}${p ? '<span class="pill-star">✦</span>' : ''}
      </div>`;
    }).join('');

    const posterHTML = ref.movie_image
      ? `<img src="/static/uploads/${ref.movie_image}" alt="${ref.movie_name}">`
      : `<div class="tposter-ph">🎬</div>`;

    const backdropHTML = isPast
  ? `<div class="tbackdrop">👁️ Watched</div>`
  : '';

const card = document.createElement('div');
card.className = `tcard ${isPast ? 'watched' : ''}`;

card.innerHTML = `
  <div class="tbar ${barClass}"></div>
  <div class="tbody">
    <div class="tposter">${posterHTML}</div>
    <div class="tdet">
      <div class="tmov">${ref.movie_name}</div>
      <div class="tmet">
        📅 ${ref.date} &nbsp;·&nbsp; 🕐 ${ref.start_time} – ${ref.end_time}<br>
        🏨 ${ref.venue_name} &nbsp;·&nbsp; 🚪 ${ref.venue_room}
      </div>
      <div class="tseats">${pillsHTML}</div>
    </div>
    <div class="tright">
      <div class="tprice">₱${total.toLocaleString()}</div>
      <div class="tprice-lbl">${group.length} seat${group.length !== 1 ? 's' : ''}</div>
      <div class="tbadge ${isPast ? 'tu' : 'tv'}">
        ${isPast ? 'Watched' : 'Upcoming'}
      </div>
    </div>
  </div>
`;

    // Make card clickable → ticket_info page
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `/ticket_info/${ref.user_id}/${ref.schedule_id}`;
    });

    list.appendChild(card);
  }
})();
});