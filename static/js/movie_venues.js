/* ===========================
   MOVIE VENUES — movie_venues.js
   Fetches /api/venues and renders a venue selector strip
   with a full detail card for the selected venue.
   =========================== */

(function () {
  "use strict";

  let allVenues    = [];
  let allMovies    = [];
  let allSchedules = [];
  let selectedId   = null;
  let stripOffset  = 0;           // how many venues are scrolled past on the left
  const VISIBLE    = 5;           // pills visible at once

  /* ── Helpers ── */
  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function imgSrc(filename) {
    if (!filename) return null;
    // Venue images are stored under static/uploads/
    return `/static/uploads/${filename}`;
  }

  function availClass(val) {
    const v = (val || "").toLowerCase();
    if (v === "available" || v === "open") return "available";
    return "unavailable";
  }

  /* ── Strip ── */
  function renderStrip() {
    const strip   = document.getElementById("venueStrip");
    const btnPrev = document.getElementById("venuePrev");
    const btnNext = document.getElementById("venueNext");

    strip.innerHTML = "";

    const slice = allVenues.slice(stripOffset, stripOffset + VISIBLE);

    slice.forEach(v => {
      const pill  = document.createElement("div");
      pill.className = "venue-pill" + (v.id === selectedId ? " active" : "");

      const src = imgSrc(v.image);
      const thumbHtml = src
        ? `<img src="${escHtml(src)}" alt="${escHtml(v.venue_name)}" onerror="this.parentElement.innerHTML='<div class=vp-thumb-placeholder>🏨</div>'">`
        : `<div class="vp-thumb-placeholder">🏨</div>`;

      pill.innerHTML = `
        <div class="vp-thumb">${thumbHtml}</div>
        <div class="vp-name">${escHtml(v.venue_name)}</div>
        ${v.room ? `<div class="vp-room">${escHtml(v.room)}</div>` : ""}
      `;

      pill.addEventListener("click", () => selectVenue(v.id));
      strip.appendChild(pill);
    });

    btnPrev.disabled = stripOffset === 0;
    btnNext.disabled = stripOffset + VISIBLE >= allVenues.length;
  }

  window.shiftVenues = function (dir) {
    stripOffset = Math.max(0, Math.min(stripOffset + dir, allVenues.length - VISIBLE));
    renderStrip();
  };

  /* ── Detail card ── */
  function selectVenue(id) {
    selectedId = id;
    renderStrip();
    renderDetail();
  }

  function renderDetail() {
    const container = document.getElementById("venueDetail");
    const v = allVenues.find(x => x.id === selectedId);

    if (!v) {
      container.innerHTML = `
        <div class="venue-empty">
          <div style="font-size:2.5rem;opacity:.3">🏨</div>
          <div>Select a venue above to see details.</div>
        </div>`;
      return;
    }

    const src        = imgSrc(v.image);
    const avClass    = availClass(v.venue_availability);
    const avLabel    = v.venue_availability || "Unknown";
    const mapLink    = v.venue_link
      ? `<a class="venue-map-btn" href="${escHtml(v.venue_link)}" target="_blank" rel="noopener">
           📍 View on Map
         </a>`
      : "";

    const heroHtml = src
      ? `<img src="${escHtml(src)}" alt="${escHtml(v.venue_name)}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : "";
    const heroPlaceholder = `<div class="venue-hero-placeholder" ${src ? 'style="display:none"' : ""}>🏨</div>`;

    container.innerHTML = `
      <div class="venue-detail">
        <div class="venue-hero">
          ${heroHtml}
          ${heroPlaceholder}
          <div class="venue-hero-overlay"></div>
          <div class="venue-hero-badge ${avClass}">${escHtml(avLabel)}</div>
        </div>
        <div class="venue-body">
          <div class="venue-title-row">
            <div>
              <div class="venue-name">${escHtml(v.venue_name)}</div>
              ${v.room ? `<div class="venue-room-label">Room · ${escHtml(v.room)}</div>` : ""}
            </div>
            ${mapLink}
          </div>
          <div class="venue-stats">
            <div class="venue-stat">
              <div class="venue-stat-val">${v.cap ?? "—"}</div>
              <div class="venue-stat-lbl">Capacity</div>
            </div>
            <div class="venue-stat">
              <div class="venue-stat-val">${v.row ?? "—"}</div>
              <div class="venue-stat-lbl">Rows</div>
            </div>
            <div class="venue-stat">
              <div class="venue-stat-val">${v.column ?? "—"}</div>
              <div class="venue-stat-lbl">Columns</div>
            </div>
          </div>
          ${buildVenueMovies(v.id)}
        </div>
      </div>
    `;
  }

  /* ── Movies at this venue ── */
  function buildVenueMovies(venueId) {
    const now = new Date();

    // All schedule slots for this venue
    const slots = allSchedules.filter(s => s.venue_id === venueId);
    if (!slots.length) return "";

    // Unique movie ids that have at least one non-ended slot (showing or coming soon)
    // Plus at most one ended movie (most recently ended), same rule as schedule page
    const endedSlots   = slots.filter(s => new Date(`${s.date}T${s.end_time}`) < now);
    const activeSlots  = slots.filter(s => new Date(`${s.date}T${s.end_time}`) >= now);

    const activeMovieIds = [...new Set(activeSlots.map(s => s.movie_id))];

    // Single most-recently-ended movie (by slot end time)
    let lastEndedMovieId = null;
    if (endedSlots.length) {
      const sorted = endedSlots.sort((a, b) =>
        new Date(`${b.date}T${b.end_time}`) - new Date(`${a.date}T${a.end_time}`)
      );
      const candidate = sorted[0].movie_id;
      // Only show if not already in active list
      if (!activeMovieIds.includes(candidate)) lastEndedMovieId = candidate;
    }

    const movieIds = lastEndedMovieId
      ? [...activeMovieIds, lastEndedMovieId]
      : activeMovieIds;

    if (!movieIds.length) return "";

    const cards = movieIds.map(mid => {
      const m = allMovies.find(x => x.id === mid);
      if (!m) return "";

      // Status label for this movie at this venue
      const movieSlots  = slots.filter(s => s.movie_id === mid);
      const isShowing   = movieSlots.some(s => {
        const start = new Date(`${s.date}T${s.start_time}`);
        const end   = new Date(`${s.date}T${s.end_time}`);
        return now >= start && now <= end;
      });
      const isEnded     = mid === lastEndedMovieId && !activeMovieIds.includes(mid);
      const statusLabel = isEnded
        ? `<span class="vm-badge ended">Ended</span>`
        : isShowing
          ? `<span class="vm-badge showing">Now Showing</span>`
          : `<span class="vm-badge soon">Coming Soon</span>`;

      const poster = m.movie_image
        ? `/static/uploads/${escHtml(m.movie_image)}`
        : null;

      return `
        <div class="vm-card${isEnded ? " vm-ended" : ""}">
          <div class="vm-poster">
            ${poster
              ? `<img src="${poster}" alt="${escHtml(m.movie_name)}" onerror="this.style.display='none'">`
              : `<div class="vm-poster-ph">🎬</div>`}
          </div>
          <div class="vm-info">
            <div class="vm-title">${escHtml(m.movie_name)}</div>
            <div class="vm-meta">
              ${statusLabel}
              ${m.genre ? `<span class="vm-genre">${escHtml(m.genre)}</span>` : ""}
              ${m.age_restrict ? `<span class="vm-age">${escHtml(m.age_restrict)}</span>` : ""}
              <span class="vm-dur">${m.duration} min</span>
            </div>
          </div>
        </div>`;
    }).join("");

    return `
      <div class="vm-section">
        <div class="vm-section-title">Playing Here</div>
        <div class="vm-list">${cards}</div>
      </div>`;
  }
  async function fetchVenues() {
    const container = document.getElementById("venueDetail");

    try {
      const [venuesRes, moviesRes, schedulesRes] = await Promise.all([
        fetch("/api/venues"),
        fetch("/api/movies"),
        fetch("/api/schedules"),
      ]);

      allVenues    = await venuesRes.json();
      allMovies    = await moviesRes.json();
      allSchedules = await schedulesRes.json();

      if (!allVenues.length) {
        container.innerHTML = `
          <div class="venue-empty">
            <div style="font-size:2.5rem;opacity:.3">🏨</div>
            <div>No venues available at the moment.</div>
          </div>`;
        return;
      }

      selectedId = allVenues[0].id;
      renderStrip();
      renderDetail();

    } catch (err) {
      container.innerHTML = `
        <div class="venue-empty">
          <div style="font-size:2.5rem;opacity:.3">⚠️</div>
          <div>Failed to load venues. Please refresh.</div>
        </div>`;
      console.error("Venues fetch error:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", fetchVenues);
})();