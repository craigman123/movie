/* ===========================
   MOVIE VENUES — movie_venues.js
   Groups venues by name, reveals rooms on selection,
   shows aired movies per room.
   =========================== */

(function () {
  "use strict";

  let allVenues    = [];   // raw from /api/venues
  let allMovies    = [];
  let allSchedules = [];

  // Groups: { name, image, rooms: [venue, …] }
  let venueGroups  = [];
  let selectedGroup = null;  // group name
  let selectedRoom  = null;  // venue id

  /* ── Helpers ── */
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function imgSrc(filename) {
    return filename ? `/static/uploads/${filename}` : null;
  }

  /* ── Group venues by name ── */
  function buildGroups(venues) {
    const map = new Map();
    for (const v of venues) {
      const key = v.venue_name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: v.venue_name, image: v.image, rooms: [] });
      }
      map.get(key).rooms.push(v);
      // Prefer any image across rooms
      if (!map.get(key).image && v.image) map.get(key).image = v.image;
    }
    return [...map.values()];
  }

  /* ── Render left panel (group list) ── */
  function renderGroupList(groups) {
    const container = document.getElementById("venueGroupList");
    const loading   = document.getElementById("venueListLoading");
    loading.style.display = "none";

    if (!groups.length) {
      container.innerHTML = `<div class="venue-empty" style="padding:40px 20px">
        <div style="font-size:2rem;opacity:.3">🏨</div>
        <div>No venues found.</div>
      </div>`;
      return;
    }

    container.innerHTML = groups.map(g => {
      const isActive = selectedGroup === g.name;
      const src = imgSrc(g.image);
      const roomCount = g.rooms.length;
      const thumb = src
        ? `<img src="${esc(src)}" alt="${esc(g.name)}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`
        : "";
      const ph = `<div class="vg-thumb-ph" ${src ? 'style="display:none"' : ""}>🏨</div>`;

      return `
        <div class="venue-group-card ${isActive ? "active" : ""}" data-name="${esc(g.name)}">
          <div class="vg-thumb">${thumb}${ph}</div>
          <div class="vg-info">
            <div class="vg-name">${esc(g.name)}</div>
            <div class="vg-rooms-count">${roomCount} room${roomCount !== 1 ? "s" : ""}</div>
          </div>
          <div class="vg-arrow">${isActive ? "▾" : "›"}</div>
        </div>
        ${isActive ? renderRoomPills(g) : ""}
      `;
    }).join("");

    // Click handlers
    container.querySelectorAll(".venue-group-card").forEach(card => {
      card.addEventListener("click", () => selectGroup(card.dataset.name));
    });
    container.querySelectorAll(".room-pill").forEach(pill => {
      pill.addEventListener("click", e => {
        e.stopPropagation();
        selectRoom(parseInt(pill.dataset.id));
      });
    });
  }

  function renderRoomPills(group) {
    if (!group.rooms.length) return "";
    return `
      <div class="room-pill-list">
        ${group.rooms.map(v => `
          <div class="room-pill ${v.id === selectedRoom ? "active" : ""}" data-id="${v.id}">
            <span class="room-pill-icon">🎭</span>
            <span>${esc(v.room || "Main Hall")}</span>
          </div>
        `).join("")}
      </div>`;
  }

  function selectGroup(name) {
    if (selectedGroup === name) {
      // Toggle off
      selectedGroup = null;
      selectedRoom  = null;
      showDetailPlaceholder();
    } else {
      selectedGroup = name;
      const group = venueGroups.find(g => g.name === name);
      // Auto-select first room
      selectedRoom = group?.rooms[0]?.id ?? null;
      if (selectedRoom) renderRoomDetail(selectedRoom);
    }
    renderGroupList(currentGroups());
  }

  function selectRoom(venueId) {
    selectedRoom = venueId;
    renderGroupList(currentGroups());
    renderRoomDetail(venueId);
  }

  /* ── Right panel: room detail ── */
  function renderRoomDetail(venueId) {
    const placeholder = document.getElementById("venueDetailPlaceholder");
    const detail      = document.getElementById("venueRoomDetail");
    const v = allVenues.find(x => x.id === venueId);
    if (!v) { showDetailPlaceholder(); return; }

    placeholder.style.display = "none";
    detail.style.display      = "block";

    const src     = imgSrc(v.image);
    const avClass = (v.venue_availability || "").toLowerCase().includes("everyday") ||
                    (v.venue_availability || "").toLowerCase().includes("available") ||
                    (v.venue_availability || "").toLowerCase().includes("open")
                    ? "available" : "unavailable";

    const heroHtml = src
      ? `<img src="${esc(src)}" alt="${esc(v.venue_name)}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : "";
    const heroPh = `<div class="venue-hero-placeholder" ${src ? 'style="display:none"' : ""}>🏨</div>`;

    const mapLink = v.venue_link
      ? `<a class="venue-map-btn" href="${esc(v.venue_link)}" target="_blank" rel="noopener">📍 View on Map</a>`
      : "";

    detail.innerHTML = `
      <div class="venue-detail" style="margin:0">
        <div class="venue-hero">
          ${heroHtml}${heroPh}
          <div class="venue-hero-overlay"></div>
          <div class="venue-hero-badge ${avClass}">${esc(v.venue_availability || "Unknown")}</div>
        </div>
        <div class="venue-body">
          <div class="venue-title-row">
            <div>
              <div class="venue-name">${esc(v.venue_name)}</div>
              ${v.room ? `<div class="venue-room-label">Room · ${esc(v.room)}</div>` : ""}
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
          ${buildVenueMovies(venueId)}
        </div>
      </div>
    `;
  }

  function showDetailPlaceholder() {
    document.getElementById("venueDetailPlaceholder").style.display = "";
    document.getElementById("venueRoomDetail").style.display = "none";
  }

  /* ── Movies at this venue ── */
  function buildVenueMovies(venueId) {
    const now   = new Date();
    const slots = allSchedules.filter(s => s.venue_id === venueId);
    if (!slots.length) return `
      <div class="vm-section">
        <div class="vm-section-title">Movies</div>
        <div class="venue-empty" style="padding:24px 0;font-size:12px">No movies scheduled here yet.</div>
      </div>`;

    const endedSlots  = slots.filter(s => new Date(`${s.date}T${s.end_time}`) < now);
    const activeSlots = slots.filter(s => new Date(`${s.date}T${s.end_time}`) >= now);

    const activeMovieIds = [...new Set(activeSlots.map(s => s.movie_id))];

    let lastEndedMovieId = null;
    if (endedSlots.length) {
      const sorted = [...endedSlots].sort((a, b) =>
        new Date(`${b.date}T${b.end_time}`) - new Date(`${a.date}T${a.end_time}`)
      );
      const candidate = sorted[0].movie_id;
      if (!activeMovieIds.includes(candidate)) lastEndedMovieId = candidate;
    }

    // Also include ALL ended movies, not just the latest
    const allEndedMovieIds = [...new Set(endedSlots.map(s => s.movie_id))]
      .filter(id => !activeMovieIds.includes(id));

    const movieIds = [...activeMovieIds, ...allEndedMovieIds];
    if (!movieIds.length) return "";

    // Split into active / ended sections
    const activeCards = activeMovieIds.map(mid => buildMovieCard(mid, venueId, slots, now, false)).filter(Boolean);
    const endedCards  = allEndedMovieIds.map(mid => buildMovieCard(mid, venueId, slots, now, true)).filter(Boolean);

    let html = `<div class="vm-section"><div class="vm-section-title">Movies</div><div class="vm-list">`;

    if (activeCards.length) {
      html += activeCards.join("");
    }

    if (endedCards.length) {
      html += `
        <div class="vm-ended-header">
          <span>Previously Aired</span>
          <button class="vm-toggle-ended" onclick="this.closest('.vm-ended-wrap').classList.toggle('open')">Show ▾</button>
        </div>
        <div class="vm-ended-wrap">
          ${endedCards.join("")}
        </div>`;
    }

    html += `</div></div>`;

    if (!activeCards.length && !endedCards.length) return "";
    return html;
  }

  function buildMovieCard(mid, venueId, slots, now, forceEnded) {
    const m = allMovies.find(x => x.id === mid);
    if (!m) return "";

    const movieSlots = slots.filter(s => s.movie_id === mid);
    const isShowing  = !forceEnded && movieSlots.some(s => {
      const start = new Date(`${s.date}T${s.start_time}`);
      const end   = new Date(`${s.date}T${s.end_time}`);
      return now >= start && now <= end;
    });
    const isEnded = forceEnded;

    // Nearest upcoming slot
    const upcoming = movieSlots
      .filter(s => new Date(`${s.date}T${s.start_time}`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.start_time}`) - new Date(`${b.date}T${b.start_time}`))[0];

    const dateHint = upcoming
      ? `<span class="vm-date">${upcoming.date} · ${upcoming.start_time}–${upcoming.end_time}</span>`
      : "";

    const badge = isEnded
      ? `<span class="vm-badge ended">Aired</span>`
      : isShowing
        ? `<span class="vm-badge showing">Now Showing</span>`
        : `<span class="vm-badge soon">Coming Soon</span>`;

    const poster = m.movie_image ? `/static/uploads/${esc(m.movie_image)}` : null;

    return `
      <a class="vm-card${isEnded ? " vm-ended" : ""}" href="/view_movie/${m.id}">
        <div class="vm-poster">
          ${poster
            ? `<img src="${poster}" alt="${esc(m.movie_name)}" onerror="this.style.display='none'">`
            : `<div class="vm-poster-ph">🎬</div>`}
        </div>
        <div class="vm-info">
          <div class="vm-title">${esc(m.movie_name)}</div>
          <div class="vm-meta">
            ${badge}
            ${m.genre ? `<span class="vm-genre">${esc(m.genre)}</span>` : ""}
            ${m.age_restrict ? `<span class="vm-age">${esc(m.age_restrict)}</span>` : ""}
            <span class="vm-dur">${m.duration} min</span>
          </div>
          ${dateHint}
        </div>
      </a>`;
  }

  /* ── Search ── */
  function setupSearch() {
    const input   = document.getElementById("venueSearchInput");
    const clear   = document.getElementById("venueSearchClear");
    const results = document.getElementById("venueSearchResults");

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      clear.style.display = q ? "block" : "none";

      if (!q) {
        results.style.display = "none";
        renderGroupList(venueGroups);
        return;
      }

      // Filter groups and rooms matching the query
      const matched = venueGroups
        .map(g => {
          // Check if group name matches
          const nameMatch = g.name.toLowerCase().includes(q);
          // Filter rooms matching by room name
          const matchedRooms = g.rooms.filter(r =>
            (r.room || "").toLowerCase().includes(q) || nameMatch
          );
          if (!matchedRooms.length) return null;
          return { ...g, rooms: matchedRooms };
        })
        .filter(Boolean);

      renderGroupList(matched);
    });

    clear.addEventListener("click", () => {
      input.value = "";
      clear.style.display = "none";
      results.style.display = "none";
      renderGroupList(venueGroups);
      input.focus();
    });
  }

  function currentGroups() {
    const q = (document.getElementById("venueSearchInput")?.value || "").trim().toLowerCase();
    if (!q) return venueGroups;
    return venueGroups
      .map(g => {
        const nameMatch = g.name.toLowerCase().includes(q);
        const matchedRooms = g.rooms.filter(r =>
          (r.room || "").toLowerCase().includes(q) || nameMatch
        );
        if (!matchedRooms.length) return null;
        return { ...g, rooms: matchedRooms };
      })
      .filter(Boolean);
  }

  /* ── Bootstrap ── */
  async function fetchAll() {
    try {
      const [vR, mR, sR] = await Promise.all([
        fetch("/api/venues"),
        fetch("/api/movies"),
        fetch("/api/schedules"),
      ]);
      allVenues    = await vR.json();
      allMovies    = await mR.json();
      allSchedules = await sR.json();

      venueGroups = buildGroups(allVenues);

      if (!venueGroups.length) {
        document.getElementById("venueListLoading").innerHTML = `
          <div class="venue-empty">
            <div style="font-size:2rem;opacity:.3">🏨</div>
            <div>No venues available.</div>
          </div>`;
        return;
      }

      renderGroupList(venueGroups);
      setupSearch();

    } catch (err) {
      document.getElementById("venueListLoading").innerHTML = `
        <div class="venue-empty">
          <div style="font-size:2rem;opacity:.3">⚠️</div>
          <div>Failed to load venues. Please refresh.</div>
        </div>`;
      console.error("Venues fetch error:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", fetchAll);
})();