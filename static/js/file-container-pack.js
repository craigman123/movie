
// global declaration ni very important
window.VENUE_STATE = {
    file: null,
    imageUrl: null
};


// document.addEventListener("DOMContentLoaded", () => {

//     const posterInput = document.getElementById('filevenue');

//     if (!posterInput) return; // safety check

//     const fileContainer = posterInput.closest('.file-container');
//     const posterHeader = fileContainer.querySelector('.file-header');

//     posterInput.addEventListener('change', function () {
//         const file = this.files[0];
//         if (!file) return;

//         const reader = new FileReader();

//         reader.onload = function (e) {
//             posterHeader.innerHTML = `
//                 <img src="${e.target.result}"
//                      style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
//             `;
//         };

//         reader.readAsDataURL(file);
//     });
// });

document.addEventListener("DOMContentLoaded", () => {

    const posterInput = document.getElementById('filevenue');

    if (!posterInput) return; // safety check

    const fileContainer = posterInput.closest('.file-container');
    const posterHeader = fileContainer.querySelector('.file-header-venue');

    posterInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        window.VENUE_STATE.file = file;
        const reader = new FileReader();

        reader.onload = function (e) {
            posterHeader.innerHTML = `
                <img src="${e.target.result}"
                     style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
            `;
        };

        reader.readAsDataURL(file);
    });
});