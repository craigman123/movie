from flask import Flask, render_template, request, redirect, session, url_for, send_from_directory, flash, jsonify, after_this_request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import time, os, uuid, json
from datetime import datetime, time as dt_time
from national import nationalities
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

app = Flask(__name__)

app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['LAST_UPDATE'] = int(time.time())
app.secret_key = "aries_vincent_secret"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///luma.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)

class Movies(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    movie_image = db.Column(db.String(1000), nullable=False)
    movie_trailer = db.Column(db.String(1000), nullable=False)
    movie_date_created = db.Column(db.Date, nullable=False)
    movie_status = db.Column(db.String(50), nullable=False)
    language = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    genre = db.Column(db.String(50), nullable=False)

    schedules = db.relationship('Schedule', backref='movie', lazy=True)

class Venue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venue_name = db.Column(db.String(100), nullable=False)
    venue_image = db.Column(db.String(1000), nullable=False)
    venue_linkMap = db.Column(db.String(1000), nullable=False)
    venue_room = db.Column(db.String(100), nullable=False)
    venue_cap = db.Column(db.Integer, nullable=False)
    venue_row = db.Column(db.Integer, nullable=False)
    venue_col = db.Column(db.Integer, nullable=False)
    venue_row_gap = db.Column(db.Integer, nullable=False)
    venue_col_gap = db.Column(db.Integer, nullable=False)
    venue_availability = db.Column(db.String(50), nullable=False)

    schedules = db.relationship('Schedule', backref='venue', lazy=True)

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venue.id'), nullable=False)

    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)


class Libraries(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    library_name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.String(200), nullable=False)
    library_image = db.Column(db.String(1000), nullable=False)
    schedule_open = db.Column(db.String(1000), nullable=False)
    library_linkMap = db.Column(db.String(1000), nullable=False)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    access = db.Column(db.String(50), nullable=False, default='active')
    role = db.Column(db.String(50), default='user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def inject_now():
    """Adds a changing timestamp to all templates."""
    return {'now': int(time.time())}

app.context_processor(inject_now)

@app.route('/gotologin')
def gotologin():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('user_dashboard'))

    return render_template('login.html')

@app.route('/users')
def view_users():
    return render_template('viewUsers.html')

@app.route('/moviewView')
def movieViewAdmin():
    return render_template('movieViewAdmin.html')

@app.route('/adminAccount')
def AdminAccount():
    return render_template('AdminAccount.html')

@app.route('/sales')
def view_sales():
    return render_template('viewSales.html')

@app.route('/logs')
def view_logs():
    return render_template('viewLogs.html')

@app.route('/')
def index():
    return render_template('landingpage.html')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}

def allowed_file(filename, allowed_ext):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_ext

