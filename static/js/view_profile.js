document.addEventListener('DOMContentLoaded', function () {
  function openEditModal() {
    document.getElementById('editModal').classList.add('open');
  }
  function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
  }
  function previewAvatar(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('avatarPreview').src = e.target.result;
        document.getElementById('profAvatarImg').src = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // Expose to inline onclick handlers
  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.previewAvatar = previewAvatar;

  // Close modal on backdrop click
  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });
});

function logout() {
  fetch('/logout', { method: 'POST' })
    .then(response => {
      if (response.ok) {
        window.location.href = '/gotologin';
      } else {
        alert('Logout failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error during logout:', error);
      alert('An error occurred. Please try again.');
    });
}