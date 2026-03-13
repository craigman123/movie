# Fix Venue Form Validation Errors (Invalid form control not focusable)

## Status: [IN PROGRESS] 

## Steps:
- [x] **Step 1**: Update `static/js/admin_seat_plan.js` ✅ - Added dynamic `required` toggling (`setVenueRequired()`), open/edit/done/cancel/backdrop handlers.
- [ ] **Step 2**: Verify no console errors on page load (hidden inputs).
- [ ] **Step 3**: Test venue modal: Open → validation works → close → no errors.
- [ ] **Step 4**: Run `py main.py`, load admin dashboard, confirm fix in browser console.
- [ ] **Step 5**: Complete tests, attempt_completion.

**Changes**: JS now sets required=false (hidden), true (visible). Preserves UX/backend.

**Test**: Reload page → check console (F12). Click "Check Venue" → validate → submit form.
**Run**: `py main.py`

