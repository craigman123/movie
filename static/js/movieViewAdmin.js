let movieId = null;
let schedules = [];

document.addEventListener("DOMContentLoaded", () => {
    const doneButtons = Array.from(
        document.querySelectorAll("#doneVenueBtn, #doneVenueButton")
    );

    if (!doneButtons.length) {
        return;
    }

    const handleVenueSave = async (e) => {
        e.preventDefault();

        // Always read live from APP_STATE — never cache the reference at startup
        // because addSchedule() pushes to this array after DOMContentLoaded runs
        const movieSchedules = window.APP_STATE?.schedules ?? [];

        const venueName = document.getElementById("venue-name").value.trim();
        const venueRoom = document.getElementById("room").value.trim();
        const venueLink = document.getElementById("venue-link").value.trim();
        const venueAvail = document.getElementById("venue_availability").value;

        const venueImageFile = window.VENUE_STATE.file;
        const venueImageUrl = window.VENUE_STATE.imageUrl;

        const rows = document.getElementById("rows").value;
        const cols = document.getElementById("cols").value;
        const row_gap = document.getElementById("row-gap").value;
        const col_gap = document.getElementById("col-gap").value;

         // ---------- VALIDATION ----------
        if (!venueName) return alert("Venue name is required");
        if (!venueRoom) return alert("Room is required");
        if (!venueLink) return alert("Venue link is required");
        if (!venueAvail) return alert("Venue availability is required");

        const hasImage =
            window.VENUE_STATE.file || window.VENUE_STATE.imageUrl;

        if (!hasImage) return alert("Image required");

        if (!movieSchedules || movieSchedules.length === 0) {
            console.log(movieSchedules);
            return alert("Please add at least one schedule");
        }

        console.log(movieSchedules);

        // ---------- VENUE DATA ----------
        const venueData = {
            name: venueName,
            room: venueRoom,
            link: venueLink,
            availability: venueAvail,

            image: window.VENUE_STATE.file
                ? window.VENUE_STATE.file.name
                : window.VENUE_STATE.imageUrl,

            rows,
            cols,
            row_gap,
            col_gap
        };

        // ---------- PAYLOAD ----------
        const payload = {
            movie_id: movieId,
            venue: venueData,
            schedules: movieSchedules
        };

        console.log("🚀 PAYLOAD:", payload);

        // ---------- API CALL ----------
        try {
            const res = await fetch("/api/venue/create", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                alert("Venue saved successfully!");
                location.reload();
            } else {
                alert("Failed to save venue");
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    };

    doneButtons.forEach((button) => {
        button.addEventListener("click", handleVenueSave);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const mapModal = document.getElementById("map-picker-modal");
    const mapModalClose = document.getElementById("map-modal-close");
    const mapModalCancel = document.getElementById("map-modal-cancel");
    const mapModalConfirm = document.getElementById("map-modal-confirm");
    const mapModalStatus = document.getElementById("map-modal-status");
    const mapModalSearch = document.getElementById("map-modal-search");
    const mapModalSearchBtn = document.getElementById("map-modal-search-btn");

    const mapOpenBtn = document.getElementById("venue-map-open-btn");
    const mapEditBtn = document.getElementById("venue-map-open-btn-edit");
    const mapClearBtn = document.getElementById("venue-map-clear");
    const pinnedResult = document.getElementById("map-pinned-result");
    const mapSelectedLabel = document.getElementById("map-selected-label");
    const mapCoordsLabel = document.getElementById("map-coords-label");
    const directionsBtn = document.getElementById("venue-directions-btn");
    const venueLinkHidden = document.getElementById("venue-link");
    const venueLatHidden = document.getElementById("venue-lat");
    const venueLngHidden = document.getElementById("venue-lng");
    const venueNameInput = document.getElementById("venue-name");
    const venueSelect = document.getElementById("venue-select");

    if (!mapModal || !mapOpenBtn || !venueLinkHidden) {
        return;
    }

    let leafletMap = null;
    let leafletMarker = null;
    let pendingLat = null;
    let pendingLng = null;
    let pendingLabel = "";

    function extractLatLngFromLink(link) {
        if (!link) return null;

        const qMatch = link.match(/[?&]q=([-0-9.]+),([-0-9.]+)/i);
        if (qMatch) {
            return {
                lat: parseFloat(qMatch[1]),
                lng: parseFloat(qMatch[2])
            };
        }

        const atMatch = link.match(/@([-0-9.]+),([-0-9.]+)/i);
        if (atMatch) {
            return {
                lat: parseFloat(atMatch[1]),
                lng: parseFloat(atMatch[2])
            };
        }

        return null;
    }

    function setConfirmButtonState(enabled) {
        mapModalConfirm.disabled = !enabled;
        mapModalConfirm.style.opacity = enabled ? "1" : ".4";
    }

    function setPinnedPreview(link, label, lat, lng) {
        if (!link) {
            pinnedResult.style.display = "none";
            mapOpenBtn.style.display = "inline-flex";
            directionsBtn.style.display = "none";
            directionsBtn.onclick = null;
            mapSelectedLabel.textContent = "";
            mapCoordsLabel.textContent = "";
            return;
        }

        const fallbackLabel =
            label ||
            venueNameInput?.value.trim() ||
            "Pinned venue location";

        mapSelectedLabel.textContent = fallbackLabel;
        mapCoordsLabel.textContent =
            Number.isFinite(lat) && Number.isFinite(lng)
                ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                : "Map link saved";

        directionsBtn.style.display = "inline-flex";
        directionsBtn.onclick = () => window.open(link, "_blank", "noopener");

        pinnedResult.style.display = "flex";
        mapOpenBtn.style.display = "none";
    }

    function syncVenueMapFromForm(preferredLabel) {
        const link = venueLinkHidden.value.trim();

        if (!link) {
            setPinnedPreview("", "", null, null);
            return;
        }

        const parsed = extractLatLngFromLink(link);
        const lat = parsed?.lat ?? parseFloat(venueLatHidden.value);
        const lng = parsed?.lng ?? parseFloat(venueLngHidden.value);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            venueLatHidden.value = lat;
            venueLngHidden.value = lng;
        } else {
            venueLatHidden.value = "";
            venueLngHidden.value = "";
        }

        setPinnedPreview(link, preferredLabel, lat, lng);
    }

    function clearPinnedVenue() {
        venueLinkHidden.value = "";
        venueLatHidden.value = "";
        venueLngHidden.value = "";
        pendingLat = null;
        pendingLng = null;
        pendingLabel = "";

        if (leafletMarker && leafletMap) {
            leafletMap.removeLayer(leafletMarker);
            leafletMarker = null;
        }

        setConfirmButtonState(false);
        mapModalStatus.textContent = "Click on the map to place a pin.";
        setPinnedPreview("", "", null, null);
    }

    function initLeafletMap() {
        if (leafletMap) return;

        leafletMap = L.map("leaflet-map").setView([10.3157, 123.8854], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(leafletMap);

        leafletMap.on("click", (event) => {
            placePin(event.latlng.lat, event.latlng.lng);
        });
    }

    function openMapModal() {
        mapModal.style.display = "flex";
        initLeafletMap();
        setTimeout(() => leafletMap.invalidateSize(), 60);

        const existingLink = venueLinkHidden.value.trim();
        const storedLat = parseFloat(venueLatHidden.value);
        const storedLng = parseFloat(venueLngHidden.value);
        const parsed = extractLatLngFromLink(existingLink);
        const lat = Number.isFinite(storedLat) ? storedLat : parsed?.lat;
        const lng = Number.isFinite(storedLng) ? storedLng : parsed?.lng;

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            placePin(lat, lng, mapSelectedLabel.textContent || venueNameInput?.value.trim());
        } else {
            mapModalStatus.textContent = "Click on the map to place a pin.";
            setConfirmButtonState(false);
        }

        if (venueNameInput?.value.trim() && !mapModalSearch.value.trim()) {
            mapModalSearch.value = venueNameInput.value.trim();
        }
    }

    function closeMapModal() {
        mapModal.style.display = "none";
    }

    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    function placePin(lat, lng, label) {
        pendingLat = lat;
        pendingLng = lng;

        if (leafletMarker) {
            leafletMarker.setLatLng([lat, lng]);
        } else {
            leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletMap);
            leafletMarker.on("dragend", () => {
                const markerPosition = leafletMarker.getLatLng();
                placePin(markerPosition.lat, markerPosition.lng);
            });
        }

        leafletMap.setView([lat, lng], 16);

        if (label) {
            pendingLabel = label;
            mapModalStatus.textContent = label;
        } else {
            mapModalStatus.textContent = "Fetching address...";
            reverseGeocode(lat, lng).then((name) => {
                pendingLabel = name;
                mapModalStatus.textContent = name;
            });
        }

        setConfirmButtonState(true);
    }

    async function searchPlace() {
        const query = mapModalSearch.value.trim();
        if (!query) return;

        mapModalStatus.textContent = `Searching "${query}"...`;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await response.json();

            if (!data.length) {
                mapModalStatus.textContent = "Location not found. Try a more specific search.";
                return;
            }

            placePin(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
        } catch {
            mapModalStatus.textContent = "Search failed. Check your connection.";
        }
    }

    function confirmPin() {
        if (!Number.isFinite(pendingLat) || !Number.isFinite(pendingLng)) {
            return;
        }

        const mapLink = `https://www.google.com/maps?q=${pendingLat},${pendingLng}`;

        venueLinkHidden.value = mapLink;
        venueLatHidden.value = pendingLat;
        venueLngHidden.value = pendingLng;

        setPinnedPreview(
            mapLink,
            pendingLabel || venueNameInput?.value.trim(),
            pendingLat,
            pendingLng
        );

        closeMapModal();
    }

    mapOpenBtn.addEventListener("click", openMapModal);
    mapEditBtn?.addEventListener("click", openMapModal);
    mapClearBtn?.addEventListener("click", clearPinnedVenue);
    mapModalClose?.addEventListener("click", closeMapModal);
    mapModalCancel?.addEventListener("click", closeMapModal);
    mapModalConfirm?.addEventListener("click", confirmPin);
    mapModalSearchBtn?.addEventListener("click", searchPlace);

    mapModal.addEventListener("click", (event) => {
        if (event.target === mapModal) {
            closeMapModal();
        }
    });

    mapModalSearch?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchPlace();
        }
    });

    venueSelect?.addEventListener("change", () => {
        setTimeout(() => {
            syncVenueMapFromForm(venueNameInput?.value.trim());
        }, 0);
    });

    venueNameInput?.addEventListener("change", () => {
        if (venueNameInput.value.trim() && !mapModalSearch.value.trim()) {
            mapModalSearch.value = venueNameInput.value.trim();
        }

        if (venueLinkHidden.value.trim()) {
            syncVenueMapFromForm(venueNameInput.value.trim());
        }
    });

    syncVenueMapFromForm(venueNameInput?.value.trim());
    window.closeVenueMapModal = closeMapModal;
});

