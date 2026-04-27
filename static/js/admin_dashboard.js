// ═══════════════════════════════════════════════════════════════
//  admin_dashboard.js  —  Add Movie page logic
//  Logic:
//    Movie (always required)
//    Venue (optional — unlocks once movie info is filled)
//    Schedule (required only when venue is set, locked otherwise)
// ═══════════════════════════════════════════════════════════════

let movieSchedules   = [];
let scheduleCounter  = 0;

// ── Helpers ──────────────────────────────────────────────────────
const GREEN_BG  = "linear-gradient(120deg, rgba(98,255,0,.52), rgba(57,67,55,.2))";
const RED_BG    = "linear-gradient(135deg, rgba(255,0,0,.4), rgba(255,0,0,.24))";
const CLEAR_BG  = "";

// ── isMovieFilled: returns true when the movie section is complete
function isMovieFilled() {
    const name     = document.getElementById('movie_name_input');
    const poster   = document.getElementById('fileposter');
    const trailer  = document.getElementById('filetrailer');
    const genre    = document.querySelectorAll('input[name="genres[]"]');
    const duration = document.querySelector('input[name="duration"]');
    const release  = document.querySelector('input[name="release_date"]');

    const nameOk     = name     && name.value.trim() !== '';
    const posterOk   = poster   && poster.files.length > 0;
    const trailerOk  = trailer  && trailer.files.length > 0;
    const genreOk    = Array.from(genre).some(c => c.checked);
    const durationOk = duration && duration.value.trim() !== '';
    const releaseOk  = release  && release.value.trim() !== '';

    return nameOk && posterOk && trailerOk && genreOk && durationOk && releaseOk;
}

// ── isVenueFilled: returns true when venue name is entered
function isVenueFilled() {
    const venueName = document.getElementById('venue-name');
    return venueName && venueName.value.trim() !== '';
}

// ── isScheduleFilled
function isScheduleFilled() {
    return movieSchedules.length > 0;
}

// ── updateSectionLocks: show/hide lock overlays & step indicators
function updateSectionLocks() {
    const movieFilled   = isMovieFilled();
    const venueFilled   = isVenueFilled();
    const scheduleFilled = isScheduleFilled();

    const venueLock     = document.getElementById('venue-lock');
    const scheduleLock  = document.getElementById('schedule-lock');
    const stepVenue     = document.getElementById('step-venue');
    const stepSchedule  = document.getElementById('step-schedule');
    const stepMovie     = document.getElementById('step-movie');
    const line1         = document.getElementById('line-1');
    const line2         = document.getElementById('line-2');

    // Movie step
    if (movieFilled) {
        stepMovie.className = 'am-step done';
    } else {
        stepMovie.className = 'am-step active';
    }

    // Venue lock
    if (movieFilled) {
        venueLock.classList.add('unlocked');
        stepVenue.className = venueFilled ? 'am-step done' : 'am-step active';
        line1.classList.add('lit');
    } else {
        venueLock.classList.remove('unlocked');
        stepVenue.className = 'am-step locked';
        line1.classList.remove('lit');
    }

    // Schedule lock
    if (venueFilled) {
        scheduleLock.classList.add('unlocked');
        stepSchedule.className = scheduleFilled ? 'am-step done' : 'am-step active';
        line2.classList.add('lit');
    } else {
        scheduleLock.classList.remove('unlocked');
        stepSchedule.className = 'am-step locked';
        line2.classList.remove('lit');
    }

    // Update schedule badge & tags based on venue presence
    const scheduleBadge = document.getElementById('schedule-badge');
    const scheduleTag   = document.getElementById('schedule-tag');
    const venueTag      = document.getElementById('venue-tag');

    if (venueFilled) {
        if (scheduleBadge) { scheduleBadge.textContent = 'REQUIRED'; scheduleBadge.className = 'am-section-badge required'; }
        if (scheduleTag)   { scheduleTag.textContent = 'Required'; scheduleTag.className = 'am-check-tag conditional-tag'; }
    } else {
        if (scheduleBadge) { scheduleBadge.textContent = 'REQUIRED WITH VENUE'; scheduleBadge.className = 'am-section-badge required-conditional'; }
        if (scheduleTag)   { scheduleTag.textContent = 'Optional'; scheduleTag.className = 'am-check-tag optional-tag'; }
    }

    updateChecklist();
    updateSubmitButton();
}