@app.route('/add_movie', methods=['GET', 'POST'])
def add_movie():
    if request.method == 'POST':
        
        poster_file = request.files.get('poster')
        trailer_file = request.files.get('trailer')
        venue_image_file = request.files.get('venue_image')

        # --- Poster Validation ---
        if not poster_file or poster_file.filename == "":
            flash("Please upload a movie poster.", "danger")
            return redirect(url_for('admin_dashboard'))

        if not allowed_file(poster_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            flash("Poster must be an image file.", "danger")
            return redirect(url_for('admin_dashboard'))

        # --- Trailer OPTIONAL ---
        trailer_filename = None
        if trailer_file and trailer_file.filename != "":
            if not allowed_file(trailer_file.filename, ALLOWED_VIDEO_EXTENSIONS):
                flash("Trailer must be an MP4 video.", "danger")
                return redirect(url_for('admin_dashboard'))
            trailer_filename = secure_filename(trailer_file.filename)
            trailer_file.save(os.path.join(app.config['UPLOAD_FOLDER'], trailer_filename))

        # --- Venue Image OPTIONAL ---
        venue_filename = None
        if venue_image_file and venue_image_file.filename != "":
            if not allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
                flash("Venue image must be an image file.", "danger")
                return redirect(url_for('admin_dashboard'))
            venue_filename = secure_filename(venue_image_file.filename)
            venue_image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], venue_filename))

        if not allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            flash("Venue image must be an image file.", "danger")
            return redirect(url_for('admin_dashboard'))

        # --- Movie Info ---
        movie_name = request.form.get('movie_name')
        duration = request.form.get('duration')
        language = request.form.get('language') or 'English'
        release_date = request.form.get('release_date')
        genres = request.form.getlist('genres[]')
        venue_name = request.form.get('venue_name')
        venue_availability = request.form.get('venue_availability')
        room = request.form.get('room')
        
        venue_link = request.form.get('venue_link')
        description = request.form.get('description')
        venue_cap = request.form.get('cap')
        movie_status = request.form.get('movie_status')
        
        # Get the full schedule data from hidden input (format: date | date | time ||| date | date | time)
        movie_schedule = request.form.get('venue_date') or ''
        scheduled_date = movie_schedule

        # --- Save Files: only store filename in DB ---
        poster_filename = trailer_filename = venue_filename = None

        if allowed_file(poster_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            poster_filename = secure_filename(poster_file.filename)
            poster_file.save(os.path.join(app.config['UPLOAD_FOLDER'], poster_filename))

        if allowed_file(trailer_file.filename, ALLOWED_VIDEO_EXTENSIONS):
            trailer_filename = secure_filename(trailer_file.filename)
            trailer_file.save(os.path.join(app.config['UPLOAD_FOLDER'], trailer_filename))

        if allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            venue_filename = secure_filename(venue_image_file.filename)
            venue_image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], venue_filename))

        genre_string = ", ".join(genres)
        
        if release_date:
            try:
                release_date_obj = datetime.strptime(release_date, '%Y-%m-%d').date()
            except ValueError:
                flash("Invalid release date format. Use YYYY-MM-DD.", "danger")
                return redirect(url_for('admin_dashboard'))
        else:
            release_date_obj = None 
            
        rows_str = request.form.get('rows', '10')
        cols_str = request.form.get('cols', '16')
        row_gap_str = request.form.get('row-gap', '0')
        col_gap_str = request.form.get('col-gap', '4')
        rows = int(rows_str)
        cols = int(cols_str)
        capacity = rows * cols

        # --- Save Movie ---
        new_movie = Movies(
            movie_name=movie_name,
            description=description,
            movie_image=poster_filename,     
            movie_trailer=trailer_filename,    
            movie_date_created=release_date_obj,
            language=language,
            duration=duration,
            genre=genre_string,    
            movie_status=movie_status,
        )
        db.session.add(new_movie)
        db.session.commit()

        # --- Save Venue ---
        new_venue = Venue(
            venue_name=venue_name,
            venue_room=room,
            venue_image=venue_filename,      
            venue_availability=venue_availability,
            venue_linkMap=venue_link,
            venue_row=rows,
            venue_col=cols,
            venue_row_gap=int(row_gap_str),
            venue_col_gap=int(col_gap_str),
            venue_cap=capacity
        )
        db.session.add(new_venue)
        db.session.flush()  

        if scheduled_date:
            try:
                # Extract the first date part before any '|' if present
                date_part = scheduled_date.split('|')[0].strip()  # e.g., 'Mar 15, 2026'

                # Parse using the correct format
                schedule_date_obj = datetime.strptime(date_part, "%b %d, %Y").date()

                # Set default start and end times
                start_hour = int(request.form.get('time_avail', 9))
                end_hour = int(request.form.get('time_avail2', 12))

                start_time_input = dt_time(start_hour, 0)
                end_time_input = dt_time(end_hour, 0)

                # Only create schedule if start and end times exist
                if start_time_input and end_time_input:
                    new_schedule = Schedule(
                        movie_id=new_movie.id,
                        venue_id=new_venue.id,
                        date=schedule_date_obj,
                        start_time=start_time_input,
                        end_time=end_time_input
                    )
                    db.session.add(new_schedule)
                    db.session.commit()
                    print("Schedule added.")
                else:
                    print("Incomplete schedule info, not adding to database.")

            except ValueError as e:
                print(f"Error parsing scheduled_date: {e}")
        else:
            print("No schedule provided, skipping database insert.")


    flash("Movie uploaded successfully!", "success")
    return redirect(url_for('admin_dashboard'))

