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
  let calYear      = 0;          // currently displayed calendar year
  let calMonth     = 0;          // currently displayed calendar month (0-11)

  /* ── Helpers ── */
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
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

  function slotEndDt(s) {
    return new Date(`${s.date}T${s.end_time}`);
  }

  function slotStartDt(s) {
    return new Date(`${s.date}T${s.start_time}`);
  }

  function slotStatus(s) {
    const now   = new Date();
    const start = slotStartDt(s);
    const end   = slotEndDt(s);
    if (now > end)                  return "ended";
    if (now >= start && now <= end) return "showing";
    return "coming_soon";
  }

  // Build the visible schedule list:
  //   • all "showing" and "coming_soon" slots
  //   • exactly ONE "ended" slot — the most recently ended one
  function visibleSchedules() {
    const ended    = allSchedules.filter(s => slotStatus(s) === "ended");
    const notEnded = allSchedules.filter(s => slotStatus(s) !== "ended");
    const lastEnded = ended.sort((a, b) => slotEndDt(b) - slotEndDt(a))[0];
    return lastEnded ? [lastEnded, ...notEnded] : notEnded;
  }

  function datesWithShows() {
    return new Set(visibleSchedules().map(s => s.date));
  }

  /* ── Month Calendar rendering ── */
  function renderCalendar() {
    const grid  = document.getElementById("calGrid");
    const label = document.getElementById("calMonthLabel");
    const today = todayStr();
    const hasSh = datesWithShows();

    // Month name + year label
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    label.textContent = `${monthNames[calMonth]} ${calYear}`;

    // First day of this month (0=Sun … 6=Sat) and total days
    const firstDow  = new Date(calYear, calMonth, 1).getDay();
    const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();

    grid.innerHTML = "";

    // Leading empty cells before the 1st
    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement("div");
      blank.className = "cal-cell cal-cell--empty";
      grid.appendChild(blank);
    }

    // One cell per day
    for (let day = 1; day <= daysInMon; day++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cell    = document.createElement("div");

      cell.className = "cal-cell";
      if (dateStr === today)        cell.classList.add("cal-cell--today");
      if (dateStr === selectedDate) cell.classList.add("cal-cell--active");
      if (hasSh.has(dateStr))       cell.classList.add("cal-cell--has-shows");

      cell.innerHTML = `<span class="cal-day-num">${day}</span><span class="cal-dot"></span>`;
      cell.addEventListener("click", () => selectDate(dateStr));
      grid.appendChild(cell);
    }
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    document.getElementById("schedDateLabel").textContent = fmtLabel(dateStr);
    renderSchedule();
  }

  /* ── Month navigation ── */
  window.shiftMonth = function (dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0;  calYear++; }
    if (calMonth < 0)  { calMonth = 11; calYear--; }
    renderCalendar();
  };

  /* ── Schedule rendering ── */
  function renderSchedule() {
    const container = document.getElementById("schedContent");
    const title     = document.getElementById("schedTitle");

    const daySchedules = visibleSchedules().filter(s => s.date === selectedDate);

    if (daySchedules.length === 0) {
      title.textContent = "No showtimes";
      container.innerHTML = `
        <div class="sched-empty">
          <div class="sched-empty-icon">🎬</div>
          <div>No showtimes available for this date.</div>
          <div style="font-size:11px;margin-top:4px;opacity:.6;">Try another day using the calendar above.</div>
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
      const movie = allMovies.find(m => m.id === parseInt(mid));
      if (!movie) return;

      const slots  = byMovie[mid].sort((a, b) => a.start_time.localeCompare(b.start_time));
      const isLast = idx === movieIds.length - 1;

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

      // Initialise calendar to today's month (or first available show month)
      const today    = todayStr();
      const now      = new Date();
      calYear        = now.getFullYear();
      calMonth       = now.getMonth();

      const available = [...datesWithShows()].sort();

      if (!datesWithShows().has(today) && available.length) {
        // Jump to the month of the first available showdate
        const firstAvail = new Date(available[0] + "T00:00:00");
        calYear          = firstAvail.getFullYear();
        calMonth         = firstAvail.getMonth();
        selectedDate     = available[0];
      }

      renderCalendar();
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