// ── updateChecklist: visual tick state for each item
function updateChecklist() {
    const posterOk   = document.getElementById('fileposter')?.files.length > 0;
    const trailerOk  = document.getElementById('filetrailer')?.files.length > 0;
    const genreOk    = Array.from(document.querySelectorAll('input[name="genres[]"]')).some(c => c.checked);
    const venueOk    = isVenueFilled();
    const scheduleOk = isScheduleFilled();

    setCheckIcon('check-poster-icon',   posterOk   ? 'done' : 'error',  posterOk   ? 'fa-check-circle' : 'fa-circle');
    setCheckIcon('check-trailer-icon',  trailerOk  ? 'done' : 'error',  trailerOk  ? 'fa-check-circle' : 'fa-circle');
    setCheckIcon('check-genre-icon',    genreOk    ? 'done' : 'error',  genreOk    ? 'fa-check-circle' : 'fa-circle');
    setCheckIcon('check-venue-icon',    venueOk    ? 'done' : '',        venueOk    ? 'fa-check-circle' : 'fa-circle');

    // Schedule icon depends on venue
    if (scheduleOk) {
        setCheckIcon('check-schedule-icon', 'done', 'fa-check-circle');
    } else if (venueOk) {
        setCheckIcon('check-schedule-icon', 'warn', 'fa-exclamation-circle');
    } else {
        setCheckIcon('check-schedule-icon', '', 'fa-circle');
    }
}

function setCheckIcon(id, state, iconClass) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'am-check-icon' + (state ? ' ' + state : '');
    el.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

// ── updateSubmitButton: enable/disable & feedback text
function updateSubmitButton() {
    const btn      = document.getElementById('submit-btn');
    const noteEl   = document.getElementById('am-submit-note');
    if (!btn) return;

    const posterOk   = document.getElementById('fileposter')?.files.length > 0;
    const trailerOk  = document.getElementById('filetrailer')?.files.length > 0;
    const genreOk    = Array.from(document.querySelectorAll('input[name="genres[]"]')).some(c => c.checked);
    const venueOk    = isVenueFilled();
    const scheduleOk = isScheduleFilled();

    // If venue is filled, schedule is required
    const scheduleBlock = venueOk && !scheduleOk;

    const canSubmit = posterOk && trailerOk && genreOk && !scheduleBlock;

    btn.disabled = !canSubmit;
    btn.classList.toggle('ready', canSubmit);

    if (noteEl) {
        if (canSubmit) {
            noteEl.textContent = venueOk
                ? 'Movie, venue and schedule are set — ready to submit!'
                : 'Movie details complete — ready to submit without a venue.';
            noteEl.style.color = '#46e59d';
        } else if (scheduleBlock) {
            noteEl.textContent = 'You added a venue — a schedule is now required.';
            noteEl.style.color = '#fbbf24';
        } else {
            const missing = [];
            if (!posterOk)  missing.push('poster');
            if (!trailerOk) missing.push('trailer');
            if (!genreOk)   missing.push('genre');
            noteEl.textContent = `Still needed: ${missing.join(', ')}.`;
            noteEl.style.color = '#f87171';
        }
    }

    // Expose globally for schedule add/delete callbacks
    window.updateScheduleCheck = function() {
        updateSectionLocks();
    };
}