function deleteMovie(event) {
    event.preventDefault();

    const button = event.target;
    const movieId = button.dataset.movieId;

    if (!confirm("Are you sure you want to delete this movie?")) {
        return;
    }

    fetch(`/delete_movie/${movieId}`, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Movie deleted successfully");

            const movieCard = button.closest(".movie-card");
            movieCard.remove();
        } else {
            alert("Failed to delete movie");
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function openEditModal(event) {
    event.preventDefault();

    const btn = event.currentTarget;
    movieId = btn.dataset.id;
    const movieName = btn.dataset.name;
    const duration = btn.dataset.duration;
    const genresStr = btn.dataset.genres || '';
    const posterUrl = btn.dataset.poster || '';   
    const trailerUrl = btn.dataset.trailer || '';
    const language = btn.dataset.language || '';
    const description = btn.dataset.description || '';
    const movieDate = btn.dataset.movie_date || '';

    try {
        schedules = JSON.parse(btn.dataset.schedules || "[]");
    } catch (e) {
        console.error("Invalid schedule JSON:", e);
        schedules = [];
    }

    const tableBody = document.getElementById("scheduleTableBody");
    tableBody.innerHTML = "";

    schedules.forEach(s => {
        tableBody.innerHTML += `
            <tr>
                <td>${s.id}</td>
                <td>${s.venue}</td>
                <td>${s.date}</td>
                <td>${s.time_status}</td>
                <td>${s.start}</td>
                <td>${s.active_status}</td>
                <td>
                    <button type="button" class="vsched-btn vsched-edit" onclick="openEditScheduleModal(this)"
                        data-id="${s.id}" data-date="${s.date}" data-start="${s.start}"
                        data-active_status="${s.active_status}">
                            Edit</button>

                    <button type="button" class="vsched-btn vsched-delete" onclick="deleteSchedule(${s.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    const genres = genresStr
        ? genresStr.split(',').map(g => g.trim().toLowerCase())
        : [];

    const modal = document.getElementById("backdrop");
    modal.style.display = "flex"; // show modal first

    const checkboxes = document.querySelectorAll('input[name="genres[]"]');

    checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.parentElement;
        label.classList.remove('checked');
    });

    // Check the ones from movie
    genres.forEach(genre => {
        const checkbox = Array.from(checkboxes).find(cb => cb.value.toLowerCase() === genre);
        if (checkbox) {
            checkbox.checked = true;
            const label = checkbox.parentElement;
            label.classList.add('checked');
        }
    });

    const posterInput = document.getElementById('fileposter');
    const posterHeader = posterInput.closest('.file-container').querySelector('.file-header');
    if (posterUrl) {
        posterHeader.innerHTML = `<img src="${posterUrl}" style="width:101%; height:100%; object-fit:cover; border-radius:10px;">`;
    } else {
        // fallback: show upload text if no poster
        posterHeader.innerHTML = `<svg ...></svg><p>UPLOAD MOVIE POSTER</p>`;
    }

    const trailerInput = document.getElementById('filetrailer');
    const trailerHeader = trailerInput.closest('.file-container').querySelector('.file-header');
    if (trailerUrl) {
        trailerHeader.innerHTML = '';
        const video = document.createElement('video');
        video.src = trailerUrl;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.borderRadius = '10px';
        video.controls = true;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        trailerHeader.appendChild(video);
    } else {
        // fallback: show upload text if no trailer
        trailerHeader.innerHTML = `<svg ...></svg><p>UPLOAD VIDEO TRAILER</p>`;
    }

    // Set other movie info
    document.getElementById("edit_movie_id").value = movieId;
    document.querySelector("#editForm input[name='movie_name']").value = movieName;
    document.querySelector("#editForm input[name='duration']").value = duration;
    document.querySelector("#editForm input[name='release_date']").value = movieDate;
    document.querySelector("#editForm textarea[name='description']").value = description;

    const languageField = document.querySelector("#editForm [name='language']");
    if (languageField) languageField.value = language;
    
    const ageSelect = document.querySelector("#editForm select[name='age_restrict']");
    if (ageSelect) {
        ageSelect.value = btn.dataset.age_restrict || 'G';
    }

    const statusSelect = document.querySelector("#editForm select[name='movie_status']");
    if (statusSelect) {
        statusSelect.value = btn.dataset.status || 'onscreen'; // default to onscreen
    }

    console.log({
        statusSelect,
        ageSelect,
        movieId,
        movieName,
        duration,
        genresStr,
        posterUrl,
        trailerUrl,
        language,
        description,
        movieDate
    });

    function closeModal(e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    }

    window.addEventListener("click", closeModal);
}

function closeModal() {
    const modal = document.getElementById("backdrop");
    modal.style.display = "none";
}

window.addEventListener('DOMContentLoaded', () => {

    // Poster
    const posterInput = document.getElementById('fileposter');
    const posterHeader = posterInput.closest('.file-container').querySelector('.file-header');

    posterInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            posterHeader.innerHTML = `<img src="${e.target.result}" style="width:101%; height:100%; object-fit:cover; border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
        BorderPoster(document.getElementById('borderposter'));
    });

    const trailerInput = document.getElementById('filetrailer');

    trailerInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert('Please select a video file.');
            return;
        }

        const trailerContainer = trailerInput.closest('.file-container').querySelector('.file-header');

        trailerContainer.innerHTML = '';

        // Create a video element
        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.borderRadius = '10px';
        video.controls = true;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;

        const reader = new FileReader();
        reader.onload = function (e) {
            video.src = e.target.result;
            trailerContainer.appendChild(video);
        };
        reader.readAsDataURL(file);

        if (typeof BorderTrial === 'function') {
            BorderTrial(document.getElementById('bordertrial'));
        }
    });
});
function openScheduleModal() {
    const modal = document.getElementById("scheduleModal");
    const content = document.getElementById("scheduleContent");

    if (!movieSchedules.length) {
        content.innerHTML = "<p>No schedules available.</p>";
        modal.style.display = "block";
        return;
    }

    let grouped = {};

    movieSchedules.forEach(s => {
        let key = s.venue + " (" + s.room + ")";

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    });

    let html = "";

    for (let venue in grouped) {
        html += `<div class="venue-group">
                    <h4>${venue}</h4>`;

        grouped[venue].forEach(s => {
            html += `
                <div class="schedule-item">
                    <p><strong>Date:</strong> ${s.date}</p>
                    <p><strong>Start:</strong> ${s.start}</p>
                </div>
            `;
        });

        html += `</div>`;
    }

    content.innerHTML = html;
    modal.style.display = "block";
}

