// Store movie schedules globally for management
let movieSchedules = [];
let scheduleCounter = 0;

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
});

window.addEventListener('DOMContentLoaded', () => {

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

        // Set video source
        const reader = new FileReader();
        reader.onload = function (e) {
            video.src = e.target.result;
            trailerContainer.appendChild(video);
        };
        reader.readAsDataURL(file);

        // Optional: trigger border effect
        if (typeof BorderTrial === 'function') {
            BorderTrial(document.getElementById('bordertrial'));
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {

    // Venue
    const trailerInput = document.getElementById('filevenue');
    const trailerHeader = trailerInput.closest('.file-container').querySelector('.file-header-venue');

    trailerInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            trailerHeader.innerHTML = `<img src="${e.target.result}" style="width:101%; height:100%; object-fit:cover; border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
        BorderTrial(document.getElementById('bordervenue'));
    });
});

function BorderPoster(border){
    const finalbackgroundColor = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    border.style.background = `${finalbackgroundColor}`;
// ImageSize(border); // Fixed missing function
}


function BorderTrial(border){
    const finalbackgroundColor = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    border.style.background = `${finalbackgroundColor}`;
    ImageSize(border);
}

function BorderVenue(border){
    const finalbackgroundColor = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    border.style.background = `${finalbackgroundColor}`;
    ImageSize(border);
}

document.addEventListener('DOMContentLoaded', function () {
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    const defaultBackground = "linear-gradient(135deg, rgba(255, 0, 0, 0.404), rgba(255, 0, 0, 0.244))";
    
    const genreBorder = document.querySelector('.genre-border');
    const checkboxes = genreBorder.querySelectorAll('input[type="checkbox"]');

    function updateBorder() {
        const anyChecked = Array.from(checkboxes).some(c => c.checked);
        if (anyChecked) {
            genreBorder.style.background = greenBackground; 
        } else {
            genreBorder.style.background = defaultBackground; 
        }
    }

    updateBorder();

    checkboxes.forEach(c => c.addEventListener('change', updateBorder));
});

document.addEventListener('DOMContentLoaded', function () {
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    const redBackground   = "linear-gradient(135deg, rgba(255, 0, 0, 0.404), rgba(255, 0, 0, 0.244))";

    const infoBorder = document.querySelector('.info-border');
    const inputs = infoBorder.querySelectorAll('.movie-info input');

    function updateBorder() {
        const allFilled = Array.from(inputs).every(input => input.value.trim() !== "");
        
        if (allFilled) {
            infoBorder.style.background = greenBackground; 
        } else {
            infoBorder.style.background = redBackground; 
        }
    }

    updateBorder();

    inputs.forEach(input => input.addEventListener('input', updateBorder));
});

document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.querySelector(".description-border textarea");
    const borderDiv = document.querySelector(".description-border");
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";

    function updateBorderColor() {
        if (textarea.value.trim().length > 0) {
            borderDiv.style.background = greenBackground;
        } else {
            borderDiv.style.background = "";
        }
    }

    textarea.addEventListener("input", updateBorderColor);
    updateBorderColor();
});

document.addEventListener("DOMContentLoaded", () => {
    const venueBorder = document.querySelector(".venue-border");
    const inputs = venueBorder.querySelectorAll("input.input");
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";

    function updateVenueBorder() {
        const allFilled = Array.from(inputs).every(input => input.value.trim().length > 0);

        venueBorder.style.background = allFilled ? greenBackground : "";
    }
    
    inputs.forEach(input => input.addEventListener("input", updateVenueBorder));

    updateVenueBorder();
});

document.addEventListener("DOMContentLoaded", () => {
    const mapBorder = document.querySelector(".map-border");
    const inputs = mapBorder.querySelectorAll("input.input");
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";

    function updateMapBorder() {
        const allFilled = Array.from(inputs).every(input => input.value.trim().length > 0);
        mapBorder.style.background = allFilled ? greenBackground : "";
    }

    inputs.forEach(input => input.addEventListener("input", updateMapBorder));

    updateMapBorder();
});

document.addEventListener("DOMContentLoaded", () => {
    const venueDateSpan = document.querySelector('.venue-date');
    const venueDate = venueDateSpan.textContent;

    const hiddenInput = document.getElementById('venue_date_input');
    hiddenInput.value = venueDate; 
});

// =========================== VALIDATION CHECKLIST ===========================

document.addEventListener("DOMContentLoaded", () => {
    const posterInput = document.getElementById('fileposter');
    const trailerInput = document.getElementById('filetrailer');
    const venueInput = document.getElementById('filevenue');
    const genreCheckboxes = document.querySelectorAll('input[name="genres[]"]');

    const posterCheck = document.getElementById('check-poster');
    const trailerCheck = document.getElementById('check-trailer');
    const venueCheck = document.getElementById('check-venue');
    const genreCheck = document.getElementById('check-genre');
    const scheduleCheck = document.getElementById('check-schedule');

    const submitBtn = document.getElementById('submit-btn');

    function updateCheck(input, checkElement) {
        checkElement.style.color = input.files.length > 0 ? 'green' : '';
    }

    function updateGenreCheck() {
        const anyChecked = Array.from(genreCheckboxes).some(c => c.checked);
        genreCheck.style.color = anyChecked ? 'green' : '';
    }
    
    // Function to update schedule check
    function updateScheduleCheck() {
        const hasSchedule = movieSchedules.length > 0;
        scheduleCheck.style.color = hasSchedule ? 'green' : '';
        if (scheduleCheck.parentElement) {
            if (!hasSchedule) {
                scheduleCheck.parentElement.querySelector('.no-schedule-message')?.remove();
                const container = document.querySelector('.movie-border');
                let dataWrapper = container.querySelector('.schedule-data-wrapper');
                if (dataWrapper) {
                    dataWrapper.innerHTML = '<p class="no-schedule-message" style="color: #aaa; text-align: center;">No schedules added yet. Click "Add Movie" to create a schedule.</p>';
                }
            }
        }
        return hasSchedule;
    }

    function updateSubmitButton() {
        const hasPoster = posterInput.files.length > 0;
        const hasVenue = venueInput.files.length > 0;
        const hasSchedule = movieSchedules.length > 0;
        const hasGenre = Array.from(genreCheckboxes).some(c => c.checked);

        // Require schedule now
        if (hasPoster && hasVenue && hasSchedule && hasGenre) {
            submitBtn.style.backgroundColor = '#4CAF50';
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
            submitBtn.style.opacity = '1';
        } else {
            submitBtn.style.backgroundColor = '#666';
            submitBtn.disabled = true;
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.style.opacity = '0.6';
        }
        console.log(`Submit status: poster=${hasPoster}, venue=${hasVenue}, schedule=${hasSchedule}, genre=${hasGenre}`);
    }

    [posterInput, trailerInput, venueInput].forEach(input => {
        input.addEventListener('change', () => {
            updateCheck(posterInput, posterCheck);
            updateCheck(trailerInput, trailerCheck);
            updateCheck(venueInput, venueCheck);
            updateSubmitButton();
        });
    });

    genreCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateGenreCheck();
            updateSubmitButton();
        });
    });
    
    // Expose the schedule check function globally so it can be called when schedules are added/deleted
    window.updateScheduleCheck = function() {
        const hasSchedule = updateScheduleCheck();
        updateSubmitButton();
    };
    
    // Initialize submit button as disabled (since no schedule exists initially)
    // Force enable after load
    setTimeout(() => {
        // Fix null errors
        if (venueCheck) venueCheck.style.color = venueInput.files.length > 0 ? 'green' : '';
        if (scheduleCheck) scheduleCheck.style.color = movieSchedules.length > 0 ? 'green' : '';
        
        updateSubmitButton();
        console.log('Submit FIXED - no null errors');
    }, 1000);
});

// document.addEventListener("DOMContentLoaded", () => {
//     const statusSelect = document.getElementById("statusSelect");

//     function updateStatusColor() {
//         const val = statusSelect.value;

//         statusSelect.style.background = ""; 
//         if(val === "onscreen"){
//             statusSelect.style.background = "#2ecc71"; 
//         } else if(val === "schedule"){
//             statusSelect.style.background = "#f39c12"; 
//         } else if(val === "cancel"){
//             statusSelect.style.background = "#e74c3c"; 
//         } else if(val === "hold"){
//             statusSelect.style.background = "#3498db"; 
//         }
//     }

//     updateStatusColor();

//     statusSelect.addEventListener("change", updateStatusColor);

// });

// =========================== MOVIE AVAILABILITY MODAL ===========================

document.addEventListener("DOMContentLoaded", () => {
    const addMovieBtn = document.getElementById('add-movie-btn');
    const modal = document.getElementById('availability-modal');
    const cancelBtn = document.getElementById('cancel-btn');

    // Store the schedule being edited for restoration if cancelled
    let editingSchedule = null;
    
    // Function to update hidden input with all schedules formatted as "datetime | datetime | datetime"
    function updateHiddenInput() {
        const hiddenInput = document.getElementById('venue_date_input');
        // Format: startDate | endDate | time
        const formattedSchedules = movieSchedules.map(s => {
            return `${s.startDate} | ${s.time1} | ${s.time2}`;
        }).join('|||');
        hiddenInput.value = formattedSchedules;
    }

    addMovieBtn.addEventListener('click', () => {
        // Clear editing state when adding new schedule
        editingSchedule = null;
        modal.style.display = 'flex'; 
    });

    function restoreEditingSchedule() {
        if (!editingSchedule) return;

        movieSchedules.push(editingSchedule);
        updateHiddenInput();
        renderScheduleEntry(editingSchedule);

        editingSchedule = null;

        document.getElementById('start-date').textContent = '';
        document.getElementById('end-date').textContent = '';
    }

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Restore the schedule if we were editing
        if (editingSchedule) {
            movieSchedules.push(editingSchedule);
            updateHiddenInput();
            renderScheduleEntry(editingSchedule);
            editingSchedule = null;
        }
        
        initializeCurrentDate();
        document.getElementById('time1').value = '';
        document.getElementById('time2').value = '';
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (!e.target.closest('.modal-content')) {
            // Restore the schedule if we were editing
            if (editingSchedule) {
                movieSchedules.push(editingSchedule);
                updateHiddenInput();
                renderScheduleEntry(editingSchedule);
                editingSchedule = null;
            }
            
            initializeCurrentDate();
            document.getElementById('time1').value = '';
            document.getElementById('time2').value = '';
            modal.style.display = 'none';
        }
    });
    
    // Function to render a schedule entry professionally
    window.renderScheduleEntry = function(scheduleEntry) {
       const container = document.getElementById('availability-data');
        
        // Use displayDate if available, otherwise combine startDate and endDate
        const displayText = scheduleEntry.displayDate || `${scheduleEntry.startDate} - ${scheduleEntry.endDate}`;
        
        const entryHTML = `
            <div class="schedule-entry" id="schedule-${scheduleEntry.id}" style="
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 15px;
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
                backdrop-filter: blur(10px);
            ">
                <div style="flex: 1; min-width: 200px;">
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div>
                            <strong style="color: #4CAF50; font-size: 1.2vw; ">Schedule:</strong>
                            <span style="color: #fff; font-size: 1.2vw;">${displayText}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" onclick="editSchedule(${scheduleEntry.id})" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1.2vw;
                        transition: background 0.3s;
                        hieght: 10vh;
                    " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button type="button" onclick="deleteSchedule(${scheduleEntry.id})" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1.2vw;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        // Remove old message if exists
        const oldMessage = container.querySelector('.no-schedule-message');
        if (oldMessage) {
            oldMessage.remove();
        }
        
        // Create a wrapper if it doesn't exist
        let dataWrapper = container.querySelector('.schedule-data-wrapper');
        if (!dataWrapper) {
            dataWrapper = document.createElement('div');
            dataWrapper.className = 'schedule-data-wrapper';
            container.appendChild(dataWrapper);
        }
        
        dataWrapper.insertAdjacentHTML('beforeend', entryHTML);
    };
    
    // Function to delete a schedule entry
    window.deleteSchedule = function(id) {
        if (confirm('Are you sure you want to delete this schedule?')) {
            movieSchedules = movieSchedules.filter(s => s.id !== id);
            const element = document.getElementById(`schedule-${id}`);
            if (element) {
                element.remove();
            }
            updateHiddenInput();
            
            // Update schedule validation check
            if (window.updateScheduleCheck) {
                window.updateScheduleCheck();
            }
            
            // Show message if no schedules left
            if (movieSchedules.length === 0) {
                const container = document.querySelector('.movie-border');
                let dataWrapper = container.querySelector('.schedule-data-wrapper');
                if (dataWrapper) {
                    dataWrapper.innerHTML = '<p class="no-schedule-message" style="color: #aaa; text-align: center;">No schedules added yet. Click "Add Movie" to create a schedule.</p>';
                }
            }
        }
    };
    
    // Function to edit a schedule entry
    window.editSchedule = function(id) {
        const schedule = movieSchedules.find(s => s.id === id);
        if (!schedule) return;
        
        // Store the original schedule for restoration if cancelled
        editingSchedule = {...schedule};
        
        // Remove from display
        const element = document.getElementById(`schedule-${id}`);
        if (element) {
            element.remove();
        }
        
        // Remove from array
        movieSchedules = movieSchedules.filter(s => s.id !== id);
        updateHiddenInput();
        
        // Open modal with pre-filled values
        const modal = document.getElementById('availability-modal');
        modal.style.display = 'flex';
        
        // Pre-fill the span with the schedule date
        document.getElementById('start-date').textContent = schedule.startDate;
        
        // Pre-fill time inputs
        document.getElementById('time1').value = schedule.time1 || '';
        document.getElementById('time2').value = schedule.time2 || '';
    };

    document.getElementById('done-btn').addEventListener('click',()=>{
        const time1 = document.getElementById('time1').value;
        const time2 = document.getElementById('time2').value;

        // Validate that both time1 AND time2 are selected
        if (!time1 || !time2) {
            alert('Please select both Starting Time and Ending Time');
            return;
        }

        // Get date from the span (which shows current date if nothing selected)
        const startDateSpan = document.getElementById('start-date').textContent;

        // Check if it's the default "none" text or empty
        if (!startDateSpan || startDateSpan === '' || startDateSpan === 'none') {
            alert('Please select a date');
            return;
        }

        const scheduleEntry = {
            id: ++scheduleCounter,
            startDate: startDateSpan,
            endDate: startDateSpan, // Same as start date for single calendar
            displayDate: `${startDateSpan} (${time1} - ${time2})`,
            time1: time1,
            time2: time2
        };
        
        movieSchedules.push(scheduleEntry);
        
        // Add to hidden input for form submission
        updateHiddenInput();
        
        // Display in movie-schedule container
        renderScheduleEntry(scheduleEntry);

        // Update schedule validation check
        if (window.updateScheduleCheck) {
            window.updateScheduleCheck();
        }

        document.getElementById('availability-modal').style.display = 'none';
        
        // Reset for next entry - show current date again
        initializeCurrentDate();
        
        // Clear time inputs
        document.getElementById('time1').value = '';
        document.getElementById('time2').value = '';
    });
});

