window.APP_STATE = {
    schedules: []
};

let idToEdit = null;

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
                    selectedInput.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    
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
    // const createMonthYear = document.getElementById("create-month-year");
    // const createDays = document.getElementById("create-days");

    // const editMonthYear = document.getElementById("edit-month-year");
    // const editDays = document.getElementById("edit-days");
    
    initCalendar(
        'prev',
        'next',
        'prev-year',
        'next-year',
        'month-year',
        'days',
        'selected-date-input',
        'start-date'
    );

    initCalendar(
        'edit-prev',
        'edit-next',
        'edit-prev-year',
        'edit-next-year',
        'edit-month-year',
        'edit-days',
        'edit-selected-date-input',
        'edit-start-date'
    );
    // Initialize with current date displayed
    initializeCurrentDate();
    
    // Time validation - prevent time2 from being earlier than time1
    const time1Input = document.getElementById('time1');
    const time2Input = document.getElementById('time2');
    const time2InputEdit = document.getElementById('edit-time2');
    const time1InputEdit = document.getElementById('edit-time1');

    if (time1Input === null && time2Input === null) {
        Increate == true;
    } else {
        InEdit == true;
    }

    
    if(InEdit == true) {
        time2InputEdit.addEventListener('change', function() {
            if (time1Input.value && time2InputEdit.value) {
                if (time2InputEdit.value < time1Input.value) {
                    alert('Ending Time cannot be earlier than Starting Time');
                    time2InputEdit.value = '';
                }
            }
        });
        
        time1InputEdit.addEventListener('change', function() {
            // Reset time2 if it's now invalid
            if (time1Input.value && time2InputEdit.value) {
                if (time2InputEdit.value < time1Input.value) {
                    time2InputEdit.value = '';
                }
            }
        });
    } else if(Increate == true) {
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
    } else {
        console.log("Increate:", Increate);
        console.log("InEdit:", InEdit);
    }
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
    const cancelBtn = document.getElementById("cancel-btn-schedule");

    let scheduleCounter = 0;

    function updateSchedulesInput() {
        const hiddenInput = document.getElementById("venue-schedules-input");
        hiddenInput.value = JSON.stringify(window.APP_STATE.schedules);
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
                <button type="button" class="venue-edit" onclick="editVenue(${schedule.id})">Edit</button>
                <button type="button" class="venue-delete" onclick="deleteVenue(${schedule.id})">Delete</button>
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
            console.log("startTime:", startTime, "endTime:", endTime);
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
        deleteVenue(idToEdit);

        modal.style.display = "none";

        document.getElementById("time1").value = "";
        document.getElementById("time2").value = "";
    });

    window.deleteVenue = function (id) {
        venueSchedules = window.APP_STATE.schedules = window.APP_STATE.schedules.filter(s => s.id !== id);
        document.getElementById(`venue-${id}`)?.remove();
        console.log("SCHEDULE SUCCESFULLY DELETED:", id, window.APP_STATE.schedules);
    };

    window.editVenue = function (id) {

        console.log("Editing schedule:", typeof id);
        const schedule = window.APP_STATE.schedules.find(s => Number(s.id) === Number(id));
        console.log("Editing schedule:", schedule);
        console.log("VENUE SCHEDULES:", window.APP_STATE.schedules);
        if (!schedule) return;

        document.getElementById("start-date").textContent = schedule.date;
        document.getElementById("time1").value = schedule.startTime;
        document.getElementById("time2").value = schedule.endTime;

        modal.style.display = "flex";
        idToEdit = id;
    };
});