// ═══════════════════════════════════════════════════════════════
//  DOM READY
// ═══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {

    // ── Poster upload preview ─────────────────────────────────
    const posterInput  = document.getElementById('fileposter');
    const posterHeader = posterInput?.closest('.file-container')?.querySelector('.am-upload-preview');

    posterInput?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            posterHeader.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
        posterInput.closest('.am-upload-card')?.classList.add('ready');
        BorderPoster(document.getElementById('borderposter'));
        updateSectionLocks();
    });

    // ── Trailer upload preview ────────────────────────────────
    const trailerInput  = document.getElementById('filetrailer');
    const trailerHeader = trailerInput?.closest('.file-container')?.querySelector('.am-upload-preview');

    trailerInput?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) { alert('Please select a video file.'); return; }

        trailerHeader.innerHTML = '';
        const video = document.createElement('video');
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;';
        video.controls = true;
        video.autoplay = true;
        video.muted    = true;
        video.loop     = true;

        const reader = new FileReader();
        reader.onload = e => { video.src = e.target.result; trailerHeader.appendChild(video); };
        reader.readAsDataURL(file);

        trailerInput.closest('.am-upload-card')?.classList.add('ready');
        if (typeof BorderTrial === 'function') BorderTrial(document.getElementById('bordertrial'));
        updateSectionLocks();
    });

    // ── Venue image upload preview ────────────────────────────
    const venueImgInput  = document.getElementById('filevenue');
    const venueImgHeader = venueImgInput?.closest('.file-container')?.querySelector('.am-upload-preview, .file-header-venue');

    venueImgInput?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            venueImgHeader.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
        venueImgInput.closest('.am-upload-card')?.classList.add('ready');
        BorderVenue(document.getElementById('bordervenue'));
    });

    // ── Genre checkboxes ──────────────────────────────────────
    const genreBorder    = document.querySelector('.genre-border');
    const genreCheckboxes = genreBorder?.querySelectorAll('input[type="checkbox"]') || [];

    function updateGenreBorder() {
        const any = Array.from(genreCheckboxes).some(c => c.checked);
        if (genreBorder) genreBorder.style.background = any ? GREEN_BG : RED_BG;
    }

    genreCheckboxes.forEach(c => c.addEventListener('change', () => {
        updateGenreBorder();
        updateSectionLocks();
    }));
    updateGenreBorder();

    // ── Movie info inputs ─────────────────────────────────────
    const infoBorder = document.querySelector('.info-border');
    const movieInputs = infoBorder?.querySelectorAll('input') || [];

    function updateInfoBorder() {
        const all = Array.from(movieInputs).every(i => i.value.trim() !== '');
        if (infoBorder) infoBorder.style.background = all ? GREEN_BG : RED_BG;
    }

    movieInputs.forEach(i => i.addEventListener('input', () => {
        updateInfoBorder();
        updateSectionLocks();
    }));
    updateInfoBorder();

    // ── Description ───────────────────────────────────────────
    const textarea      = document.querySelector('.description-border textarea');
    const descBorder    = document.querySelector('.description-border');

    textarea?.addEventListener('input', () => {
        if (descBorder) descBorder.style.background = textarea.value.trim() ? GREEN_BG : CLEAR_BG;
        updateSectionLocks();
    });

    // ── Venue name input drives schedule lock ─────────────────
    const venueNameInput = document.getElementById('venue-name');
    venueNameInput?.addEventListener('input', () => {
        updateVenueBorder();
        updateSectionLocks();
    });

    // ── Venue border ──────────────────────────────────────────
    const venueBorder  = document.querySelector('.venue-border');
    const venueInputs  = venueBorder?.querySelectorAll('input.input') || [];

    function updateVenueBorder() {
        const all = Array.from(venueInputs).every(i => i.value.trim() !== '');
        if (venueBorder) venueBorder.style.background = all ? GREEN_BG : CLEAR_BG;
    }

    venueInputs.forEach(i => i.addEventListener('input', updateVenueBorder));
    updateVenueBorder();

    // ── Map border ────────────────────────────────────────────
    const mapBorder   = document.querySelector('.map-border');

    function updateMapBorder() {
        const venueLink = document.getElementById('venue-link');
        const filled = venueLink && venueLink.value.trim() !== '';
        if (mapBorder) mapBorder.style.background = filled ? GREEN_BG : CLEAR_BG;
    }

    // ── Leaflet Pin-Point Map Modal ───────────────────────────
    let leafletMap       = null;
    let leafletMarker    = null;
    let pendingLat       = null;
    let pendingLng       = null;
    let pendingLabel     = '';

    const mapModal        = document.getElementById('map-picker-modal');
    const mapModalClose   = document.getElementById('map-modal-close');
    const mapModalCancel  = document.getElementById('map-modal-cancel');
    const mapModalConfirm = document.getElementById('map-modal-confirm');
    const mapModalStatus  = document.getElementById('map-modal-status');
    const mapModalSearch  = document.getElementById('map-modal-search');
    const mapModalSrchBtn = document.getElementById('map-modal-search-btn');

    const mapOpenBtn      = document.getElementById('venue-map-open-btn');
    const mapEditBtn      = document.getElementById('venue-map-open-btn-edit');
    const mapClearBtn     = document.getElementById('venue-map-clear');
    const pinnedResult    = document.getElementById('map-pinned-result');
    const mapSelectedLbl  = document.getElementById('map-selected-label');
    const mapCoordsLbl    = document.getElementById('map-coords-label');
    const directionsBtn   = document.getElementById('venue-directions-btn');
    const venueLinkHidden = document.getElementById('venue-link');
    const venueLatHidden  = document.getElementById('venue-lat');
    const venueLngHidden  = document.getElementById('venue-lng');

    function openMapModal() {
        mapModal.style.display = 'flex';

        // Init Leaflet only once
        if (!leafletMap) {
            leafletMap = L.map('leaflet-map').setView([10.3157, 123.8854], 13); // default: Cebu City
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(leafletMap);

            leafletMap.on('click', function(e) {
                placePin(e.latlng.lat, e.latlng.lng);
            });
        } else {
            // Force re-render in case modal was hidden
            setTimeout(() => leafletMap.invalidateSize(), 50);
        }

        // If there's already a confirmed pin, pre-load it
        if (venueLinkHidden.value && venueLatHidden.value && venueLngHidden.value) {
            const lat = parseFloat(venueLatHidden.value);
            const lng = parseFloat(venueLngHidden.value);
            placePin(lat, lng, mapSelectedLbl.textContent);
        }
    }

    function placePin(lat, lng, label) {
        pendingLat = lat;
        pendingLng = lng;

        if (leafletMarker) {
            leafletMarker.setLatLng([lat, lng]);
        } else {
            leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletMap);
            leafletMarker.on('dragend', function() {
                const pos = leafletMarker.getLatLng();
                placePin(pos.lat, pos.lng);
            });
        }

        leafletMap.setView([lat, lng], 16);

        if (label) {
            pendingLabel = label;
            mapModalStatus.textContent = `📍 ${label}`;
        } else {
            mapModalStatus.textContent = `Fetching address…`;
            reverseGeocode(lat, lng).then(name => {
                pendingLabel = name;
                mapModalStatus.textContent = `📍 ${name}`;
            });
        }

        mapModalConfirm.disabled = false;
        mapModalConfirm.style.opacity = '1';
    }

    async function reverseGeocode(lat, lng) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    async function modalSearchPlace() {
        const query = mapModalSearch?.value.trim();
        if (!query) return;
        mapModalStatus.textContent = `Searching "${query}"…`;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (!data.length) { mapModalStatus.textContent = 'Location not found. Try a more specific name.'; return; }
            placePin(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
        } catch {
            mapModalStatus.textContent = 'Search failed. Check your connection.';
        }
    }

    function confirmPin() {
        if (pendingLat === null || pendingLng === null) return;

        const mapsUrl = `https://www.google.com/maps?q=${pendingLat},${pendingLng}`;

        venueLinkHidden.value = mapsUrl;
        venueLatHidden.value  = pendingLat;
        venueLngHidden.value  = pendingLng;

        mapSelectedLbl.textContent = pendingLabel || `${pendingLat.toFixed(6)}, ${pendingLng.toFixed(6)}`;
        mapCoordsLbl.textContent   = `${pendingLat.toFixed(6)}, ${pendingLng.toFixed(6)}`;

        directionsBtn.style.display = 'inline-flex';
        directionsBtn.onclick = () => window.open(mapsUrl, '_blank');

        pinnedResult.style.display = 'flex';
        mapOpenBtn.style.display   = 'none';

        closeMapModal();
        updateMapBorder();
        updateSectionLocks();
    }

    function closeMapModal() {
        mapModal.style.display = 'none';
    }

    // Event bindings
    mapOpenBtn?.addEventListener('click', openMapModal);
    mapEditBtn?.addEventListener('click', openMapModal);
    mapModalClose?.addEventListener('click', closeMapModal);
    mapModalCancel?.addEventListener('click', closeMapModal);
    mapModal?.addEventListener('click', (e) => {
        if (e.target === mapModal) closeMapModal();
    });
    mapModalConfirm?.addEventListener('click', confirmPin);
    mapModalSrchBtn?.addEventListener('click', modalSearchPlace);
    mapModalSearch?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); modalSearchPlace(); }
    });

    // Clear map selection
    mapClearBtn?.addEventListener('click', () => {
        venueLinkHidden.value = '';
        if (venueLatHidden)  venueLatHidden.value  = '';
        if (venueLngHidden)  venueLngHidden.value  = '';
        if (mapSelectedLbl)  mapSelectedLbl.textContent = '';
        if (mapCoordsLbl)    mapCoordsLbl.textContent   = '';
        if (directionsBtn)   directionsBtn.style.display = 'none';
        if (pinnedResult)    pinnedResult.style.display  = 'none';
        if (mapOpenBtn)      mapOpenBtn.style.display    = '';
        pendingLat = null; pendingLng = null; pendingLabel = '';
        if (leafletMarker && leafletMap) { leafletMap.removeLayer(leafletMarker); leafletMarker = null; }
        if (mapModalConfirm) { mapModalConfirm.disabled = true; mapModalConfirm.style.opacity = '.4'; }
        updateMapBorder();
        updateSectionLocks();
    });

    // Auto-suggest venue name into search when venue name is typed
    document.getElementById('venue-name')?.addEventListener('change', function () {
        const name = this.value.trim();
        if (name && mapModalSearch && !mapModalSearch.value.trim()) {
            mapModalSearch.value = name;
        }
    });

    // ── Hidden input for venue_date_input ─────────────────────
    const hiddenVenueDate = document.getElementById('venue_date_input');
    if (hiddenVenueDate) hiddenVenueDate.value = '';

    // ── Initial state ─────────────────────────────────────────
    updateSectionLocks();

}); // end DOMContentLoaded

