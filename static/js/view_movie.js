// ── Trailer video setup ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('vid');
  if (!video) return;
 
  video.controlsList = 'nofullscreen';
  video.disablePictureInPicture = true;
 
  video.addEventListener('loadeddata', () => video.play());
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play();
  });
});
 
// ── Venue Modal ──────────────────────────────────────────────────────────
let _cachedSchedules = null;
let _cachedVenues    = null;
 
async function fetchAll() {
  if (_cachedSchedules && _cachedVenues) return;
  const [s, v] = await Promise.all([
    fetch('/api/schedules').then(r => r.json()),
    fetch('/api/venues').then(r => r.json())
  ]);
  _cachedSchedules = s;
  _cachedVenues    = v;
}
 
async function openVenueModal(movieId) {
  const overlay = document.getElementById('vmOverlay');
  const body    = document.getElementById('vmBody');
  const subEl   = document.getElementById('vmSub');
 
  overlay.classList.add('open');
  body.innerHTML = `
    <div class="vm-loading">
      <div class="vm-spinner"></div>
      <span>Fetching venues...</span>
    </div>`;
 
  try {
    await fetchAll();
 
    const movieScheds = _cachedSchedules.filter(s => s.movie_id === movieId);
 
    const byVenue = {};
    for (const s of movieScheds) {
      if (!byVenue[s.venue_id]) byVenue[s.venue_id] = [];
      byVenue[s.venue_id].push(s);
    }
 
    const venueIds = Object.keys(byVenue).map(Number);
    const venues   = _cachedVenues.filter(v => venueIds.includes(v.id));
 
    subEl.textContent = venues.length
      ? `${venues.length} venue${venues.length > 1 ? 's' : ''} showing this film`
      : 'No venues scheduled for this film';
 
    if (!venues.length) {
      body.innerHTML = `<div class="vm-no-results">No venues or schedules found for this movie.</div>`;
      return;
    }
 
    let html = '';
    for (const v of venues) {
      const scheds = byVenue[v.id] || [];
 
      const avail      = (v.venue_availability || '').toLowerCase();
      const availClass = avail.includes('unavail') ? 'unavailable' : 'available';
      const availLabel = avail.includes('unavail') ? '✕ Unavailable' : '✓ Available';
 
      // venue image
      const imgHtml = v.image
        ? `<img class="vm-venue-img" src="/static/uploads/${v.image}" alt="${v.venue_name}" onerror="this.style.display='none'">`
        : `<div class="vm-venue-img-placeholder">🏨</div>`;
 
      // schedule pills
      const now = new Date();

// 1. Split schedules into two groups
      const activeScheds = [];
      const endedScheds = [];

      scheds.forEach(s => {
          const schedDateTime = new Date(`${s.date} ${s.end_time}`);
          const cancelled = s.active !== 'True' && s.active !== true;
          
          if (cancelled || schedDateTime >= now) {
              activeScheds.push(s);
          } else {
              endedScheds.push(s);
          }
      });

      // 2. Get only the most recent ended schedule (the one closest to "now")
      // We sort by date/time descending and take the first one
      const lastEnded = endedScheds
          .sort((a, b) => new Date(`${b.date} ${b.end_time}`) - new Date(`${a.date} ${a.end_time}`))
          .slice(0, 1);

      // 3. Combine them: The one last ended + all active/upcoming ones
      const filteredScheds = [...lastEnded, ...activeScheds];

      const schedHtml = filteredScheds.length
          ? filteredScheds.map(s => {
              const cancelled = s.active !== 'True' && s.active !== true;
              const schedDateTime = new Date(`${s.date} ${s.end_time}`);
              const hasEnded = schedDateTime < now;

              if (cancelled) {
                  return `
                      <div class="vm-sched-pill cancelled">
                          <span class="sdate">${formatDate(s.date)}</span>
                          <span class="stime">${s.start_time} – ${s.end_time} · Cancelled</span>
                      </div>`;
              }

              if (hasEnded) {
                  return `
                      <div class="vm-sched-pill end">
                          <span class="sdate">${formatDate(s.date)}</span>
                          <span class="stime">${s.start_time} – ${s.end_time} · Ended</span>
                      </div>`;
              }

              return `
                  <a class="vm-sched-pill clickable" href="/book/${s.id}">
                      <span class="sdate">${formatDate(s.date)}</span>
                      <span class="stime">${s.start_time} – ${s.end_time}</span>
                      <span class="sbook">Book Seat →</span>
                  </a>`;
          }).join('')
          : '<span class="vm-no-sched">No schedules listed.</span>';
 
      const mapLink = v.venue_link
        ? `<a class="vm-map-link" href="${v.venue_link}" target="_blank" rel="noopener">📍 View on Map</a>`
        : '';
 
      html += `
        <div class="vm-venue-card">
          ${imgHtml}
          <div class="vm-venue-info">
            <div class="vm-venue-name">${v.venue_name}</div>
            <div class="vm-venue-room">Room: ${v.room || '—'}</div>
            <div class="vm-venue-meta">
              <span class="vm-tag ${availClass}">${availLabel}</span>
              <span class="vm-tag">🪑 ${v.cap || '—'} seats</span>
              <span class="vm-tag">📐 ${v.row} rows × ${v.column} cols</span>
            </div>
            ${mapLink}
            <div class="vm-sched-label">Showtimes</div>
            <div class="vm-sched-grid">${schedHtml}</div>
          </div>
        </div>`;
    }
 
    body.innerHTML = html;
 
  } catch (err) {
    console.error('Venue modal error:', err);
    body.innerHTML = `<div class="vm-no-results">Failed to load venue data. Please try again.</div>`;
  }
}
 
function closeVenueModal(event, force) {
  const overlay = document.getElementById('vmOverlay');
  if (force || (event && event.target === overlay)) {
    overlay.classList.remove('open');
  }
}
 
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}