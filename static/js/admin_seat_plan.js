
// global declaration ni very important
window.VENUE_STATE = {
    file: null,
    imageUrl: null
};



let VENUES = [];
let venueData = null;
let seatsData = [];
let selectedSeats = new Set();

function generateSeats(rows, cols) {
    seatsData = [];
    for (let r = 0; r < rows; r++) {
      const rowSeats = [];
      for (let c = 0; c < cols; c++) {
        rowSeats.push({ row: r, col: c, status: 'available' });
      }
      seatsData.push(rowSeats);
    }
    selectedSeats.clear();
  }

  function getRowLabel(index) {
    return String.fromCharCode(65 + index);
  }

  function updateSelectedInfo(selectedSeats, selectedInfo) {
    selectedInfo.textContent = `Selected Seats: ${selectedSeats.size}`;
  }

  function renderSeats(colGap, rowGap, seatContainer, seatSVG, capacityInfo, selectedInfo) {
    const rows = seatsData.length;
    const cols = seatsData[0]?.length || 0;
    seatContainer.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'seat-grid';

    // Header row
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // top-left corner
    let visibleColNumber = 1;
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      if (colGap > 0 && colIndex > 0 && colIndex % colGap === 0) {
        const gapTh = document.createElement('th');
        gapTh.classList.add('gap-cell');
        headerRow.appendChild(gapTh);
      }
      const th = document.createElement('th');
      th.textContent = visibleColNumber++;
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (let r = 0; r < rows; r++) {
      // Add row gap before row if needed
      if (rowGap > 0 && r > 0 && r % rowGap === 0) {
        const gapTr = document.createElement('tr');
        const gapTh = document.createElement('th');
        gapTh.classList.add('gap-cell');
        gapTr.appendChild(gapTh);
        for (let i = 0; i < cols + (colGap > 0 ? Math.floor((cols-1)/colGap) : 0); i++) {
          const gapTd = document.createElement('td');
          gapTd.classList.add('gap-cell');
          gapTr.appendChild(gapTd);
        }
        table.appendChild(gapTr);
      }

      const tr = document.createElement('tr');
      const rowLabel = document.createElement('th');
      rowLabel.textContent = getRowLabel(r);
      tr.appendChild(rowLabel);

      for (let c = 0; c < cols; c++) {
        if (colGap > 0 && c > 0 && c % colGap === 0) {
          const gapTd = document.createElement('td');
          gapTd.classList.add('gap-cell');
          tr.appendChild(gapTd);
        }

        const seat = seatsData[r][c];
        const td = document.createElement('td');
        td.classList.add('seat', seat.status);
        td.dataset.row = seat.row;
        td.dataset.col = seat.col;

        td.innerHTML = seatSVG;

        td.addEventListener('click', () => {
          const key = `${seat.row}-${seat.col}`;
          if (selectedSeats.has(key)) {
            selectedSeats.delete(key);
            td.classList.remove('selected');
          } else {
            selectedSeats.add(key);
            td.classList.add('selected');
          }
          updateSelectedInfo();
        });

        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    seatContainer.appendChild(table);
    capacityInfo.textContent = `Total Capacity: ${rows * cols} seats`;
    updateSelectedInfo(selectedInfo, selectedSeats);
  }

document.addEventListener('DOMContentLoaded', () => {
  const seatContainer = document.getElementById('seat-container');
  const capacityInfo = document.getElementById('capacity-info');
  const selectedInfo = document.getElementById('selected-info');
  const generateBtn = document.getElementById('generate');
  const seatSVG = `<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"
   viewBox="0 0 24 24" transform="scale(-1,1) ">
   <path d="M22 8h-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2v3h2v-3h12v3h2v-3h2c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M5 5h14v3h-1c-.55 0-1 .45-1 1v3H7V9c0-.55-.45-1-1-1H5zm16 12H3v-7h2v3c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3h2z"></path></svg>`;

  generateBtn.addEventListener('click', () => {
    const rows = parseInt(document.getElementById('rows').value, 10);
    const cols = parseInt(document.getElementById('cols').value, 10);
    const colGap = parseInt(document.getElementById('col-gap').value, 10);
    const rowGap = parseInt(document.getElementById('row-gap').value, 10);

    if (isNaN(rows) || rows < 1 || rows > 26) {
      alert('Rows must be 1-26');
      return;
    }
    if (isNaN(cols) || cols < 1 || cols > 30) {
      alert('Columns must be 1-30');
      return;
    }

    generateSeats(rows, cols);
    renderSeats(colGap, rowGap, seatContainer, seatSVG, capacityInfo, selectedInfo);
  });

  // Zoom slider
  const zoomInput = document.getElementById('zoom');
  const zoomValue = document.getElementById('zoom-value');
  const zoomContainer = document.getElementById('zoom-container');

  zoomInput.addEventListener('input', () => {
    const scale = zoomInput.value / 100;
    zoomContainer.style.transform = `scale(${scale})`;
    zoomValue.textContent = `${zoomInput.value}%`;
  });

  // Initial load
  generateBtn.click();
  });

document.addEventListener("DOMContentLoaded", () => {
    const venueModal = document.querySelector(".venue-modal");
    const openVenueBtn = document.getElementById("check-venue-btn");
    const cancelVenueBtn = document.querySelector("#cancel-btn-venue");
    const doneVenueBtn = document.querySelector("#done-btn-venue");
    
    
    // Venue input selectors for dynamic required
    const venueInputNames = ['venue_name', 'venue_link', 'room'];
    
    function setVenueRequired(required) {
        venueInputNames.forEach(name => {
            const input = document.querySelector(`[name="${name}"]`);
            if (input) input.required = required;
        });
        const fileInput = document.getElementById('filevenue');
        if (fileInput) fileInput.required = required;
    }

    let imageName = null;

    function updateVenueImagePreview(fileName) {
        const fileContainer = document.querySelector('.file-header-venue');
        if (!fileContainer) return;

        const cleanName = fileName.replace("uploads/", "");
        const imgUrl = `/static/uploads/${cleanName}`;

        imageName = imgUrl;

        console.log("Preview URL:", imgUrl);

        fileContainer.innerHTML = `
            <img src="${imgUrl}" 
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:12px;
                ">
        `;
    }

    function ImagePreview() {
        let input = imageName;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updateVenueImagePreview(input.files[0].name);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }



    
    [openVenueBtn, cancelVenueBtn, doneVenueBtn].forEach(btn => {
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });

    let selectedVenue = null; // store selected venue
    const checkVenueBtnStatus = () => {
        // DISABLED: Prevents hiding button
        /*const venueDataDiv = document.getElementById('venue-data');
        const venueSpan = document.querySelector('.venue-schedule span'); 
        
        if (venueDataDiv && venueDataDiv.innerHTML.trim()) {
            openVenueBtn.style.display = 'none';
            if (venueSpan) venueSpan.style.color = '#4CAF50';
        }*/
        const venueSpan = document.querySelector('.venue-schedule span');
        if (venueSpan) {
            venueSpan.textContent.includes('Venue:') ? venueSpan.style.color = '#4CAF50' : venueSpan.style.color = '';
        }
        console.log('checkVenueBtnStatus - safe null check');
    };

    
    checkVenueBtnStatus();

    openVenueBtn.addEventListener("click", () => {
        venueModal.style.display = "flex";
        setVenueRequired(true);
    });

    cancelVenueBtn.addEventListener("click", () => {
        setVenueRequired(false);
        venueModal.style.display = "none";
    });

    doneVenueBtn.addEventListener("click", () => {

        const venueName = document.querySelector('[name="venue_name"]').value.trim();
        const venueRoom = document.querySelector('[name="room"]').value.trim();
        const venueLink = document.querySelector('[name="venue_link"]').value.trim();
        const venueAvail = document.querySelector('[name="venue_availability"]').value;
        const venueImage = document.getElementById('filevenue').files.length > 0;
        const rows = document.getElementById('rows').value;
        const cols = document.getElementById('cols').value;

        if (!venueName || !venueRoom || !venueLink || !venueAvail) {
            alert('Please fill venue name, room, link, availability!');
            return;
        }
        // Made image/rows optional

        console.log({
            venueName,
            venueRoom,
            venueLink,
            venueAvail,
            venueImage,
            rows,
            cols
        });

        const venueColor = document.getElementById('check-venue');

        venueColor.style.color = 'green';

        const venueCap = document.getElementById('capacity-info').textContent || 'N/A';

        const fileInput = document.getElementById('filevenue');
        const venueImageFile = fileInput.files[0]; 
        const venueImageName = venueImageFile ? fileInput.files[0].name : null;

        venueData = {
            id: Date.now(),
            name: venueName,
            room: venueRoom,
            capacity: venueCap.replace('Total Capacity: ', ''),
            link: venueLink,
            image: venueImageName
        };

        renderVenueEntry(venueData);
        checkVenueBtnStatus(); // Hide button after adding venue

        setVenueRequired(false);
        venueModal.style.display = "none";
    });

    venueModal.addEventListener("click", function(e){
        if(e.target === venueModal){
            setVenueRequired(false);
            venueModal.style.display = "none";
        }
    });

    // Render Venue Entry
    window.renderVenueEntry = function(venue){
        const container = document.getElementById('venue-data');

        const entryHTML = `
        <div class="venue-entry" id="venue-${venue.id}" style="
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:10px;
        ">
            <div style="display:flex; flex-direction:column;">
                <strong style="color:#4CAF50; font-size:20px;">Venue:</strong>
                <span style="color:#fff;">
                    ${venue.name} | Room ${venue.room} | Capacity: ${venue.capacity}
                </span>
                <span style="color:#fff;">
                    <strong style="color:#4CAF50; font-size:20px;">Link:</strong>
                    <a href="${venue.link}" target="_blank" style="color:white; text-decoration:none;">${venue.link}</a>
                </span>
            </div>

            <div style="display:flex; gap:8px;">
                <button type="button" onclick="editVenue(${venue.id})" style="
                    background:#3498db;
                    color:white;
                    border:none;
                    padding:8px 15px;
                    border-radius:5px;
                    cursor:pointer;
                ">
                    <i class="fas fa-edit"></i> Edit
                </button>

                <button type="button" onclick="deleteVenue(${venue.id})" style="
                    background:#e74c3c;
                    color:white;
                    border:none;
                    padding:8px 15px;
                    border-radius:5px;
                    cursor:pointer;
                ">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        `;

        container.innerHTML = entryHTML;
        container.style.display = "block";
    };

    window.editVenue = function(id) {
        if (!venueData || venueData.id !== id) return;

        document.querySelector('[name="venue_name"]').value = venueData.name;
        document.querySelector('[name="venue_link"]').value = venueData.link;
        document.querySelector('[name="room"]').value = venueData.room;

        setVenueRequired(true);
        venueModal.style.display = "flex";
    };

    // When selecting from dropdown
    document.addEventListener("change", function(e) {
        if (e.target.id !== "venue-select") return;

        console.log("SELECT CHANGED");

        const venueId = e.target.value;
        const venue = VENUES.find(v => v.id == venueId);
        if (!venue) return;

        document.querySelector('[name="venue_name"]').value = venue.venue_name;
        document.querySelector('[name="venue_link"]').value = venue.venue_link;
        document.querySelector('[name="venue_availability"]').value = venue.venue_availability;
        document.querySelector('[name="room"]').value = venue.room;

        // Update preview
        updateVenueImagePreview(venue.image);

        document.getElementById("rows").value = venue.row;
        document.getElementById("cols").value = venue.column;
        document.getElementById("row-gap").value = venue.row_gap;
        document.getElementById("col-gap").value = venue.col_gap;

        document.getElementById("generate").click();
    });

    // Delete Venue
    window.deleteVenue = function(id){
        if(confirm("Are you sure you want to delete this venue?")){
            const entry = document.getElementById(`venue-${id}`);
            const venueColor = document.getElementById('check-venue');
            if(entry) entry.remove();

            venueData = null;
            openVenueBtn.style.display = 'flex'; // Show button again
            venueColor.style.color = 'red';
            const venueSpan = document.querySelector('.venue-schedule span');
            if (venueSpan) venueSpan.style.color = ''; // Reset color
            checkVenueBtnStatus(); // Re-check status
        }
    };

});

// document.addEventListener("change", function(e){

//     if(e.target.id !== "venue-select") return;

//     const venueId = e.target.value;

//     const venue = VENUES.find(v => v.id == venueId);

//     if(!venue) return;

//     document.querySelector('[name="venue_name"]').value = venue.venue_name;
//     document.querySelector('[name="venue_link"]').value = venue.venue_link;
//     document.querySelector('[name="room"]').value = venue.room;
    
//     // Prefill venue image preview
//     const fileContainer = document.querySelector('.bordervenue .file-container .file-header');
//     if (venue.image && fileContainer) {
//         const imgUrl = `/static/uploads/${venue.image}`;
//         fileContainer.innerHTML = `<img src="${imgUrl}" alt="Venue" style="width:101%; height:100%; object-fit:cover; border-radius:10px;">`;
//         const bordervenue = document.getElementById('bordervenue');
//         if (typeof BorderVenue === 'function') BorderVenue(bordervenue);
//     }

//     document.getElementById("rows").value = venue.row;
//     document.getElementById("cols").value = venue.column;
//     document.getElementById("row-gap").value = venue.row_gap;
//     document.getElementById("col-gap").value = venue.col_gap;

//     document.getElementById("generate").click();

// });

document.addEventListener("DOMContentLoaded", async () => {
    await loadVenues();
});

  async function loadVenues() {

    try {

        const response = await fetch("/api/venues");
        VENUES = await response.json();

        console.log("Venues:", VENUES);

        populateVenueSelect();

    } catch (error) {
        console.error("Error loading venues:", error);
    }

}

  function populateVenueSelect(){

    const select = document.getElementById("venue-select");

    select.innerHTML = `<option value="">Select Venue</option>`;

    VENUES.forEach(v => {

        const option = document.createElement("option");

        option.value = v.id;
        option.textContent = v.venue_name;

        select.appendChild(option);

    });

}

document.addEventListener("DOMContentLoaded", async () => {
    const select = document.getElementById("venue-select");
    console.log("🔥 venue-select selected");

    if (!select) {
        console.log("venue-select not found");
        return;
    }

    select.addEventListener("change", function () {

        console.log("🔥 venue-select fired:", this.value);

        const venue = VENUES.find(v => v.id == this.value);

        if (!venue) {
            console.log("❌ venue not found in VENUES");
            return;
        }

        document.getElementById("venue-name").value = venue.venue_name;
        document.getElementById("venue-link").value = venue.venue_link;
        
        document.getElementById("venue_availability").value = venue.venue_availability;
        console.log("Availability value:", venue.venue_availability);
        document.getElementById("room").value = venue.room;

        console.log(venue.image);
        updateVenueImagePreview(venue.image);
        window.VENUE_STATE.imageUrl = venue.image;

        document.getElementById("rows").value = venue.row;
        document.getElementById("cols").value = venue.column;
        document.getElementById("row-gap").value = venue.row_gap;
        document.getElementById("col-gap").value = venue.col_gap;

        document.getElementById("generate").click();
        buildSeatPlan();
    });

    const seatContainer = document.getElementById('seat-container');
    const capacityInfo = document.getElementById('capacity-info');
    const selectedInfo = document.getElementById('selected-info');
    const seatSVG = `<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" transform="scale(-1,1) "><path d="M22 8h-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2v3h2v-3h12v3h2v-3h2c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M5 5h14v3h-1c-.55 0-1 .45-1 1v3H7V9c0-.55-.45-1-1-1H5zm16 12H3v-7h2v3c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3h2z"></path></svg>`;


    function buildSeatPlan() {
        console.log("🔥 buildSeatPlan fired");
        const rows = parseInt(document.getElementById("rows").value);
        const cols = parseInt(document.getElementById("cols").value);
        const colGap = parseInt(document.getElementById("col-gap").value);
        const rowGap = parseInt(document.getElementById("row-gap").value);

        goAbove(rows, cols, colGap, rowGap, seatContainer, seatSVG, capacityInfo, selectedInfo);
    }
});

    function goAbove (rows, cols, colGap, rowGap, seatContainer, seatSVG, capacityInfo, selectedInfo) {
        generateSeats(rows, cols);
        renderSeats(colGap, rowGap, seatContainer, seatSVG, capacityInfo, selectedInfo);
        updateSelectedInfo(selectedSeats, selectedInfo);
    }


    function updateVenueImagePreview(fileName) {
        const fileContainer = document.querySelector('.file-header-venue');

        const cleanName = fileName.replace("uploads/", "");
        const imgUrl = `/static/uploads/${cleanName}`;

        console.log("Preview URL:", imgUrl);

        fileContainer.innerHTML = `
            <img src="${imgUrl}" 
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:12px;
                ">
        `;
    }