// ═══════════════════════════════════════════════════════════════
//  SCHEDULE MODAL
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    const addMovieBtn = document.getElementById('add-movie-btn');
    const modal       = document.getElementById('availability-modal');
    const cancelBtn   = document.getElementById('cancel-btn');
    let editingSchedule = null;

    function updateHiddenInput() {
        const h = document.getElementById('venue_date_input');
        if (!h) return;
        h.value = movieSchedules.map(s => `${s.startDate} | ${s.time1} | ${s.time2}`).join('|||');
    }

    addMovieBtn?.addEventListener('click', () => {
        editingSchedule = null;
        modal.style.display = 'flex';
    });

    cancelBtn?.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (editingSchedule) {
            movieSchedules.push(editingSchedule);
            updateHiddenInput();
            renderScheduleEntry(editingSchedule);
            editingSchedule = null;
        }
        initializeCurrentDate?.();
        document.getElementById('time1').value = '';
        document.getElementById('time2').value = '';
        modal.style.display = 'none';
    });

    modal?.addEventListener('click', e => {
        if (!e.target.closest('.modal-content')) {
            if (editingSchedule) {
                movieSchedules.push(editingSchedule);
                updateHiddenInput();
                renderScheduleEntry(editingSchedule);
                editingSchedule = null;
            }
            initializeCurrentDate?.();
            document.getElementById('time1').value = '';
            document.getElementById('time2').value = '';
            modal.style.display = 'none';
        }
    });

    // ── Render a schedule entry card ──────────────────────────
    window.renderScheduleEntry = function(entry) {
        const container = document.getElementById('availability-data');
        const emptyMsg  = document.getElementById('schedule-empty-msg');
        if (emptyMsg) emptyMsg.style.display = 'none';

        const displayText = entry.displayDate || `${entry.startDate} (${entry.time1} – ${entry.time2})`;

        const card = document.createElement('div');
        card.className = 'schedule-entry';
        card.id = `schedule-${entry.id}`;
        card.innerHTML = `
            <div>
                <div class="schedule-entry-label"><i class="fas fa-calendar-check"></i> Screening Date</div>
                <div class="schedule-entry-date">${displayText}</div>
            </div>
            <div class="schedule-entry-actions">
                <button type="button" class="sch-edit-btn" onclick="editSchedule(${entry.id})">
                    <i class="fas fa-pen"></i> Edit
                </button>
                <button type="button" class="sch-del-btn" onclick="deleteSchedule(${entry.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        container.appendChild(card);
    };

    // ── Delete ────────────────────────────────────────────────
    window.deleteSchedule = function(id) {
        if (!confirm('Remove this schedule?')) return;
        movieSchedules = movieSchedules.filter(s => s.id !== id);
        document.getElementById(`schedule-${id}`)?.remove();
        updateHiddenInput();

        if (movieSchedules.length === 0) {
            const emptyMsg = document.getElementById('schedule-empty-msg');
            if (emptyMsg) emptyMsg.style.display = 'flex';
        }

        updateSectionLocks();
    };

    // ── Edit ──────────────────────────────────────────────────
    window.editSchedule = function(id) {
        const s = movieSchedules.find(s => s.id === id);
        if (!s) return;

        editingSchedule = { ...s };
        document.getElementById(`schedule-${id}`)?.remove();
        movieSchedules = movieSchedules.filter(s => s.id !== id);
        updateHiddenInput();

        document.getElementById('start-date').textContent = s.startDate;
        document.getElementById('time1').value = s.time1 || '';
        document.getElementById('time2').value = s.time2 || '';
        modal.style.display = 'flex';
    };

    // ── Done (confirm schedule) ───────────────────────────────
    document.getElementById('done-btn')?.addEventListener('click', () => {
        const time1       = document.getElementById('time1').value;
        const time2       = document.getElementById('time2').value;
        const startDateEl = document.getElementById('start-date');
        const startDate   = startDateEl?.textContent;

        if (!time1 || !time2) { alert('Please select both Starting and Ending time.'); return; }
        if (!startDate || startDate === 'none' || startDate === '') { alert('Please select a date from the calendar.'); return; }

        const entry = {
            id: ++scheduleCounter,
            startDate,
            endDate: startDate,
            displayDate: `${startDate}  (${time1} – ${time2})`,
            time1,
            time2
        };

        movieSchedules.push(entry);
        updateHiddenInput();
        renderScheduleEntry(entry);

        editingSchedule = null;
        modal.style.display = 'none';
        initializeCurrentDate?.();
        document.getElementById('time1').value = '';
        document.getElementById('time2').value = '';

        updateSectionLocks();
    });
});

// ═══════════════════════════════════════════════════════════════
//  BORDER UTILITIES (kept for compatibility)
// ═══════════════════════════════════════════════════════════════
function BorderPoster(border) {
    if (border) border.style.background = "linear-gradient(120deg, rgba(98,255,0,.52), rgba(57,67,55,.2))";
}

function BorderTrial(border) {
    if (border) border.style.background = "linear-gradient(120deg, rgba(98,255,0,.52), rgba(57,67,55,.2))";
}

function BorderVenue(border) {
    if (border) border.style.background = "linear-gradient(120deg, rgba(98,255,0,.52), rgba(57,67,55,.2))";
}