window.APP_STATE = {
    schedules: []
};

function initCalendar(prevBtnId, nextBtnId, prevYearBtnId, nextYearBtnId, monthYearId, daysId, inputId, spanId) {
    const prevButton = document.getElementById(prevBtnId);
    const nextButton = document.getElementById(nextBtnId);
    const prevYearButton = document.getElementById(prevYearBtnId);
    const nextYearButton = document.getElementById(nextYearBtnId);
    const monthYear = document.getElementById(monthYearId);
    const daysContainer = document.getElementById(daysId);
    const selectedInput = document.getElementById(inputId);
    const spanElement = document.getElementById(spanId);
    
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let currentDate = new Date();
    let today = new Date();
    let selectedDate = null;

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        monthYear.textContent = `${months[month]} ${year}`;
        daysContainer.innerHTML = '';

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDay; i > 0; i--) {
            const div = document.createElement('div');
            div.textContent = prevMonthLastDay - i + 1;
            div.classList.add('fade');
            daysContainer.appendChild(div);
        }

        // Current month days
        for (let i = 1; i <= lastDay; i++) {
            const div = document.createElement('div');
            div.textContent = i;

            // Check if date is in the past
            const currentDayDate = new Date(year, month, i);
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            if (currentDayDate < todayStart) {
                // Past date - disable it
                div.classList.add('fade', 'disabled-date');
                div.style.cursor = 'not-allowed';
                div.style.color = '#555';
                div.style.opacity = '0.5';

            } else if (currentDayDate > todayStart) {
                div.classList.add('SelectableDate');
                div.style.cursor = 'pointer';
                div.style.color = '#fff';
                div.style.opacity = '1';
            
            } else if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                // Today - highlight it
                div.classList.add('today');
            }

            // Only add click handler for future dates
            if (currentDayDate >= todayStart) {
                div.addEventListener('click', () => {
                    const prev = daysContainer.querySelector('.selected');
                    if (prev) prev.classList.remove('selected');
                    div.classList.add('selected');
                    
                    selectedDate = new Date(year, month, i);
                    selectedInput.value = new Date(year, month, i).toISOString().split('T')[0];
                    
                    window.calendar1Date = selectedDate;
                    
                    if (spanElement) {
                        const options = { year: 'numeric', month: 'short', day: 'numeric' };
                        spanElement.textContent = new Date(year, month, i).toLocaleDateString(undefined, options);
                    }
                });
            }

            daysContainer.appendChild(div);
        }

        // Next month days
        const totalCells = firstDay + lastDay;
        const nextMonthDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= nextMonthDays; i++) {
            const div = document.createElement('div');
            div.textContent = i;
            div.classList.add('fade');
            daysContainer.appendChild(div);
        }
    }

    prevButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
    nextButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
    prevYearButton.addEventListener('click', () => { currentDate.setFullYear(currentDate.getFullYear() - 1); renderCalendar(currentDate); });
    nextYearButton.addEventListener('click', () => { currentDate.setFullYear(currentDate.getFullYear() + 1); renderCalendar(currentDate); });

    renderCalendar(currentDate);

    return {
        getDate: () => selectedDate
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Single Calendar initialization
    initCalendar('prev','next','prev-year','next-year','month-year','days','selected-date-input', 'start-date');
    
    // Initialize with current date displayed
    initializeCurrentDate();
    
    // Time validation - prevent time2 from being earlier than time1
    const time1Input = document.getElementById('time1');
    const time2Input = document.getElementById('time2');
    
    time2Input.addEventListener('change', function() {
        if (time1Input.value && time2Input.value) {
            if (time2Input.value < time1Input.value) {
                alert('Ending Time cannot be earlier than Starting Time');
                time2Input.value = '';
            }
        }
    });
    
    time1Input.addEventListener('change', function() {
        // Reset time2 if it's now invalid
        if (time1Input.value && time2Input.value) {
            if (time2Input.value < time1Input.value) {
                time2Input.value = '';
            }
        }
    });
});

// Function to display current date when nothing is selected
function initializeCurrentDate() {
    const startDateSpan = document.getElementById('start-date');
    const today = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, options);
    startDateSpan.textContent = formattedDate;
}

//  ============================= DISPLAY DATE TIME ==========
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("selectScheduleModalBackdrop");

    let scheduleCounter = 0;
    let venueSchedules = [];

    function updateSchedulesInput() {
        const hiddenInput = document.getElementById("venue-schedules-input");
        hiddenInput.value = JSON.stringify(venueSchedules);
    }

    function renderVenueSchedule(schedule) {
        const container = document.getElementById("venue-data");

        const row = document.createElement("div");
        row.className = "venue-row";
        row.id = `venue-${schedule.id}`;

        row.innerHTML = `
            <div class="venue-text">
                DATE: ${schedule.date} == START TIME: ${schedule.startTime} == END TIME: ${schedule.endTime}
            </div>

            <div class="venue-actions">
                <button class="venue-edit" onclick="editVenue(${schedule.id})">Edit</button>
                <button class="venue-delete" onclick="deleteVenue(${schedule.id})">Delete</button>
            </div>
        `;

        container.appendChild(row);
    }

    document.getElementById("done-btn-schedule").addEventListener("click", () => {
        const startTime = document.getElementById("time1").value;
        const endTime = document.getElementById("time2").value;
        const date = document.getElementById("start-date").textContent;

        if (!date || date === "none") {
            alert("Please select a date");
            return;
        }

        if (!startTime || !endTime) {
            alert("Please select both start and end time");
            return;
        }

        const schedule = {
            id: ++scheduleCounter,
            date: date,
            startTime: startTime,
            endTime: endTime
        };

        window.APP_STATE.schedules.push(schedule);
        renderVenueSchedule(schedule);
        updateSchedulesInput();

        modal.style.display = "none";

        document.getElementById("time1").value = "";
        document.getElementById("time2").value = "";
    });

    window.deleteVenue = function (id) {
        venueSchedules = venueSchedules.filter(s => s.id !== id);
        document.getElementById(`venue-${id}`)?.remove();
    };

    window.editVenue = function (id) {
        const schedule = venueSchedules.find(s => s.id === id);
        if (!schedule) return;

        document.getElementById("start-date").textContent = schedule.date;
        document.getElementById("time1").value = schedule.startTime;
        document.getElementById("time2").value = schedule.endTime;

        deleteVenue(id);
        modal.style.display = "flex";
    };
});