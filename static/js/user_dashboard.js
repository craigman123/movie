document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach(link => {
        link.addEventListener("click", function() {
            // Remove active class from others
            navLinks.forEach(l => l.classList.remove("active"));
            // Add to current
            this.classList.add("active");
        });
    });

    // Simple search filter simulation
    const searchInput = document.querySelector(".search-wrapper input");
    searchInput.addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll(".movie-card");
        
        cards.forEach(card => {
            const title = card.querySelector("h3") ? card.querySelector("h3").textContent : "";
            const desc = card.querySelector(".description").textContent;
            
            if(title.toLowerCase().includes(term) || desc.toLowerCase().includes(term)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
});