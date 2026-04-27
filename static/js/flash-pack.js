document.addEventListener("DOMContentLoaded", () => {
    const closeFlash = (flash) => {
        if (!flash || flash.dataset.closing === "true") {
            return;
        }

        flash.dataset.closing = "true";
        flash.classList.add("is-closing");

        window.setTimeout(() => {
            flash.remove();
        }, 300);
    };

    document.querySelectorAll(".flash").forEach((flash) => {
        const duration = Number.parseInt(flash.dataset.flashDuration || "3000", 10);
        flash.style.setProperty("--flash-duration", `${duration}ms`);

        const closeBtn = flash.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => closeFlash(flash));
        }

        window.setTimeout(() => {
            closeFlash(flash);
        }, duration);
    });
});
