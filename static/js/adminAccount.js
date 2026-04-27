function previewAvatar(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('avatarPreview').src = e.target.result; };
    reader.readAsDataURL(input.files[0]);
}

function togglePw(id, btn) {
    const inp = document.getElementById(id);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function checkStrength(pw) {
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    let score = 0;
    if (pw.length >= 6)             score++;
    if (pw.length >= 10)            score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))    score++;
    const pct    = (score / 5) * 100;
    const colors = ['#ef4444','#f97316','#eab308','#84cc16','#46e59d'];
    const labels = ['Very Weak','Weak','Fair','Good','Strong'];
    bar.style.width      = pct + '%';
    bar.style.background = colors[score - 1] || '#2a2f3e';
    label.textContent    = pw.length ? (labels[score - 1] || '') : '';
    label.style.color    = colors[score - 1] || '#64748b';
}

// ── Shared modal helpers ─────────────────────────────────────────────────────
function showModal({ title = "", message = "", confirmText = "OK", cancelText = "Cancel", onConfirm = null, onCancel = null }) {
    const modal = document.getElementById("sysModal");
    document.getElementById("sysModal_title").innerText = title;
    document.getElementById("sysModal_message").innerText = message;

    const confirmBtn = document.getElementById("sysModal_confirmBtn");
    const cancelBtn  = document.getElementById("sysModal_cancelBtn");
    confirmBtn.innerText = confirmText;
    cancelBtn.innerText  = cancelText;

    modal.classList.remove("sysModal_hidden");

    confirmBtn.onclick = () => { hideModal(); if (onConfirm) onConfirm(); };
    cancelBtn.onclick  = () => { hideModal(); if (onCancel)  onCancel();  };
}

function hideModal() {
    document.getElementById("sysModal").classList.add("sysModal_hidden");
}

function confirmAction(title, message, onConfirm) {
    showModal({ title, message, confirmText: "Confirm", cancelText: "Cancel", onConfirm });
}

// ── Fetch system stats helper ────────────────────────────────────────────────
async function fetchStats() {
    try {
        const res = await fetch("/api/system-stats");
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ── DELETE ACCOUNT ───────────────────────────────────────────────────────────
window.confirmDeleteAccount = function () {
    showModal({
        title: "Delete Account",
        message: "This will permanently delete your account. Are you sure you want to continue?",
        confirmText: "Continue",
        cancelText: "Cancel",
        onConfirm: () => {
            const text = prompt("Type DELETE to confirm:");
            if (text === "DELETE") {
                document.getElementById("deleteForm").submit();
            } else {
                showModal({
                    title: "Delete Account",
                    message: "Incorrect confirmation text. Account deletion cancelled.",
                    confirmText: "OK", cancelText: "Cancel", onConfirm: () => {}
                });
            }
        }
    });
};

// ── RESET SYSTEM ─────────────────────────────────────────────────────────────
window.confirmResetSystem = async function () {
    // Step 1 — fetch live stats to show impact summary
    const stats = await fetchStats();

    let impactLines = "This will erase ALL system data permanently.";
    if (stats) {
        impactLines =
            `This will permanently wipe ALL system data:\n\n` +
            `  • ${stats.users} user account(s)\n` +
            `  • ${stats.movies} movie(s)\n` +
            `  • ${stats.tickets} ticket(s)\n` +
            `  • ${stats.schedules} schedule(s)\n` +
            `  • ${stats.venues} venue(s)\n` +
            `  • ${stats.logs} log event(s)\n\n` +
            `This action cannot be undone.`;
    }

    // Step 2 — first confirmation modal
    showModal({
        title: "⚡ Reset System",
        message: impactLines,
        confirmText: "Continue",
        cancelText: "Cancel",
        onConfirm: async () => {
            // Step 3 — password verification
            const password = prompt("Enter your admin password to confirm:");
            if (!password) return;

            let valid = false;
            try {
                const res = await fetch("/api/verify-admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();
                valid = data.valid === true;
            } catch {
                valid = false;
            }

            if (valid) {
                document.getElementById("resetForm").submit();
            } else {
                showModal({
                    title: "Reset System",
                    message: "Incorrect password. System reset cancelled.",
                    confirmText: "OK", cancelText: "Cancel", onConfirm: () => {}
                });
            }
        }
    });
};

// ── BULK ROLE CHANGE ─────────────────────────────────────────────────────────
window.confirmBulkRoleChange = async function () {
    const role = document.getElementById("roleSelect").value;

    if (!role) {
        showModal({
            title: "Bulk Role Change",
            message: "Please select a role before confirming.",
            confirmText: "OK", cancelText: "Cancel", onConfirm: () => {}
        });
        return;
    }

    // Fetch live user count for impact line
    const stats = await fetchStats();
    const count = stats ? stats.users : null;
    const countLine = count !== null ? `\n\n⚠ ${count} account(s) will be affected.` : "";

    const mess = role === "user"
        ? `This will change ALL users to "User".\nThis includes your admin account.\nYou will be redirected to the user dashboard.${countLine}`
        : `This will change ALL users to "${role.charAt(0).toUpperCase() + role.slice(1)}".${countLine}`;

    showModal({
        title: "Bulk Role Change",
        message: mess,
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: () => {
            const text = prompt(`Type ${role.toUpperCase()} to confirm:`);
            if (text === role.toUpperCase()) {
                document.getElementById("roleForm").submit();
            } else {
                showModal({
                    title: "Bulk Role Change",
                    message: "Incorrect confirmation text. Bulk role change cancelled.",
                    confirmText: "OK", cancelText: "Cancel", onConfirm: () => {}
                });
            }
        }
    });
};