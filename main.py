import profile

from flask import Flask, render_template, request, redirect, session, url_for, send_from_directory, flash, jsonify, after_this_request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import time, os, uuid, json, traceback
from datetime import time as dt_time
import datetime
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

UPLOAD_FOLDER = os.path.join('static', 'uploads')
PROFILE_PICTURE_FOLDER = os.path.join(UPLOAD_FOLDER, 'uploadedPictures')
DEFAULT_PICTURE_FOLDER = os.path.join(UPLOAD_FOLDER, 'defaultPictures')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PICTURE_FOLDER, exist_ok=True)
os.makedirs(DEFAULT_PICTURE_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_PICTURE_FOLDER'] = PROFILE_PICTURE_FOLDER
app.config['DEFAULT_PICTURE_FOLDER'] = DEFAULT_PICTURE_FOLDER

db = SQLAlchemy(app)

class UserTickets(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    seat_row = db.Column(db.Integer, nullable=False)
    seat_col = db.Column(db.Integer, nullable=False)
    booking_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    

class Profiles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer,db.ForeignKey('user.id'), nullable=False)
    profile_image = db.Column(db.String(1000), nullable=False)
    bio = db.Column(db.String(1000), nullable=True)
    nationality = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(50), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    preffered_genre = db.Column(db.String(50), nullable=False)
    profile_date_created = db.Column(db.Date, nullable=False, default=datetime.datetime.today())

class Movies(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    movie_image = db.Column(db.String(1000), nullable=False)
    movie_trailer = db.Column(db.String(1000), nullable=False)
    movie_date_created = db.Column(db.Date, nullable=False)
    language = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    genre = db.Column(db.String(50), nullable=False)
    age_restrict = db.Column(db.String(100), nullable=False)

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
    
    active = db.Column(db.String(50), nullable=False, default="True")
    user_tickets = db.relationship('UserTickets', backref='schedule', lazy=True)


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
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.today())

    profile = db.relationship('Profiles', backref='user', uselist=False, lazy='joined')
    user_tickets = db.relationship('UserTickets', backref='user', lazy=True)
    # libraries = db.relationship('Libraries', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def inject_now():
    """Adds a changing timestamp to all templates."""
    return {'now': int(time.time())}

app.context_processor(inject_now)

# ======== ROUTES =================       
@app.route('/gotologin')
def gotologin():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('user_dashboard'))

    return render_template('login.html')
@app.route('/api/movies')
def api_movies():
    movies = Movies.query.all()

    data = []
    for m in movies:
        data.append({
            "id": m.id,
            "movie_name": m.movie_name,
            "description": m.description,
            "movie_image": m.movie_image,
            "genre": m.genre,
            "duration": m.duration,
            "age_restrict": m.age_restrict
        })

    return jsonify(data)


@app.route('/api/schedules')
def api_schedules():
    schedules = Schedule.query.all()

    data = []
    for s in schedules:
        data.append({
            "id": s.id,
            "movie_id": s.movie_id,
            "venue_id": s.venue_id,
            "date": s.date.strftime("%Y-%m-%d"),
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "active": s.active
        })

    return jsonify(data)
@app.route('/dashboard')
def dashboard():
    return render_template('luma_dashboard.html')
@app.route('/users')
def view_users():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    if session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))

    user = User.query.get(session['user_id'])
    search_query = request.args.get('search', '').strip()
    count_users = User.query.count()

    query = User.query

    if search_query:
        query = query.filter(
            (User.username.ilike(f"%{search_query}%")) |
            (User.email.ilike(f"%{search_query}%"))
        )

    users = query.all()

    users_data = []

    for u in users:
        users_data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "access": u.access,

            "profile": {
                "bio": u.profile.bio if u.profile else "",
                "nationality": u.profile.nationality if u.profile else "",
                "gender": u.profile.gender if u.profile else "",
                "dob": u.profile.dob.isoformat() if u.profile and u.profile.dob else "",
                "preffered_genre": u.profile.preffered_genre if u.profile else "",
                "profile_image": u.profile.profile_image if u.profile else ""
            }
        })
    
    admin_users = User.query.filter_by(role='admin').all()
    regular_users = User.query.filter_by(role='user').all()
    verified_users = User.query.filter_by(access='verified').all()
    inactive_users = User.query.filter_by(access='inactive').all()
    banned_users = User.query.filter_by(access='banned').all()
    
    return render_template(
        'viewUsers.html', 
        search_query=search_query,
        user=user, 
        count_users=count_users,
        users=users_data,
        admin_users=admin_users,
        regular_users=regular_users,
        verified_users=verified_users,
        inactive_users=inactive_users,
        banned_users=banned_users
    )

