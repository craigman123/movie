


let selectedGenres = [];
let selectedStatus = "";

document.addEventListener("DOMContentLoaded", function() {
  // Genre tag click handler
  document.querySelectorAll(".genre").forEach(tag => {
    tag.addEventListener("click", () => {
      const value = tag.dataset.genre;

      if (value === "") {
        // "All" — reset genre selection
        selectedGenres = [];
        document.querySelectorAll(".genre").forEach(t => t.classList.remove("active"));
        tag.classList.add("active");
      } else {
        tag.classList.toggle("active");

        if (selectedGenres.includes(value)) {
          selectedGenres = selectedGenres.filter(g => g !== value);
        } else {
          selectedGenres.push(value);
        }

        // Deactivate "All" when specific genres are selected
        document.querySelector('.genre[data-genre=""]').classList.remove("active");

        // If nothing selected, re-activate "All"
        if (selectedGenres.length === 0) {
          document.querySelector('.genre[data-genre=""]').classList.add("active");
        }
      }

      rmov();
    });
  });

  // Status tag click handler
  document.querySelectorAll(".status").forEach(tag => {
    tag.addEventListener("click", function() {
      document.querySelectorAll(".status").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      selectedStatus = this.dataset.status;
      rmov();
    });
  });

  // Search input
  const sq = document.getElementById("sq");
  if (sq) sq.addEventListener("input", rmov);

  // Run once on load to set initial state
  rmov();
});

function rmov() {
  const q = (document.getElementById("sq")?.value || "").toLowerCase().trim();
  const cards = document.querySelectorAll(".movies-grid .movie-link");

  cards.forEach(link => {
    const card = link.querySelector(".movie-card");
    if (!card) return;

    const nameEl  = card.querySelector(".movie-info h5");
    const genreEl = card.querySelector(".movie-info p");
    const statusEl = card.querySelector(".status");

    const name   = nameEl  ? nameEl.textContent.toLowerCase()  : "";
    const genre  = genreEl ? genreEl.textContent.toLowerCase() : "";
    const rawStatus = statusEl ? statusEl.textContent.trim().toLowerCase().replace(/\s+/g, "-") : "";

    // Search match: name or genre contains query
    const matchSearch = !q || name.includes(q) || genre.includes(q);

    // Genre match: every selected genre must appear in the genre text
    const matchGenre = selectedGenres.length === 0 ||
      selectedGenres.every(g => genre.includes(g.toLowerCase()));

    // Status match
    let matchStatus = true;
    if (selectedStatus) {
      matchStatus = rawStatus === selectedStatus;
    }

    link.style.display = (matchSearch && matchGenre && matchStatus) ? "" : "none";
  });

  const grid = document.querySelector(".movies-grid");
  if (grid) {
    const visible = [...grid.querySelectorAll(".movie-link")].filter(l => l.style.display !== "none");
    let noMsg = grid.querySelector(".no-movies-filter");
    if (visible.length === 0) {
      if (!noMsg) {
        noMsg = document.createElement("p");
        noMsg.className = "no-movies no-movies-filter";
        noMsg.textContent = "No movies match your filters.";
        grid.style.display = "flex";
        grid.style.flexDirection = "column";
        grid.style.textAlign = "center";
        grid.appendChild(noMsg);
      }
      noMsg.style.display = "";
    } else if (noMsg) {
      grid.style.display = "grid";
      noMsg.style.display = "none";
    }
  }
}