function closeScheduleModal() {
    document.getElementById("scheduleModal").style.display = "none";
}

function openAddScheduleModal() {

    document.querySelectorAll('.modal, .addSchedModal').forEach(m => {
        m.style.display = "none";
    });

    const modal = document.getElementById("addScheduleModal");
    modal.style.display = "flex";
}

function closeAddScheduleModal() {
    window.closeVenueMapModal?.();
    document.getElementById("addScheduleModal").style.display = "none";
}

function OpenCalendar() {
    document.getElementById("selectScheduleModalBackdrop").style.display = "flex";
}

function CloseCalendar() {
    document.getElementById("selectScheduleModalBackdrop").style.display = "none";
}

function addSchedule(date, start, venue, room) {
    window.APP_STATE.schedules.push({
        date,
        start,
        venue,
        room
    });

    console.log("Schedules:", window.APP_STATE.schedules);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("doneMovieButton").addEventListener("click", async () => {
        console.log("Updating movie...");
        const form = document.getElementById("editForm");
        const movieId = document.getElementById("edit_movie_id").value;

        const formData = new FormData(form);

        try {
            const res = await fetch(`/update_movie/${movieId}`, {
                method: "POST", 
                body: formData
            });

            if (!res.ok) throw new Error("Update failed");

            alert("Movie updated successfully!");

            // close modal
            closeModal();

            // OPTION A: reload page
            location.reload();

            // OPTION B (better UX): update UI manually instead of reload

        } catch (err) {
            console.error(err);
            alert("Error updating movie");
        }
    });
});

