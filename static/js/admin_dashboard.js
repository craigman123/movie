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
    const trailerHeader = trailerInput.closest('.file-container').querySelector('.file-header');

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
    ImageSize(border);
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

// ====================== CALENDAR ========================

function initCalendar(prevBtnId, nextBtnId, prevYearBtnId, nextYearBtnId, monthYearId, daysId, inputId, spanId, isFirstCalendar = false) {
    const prevButton = document.getElementById(prevBtnId);
    const nextButton = document.getElementById(nextBtnId);
    const prevYearButton = document.getElementById(prevYearBtnId);
    const nextYearButton = document.getElementById(nextYearBtnId);
    const monthYear = document.getElementById(monthYearId);
    const daysContainer = document.getElementById(daysId);
    const selectedInput = document.getElementById(inputId);
    const spanElement = document.getElementById(spanId);
    
    // For calendar2 - get the calendar2 container to enable/disable
    const calendar2Container = document.querySelector('.calendar2');
    
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let currentDate = new Date();
    let today = new Date();
    
    // Store selected date for this calendar
    let selectedDate = null;

    function renderCalendar(date, minDate = null) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const lastDay = new Date(year, month + 1, 0).getDate();

    monthYear.textContent = `${months[month]} ${year}`;
    daysContainer.innerHTML = '';

    // --- Previous month days ---
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay; i > 0; i--) {
        const div = document.createElement('div');
        div.textContent = prevMonthLastDay - i + 1;
        div.classList.add('fade'); // gray, unclickable
        daysContainer.appendChild(div);
    }

    // --- Current month days ---
    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.textContent = i;

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }

        // Check if this date should be disabled (for calendar2 - dates before calendar1 selection)
        let isDisabled = false;
        if (minDate) {
            const currentDayDate = new Date(year, month, i);
            if (currentDayDate < minDate) {
                isDisabled = true;
                div.classList.add('fade', 'disabled-date');
                div.style.cursor = 'not-allowed';
                div.style.color = '#888'; // Visible gray color
                div.style.opacity = '0.6';
            }
        }

        if (!isDisabled) {
            div.addEventListener('click', () => {
                const prev = daysContainer.querySelector('.selected');
                if (prev) prev.classList.remove('selected');
                div.classList.add('selected');
                
                selectedDate = new Date(year, month, i);
                selectedInput.value = new Date(year, month, i).toISOString().split('T')[0];
                
                // Store globally for done button
                if (isFirstCalendar) {
                    window.calendar1Date = selectedDate;
                } else {
                    window.calendar2Date = selectedDate;
                }
                
                // Update the span element with the selected date
                if (spanElement) {
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    spanElement.textContent = new Date(year, month, i).toLocaleDateString(undefined, options);
                }
                
                // If this is calendar1, enable calendar2 and update its min date
                if (isFirstCalendar && calendar2Container) {
                    calendar2Container.style.opacity = '1';
                    calendar2Container.style.pointerEvents = 'auto';
                    calendar2Container.style.filter = 'none';
                    
                    // Trigger re-render of calendar2 with new min date
                    const cal2Init = window.calendar2Init;
                    if (cal2Init && cal2Init.rerender) {
                        cal2Init.rerender(selectedDate);
                    }
                }
            });
        }

        daysContainer.appendChild(div);
    }

    // --- Next month days (to fill the last week) ---
    const totalCells = firstDay + lastDay;
    const nextMonthDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= nextMonthDays; i++) {
        const div = document.createElement('div');
        div.textContent = i;
        div.classList.add('fade'); // gray, unclickable
        daysContainer.appendChild(div);
    }
}

    prevButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
    nextButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
    prevYearButton.addEventListener('click', () => { currentDate.setFullYear(currentDate.getFullYear() - 1); renderCalendar(currentDate); });
    nextYearButton.addEventListener('click', () => { currentDate.setFullYear(currentDate.getFullYear() + 1); renderCalendar(currentDate); });

    renderCalendar(currentDate);

    // If this is the second calendar, initially disable it
    if (!isFirstCalendar && calendar2Container) {
        calendar2Container.style.opacity = '0.5';
        calendar2Container.style.pointerEvents = 'none';
        calendar2Container.style.filter = 'grayscale(100%)';
    }

    return {
        getDate: () => selectedDate,
        rerender: (minDate) => {
            renderCalendar(currentDate, minDate);
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Calendar 1 - pass true as isFirstCalendar
    const cal1 = initCalendar('prev','next','prev-year','next-year','month-year','days','selected-date-input', 'start-date', true);
    
    // Calendar 2 - pass false as isFirstCalendar and store globally
    window.calendar2Init = initCalendar('prev2','next2','prev-year2','next-year2','month-year2','days2','selected-date-input2', 'end-date', false);
});

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
        return hasSchedule;
    }

    function updateSubmitButton() {
        const hasSchedule = movieSchedules.length > 0;
        const allValid =
            posterInput.files.length > 0 &&
            trailerInput.files.length > 0 &&
            venueInput.files.length > 0 &&
            Array.from(genreCheckboxes).some(c => c.checked) &&
            hasSchedule;

        submitBtn.style.backgroundColor = allValid ? 'green' : '';
        submitBtn.disabled = !allValid;
        submitBtn.style.cursor = allValid ? 'pointer' : 'not-allowed';
        submitBtn.style.opacity = allValid ? '1' : '0.6';
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
    updateSubmitButton();
});

