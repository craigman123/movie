# Movie Genre Edit Prefill TODO

## Steps:
1. [x] Add edit button to templates/movieViewAdmin.html movie cards
2. [x] Add /admin/edit_movie/<int:movie_id> route in main.py (GET: show form with prefilled genres; POST: update genres)
3. [x] Create templates/editMovie.html with genre checkboxes prefilled from movie.genre.split(', ')
4. [x] Test: Add movie with genres → Go to movies → Click Edit → Verify prefill → Submit update
5. [x] [Complete] Run `py main.py` and verify.