async function deleteSchedule(id) {
    if (!confirm("Are you sure?")) return;

    const res = await fetch(`/delete_schedule/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (data.success) {
        alert("Deleted!");
        location.reload(); // or remove row
    }
}

let editingScheduleId = null;

function openEditScheduleModal(btn) {
    const modal = document.getElementById("editScheduleModalBackdrop");

    const schedule = {
        id: btn.dataset.id,
        date: btn.dataset.date,
        start: btn.dataset.start,
        status: btn.dataset.active_status
    };

    editingScheduleId = schedule.id;
    console.log("Editing schedule:", schedule);

    // ✅ SET DATE (hidden input used by your calendar)
    document.getElementById("edit-selected-date-input").value = schedule.date;

    // ✅ SET TIME
    document.getElementById("time1-edit").value = schedule.start;
    document.getElementById("schedule_status").value = schedule.status;

    const [y, m, d] = schedule.date.split("-");

    const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
    ];

    document.getElementById("edit-start-date").textContent =
    `${monthNames[m - 1]} ${d}, ${y}`;

    highlightSelectedDate(schedule.date);
    modal.style.display = "flex";

    console.log(schedule);
}

function highlightSelectedDate(dateStr) {
    const selectedDate = new Date(dateStr);
    const selectedDay = selectedDate.getDate();

    const days = document.querySelectorAll("#days div");

    days.forEach(day => {
        day.classList.remove("active");

        if (parseInt(day.textContent) === selectedDay) {
            day.classList.add("active");
        }
    });
}

function CloseEditCalendar() {
    document.getElementById("editScheduleModalBackdrop").style.display = "none";
}


document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("done-edit-btn-schedule").addEventListener("click", async () => {
        const rawDate = document.getElementById("edit-selected-date-input").value;

        const correctedDate = rawDate;

        const payload = {
            date: correctedDate,
            start: document.getElementById("time1-edit").value,
            status: document.getElementById("schedule_status").value
        };

        console.log("Payload:", payload);

        let url = "/create_schedule";
        let method = "POST";

        // if editing → switch to update mode
        if (editingScheduleId) {
            url = `/update_schedule/${editingScheduleId}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alert("Saved!");

            editingScheduleId = null;

            location.reload();
        } else {
            alert("Failed");
        }
    });
});