document.addEventListener("DOMContentLoaded", () => {
    const statusSelect = document.getElementById("statusSelect");

    function updateStatusColor() {
        const val = statusSelect.value;

        statusSelect.style.background = ""; 
        if(val === "onscreen"){
            statusSelect.style.background = "#2ecc71"; 
        } else if(val === "schedule"){
            statusSelect.style.background = "#f39c12"; 
        } else if(val === "cancel"){
            statusSelect.style.background = "#e74c3c"; 
        } else if(val === "hold"){
            statusSelect.style.background = "#3498db"; 
        }
    }

    updateStatusColor();

    statusSelect.addEventListener("change", updateStatusColor);

});

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
            return `${s.startDate} | ${s.endDate} | ${s.time1}`;
        }).join('|||');
        hiddenInput.value = formattedSchedules;
    }

    addMovieBtn.addEventListener('click', () => {
        // Clear editing state when adding new schedule
        editingSchedule = null;
        modal.style.display = 'flex'; 
    });

    cancelBtn.addEventListener('click', () => {
        // If we were editing a schedule, restore it when cancel is clicked
        if (editingSchedule) {
            // Add back to movieSchedules array
            movieSchedules.push(editingSchedule);
            updateHiddenInput();
            
            // Re-render the schedule entry
            renderScheduleEntry(editingSchedule);
            
            // Clear the editing state
            editingSchedule = null;
            
            // Clear modal date selections
            document.getElementById('start-date').textContent = '';
            document.getElementById('end-date').textContent = '';
        }
        modal.style.display = 'none'; 
    });
    modal.addEventListener('click', (e)=>{
        if(e.target === modal) {
            // If we were editing a schedule, restore it when modal is closed by clicking outside
            if (editingSchedule) {
                // Add back to movieSchedules array
                movieSchedules.push(editingSchedule);
                updateHiddenInput();
                
                // Re-render the schedule entry
                renderScheduleEntry(editingSchedule);
                
                // Clear the editing state
                editingSchedule = null;
                
                // Clear modal date selections
                document.getElementById('start-date').textContent = '';
                document.getElementById('end-date').textContent = '';
            }
            modal.style.display='none';
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
                            <strong style="color: #4CAF50;">Schedule:</strong>
                            <span style="color: #fff; font-size: 14px;">${displayText}</span>
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
                        font-size: 12px;
                        transition: background 0.3s;
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
                        font-size: 12px;
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
        
        // Pre-fill the spans (this won't trigger calendar selection visually)
        document.getElementById('start-date').textContent = schedule.startDate;
        document.getElementById('end-date').textContent = schedule.endDate;
    };

    document.getElementById('done-btn').addEventListener('click',()=>{
        const date1=window.calendar1Date;
        const date2=window.calendar2Date;
        const time1=document.getElementById('time1').value;
        const time2 = "";

        // Get dates from the spans
        const startDateSpan = document.getElementById('start-date').textContent;
        const endDateSpan = document.getElementById('end-date').textContent;

        if(!startDateSpan || !endDateSpan || startDateSpan === '' || endDateSpan === ''){ 
            alert('Select both start and end dates'); 
            return; 
        }

        const scheduleEntry = {
            id: ++scheduleCounter,
            startDate: startDateSpan,
            endDate: endDateSpan,
            displayDate: `${startDateSpan} - ${endDateSpan} (${time1})`,
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
        
        // Clear selections for next entry
        document.getElementById('start-date').textContent = '';
        document.getElementById('end-date').textContent = '';
    });
});