@app.route('/moviewView')
def movieViewAdmin():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    if session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))

    user = User.query.get(session['user_id'])
    # movies = Movies.query.all()
    
    search = request.args.get("search", "").strip()

    now = datetime.datetime.now()
    today = datetime.date.today()

    if search:
        movies = Movies.query.filter(
            Movies.movie_name.ilike(f"%{search}%")
        ).all()
    else:
         movies = Movies.query.all()
        

    showing_movies = []
    coming_soon_movies = []
    ended_movies = []
    no_schedules_movies = []
    cancelled_movies = []

    for movie in movies:
        schedules = movie.schedules

        if not schedules:
            no_schedules_movies.append(movie)
            continue
        
        upcoming_schedules = []

        for s in schedules:
            date_val = s.date.date() if isinstance(s.date, datetime.datetime) else s.date
            start = datetime.datetime.combine(date_val, s.start_time)

            if start >= now:
                upcoming_schedules.append((start, s))

        upcoming_schedules.sort(key=lambda x: x[0])
        skip_movie = False

        if upcoming_schedules:
            next_schedule = upcoming_schedules[0][1]
            
            print(f"{movie.movie_name} -> Next Active:", next_schedule.active, type(next_schedule.active))
            
            if str(next_schedule.active) != "True":
                cancelled_movies.append(movie)
                print("CANCELLED MOVIE ADDED:", movie.movie_name)
        
        if skip_movie:
            continue

        is_showing = False
        is_coming = True
        is_ended = True

        for s in schedules:
            date = s.date.date() if isinstance(s.date, datetime.datetime) else s.date
            start = datetime.datetime.combine(date, s.start_time)
            end = datetime.datetime.combine(date, s.end_time)

            if start <= now and now <= end:
                is_showing = True
                
            if now >= start:
                is_coming = False

            if now <= end:
                is_ended = False

        if is_showing:
            showing_movies.append(movie)

        elif all(s_end < now for s_end in [
            datetime.datetime.combine(
                s.date.date() if hasattr(s.date, "date") else s.date,
                s.end_time
            ) for s in movie.schedules
        ]):
            ended_movies.append(movie)
        
        else:
            coming_soon_movies.append(movie)
    
    for movie in movies:
        movie.schedule_data = []

        for s in movie.schedules:
            
            if s.date > today:
                status = "Coming Soon"
            elif s.date < today:
                status = "Ended"
            elif s.date == today:
                status = "On Schedule"
            else:
                status = "Unknown"
                
            if s.active == "True":
                active = "Active"
            else:
                active = "Inactive"
                status = "Canceled"

            movie.schedule_data.append({
                "id": s.id,
                "venue": s.venue.venue_name,
                "date": s.date.strftime("%Y-%m-%d"),
                "start": s.start_time.strftime("%H:%M"),
                "end": s.end_time.strftime("%H:%M"),
                "time_status": status,
                "active_status": active
            })

    return render_template(
        'movieViewAdmin.html',
        user=user,
        movie=movie,
        movies=movies,
        no_schedules_movies=no_schedules_movies,
        showing_movies=showing_movies,
        coming_soon_movies=coming_soon_movies,
        ended_movies=ended_movies,
        cancelled_movies=cancelled_movies
    )

@app.route('/adminAccount')
def AdminAccount():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    if session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))

    user = User.query.get(session['user_id'])
    return render_template('AdminAccount.html', user=user)

@app.route('/sales')
def view_sales():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    if session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))

    user = User.query.get(session['user_id'])
    return render_template('viewSales.html', user=user)

@app.route('/logs')
def view_logs():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    if session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))

    user = User.query.get(session['user_id'])
    return render_template('viewLogs.html', user=user)

@app.route('/')
def index():
    return render_template('landingpage.html')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}

