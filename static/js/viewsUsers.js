function openEditUserModal(btn) {
    const user = btn.dataset;

    console.log(user);
    console.log("USER OBJECT:", user);

    document.getElementById("edit_user_id").value = user.id;
    document.getElementById("edit_name").value = user.name;
    document.getElementById("edit_email").value = user.email;
    document.getElementById("edit_role").value = user.role;
    document.getElementById("edit_status").src = user.access;

    const profile = user.profile;

    document.getElementById("edit_bio").value = user.bio || "";
    document.getElementById("edit_nationality").value = user.nationality || "";
    document.getElementById("edit_gender").value = user.gender || "Male";
    document.getElementById("edit_dob").value = user.dob || "";
    document.getElementById("edit_preffered_genre").value = user.genre || "";

    const preview = document.getElementById("profilePreview");

    if (user.profile_image) {
        preview.src = `/static/${profile.profile_image}`;
    } else {
        preview.src = `/static/uploads/defaultPictures/${user.name[0].toLowerCase()}.jpg`;
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

    input.addEventListener("change", function () {
        const file = this.files[0];

        if (file) {
            preview.src = URL.createObjectURL(file);
        }
    });
});
