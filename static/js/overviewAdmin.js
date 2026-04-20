document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll('.nav-card');
    const sections = document.querySelectorAll('.tab-section');

    cards.forEach(card => {
        card.addEventListener('click', () => {

            const target = card.getAttribute('data-target');

            // remove active from all
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // add active to target
            document.getElementById(target).classList.add('active');
        });
    });
});