def allowed_file(filename, allowed_ext):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_ext

@app.route('/view_movie/<int:movie_id>')
def view_movie(movie_id):
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    movie = Movies.query.get_or_404(movie_id)
    schedule = Schedule.query.filter_by(movie_id=movie.id).first()
    venue = Venue.query.filter_by(movie_id=movie.id).first()

    status = None

    if schedule and schedule.date:  # make sure schedule exists
        today = date.today()

        if schedule.date == today:
            status = 'onscreen'
        elif schedule.date > today:
            status = 'onschedule'
        else:
            status = 'ended'

    return render_template(
        'view_movie.html',
        movie=movie,
        venue=venue,
        schedule=schedule,
        status=status
    )
@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('login'))

    today = datetime.datetime.today().strftime('%B %d, %Y')

    user = User.query.get(session['user_id'])
    venues = Venue.query.all()

    venue_data = [
        {
            "id": v.id,
            "venue_name": v.venue_name,
            "venue_link": v.venue_linkMap,
            "venue_room": v.venue_room,
            "venue_availability": v.venue_availability,
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
            "venue_availability": v.venue_availability,
            "room": v.venue_room,
            "cap": v.venue_cap,
            "row": v.venue_row,
            "column": v.venue_col,
            "row_gap": v.venue_row_gap,
            "col_gap": v.venue_col_gap,
            "image": v.venue_image
        })

    return jsonify(venue_data)

@app.route('/overview')
def overview():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
    
    if session.get('role') == 'user':
        flash("Unauthorized access", "danger")
        return redirect(url_for('user_dashboard'))
    
    user = User.query.get(session['user_id'])
    
    return render_template(
        'overviewAdmin.html', 
        user=user,
        users=User.query.all(),
        movies=Movies.query.all(),
        count_users=User.query.count(),
        count_movies=Movies.query.count()
        )


@app.route('/user_dashboard')
def user_dashboard():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
    
    if session.get('role') == 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('admin_dashboard'))
    
    user = User.query.get(session['user_id'])
    movies = Movies.query.all()
    profile =Profiles.query.filter_by(user_id=user.id).first()
    
    now = datetime.datetime.now()

    showing_movies = []
    coming_soon_movies = []
    ended_movies = []
    no_schedules_movies = []
    cancelled_movies = []

    for movie in movies:
        schedules = movie.schedules

        if not schedules:
            no_schedules_movies.append(movie)
            continue
        
        upcoming_schedules = []

        for s in schedules:
            date_val = s.date.date() if isinstance(s.date, datetime.datetime) else s.date
            start = datetime.datetime.combine(date_val, s.start_time)

            if start >= now:
                upcoming_schedules.append((start, s))

        upcoming_schedules.sort(key=lambda x: x[0])
        skip_movie = False

        if upcoming_schedules:
            next_schedule = upcoming_schedules[0][1]
            
            print(f"{movie.movie_name} -> Next Active:", next_schedule.active, type(next_schedule.active))
            
            if str(next_schedule.active) != "True":
                cancelled_movies.append(movie)
                print("CANCELLED MOVIE ADDED:", movie.movie_name)
        
        if skip_movie:
            continue

        is_showing = False
        is_coming = True
        is_ended = True

        for s in schedules:
            date = s.date.date() if isinstance(s.date, datetime.datetime) else s.date
            start = datetime.datetime.combine(date, s.start_time)
            end = datetime.datetime.combine(date, s.end_time)

            if start <= now and now <= end:
                is_showing = True
                
            if now >= start:
                is_coming = False

            if now <= end:
                is_ended = False

        if is_showing:
            showing_movies.append(movie)

        elif all(s_end < now for s_end in [
            datetime.datetime.combine(
                s.date.date() if hasattr(s.date, "date") else s.date,
                s.end_time
            ) for s in movie.schedules
        ]):
            ended_movies.append(movie)
        
        else:
            coming_soon_movies.append(movie)
            
    first_letter = user.username[0].lower() if user.username else "a"

    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )
    
    return render_template(
        'luma_dashboard.html', 
        user=user, 
        profile=profile,
        profimage=profimage,
        movies=movies,
        showing_movies=showing_movies,
        coming_soon_movies=coming_soon_movies,
        ended_movies=ended_movies
    )

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

    if user.role == "admin" and user.access == "active":
        flash(f"Welcome back {user.username}, you have been logged in successfully!", "success")
        return redirect(url_for('overview'))
    elif user.role == "user" or user.role == "verified" and user.access == "active":
        flash(f"Welcome back {user.username}, you have been logged in successfully!", "success")
        return redirect(url_for('user_dashboard'))
    elif user.role == "user" or user.role == "verified" and user.access == "inactive":
        return redirect(url_for('gotologin'))
    elif user.role == "user" or user.role == "verified" and user.access == "banned":
        return redirect(url_for('gotologin'))
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
        flash("Email already exists. Please choose a different one.", "error")
        return render_template('login.html')

    # ✅ Create user
    new_user = User(username=username, email=email, role='user', access='active')
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()  # commit first to get user.id

    # ✅ Generate default profile image (first letter)
    first_letter = username[0].lower() if username else "default"
    default_image = f"{first_letter}.jpg"

    # ✅ Create empty profile (except image)
    new_profile = Profiles(
        user_id=new_user.id,
        profile_image=default_image,
        bio="",
        nationality="",
        gender="",
        dob=datetime.date.today(),  # must NOT be None
        preffered_genre=""
    )

    db.session.add(new_profile)
    db.session.commit()

    # ✅ Session
    session['user_id'] = new_user.id
    session['email'] = new_user.email
    session['role'] = new_user.role
    session['username'] = new_user.username

    flash("Registration successful!", "success")
    return redirect(url_for('user_dashboard'))


