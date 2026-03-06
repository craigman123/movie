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

document.addEventListener("DOMContentLoaded", () => {
    const availBorder = document.querySelector(".avail-border");
    const greenBackground = "linear-gradient(120deg, rgba(98, 255, 0, 0.521), rgba(57, 67, 55, 0.2))";
    const MAX_VALUE = 999999;

    const ticketTypes = document.querySelectorAll(".ticket-type:not(.infinite):not(.add10):not(.add100):not(.add1000)");

    function updateAvailabilityColor() {
        let active = false;
        ticketTypes.forEach(ticket => {
            const checkbox = ticket.querySelector(".ticket-checkbox");
            const value = parseInt(ticket.querySelector(".value")?.textContent) || 0;
            if (checkbox?.checked && value > 0) active = true;
        });
        availBorder.style.background = active ? greenBackground : "";
    }

    // Small + / - buttons
    ticketTypes.forEach(ticket => {
        const valueSpan = ticket.querySelector(".value");
        const hiddenInput = ticket.querySelector("input[type='hidden']");
        const plus = ticket.querySelector(".plus");
        const minus = ticket.querySelector(".minus");

        plus.addEventListener("click", () => {
            let val = parseInt(valueSpan.textContent) || 0;
            val = Math.min(val + 1, MAX_VALUE);
            valueSpan.textContent = val;
            hiddenInput.value = val;
            updateAvailabilityColor();
        });

        minus.addEventListener("click", () => {
            let val = parseInt(valueSpan.textContent) || 0;
            val = Math.max(val - 1, 0);
            valueSpan.textContent = val;
            hiddenInput.value = val;
            updateAvailabilityColor();
        });
    });

    // Big increment/decrement buttons
    const bigButtons = document.querySelectorAll(".ticket-type-container .ticket-type");
    bigButtons.forEach(button => {
        button.addEventListener("click", () => {
            let label = button.textContent.trim();
            if (button.querySelector("label")) {
                label = button.querySelector("label").textContent.trim();
            }

            let increment = 0;
            if (label.includes("+") && label.includes("∞")) increment = MAX_VALUE;
            else if (label.includes("-") && label.includes("∞")) increment = -MAX_VALUE;
            else if (label.includes("1000")) increment = label.includes("-") ? -1000 : 1000;
            else if (label.includes("100")) increment = label.includes("-") ? -100 : 100;
            else if (label.includes("10")) increment = label.includes("-") ? -10 : 10;

            ticketTypes.forEach(ticket => {
                const checkbox = ticket.querySelector(".ticket-checkbox");
                if (!checkbox || checkbox.checked) {
                    const valueSpan = ticket.querySelector(".value");
                    const hiddenInput = ticket.querySelector("input[type='hidden']");
                    let current = parseInt(valueSpan.textContent) || 0;
                    current = Math.min(Math.max(current + increment, 0), MAX_VALUE);
                    valueSpan.textContent = current;
                    hiddenInput.value = current;
                }
            });

            updateAvailabilityColor();
        });
    });

    document.querySelectorAll(".ticket-checkbox").forEach(cb => cb.addEventListener("change", updateAvailabilityColor));

    updateAvailabilityColor();
});

// ====================== CALENDAR ========================

document.addEventListener('DOMContentLoaded', function () {
    const prevYearButton = document.getElementById('prev-year');
    const nextYearButton = document.getElementById('next-year');
    const monthYear = document.getElementById('month-year');
    const daysContainer = document.getElementById('days');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const dateSpan = document.querySelector('.venue-date');
    const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let currentDate = new Date();
    let today = new Date();
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        monthYear.textContent = `${months[month]} ${year}`;
        daysContainer.innerHTML = '';
        // Previous month's dates
        const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = firstDay; i > 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = prevMonthLastDay - i + 1;
        dayDiv.classList.add('fade');
        daysContainer.appendChild(dayDiv);
    }

    // Current month's dates
    for (let i = 1; i <= lastDay; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.textContent = i;

    // Highlight today
    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayDiv.classList.add('today');
    }

    // Highlight selected date
    dayDiv.addEventListener("click", function () {
        const selected = document.querySelector(".days .selected");
        if (selected) {
            selected.classList.remove("selected");
        }

        dayDiv.classList.add("selected");

        const selectedDate = new Date(year, month, i);
        const formattedDate = `${months[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
        dateSpan.textContent = formattedDate;
    });

    daysContainer.appendChild(dayDiv);
    }
    // Next month's dates
    const nextMonthStartDay = 7 - new Date(year, month + 1, 0).getDay() - 1;

    for (let i = 1; i <= nextMonthStartDay; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = i;
        dayDiv.classList.add('fade');
        daysContainer.appendChild(dayDiv);
        }
    }

    // ================ LISTENERS ================

    prevYearButton.addEventListener('click', function () {
    currentDate.setFullYear(currentDate.getFullYear() - 1);
    renderCalendar(currentDate);
    });

    nextYearButton.addEventListener('click', function () {
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    renderCalendar(currentDate);
    });

    prevButton.addEventListener('click', function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
    });

    nextButton.addEventListener('click', function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
    });

    renderCalendar(currentDate);

    const selectedDate = new Date(year, month, i);
    const formattedDate = selectedDate.toISOString().split('T')[0];

    document.getElementById("selected-date-input").value = formattedDate;
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

    const submitBtn = document.getElementById('submit-btn');

    function updateCheck(input, checkElement) {
        checkElement.style.color = input.files.length > 0 ? 'green' : '';
    }

    function updateGenreCheck() {
        const anyChecked = Array.from(genreCheckboxes).some(c => c.checked);
        genreCheck.style.color = anyChecked ? 'green' : '';
    }

    function updateSubmitButton() {
        const allValid =
            posterInput.files.length > 0 &&
            trailerInput.files.length > 0 &&
            venueInput.files.length > 0 &&
            Array.from(genreCheckboxes).some(c => c.checked);

        submitBtn.style.backgroundColor = allValid ? 'green' : '';
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
});