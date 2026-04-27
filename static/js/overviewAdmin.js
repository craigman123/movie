document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll(".nav-card");
    const sections = document.querySelectorAll(".tab-section");
    const mobileView = window.matchMedia("(max-width: 900px)");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            const target = card.getAttribute("data-target");
            const targetSection = document.getElementById(target);

            cards.forEach(item => item.classList.remove("active-card"));
            card.classList.add("active-card");

            if (mobileView.matches) {
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                return;
            }

            sections.forEach(section => {
                section.classList.remove("active");
            });

            if (targetSection) {
                targetSection.classList.add("active");
            }
        });
    });
});