# ======================= CRUD FOR MOVIE =======================
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
        age_restrict = request.form.get('age_restrict')
        
        venue_link = request.form.get('venue_link')
        description = request.form.get('description')
        venue_cap = request.form.get('cap')
        
        # Get the full schedule data from hidden input (format: date | date | time ||| date | date | time)
        venue_date = request.form.get('venue_date') or ''
        scheduled_date = venue_date
        print(f"DEBUG: Raw venue_date length={len(venue_date) if venue_date else 0}, value='{venue_date[:100]}...'")

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
                release_date_obj = datetime.datetime.strptime(release_date, '%Y-%m-%d').date()
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
            age_restrict=age_restrict,
        )

        db.session.add(new_movie)
        db.session.flush()  # get movie id without committing


        # --- Check if venue already exists ---
        existing_venue = Venue.query.filter_by(
            venue_name=venue_name,
            venue_room=room,
            venue_row=rows,
            venue_col=cols,
            venue_row_gap=int(row_gap_str),
            venue_col_gap=int(col_gap_str),
            venue_cap=capacity
        ).first()

        if existing_venue:
            venue_id_to_use = existing_venue.id
            print("Venue already exists. Using existing venue.")
        else:
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
            db.session.flush()   # get venue id
            venue_id_to_use = new_venue.id
            print("New venue created.")

        if scheduled_date:
            try:
                print(f"DEBUG: Split into {len([s for s in scheduled_date.split('|||') if s.strip()])} schedules")
                schedules = scheduled_date.split("|||")
                schedule_count = 0

                try:
                    duration_minutes = int(duration or 120)
                except (ValueError, TypeError):
                    duration_minutes = 120
                    print(f"DEBUG: Invalid duration '{duration}', default 120min")
                duration_hours = duration_minutes // 60

                for sched in schedules:
                    parts = [p.strip() for p in sched.split("|")]

                    if len(parts) < 3:
                        print(f"Skipping invalid schedule: {sched}")
                        continue

                    date_str = parts[0]
                    start_time_str = parts[2]

                    schedule_date_obj = datetime.strptime(date_str, "%b %d, %Y").date()

                    # Parse hour from HH:MM
                    if ':' in start_time_str:
                        start_hour = int(start_time_str.split(':')[0])
                    else:
                        start_hour = int(start_time_str)

                    start_time_input = dt_time(start_hour, 0)

                    # Calculate end time using duration
                    end_hour = (start_hour + duration_hours) % 24
                    end_time_input = dt_time(end_hour, 0)

                    new_schedule = Schedule(
                        movie_id=new_movie.id,
                        venue_id=venue_id_to_use,
                        date=schedule_date_obj,
                        start_time=start_time_input,
                        end_time=end_time_input
                    )

                    db.session.add(new_schedule)
                    schedule_count += 1
                    print(f"Added schedule: {schedule_date_obj} {start_time_input}-{end_time_input}")

                flash(f'Movie added with {schedule_count} schedules!', 'success')

            except ValueError as e:
                flash(f'Schedule date/time parse error: {str(e)}', 'danger')
                print(f"Parse error: {e}")
            except Exception as e:
                flash(f'Schedule creation error: {str(e)}', 'danger')
                print(f"Unexpected error: {e}")

        db.session.commit()

        flash(f"Movies added successfully! Schedules: {schedule_count if 'schedule_count' in locals() else 0}", "success")
        return redirect(url_for('admin_dashboard'))

