/* ═══════════════════════════════════════════
   viewLogs.js  —  search + level filter logic
   ═══════════════════════════════════════════
   Strategy:
   • Level tabs  → navigate to ?level=X&search=... (server filters)
   • Search box  → live client-side filter while typing;
                   pressing Enter or clicking the button submits to server
   ═══════════════════════════════════════════ */

/* ── Helpers ── */
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
}

function buildUrl({ search, level }) {
    const params = new URLSearchParams();
    if (level)  params.set('level',  level);
    if (search) params.set('search', search.trim());
    const qs = params.toString();
    return window.location.pathname + (qs ? '?' + qs : '');
}

/* ── Level tab: navigate with current search preserved ── */
function setLevel(btn, level) {
    const search = document.getElementById('logSearch').value.trim();
    window.location.href = buildUrl({ search, level });
}

/* ── Search button / Enter: submit to server ── */
function submitSearch() {
    const search = document.getElementById('logSearch').value.trim();
    const level  = getParam('level').toUpperCase();
    window.location.href = buildUrl({ search, level });
}

/* ── Live client-side filter while typing ── */
function filterLogs() {
    const q     = document.getElementById('logSearch').value.trim().toLowerCase();
    const rows  = document.querySelectorAll('#logsTable tbody .log-row');
    let visible = 0;

    rows.forEach(row => {
        const matchSearch = !q || row.dataset.search.includes(q);
        row.style.display = matchSearch ? '' : 'none';
        if (matchSearch) visible++;
    });

    /* Update the live counter badge */
    const badge = document.getElementById('visibleCount');
    if (badge) badge.textContent = visible + ' entries';

    /* Show/hide the empty-state row */
    const tbody   = document.querySelector('#logsTable tbody');
    let emptyRow  = document.getElementById('emptyRow');

    if (visible === 0 && rows.length > 0) {
        if (!emptyRow) {
            emptyRow = document.createElement('tr');
            emptyRow.id = 'emptyRow';
            emptyRow.innerHTML = '<td colspan="7" class="no-data">No logs match your search.</td>';
            tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
    } else if (emptyRow) {
        emptyRow.style.display = 'none';
    }
}

/* ── Keyboard shortcuts ── */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('logSearch');
    if (!input) return;

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            filterLogs();
            input.blur();
            const level = getParam('level').toUpperCase();
            history.replaceState(null, '', buildUrl({ search: '', level }));
        }
        if (e.key === 'Enter') {
            submitSearch();
        }
    });

    /* Ctrl/Cmd + F focuses the search bar instead of browser find */
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });

    /* Run once on load so live-counter matches server-rendered rows */
    filterLogs();
});