@app.route('/view_movie/<int:movie_id>')
def view_movie(movie_id):
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    movie = Movies.query.get_or_404(movie_id)

    venue = Venue.query.filter_by(movie_id=movie.id).first()
    tickets = Tickets.query.filter_by(movie_id=movie.id).first()

    return render_template('view_movie.html', movie=movie, venue=venue, tickets=tickets)

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('login'))

    today = datetime.today().strftime('%B %d, %Y')

    user = User.query.get(session['user_id'])
    venues = Venue.query.all()

    venue_data = [
        {
            "id": v.id,
            "venue_name": v.venue_name,
            "venue_link": v.venue_linkMap,
            "venue_room": v.venue_room,
            "venue_cap": v.venue_cap,
            "row": v.venue_row,
            "column": v.venue_col,
            "row_gap": v.venue_row_gap,
            "col_gap": v.venue_col_gap
        }
        for v in venues
    ]

    return render_template(
        'admin_dashboard.html',
        user=user,
        current_date=today,
        venues=venue_data
    )
    
@app.route('/api/venues')
def get_venues():
    venues = Venue.query.all()

    venue_data = []
    for v in venues:
        venue_data.append({
            "id": v.id,
            "venue_name": v.venue_name,
            "venue_link": v.venue_linkMap,
            "room": v.venue_room,
            "cap": v.venue_cap,
            "row": v.venue_row,
            "column": v.venue_col,
            "row_gap": v.venue_row_gap,
            "col_gap": v.venue_col_gap,
            "image": v.venue_image
        })

    return jsonify(venue_data)

@app.route('/user_dashboard')
def user_dashboard():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
    
    if session.get('role') != 'user':
        flash("Unauthorized access", "danger")
        return redirect(url_for('admin_dashboard'))
    
    user = User.query.get(session['user_id'])
    movies = Movies.query.all()
    return render_template('user_dashboard.html', user=user, movies=movies)

@app.route('/settings')
def settings():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
    
    return render_template('settings.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/login', methods=['POST'])
def login():
    password = request.form['password']
    email = request.form['email']

    user = User.query.filter_by(email=email).first()

    if not user:
        flash("Account does not exist!.", "danger")
        return redirect(url_for('gotologin'))

    if user.access == "Inactive":
        flash("Account disable contact support, or make a new account!", "danger")
        return redirect(url_for('gotologin'))

    if not user.check_password(password):
        flash("Incorrect password or email!", "danger")
        return redirect(url_for('gotologin'))

    session['user_id'] = user.id
    session['email'] = email
    session['role'] = user.role
    session['username'] = user.username

    if user.role == "admin":
        return redirect(url_for('admin_dashboard'))
    elif user.role == "user":
        return redirect(url_for('user_dashboard'))
    else:
        flash("Invalid user role", "danger")
        return redirect(url_for('gotologin'))

@app.route('/register', methods=['POST'])
def register():
    
    name_parts = [request.form.get('last', ''), request.form.get('first', '')]
    username = " ".join([p.capitalize() for p in name_parts if p.strip()]).strip()
    password = request.form['password']
    email = request.form['email']

    existing_user = User.query.filter_by(email=email).first()
    
    if existing_user:
        flash("Email already exists. Please choose a different one.", "danger")
        return render_template('login.html')

    new_user = User(username=username, email=email, access='active')
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    session['user_id'] = new_user.id
    session['email'] = new_user.email
    session['role'] = new_user.role
    session['username'] = new_user.username

    flash("Registration successful!", "success")
    return redirect(url_for('user_dashboard'))

if __name__ == '__main__':

    with app.app_context():
        db.create_all()
        db.session.commit()

    app.run(debug=True)