@app.route('/delete_movie/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    try:
        movie = Movies.query.get_or_404(movie_id)

        for s in movie.schedules:
            db.session.delete(s)

        db.session.delete(movie)
        db.session.commit()

        return jsonify({"success": True})

    except Exception as e:
        print("DELETE ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/delete_schedule/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):

    schedule = Schedule.query.get_or_404(schedule_id)

    db.session.delete(schedule)
    db.session.commit()

    return jsonify({"success": True})

@app.route("/create_schedule", methods=["POST"])
def create_schedule():
    data = request.get_json()

    date = data["date"]
    start = data["start"]
    end = data["end"]

    # TODO: insert into DB
    # db.insert(...)

    return jsonify({
        "success": True,
        "message": "Schedule created"
    })
    
@app.route("/update_schedule/<int:schedule_id>", methods=["PUT"])
def update_schedule(schedule_id):
    data = request.get_json(silent=True)
    print("DATA:", data)

    schedule = Schedule.query.get(schedule_id)
    
    print ("🔥 UPDATE HIT")
    print(schedule)
    print(request.form)
    print(request.files)

    if not schedule:
        return jsonify({
            "success": False,
            "message": "Schedule not found"
        }), 404

    schedule.date = datetime.datetime.strptime(data["date"], "%Y-%m-%d").date()
    schedule.start_time = datetime.datetime.strptime(data["start"], "%H:%M").time()
    schedule.end_time = datetime.datetime.strptime(data["end"], "%H:%M").time()
    stat = data["status"]
    
    if stat == "Active":
        schedule.active = "True"
    else:
        schedule.active = "False"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Schedule updated"
    })
@app.route('/update_movie/<int:movie_id>', methods=['POST'])
def update_movie(movie_id):

    movie = Movies.query.get_or_404(movie_id)
    
    print("🔥 UPDATE HIT")
    print(request.form)
    print(request.files)

    movie.movie_name = request.form.get('movie_name')
    movie.duration = request.form.get('duration')
    movie.language = request.form.get('language')
    movie.description = request.form.get('description')
    movie.age_restrict = request.form.get('age_restrict')
    movie.genre = ", ".join(request.form.getlist('genres[]'))
    
    movie.movie_date_created = datetime.datetime.strptime(request.form['release_date'],"%Y-%m-%d").date()

    poster = request.files.get('poster')
    if poster and poster.filename:
        filename = f"{uuid.uuid4()}_{secure_filename(poster.filename)}"
        poster.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        movie.movie_image = filename

    trailer = request.files.get('trailer')
    if trailer and trailer.filename:
        filename = f"{uuid.uuid4()}_{secure_filename(trailer.filename)}"
        trailer.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        movie.trailer = filename

    db.session.commit()
    
    print("✅ UPDATED:", movie.movie_name, movie.genre)

    flash("Movie updated successfully", "success")
    return redirect(url_for('movieViewAdmin'))

