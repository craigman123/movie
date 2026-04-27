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