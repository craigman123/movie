function openEditUserModal(btn) {
    if (btn.disabled) {
        showFlash("You cannot edit your own account from Users Management.", "warning");
        return;
    }

    const user = btn.dataset;

    document.getElementById("edit_user_id").value = user.id;
    document.getElementById("edit_name").value = user.name;
    document.getElementById("edit_email").value = user.email;
    document.getElementById("edit_role").value = user.role;
    document.getElementById("edit_status").value = user.status;

    document.getElementById("edit_bio").value = user.bio || "";
    document.getElementById("edit_nationality").value = user.nationality || "";
    document.getElementById("edit_gender").value = user.gender || "Male";
    document.getElementById("edit_dob").value = user.dob || "";
    document.getElementById("edit_preffered_genre").value = user.genre || "";

    const preview = document.getElementById("profilePreview");
    const defaultImage = `/static/uploads/defaultPictures/${user.name[0].toLowerCase()}.jpg`;

    if (user.image) {
        preview.src = `/static/uploads/uploadedPictures/${user.image}?t=${Date.now()}`;
        preview.onerror = () => {
            preview.src = defaultImage;
        };
    } else {
        preview.src = defaultImage;
    }

    document.getElementById("editUserModal").style.display = "flex";

    window.onclick = function (event) {
        if (event.target === document.getElementById("editUserModal")) {
            closeEditUserModal();
        }
    };
}

function closeEditUserModal() {
    document.getElementById("editUserModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("profile_picture");
    const preview = document.getElementById("profilePreview");

    if (input && preview) {
        input.addEventListener("change", function () {
            const file = this.files[0];

            if (file) {
                preview.src = URL.createObjectURL(file);
            }
        });
    }
});

document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form.classList.contains("delete-form")) return;

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        e.preventDefault();
    }
});

function showFlash(message, category, duration = 3000) {
    const container = document.querySelector(".flash-container") || (() => {
        const flashContainer = document.createElement("div");
        flashContainer.className = "flash-container";
        document.querySelector("main").prepend(flashContainer);
        return flashContainer;
    })();

    const flash = document.createElement("div");
    flash.className = `flash flash-${category}`;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", function () {
        flash.remove();
    });

    flash.appendChild(messageSpan);
    flash.appendChild(closeButton);
    container.appendChild(flash);

    setTimeout(() => flash.remove(), duration);
}

function openAddUserModal() {
    document.getElementById("addUserModal").style.display = "flex";
    window.onclick = function (event) {
        if (event.target === document.getElementById("addUserModal")) {
            closeAddUserModal();
        }
    };
}

function closeAddUserModal() {
    document.getElementById("addUserModal").style.display = "none";
}