@app.route("/api/venue/create", methods=["POST"])
def create_venue():
    try:
        data = request.get_json()
        
        print("📦 RECEIVED DATA:", data)

        if not data:
            return jsonify({"success": False, "error": "No JSON received"}), 400

        movie_id = data.get("movie_id")
        venue = data.get("venue")
        schedules = data.get("schedules", [])

        if not movie_id or not venue:
            return jsonify({"success": False, "error": "Missing movie_id or venue"}), 400

        venue_id = insert_venue(venue)

        for s in schedules:
            date_obj = datetime.datetime.strptime(s.get("date"), "%b %d, %Y").date()
            start_time_obj = datetime.datetime.strptime(s.get("startTime"), "%H:%M").time()
            end_time_obj = datetime.datetime.strptime(s.get("endTime"), "%H:%M").time()
            
            insert_schedule(
                venue_id=venue_id,
                movie_id=movie_id,
                date=date_obj,
                start=start_time_obj,
                end=end_time_obj
            )

        return jsonify({"success": True})

    except Exception as e:
        print("🔥 ERROR:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
def insert_schedule(venue_id, date, start, end, movie_id):

    new_schedule = Schedule(
        venue_id=venue_id,
        movie_id=movie_id,
        date=date,
        start_time=start,
        end_time=end,
        active="True"
    )

    db.session.add(new_schedule)
    db.session.commit()

    return new_schedule.id

def insert_venue(venue):

    rows = int(venue.get("rows") or 0)
    cols = int(venue.get("cols") or 0)
    cap = rows * cols or None

    # 🔍 Check if venue already exists
    existing_venue = Venue.query.filter_by(
        venue_name=venue.get("name"),
        venue_room=venue.get("room"),
        venue_row=rows,
        venue_col=cols,
        venue_row_gap=venue.get("row_gap"),
        venue_col_gap=venue.get("col_gap"),
    ).first()

    # ✅ If exists, reuse it
    if existing_venue:
        return existing_venue.id

    # 🆕 Otherwise create new
    new_venue = Venue(
        venue_name=venue.get("name"),
        venue_image=venue.get("image"),
        venue_linkMap=venue.get("link"),
        venue_room=venue.get("room"),
        venue_cap=cap,
        venue_row=rows,
        venue_col=cols,
        venue_row_gap=venue.get("row_gap"),
        venue_col_gap=venue.get("col_gap"),
        venue_availability=venue.get("availability"),
    )

    db.session.add(new_venue)
    db.session.commit()

    return new_venue.id


# ===================================== CRUD FOR USERS ======================================
@app.route('/edit_user/<int:user_id>', methods=['POST'])
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    profile = Profiles.query.filter_by(user_id=user.id).first()

    if not profile:
        profile = Profiles(user_id=user.id)
        db.session.add(profile)

    file = request.files.get('profile_picture')

    if file and file.filename:
        filename = secure_filename(file.filename)

        upload_path = os.path.join(app.config['PROFILE_PICTURE_FOLDER'], filename)
        file.save(upload_path)

        profile.profile_image = filename

        print(f"✅ Uploaded new profile picture for user {user.username}: {filename}")

    # user fields
    user.username = request.form['name']
    user.email = request.form['email']
    user.access = request.form['status']
    user.role = request.form['role']
    
    new_password = request.form.get('password')

    if new_password and new_password.strip():
        user.password_hash = generate_password_hash(new_password)

    # profile fields
    profile.bio = request.form.get('bio')
    profile.nationality = request.form.get('nationality')
    profile.gender = request.form.get('gender')
    dob_raw = request.form.get('dob') 
    if dob_raw:
        profile.dob = datetime.datetime.strptime(dob_raw, "%Y-%m-%d").date()
    else:
        profile.dob = datetime.datetime.today()
    profile.preffered_genre = request.form.get('genre') or "Not set"

    db.session.commit()

    return redirect(url_for('view_users'))

@app.route('/delete_user/<int:user_id>', methods=['POST'])
def delete_user(user_id):
    if 'user_id' not in session:
        flash("You must be logged in.", "danger")
        return redirect(url_for('login'))

    userSession = User.query.get(session['user_id'])

    if userSession and user_id == userSession.id:
        flash("You cannot delete your own account.", "error")
        return redirect(url_for('view_users'))

    user = User.query.get_or_404(user_id)

    profile = Profiles.query.filter_by(user_id=user.id).first()

    if profile:
        db.session.delete(profile)

    db.session.delete(user)
    db.session.commit()

    flash("User deleted successfully.", "success")
    return redirect(url_for('view_users'))

@app.route('/get_profile/<int:user_id>')
def get_profile(user_id):
    user = User.query.get(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()

    if not user:
        return {"error": "User not found"}, 404

    # get first letter of username (lowercase)
    first_letter = user.username[0].lower() if user.username else "a"

    # profile image logic
    if profile and profile.profile_image:
        image_path = f"/static/uploads/uploadedPictures/{profile.profile_image}"
    else:
        image_path = f"/static/uploads/defaultPictures/{first_letter}.jpg"

    return {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.access,
        "bio": profile.bio if profile else "",
        "gender": profile.gender if profile else "",
        "nationality": profile.nationality if profile else "",
        "image": image_path
    }
    
@app.route('/movie_detail/<int:movie_id>')
def movie_detail(movie_id):
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    movie = Movies.query.get_or_404(movie_id)
    user = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()

    first_letter = user.username[0].lower() if user.username else "a"
    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )

    return render_template('view_movie.html', movie=movie, user=user, profimage=profimage)

@app.route('/movie_schedule')
def view_schedule():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    user = User.query.get(session['user_id'])
    
    profile = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"
    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )
    # movies = Movies.query.all()

    #  # categorize movies
    # showing_movies = []
    # coming_soon_movies = []
    # ended_movies = []
    # no_schedules_movies = []
    # cancelled_movies = []

    # for movie in movies:
    #     schedules = movie.schedules

    #     if not schedules:
    #         no_schedules_movies.append(movie)
    #         continue  

    return render_template('movie_schedule.html', user=user, profimage=profimage)

