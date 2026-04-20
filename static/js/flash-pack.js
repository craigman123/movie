document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        document.querySelectorAll('.flash').forEach(el => {
            el.style.transition = "opacity 0.5s ease";
            el.style.opacity = "0";

            setTimeout(() => el.remove(), 500); // wait for fade
        });
    }, 3000);
});