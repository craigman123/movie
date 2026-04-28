function expandCard(selected) {
    const cards = document.querySelectorAll(".card");

    if (selected.classList.contains("expanded")) {
        // Collapse card: restore original image
        const imgTag = selected.querySelector(".card-img img");
        imgTag.src = imgTag.dataset.original; // restore original
        selected.classList.remove("expanded");
        cards.forEach(card => card.classList.remove("hide"));
        return;
    }

    cards.forEach(card => {
        if (card !== selected) {
            card.classList.add("hide");
            card.classList.remove("expanded");
            // Restore their original images too
            const imgTag = card.querySelector(".card-img img");
            if (imgTag.dataset.original) imgTag.src = imgTag.dataset.original;
        }
    });

    // Expand the clicked card
    selected.classList.add("expanded");

    // Swap the image
    const imgTag = selected.querySelector(".card-img img");
    if (!imgTag.dataset.original) {
        imgTag.dataset.original = imgTag.src; // save original image
    }
    imgTag.src = selected.dataset.altImg; // replace with alternate image
}

    const details = [
        {
            icon: '⚡',
            tag: '● Efficiency',
            heading: 'EFFORTLESSLY FAST',
            text: 'This Movie Ticketing System lets users purchase tickets in advance using virtual tickets. Instead of complicated seat selection flows, the system focuses purely on ticket availability management — so you can go from browsing to booked in under a minute. No account setup headaches, no waiting in physical queues.'
        },
        {
            icon: '🔐',
            tag: '● Security',
            heading: 'TICKET UNIQUE SECURITY',
            text: 'Tickets are sold virtually using QR codes paired with a unique hexadecimal code as a dual identification system. Registered in advance, each ticket is cryptographically distinct and tracked in real time. This prevents duplication, fraud, and the chaos of overselling during peak movie schedules.'
        },
        {
            icon: '🎯',
            tag: '● Experience',
            heading: 'REDUCE HASSLE',
            text: 'The system provides a fast, reliable, and user-friendly way to secure movie tickets early. By solving the problem of missed screenings and sold-out last-minute rushes, LUMA improves the entire demand management pipeline — from initial booking through venue check-in — for a smoother cinema experience.'
        }
    ];

    let activeIdx = null;

    function toggleCard(card) {
        const idx = parseInt(card.dataset.idx);
        const panel = document.getElementById('detailPanel');
        const cards = document.querySelectorAll('.feat-card');

        if (activeIdx === idx) {
            closeDetail();
            return;
        }

        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeIdx = idx;

        const d = details[idx];
        document.getElementById('detailVisual').textContent = d.icon;
        document.getElementById('detailTag').textContent = d.tag;
        document.getElementById('detailHeading').textContent = d.heading;
        document.getElementById('detailText').textContent = d.text;

        panel.classList.remove('open');
        void panel.offsetWidth;
        panel.classList.add('open');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closeDetail() {
        const panel = document.getElementById('detailPanel');
        panel.classList.remove('open');
        document.querySelectorAll('.feat-card').forEach(c => c.classList.remove('active'));
        activeIdx = null;
    }

    /* ===== ACCORDION ===== */
    function toggleAcc(header) {
        const item = header.closest('.acc-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    }

    /* ===== COUNT-UP ANIMATION ===== */
    function animateCountUp() {
        document.querySelectorAll('.count-up').forEach(el => {
            const target = parseInt(el.dataset.target);
            const duration = 1200;
            const start = performance.now();
            function step(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }

    /* Trigger count-up when stats section enters viewport */
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                animateCountUp();
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });
    const statsRow = document.querySelector('.stats-row');
    if (statsRow) statsObserver.observe(statsRow);