@app.route('/view_venues')
def view_venues():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    venues = Venue.query.all()
    user = User.query.get(session['user_id'])
    
    profile = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"
    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )

    return render_template('movie_venues.html', venues=venues, user=user, profimage=profimage)

@app.route('/view_tickets')
def view_tickets():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))

    user = User.query.get(session['user_id'])
    
    profile = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"
    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )
    
    return render_template('movie_tickets.html', user=user, profimage=profimage)



@app.route('/book/<int:schedule_id>')
def book_seat(schedule_id):
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
 
    schedule = Schedule.query.get_or_404(schedule_id)
    movie    = Movies.query.get_or_404(schedule.movie_id)
    venue    = Venue.query.get_or_404(schedule.venue_id)
    user     = User.query.get(session['user_id'])
    profile  = Profiles.query.filter_by(user_id=user.id).first()
 
    first_letter = user.username[0].lower() if user.username else "a"
    profimage = (
        f"/static/uploads/uploadedPictures/{profile.profile_image}"
        if profile and profile.profile_image
        else f"/static/uploads/defaultPictures/{first_letter}.jpg"
    )
 
    return render_template(
        'book_seat.html',
        schedule=schedule,
        movie=movie,
        venue=venue,
        user=user,
        profimage=profimage,
    )
 
 
@app.route('/api/booked_seats/<int:schedule_id>')
def api_booked_seats(schedule_id):
    bookings = Booking.query.filter_by(schedule_id=schedule_id, status='confirmed').all()
    return jsonify([
        {"seat": b.seat_label, "type": b.ticket_type}
        for b in bookings
    ])
 
 
@app.route('/api/book', methods=['POST'])
def api_book():
    if 'user_id' not in session:
        return jsonify({"success": False, "error": "Not logged in"}), 401
 
    data        = request.get_json()
    schedule_id = data.get('schedule_id')
    seat_label  = data.get('seat')
    ticket_type = data.get('type', 'standard')
 
    if not schedule_id or not seat_label:
        return jsonify({"success": False, "error": "Missing fields"}), 400
 
    # Check seat not already taken
    existing = Booking.query.filter_by(
        schedule_id=schedule_id,
        seat_label=seat_label,
        status='confirmed'
    ).first()
    if existing:
        return jsonify({"success": False, "error": "Seat already taken"}), 409
 
    price = 500 if ticket_type == 'premium' else 350
 
    booking = Booking(
        user_id     = session['user_id'],
        schedule_id = schedule_id,
        seat_label  = seat_label,
        ticket_type = ticket_type,
        price       = price,
    )
    db.session.add(booking)
    db.session.commit()
 
    return jsonify({"success": True, "booking_id": booking.id})



if __name__ == '__main__':

    with app.app_context():
        db.create_all()
        db.session.commit()

    app.run(debug=True)