/* ===========================
   MOVIE SCHEDULE — movie_schedule.js
   Fetches /api/movies, /api/schedules, /api/venues
   and renders showtimes for the selected date.
   =========================== */

(function () {
  "use strict";

  /* ── State ── */
  let allMovies    = [];
  let allSchedules = [];
  let allVenues    = {};          // keyed by venue id
  let selectedDate = todayStr(); // "YYYY-MM-DD"
  let weekOffset   = 0;          // weeks shifted from today

  /* ── Helpers ── */
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function fmtLabel(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  function fmtTime12(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  /* ── Schedule status helpers ── */

  // Returns a Date for when a schedule slot ends (date + end_time)
  function slotEndDt(s) {
    return new Date(`${s.date}T${s.end_time}`);
  }

  // Returns a Date for when a schedule slot starts
  function slotStartDt(s) {
    return new Date(`${s.date}T${s.start_time}`);
  }

  // "ended"       — end_time is in the past
  // "showing"     — start_time <= now <= end_time
  // "coming_soon" — start_time is in the future
  function slotStatus(s) {
    const now   = new Date();
    const start = slotStartDt(s);
    const end   = slotEndDt(s);
    if (now > end)               return "ended";
    if (now >= start && now <= end) return "showing";
    return "coming_soon";
  }

  // Build the visible schedule list:
  //   • all "showing" and "coming_soon" slots
  //   • exactly ONE "ended" slot — the most recently ended one
  function visibleSchedules() {
    const ended       = allSchedules.filter(s => slotStatus(s) === "ended");
    const notEnded    = allSchedules.filter(s => slotStatus(s) !== "ended");

    // Pick the single most-recently-ended slot
    const lastEnded   = ended.sort((a, b) => slotEndDt(b) - slotEndDt(a))[0];

    return lastEnded ? [lastEnded, ...notEnded] : notEnded;
  }

  function datesWithShows() {
    const set = new Set(visibleSchedules().map(s => s.date));
    return set;
  }

  /* ── Date-strip rendering ── */
  function renderDateStrip() {
    const strip  = document.getElementById("dateStrip");
    const today  = todayStr();
    const base   = addDays(today, weekOffset * 7);
    const days   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const hasSh  = datesWithShows();

    strip.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const dateStr = addDays(base, i);
      const d       = new Date(dateStr + "T00:00:00");
      const pill    = document.createElement("div");

      pill.className = "date-pill";
      if (dateStr === today)        pill.classList.add("today");
      if (dateStr === selectedDate) pill.classList.add("active");
      if (hasSh.has(dateStr))       pill.classList.add("has-shows");

      pill.innerHTML = `
        <div class="dp-day">${days[d.getDay()]}</div>
        <div class="dp-num">${d.getDate()}</div>
        <div class="dp-dot"></div>
      `;

      pill.addEventListener("click", () => selectDate(dateStr));
      strip.appendChild(pill);
    }
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    renderDateStrip();
    document.getElementById("schedDateLabel").textContent = fmtLabel(dateStr);
    renderSchedule();
  }

  /* ── Schedule rendering ── */
  function renderSchedule() {
    const container = document.getElementById("schedContent");
    const title     = document.getElementById("schedTitle");

    // Filter visible schedules for the selected date
    const daySchedules = visibleSchedules().filter(s => s.date === selectedDate);

    if (daySchedules.length === 0) {
      title.textContent = "No showtimes";
      container.innerHTML = `
        <div class="sched-empty">
          <div class="sched-empty-icon">🎬</div>
          <div>No showtimes available for this date.</div>
          <div style="font-size:11px;margin-top:4px;opacity:.6;">Try another day using the date picker above.</div>
        </div>`;
      return;
    }

    // Group by movie_id
    const byMovie = {};
    for (const s of daySchedules) {
      if (!byMovie[s.movie_id]) byMovie[s.movie_id] = [];
      byMovie[s.movie_id].push(s);
    }

    title.textContent = `${Object.keys(byMovie).length} movie${Object.keys(byMovie).length !== 1 ? "s" : ""} showing`;

    const movieIds = Object.keys(byMovie);
    let html = "";

    movieIds.forEach((mid, idx) => {
      const movie    = allMovies.find(m => m.id === parseInt(mid));
      if (!movie) return;

      const slots    = byMovie[mid].sort((a, b) => a.start_time.localeCompare(b.start_time));
      const isLast   = idx === movieIds.length - 1;

      html += `
        <div class="sched-movie-block">
          <div class="sched-movie-row">
            <div class="sched-poster">
              <img src="static/uploads/${movie.movie_image}" alt="${escHtml(movie.movie_name)}"
                   onerror="this.style.display='none'">
            </div>
            <div class="sched-movie-info">
              <div class="sched-movie-name">${escHtml(movie.movie_name)}</div>
              <div class="sched-movie-meta">
                <span>${movie.duration} min</span>
                ${movie.genre ? `<span class="sched-genre-chip">${escHtml(movie.genre)}</span>` : ""}
                ${movie.age_restrict ? `<span class="sched-age-chip">${escHtml(movie.age_restrict)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="sched-slots">
            ${slots.map(s => buildSlotCard(s, slotStatus(s))).join("")}
          </div>
        </div>
        ${!isLast ? '<div class="sched-divider"></div>' : ""}
      `;
    });

    container.innerHTML = html;
  }

  function buildSlotCard(s, status) {
    const venue      = allVenues[s.venue_id] || {};
    const venueName  = venue.venue_name || `Venue #${s.venue_id}`;
    const room       = venue.room ? ` · ${venue.room}` : "";
    const isInactive = s.active !== "True" && s.active !== true;
    const bookUrl    = `/book/${s.id}`;
    const isEnded    = status === "ended";
    const isShowing  = status === "showing";

    let actionHtml;
    if (isInactive) {
      actionHtml = `<div style="font-size:10px;color:var(--text3);margin-top:6px;">Cancelled</div>`;
    } else if (isEnded) {
      actionHtml = `<div style="font-size:10px;color:red;margin-top:6px;">Ended</div>`;
    } else if (isShowing) {
      actionHtml = `<a class="slot-book-btn" href="${bookUrl}" style="background:var(--green,#18a200);">Now Showing — Book</a>`;
    } else {
      actionHtml = `<a class="slot-book-btn" href="${bookUrl}">Book Seat</a>`;
    }

    let starTime;
    if (isEnded) {
      starTime = `<div class="slot-time-ended">${fmtTime12(s.start_time)}</div>
        <div class="slot-end-ended">${fmtTime12(s.end_time)}</div>`;
    } else {
      starTime = `<div class="slot-time">${fmtTime12(s.start_time)}</div>
        <div class="slot-end">${fmtTime12(s.end_time)}</div>`;
    }

    return `
      <div class="sched-slot${isEnded || isInactive ? " inactive" : ""}">
        ${starTime}
        <div class="slot-venue">${escHtml(venueName)}${escHtml(room)}</div>
        ${actionHtml}
      </div>
    `;
  }

  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Week navigation ── */
  window.shiftWeek = function (dir) {
    weekOffset += dir;
    renderDateStrip();
  };

  /* ── Data fetching ── */
  async function fetchAll() {
    try {
      const [moviesRes, schedulesRes, venuesRes] = await Promise.all([
        fetch("/api/movies"),
        fetch("/api/schedules"),
        fetch("/api/venues"),
      ]);

      allMovies    = await moviesRes.json();
      allSchedules = await schedulesRes.json();

      const venuesArr = await venuesRes.json();
      allVenues = {};
      for (const v of venuesArr) allVenues[v.id] = v;

      // Auto-select today (or first available date if today has no shows)
      const today = todayStr();
      const available = [...datesWithShows()].sort();
      if (!datesWithShows().has(today) && available.length) {
        // shift weekOffset so the first available date is visible
        const diff = Math.floor(
          (new Date(available[0] + "T00:00:00") - new Date(today + "T00:00:00"))
          / (7 * 24 * 3600 * 1000)
        );
        weekOffset = diff;
        selectedDate = available[0];
      }

      renderDateStrip();
      document.getElementById("schedDateLabel").textContent = fmtLabel(selectedDate);
      renderSchedule();

    } catch (err) {
      document.getElementById("schedContent").innerHTML = `
        <div class="sched-empty">
          <div class="sched-empty-icon">⚠️</div>
          <div>Failed to load schedule. Please refresh the page.</div>
        </div>`;
      console.error("Schedule fetch error:", err);
    }
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", fetchAll);
})();