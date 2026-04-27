import profile

from flask import Flask, current_app, render_template, request, redirect, session, url_for, send_from_directory, flash, jsonify, after_this_request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import time, os, uuid, json, traceback
import smtplib
import random
from datetime import time as dt_time
import datetime
import requests
import base64
from email.message import EmailMessage
from national import nationalities
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
import qrcode
import qrcode.image.svg
import socket
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

def load_local_env(env_path=".env", override=True):
    """Load simple KEY=VALUE pairs from a local .env file into os.environ."""
    if not os.path.exists(env_path):
        return

    try:
        with open(env_path, "r", encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()

                if not line or line.startswith("#") or "=" not in line:
                    continue

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()

                if not key:
                    continue

                if (value.startswith('"') and value.endswith('"')) or (
                    value.startswith("'") and value.endswith("'")
                ):
                    value = value[1:-1]

                if override or key not in os.environ:
                    os.environ[key] = value
    except OSError:
        pass

load_local_env()

app = Flask(__name__)

app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['LAST_UPDATE'] = int(time.time())
app.secret_key = "aries_vincent_secret"


app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///luma.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "")
app.config["MAIL_FROM"] = os.environ.get("MAIL_FROM", app.config["MAIL_USERNAME"])
app.config["PASSWORD_RESET_SALT"] = os.environ.get("PASSWORD_RESET_SALT", "luma-password-reset")
app.config["GOOGLE_CLIENT_ID"] = os.environ.get("GOOGLE_CLIENT_ID", "")

password_reset_sessions = {}

UPLOAD_FOLDER = os.path.join('static', 'uploads')
PROFILE_PICTURE_FOLDER = os.path.join(UPLOAD_FOLDER, 'uploadedPictures')
DEFAULT_PICTURE_FOLDER = os.path.join(UPLOAD_FOLDER, 'defaultPictures')
QR_TICKET_CODES = os.path.join(UPLOAD_FOLDER, 'ticketCodes')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PICTURE_FOLDER, exist_ok=True)
os.makedirs(DEFAULT_PICTURE_FOLDER, exist_ok=True)
os.makedirs(QR_TICKET_CODES, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_PICTURE_FOLDER'] = PROFILE_PICTURE_FOLDER
app.config['DEFAULT_PICTURE_FOLDER'] = DEFAULT_PICTURE_FOLDER
app.config['QR_TICKET_CODES'] = QR_TICKET_CODES

db = SQLAlchemy(app)

class AdminActions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)

class SystemLog(db.Model):
    __tablename__ = 'system_log'
 
    id        = db.Column(db.Integer, primary_key=True)
    user_id   = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # can be null for system events
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    level     = db.Column(db.String(10),  nullable=False, default='INFO')   # INFO | WARNING | ERROR
    actor     = db.Column(db.String(150), nullable=False)                   # username or 'system'
    action    = db.Column(db.String(200), nullable=False)                   # human-readable verb
    target    = db.Column(db.String(200), nullable=True)                    # affected entity, e.g. "Movie #3"
    details   = db.Column(db.Text,        nullable=True)

class MovieRating(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('user.id'),    nullable=False)
    movie_id   = db.Column(db.Integer, db.ForeignKey('movies.id'),  nullable=False)
    stars      = db.Column(db.Integer, nullable=False)          # 1 – 5
    review     = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now, onupdate=datetime.datetime.now)
 
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_rating'),
    )
 
    user  = db.relationship('User',   backref='ratings', lazy='joined')
    movie = db.relationship('Movies', backref='ratings', lazy='joined')

class QrCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    qr_code_path_image = db.Column(db.String(1000), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'schedule_id', name='uq_user_schedule_qr'),)

class UserTickets(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('schedule.id'), nullable=False)
    seat_row = db.Column(db.Integer, nullable=False)
    seat_col = db.Column(db.Integer, nullable=False)
    ticket_type = db.Column(db.String(50), nullable=False, default='standard')
    booking_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    reference_code = db.Column(db.String(100), nullable=False, unique=True)
    scanned = db.Column(db.Boolean, nullable=False, default=False)

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
    movie_libraries = db.relationship('Libraries', backref='movie', lazy=True)  

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
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


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
    user_libraries = db.relationship('Libraries', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def inject_now():
    """Adds a changing timestamp to all templates."""
    return {'now': int(time.time())}

app.context_processor(inject_now)

# ======== LOG HELPER =================
def log_event(actor: str, action: str, target: str = None,
               details: str = None, level: str = 'INFO', user_id: int = None):
    """Append one row to SystemLog. Only the backend calls this."""
    try:
        entry = SystemLog(
            user_id=user_id,
            level=level.upper(),
            actor=actor,
            action=action,
            target=target,
            details=details,
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()

# ======== ADMIN ACTION LOGGER =================
def log_admin_action(action: str):
    """Record a permanent danger-zone action performed by the current admin."""
    try:
        entry = AdminActions(
            admin_id=session.get('user_id'),
            action=action,
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()

def get_reset_serializer():
    return URLSafeTimedSerializer(app.secret_key)

def create_email_verification_token(user_id):
    return get_reset_serializer().dumps(
        {"user_id": user_id, "purpose": "email-verify"},
        salt="luma-email-verify"
    )

def load_email_verification_token(token, max_age=86400):  # 24 hours
    data = get_reset_serializer().loads(
        token,
        salt="luma-email-verify",
        max_age=max_age
    )
    if data.get("purpose") != "email-verify":
        raise BadSignature("Invalid verification purpose.")
    return data

def send_verification_email(user, token):
    mail_username = app.config.get("MAIL_USERNAME")
    mail_password = app.config.get("MAIL_PASSWORD")
    mail_from     = app.config.get("MAIL_FROM")

    verify_link = url_for("verify_email", token=token, _external=True)

    message = EmailMessage()
    message["Subject"] = "LUMA – Verify your email address"
    message["From"]    = mail_from
    message["To"]      = user.email
    message.set_content(
        f"Hello {user.username},\n\n"
        "Thanks for registering at LUMA!\n\n"
        "Please verify your email address by clicking the link below:\n"
        f"{verify_link}\n\n"
        "This link expires in 24 hours. If you did not register, ignore this email."
    )

    with smtplib.SMTP(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]) as server:
        if app.config.get("MAIL_USE_TLS", True):
            server.starttls()
        server.login(mail_username, mail_password)
        server.send_message(message)

def create_password_reset_token(user_id):
    return get_reset_serializer().dumps(
        {"user_id": user_id, "purpose": "password-reset"},
        salt=app.config["PASSWORD_RESET_SALT"]
    )

def load_password_reset_token(token, max_age=3600):
    data = get_reset_serializer().loads(
        token,
        salt=app.config["PASSWORD_RESET_SALT"],
        max_age=max_age
    )

    if data.get("purpose") != "password-reset":
        raise BadSignature("Invalid password reset purpose.")

    return data

def create_password_reset_pin():
    return f"{random.randint(0, 999999):06d}"

def set_password_reset_session(token, pin, verified=False):
    password_reset_sessions[token] = {
        "pin": pin,
        "verified": verified,
        "updated_at": time.time(),
    }

def get_password_reset_session(token):
    entry = password_reset_sessions.get(token)
    if not entry:
        return None
    return entry

def is_password_reset_verified(token):
    entry = get_password_reset_session(token)
    if not entry:
        return False
    return bool(entry.get("verified"))

def verify_password_reset_pin(token, pin):
    entry = get_password_reset_session(token)
    if not entry:
        return False

    if str(entry.get("pin")) != str(pin):
        return False

    entry["verified"] = True
    entry["updated_at"] = time.time()
    return True

def send_password_reset_email(user, token=None, pin=None):
    mail_username = app.config.get("MAIL_USERNAME")
    mail_password = app.config.get("MAIL_PASSWORD")
    mail_from = app.config.get("MAIL_FROM")

    missing_settings = []
    if not mail_username:
        missing_settings.append("MAIL_USERNAME")
    if not mail_password:
        missing_settings.append("MAIL_PASSWORD")
    if not mail_from:
        missing_settings.append("MAIL_FROM")

    if missing_settings:
        raise RuntimeError(f"Missing mail settings: {', '.join(missing_settings)}")

    token = token or create_password_reset_token(user.id)
    pin = pin or create_password_reset_pin()
    reset_link = url_for("reset_password", token=token, _external=True)

    message = EmailMessage()
    message["Subject"] = "LUMA password reset confirmation"
    message["From"] = mail_from
    message["To"] = user.email
    message.set_content(
        f"Hello {user.username},\n\n"
        "Yes, we received your password reset request for your LUMA account.\n\n"
        "Use this 6-digit verification PIN to continue resetting your password:\n"
        f"{pin}\n\n"
        "Enter this PIN on the device where you started the request.\n\n"
        f"Backup reset link:\n{reset_link}\n\n"
        "This link expires in 1 hour. If you did not request this, you can ignore this email."
    )

    try:
        with smtplib.SMTP(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]) as server:
            if app.config.get("MAIL_USE_TLS", True):
                server.starttls()
            server.login(mail_username, mail_password)
            server.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        raise RuntimeError(
            "SMTP authentication failed. Check MAIL_USERNAME and use a valid app password for MAIL_PASSWORD."
        ) from exc
    except smtplib.SMTPException as exc:
        raise RuntimeError(f"SMTP error: {exc}") from exc
    except OSError as exc:
        raise RuntimeError(f"Mail server connection error: {exc}") from exc

def verify_google_credential(credential):
    google_client_id = app.config.get("GOOGLE_CLIENT_ID", "").strip()
    if not google_client_id:
        raise RuntimeError("Google sign-in is not configured. Add GOOGLE_CLIENT_ID to .env.")

    response = requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": credential},
        timeout=10
    )
    payload = response.json()

    if not response.ok:
        raise RuntimeError(payload.get("error_description") or payload.get("error") or "Google token verification failed.")

    if payload.get("aud") != google_client_id:
        raise RuntimeError("Google client ID mismatch.")

    if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise RuntimeError("Invalid Google token issuer.")

    if str(payload.get("email_verified")).lower() != "true":
        raise RuntimeError("Google email is not verified.")

    return payload

def create_default_profile_for_user(user, default_image=None):
    first_letter = user.username[0].lower() if user.username else "default"
    profile_image = default_image or f"{first_letter}.jpg"

    new_profile = Profiles(
        user_id=user.id,
        profile_image=profile_image,
        bio="",
        nationality="",
        gender="",
        dob=datetime.date.today(),
        preffered_genre=""
    )
    db.session.add(new_profile)

def start_user_session(user):
    session['user_id'] = user.id
    session['email'] = user.email
    session['role'] = user.role
    session['username'] = user.username

# ======== AUTH DECORATORS =================
from functools import wraps

def login_required(f):
    """Redirect to login if there is no active session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in first.", "danger")
            return redirect(url_for('gotologin'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Must be logged in AND have role == 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in first.", "danger")
            return redirect(url_for('gotologin'))
        if session.get('role') != 'admin':
            flash("Unauthorized access.", "danger")
            return redirect(url_for('user_dashboard'))
        return f(*args, **kwargs)
    return decorated

def user_required(f):
    """Must be logged in AND have role == 'user' (blocks admins from user-only pages)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in first.", "danger")
            return redirect(url_for('gotologin'))
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        return f(*args, **kwargs)
    return decorated

# ======== ROUTES =================       
@app.route('/gotologin')
def gotologin():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('overview'))
        else:
            return redirect(url_for('user_dashboard'))

    return render_template('login.html', google_client_id=app.config.get("GOOGLE_CLIENT_ID", ""))

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
@admin_required
def view_users():
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
@admin_required
def movieViewAdmin():
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
@admin_required
def AdminAccount():
    user    = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()

    # profile image
    first_letter = user.username[0].lower() if user.username else 'a'
    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path, 'static', 'uploads',
            'uploadedPictures', profile.profile_image
        )
        profile_image = (
            url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
            if os.path.exists(uploaded_path)
            else url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
        )
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')

    # quick stats
    total_users   = User.query.count()
    total_movies  = Movies.query.count()
    total_tickets = UserTickets.query.count()
    total_logs    = SystemLog.query.count()

    # recent logs by this admin
    recent_logs = (
        SystemLog.query
        .filter(SystemLog.actor == user.username)
        .order_by(SystemLog.timestamp.desc())
        .limit(8).all()
    )

    # permanent danger-zone action history for this admin
    admin_actions = (
        AdminActions.query
        .filter_by(admin_id=user.id)
        .order_by(AdminActions.timestamp.desc())
        .all()
    )

    return render_template(
        'AdminAccount.html',
        user          = user,
        profile       = profile,
        profile_image = profile_image,
        total_users   = total_users,
        total_movies  = total_movies,
        total_tickets = total_tickets,
        total_logs    = total_logs,
        recent_logs   = recent_logs,
        admin_actions = admin_actions,
    )

@app.route('/admin/update_account', methods=['POST'])
@admin_required
def admin_update_account():
    user    = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()
    if not profile:
        profile = Profiles(user_id=user.id, profile_image='',
                           nationality='', gender='', preffered_genre='')
        db.session.add(profile)

    action = request.form.get('action')

    if action == 'update_info':
        new_username = request.form.get('username', '').strip()
        if new_username and new_username != user.username:
            user.username = new_username
            session['username'] = new_username
        profile.bio         = request.form.get('bio', '').strip()
        profile.nationality = request.form.get('nationality', '').strip()
        profile.gender      = request.form.get('gender', '').strip()
        dob_str = request.form.get('dob', '')
        if dob_str:
            try:
                profile.dob = datetime.datetime.strptime(dob_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        # avatar upload
        pic = request.files.get('profile_image')
        if pic and pic.filename and allowed_file(pic.filename, ALLOWED_IMAGE_EXTENSIONS):
            filename = f"user_{user.id}_{secure_filename(pic.filename)}"
            pic.save(os.path.join(app.config['PROFILE_PICTURE_FOLDER'], filename))
            profile.profile_image = filename
        db.session.commit()
        log_event(actor=user.username, action='Updated admin account info', target=f'Admin #{user.id}', user_id=user.id)
        flash('Account info updated!', 'success')

    elif action == 'change_password':
        current  = request.form.get('current_password', '')
        new_pw   = request.form.get('new_password', '')
        confirm  = request.form.get('confirm_password', '')
        if not user.check_password(current):
            flash('Current password is incorrect.', 'danger')
        elif len(new_pw) < 6:
            flash('New password must be at least 6 characters.', 'danger')
        elif new_pw != confirm:
            flash('Passwords do not match.', 'danger')
        else:
            user.set_password(new_pw)
            db.session.commit()
            log_event(actor=user.username, action='Changed password', target=f'Admin #{user.id}', level='WARNING', user_id=user.id)
            flash('Password changed successfully!', 'success')

    return redirect(url_for('AdminAccount'))

@app.route('/sales')
@admin_required
def view_sales():
    user = User.query.get(session['user_id'])
    search = request.args.get('search', '').strip().lower()
 
    # ── Pull all tickets with related data ──────────────────────────────────
    all_tickets = (
        UserTickets.query
        .join(Schedule, UserTickets.schedule_id == Schedule.id)
        .join(Movies,   Schedule.movie_id      == Movies.id)
        .join(Venue,    Schedule.venue_id       == Venue.id)
        .join(User,     UserTickets.user_id     == User.id)
        .order_by(UserTickets.booking_time.desc())
        .all()
    )
 
    # ── Apply search filter ─────────────────────────────────────────────────
    if search:
        all_tickets = [
            t for t in all_tickets
            if search in t.schedule.movie.movie_name.lower()
            or search in t.user.username.lower()
            or search in t.reference_code.lower()
        ]
 
    # ── KPI totals ──────────────────────────────────────────────────────────
    STANDARD_PRICE = 350
    PREMIUM_PRICE  = 500
 
    standard_tickets = [t for t in all_tickets if t.ticket_type == 'standard']
    premium_tickets  = [t for t in all_tickets if t.ticket_type == 'premium']
 
    standard_count  = len(standard_tickets)
    premium_count   = len(premium_tickets)
    total_tickets   = len(all_tickets)
    total_revenue   = standard_count * STANDARD_PRICE + premium_count * PREMIUM_PRICE
    unique_buyers   = len(set(t.user_id for t in all_tickets))
 
    # ── Revenue per day (last 30 days) ──────────────────────────────────────
    from collections import defaultdict
    daily_map = defaultdict(int)
    for t in all_tickets:
        day = t.booking_time.strftime('%b %d')
        price = PREMIUM_PRICE if t.ticket_type == 'premium' else STANDARD_PRICE
        daily_map[day] += price
 
    # Keep last 30 distinct days sorted
    sorted_days = sorted(daily_map.keys(),
                         key=lambda d: datetime.datetime.strptime(d + ' 2026', '%b %d %Y'))[-30:]
    daily_labels  = sorted_days
    daily_revenue = [daily_map[d] for d in sorted_days]
 
    # ── Revenue per month ───────────────────────────────────────────────────
    monthly_map = defaultdict(int)
    for t in all_tickets:
        month = t.booking_time.strftime('%b %Y')
        price = PREMIUM_PRICE if t.ticket_type == 'premium' else STANDARD_PRICE
        monthly_map[month] += price
 
    sorted_months   = sorted(monthly_map.keys(),
                             key=lambda m: datetime.datetime.strptime(m, '%b %Y'))
    monthly_labels  = sorted_months
    monthly_revenue = [monthly_map[m] for m in sorted_months]
 
    # ── Revenue + ticket counts per movie ───────────────────────────────────
    movie_map = defaultdict(lambda: {'ticket_count': 0, 'standard_count': 0,
                                      'premium_count': 0, 'revenue': 0,
                                      'genre': ''})
    for t in all_tickets:
        movie = t.schedule.movie
        key   = movie.movie_name
        price = PREMIUM_PRICE if t.ticket_type == 'premium' else STANDARD_PRICE
        movie_map[key]['ticket_count'] += 1
        movie_map[key]['revenue']      += price
        movie_map[key]['genre']         = movie.genre
        if t.ticket_type == 'premium':
            movie_map[key]['premium_count'] += 1
        else:
            movie_map[key]['standard_count'] += 1
 
    top_movies = sorted(
        [{'movie_name': k, **v} for k, v in movie_map.items()],
        key=lambda x: x['revenue'], reverse=True
    )
 
    # Add share percentage
    for m in top_movies:
        m['share'] = (m['revenue'] / total_revenue * 100) if total_revenue else 0
 
    # Chart data (top 8 movies)
    chart_movies        = top_movies[:8]
    movie_chart_names   = [m['movie_name'] for m in chart_movies]
    movie_chart_revenues= [m['revenue']    for m in chart_movies]
 
    # ── Revenue per venue ───────────────────────────────────────────────────
    venue_map = defaultdict(int)
    for t in all_tickets:
        venue_name = t.schedule.venue.venue_name
        venue_map[venue_name] += 1
 
    venue_chart_names  = list(venue_map.keys())
    venue_chart_counts = list(venue_map.values())
 
    # ── Recent 50 transactions (table) ─────────────────────────────────────
    recent_tickets = []
    for t in all_tickets[:50]:
        movie   = t.schedule.movie
        venue   = t.schedule.venue
        price   = PREMIUM_PRICE if t.ticket_type == 'premium' else STANDARD_PRICE
        seat    = f"{chr(t.seat_row + 64)}{t.seat_col}"
        recent_tickets.append({
            'reference_code': t.reference_code,
            'buyer':          t.user.username,
            'movie':          movie.movie_name,
            'venue':          venue.venue_name,
            'date':           t.booking_time.strftime('%b %d, %Y'),
            'seat':           seat,
            'ticket_type':    t.ticket_type,
            'price':          price,
        })
 
    return render_template(
        'viewSales.html',
        user             = user,
        # KPIs
        total_revenue    = total_revenue,
        total_tickets    = total_tickets,
        standard_count   = standard_count,
        premium_count    = premium_count,
        unique_buyers    = unique_buyers,
        # Chart data
        daily_labels     = daily_labels,
        daily_revenue    = daily_revenue,
        monthly_labels   = monthly_labels,
        monthly_revenue  = monthly_revenue,
        movie_chart_names    = movie_chart_names,
        movie_chart_revenues = movie_chart_revenues,
        venue_chart_names    = venue_chart_names,
        venue_chart_counts   = venue_chart_counts,
        # Tables
        top_movies       = top_movies,
        recent_tickets   = recent_tickets,
    )

@app.route('/logs')
@admin_required
def view_logs():
    user   = User.query.get(session['user_id'])
    search = request.args.get('search', '').strip().lower()
    level  = request.args.get('level', '').strip().upper()
 
    query = SystemLog.query.order_by(SystemLog.timestamp.desc())
 
    if level in ('INFO', 'WARNING', 'ERROR'):
        query = query.filter(SystemLog.level == level)

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                SystemLog.actor.ilike(like),
                SystemLog.action.ilike(like),
                SystemLog.target.ilike(like),
                SystemLog.details.ilike(like),
            )
        )
 
    logs = query.all()
 
    # keep server-side counts always based on full table (unfiltered)
    today      = datetime.date.today()
    all_logs   = SystemLog.query.all()
    total_logs   = len(all_logs)
    info_count   = sum(1 for l in all_logs if l.level == 'INFO')
    warning_count= sum(1 for l in all_logs if l.level == 'WARNING')
    error_count  = sum(1 for l in all_logs if l.level == 'ERROR')
    today_count  = sum(1 for l in all_logs if l.timestamp.date() == today)
 
    return render_template(
        'viewLogs.html',
        user          = user,
        logs          = logs,
        total_logs    = total_logs,
        info_count    = info_count,
        warning_count = warning_count,
        error_count   = error_count,
        today_count   = today_count,
        active_search = search,
        active_level  = level,
    )

@app.route('/')
def index():
    # session.clear()
    return render_template('landingpage.html')

def allowed_file(filename, allowed_ext):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_ext

@app.route('/view_movie/<int:movie_id>')
@login_required
def view_movie(movie_id):

    movie = Movies.query.get_or_404(movie_id)
    schedule = Schedule.query.filter_by(movie_id=movie.id).first()
    venue = Venue.query.filter_by().first()

    status = None

    if schedule and schedule.date:  # make sure schedule exists
        today = datetime.date.today()

        if schedule.date == today:
            status = 'onscreen'
        elif schedule.date > today:
            status = 'onschedule'
        else:
            status = 'ended'

    user = User.query.get(session['user_id'])
    profile_image = user.profile.profile_image if user.profile and user.profile.profile_image else 'assets/default-avatar.png'

    return render_template(
        'view_movie.html',
        movie=movie,
        venue=venue,
        schedule=schedule,
        status=status,
        user=user,
        profile_image=profile_image,
    )

@app.route('/library/toggle/<int:movie_id>', methods=['POST'])
@login_required
def toggle_library(movie_id):
    existing = Libraries.query.filter_by(
        user_id=session['user_id'],
        movie_id=movie_id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        log_event(actor=session.get('username', 'user'), action='Removed movie from library',
                  target=f'Movie #{movie_id}', user_id=session.get('user_id'))
        return jsonify({'in_library': False})
    else:
        entry = Libraries(user_id=session['user_id'], movie_id=movie_id)
        db.session.add(entry)
        db.session.commit()
        log_event(actor=session.get('username', 'user'), action='Added movie to library',
                  target=f'Movie #{movie_id}', user_id=session.get('user_id'))
        return jsonify({'in_library': True})

@app.route('/admin_dashboard')
@admin_required
def admin_dashboard():
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
@admin_required
def overview():
    user = User.query.get(session['user_id'])

    total_users = User.query.count()
    total_movies = Movies.query.count()
    total_tickets = UserTickets.query.count()
    total_schedules = Schedule.query.count()
    total_venues = Venue.query.count()
    total_logs = SystemLog.query.count()

    admins_count = User.query.filter_by(role='admin').count()
    regular_users_count = User.query.filter_by(role='user').count()
    active_users_count = User.query.filter_by(access='active').count()
    verified_users_count = User.query.filter_by(access='verified').count()
    inactive_users_count = User.query.filter_by(access='inactive').count()
    banned_users_count = User.query.filter_by(access='banned').count()

    today = datetime.date.today()
    now = datetime.datetime.now()
    month_start = today.replace(day=1)

    schedules = Schedule.query.all()
    active_schedules_count = sum(1 for s in schedules if str(s.active) == "True")
    inactive_schedules_count = total_schedules - active_schedules_count
    schedules_today_count = sum(1 for s in schedules if s.date == today)
    upcoming_schedules_count = sum(1 for s in schedules if s.date >= today and str(s.active) == "True")

    movies = Movies.query.all()
    movies_with_schedules_count = sum(1 for movie in movies if movie.schedules)
    movies_without_schedules_count = total_movies - movies_with_schedules_count

    showing_now_count = 0
    coming_soon_count = 0
    ended_movies_count = 0

    for movie in movies:
        if not movie.schedules:
            continue

        is_showing = False
        has_upcoming = False
        has_finished = False

        for sched in movie.schedules:
            schedule_date = sched.date.date() if isinstance(sched.date, datetime.datetime) else sched.date
            start_dt = datetime.datetime.combine(schedule_date, sched.start_time)
            end_dt = datetime.datetime.combine(schedule_date, sched.end_time)

            if str(sched.active) == "True" and start_dt <= now <= end_dt:
                is_showing = True
            if str(sched.active) == "True" and start_dt > now:
                has_upcoming = True
            if end_dt < now:
                has_finished = True

        if is_showing:
            showing_now_count += 1
        elif has_upcoming:
            coming_soon_count += 1
        elif has_finished:
            ended_movies_count += 1

    all_tickets = (
        UserTickets.query
        .join(Schedule, UserTickets.schedule_id == Schedule.id)
        .join(Movies, Schedule.movie_id == Movies.id)
        .join(Venue, Schedule.venue_id == Venue.id)
        .join(User, UserTickets.user_id == User.id)
        .order_by(UserTickets.booking_time.desc())
        .all()
    )

    STANDARD_PRICE = 350
    PREMIUM_PRICE = 500

    total_revenue = 0
    revenue_today = 0
    revenue_this_month = 0
    premium_tickets_count = 0
    standard_tickets_count = 0
    unique_buyers_count = len({ticket.user_id for ticket in all_tickets})

    movie_sales_map = {}
    venue_sales_map = {}

    for ticket in all_tickets:
        price = PREMIUM_PRICE if ticket.ticket_type == 'premium' else STANDARD_PRICE
        total_revenue += price

        booking_date = ticket.booking_time.date()
        if booking_date == today:
            revenue_today += price
        if booking_date >= month_start:
            revenue_this_month += price

        if ticket.ticket_type == 'premium':
            premium_tickets_count += 1
        else:
            standard_tickets_count += 1

        movie_name = ticket.schedule.movie.movie_name
        venue_name = ticket.schedule.venue.venue_name

        if movie_name not in movie_sales_map:
            movie_sales_map[movie_name] = {"tickets": 0, "revenue": 0}
        movie_sales_map[movie_name]["tickets"] += 1
        movie_sales_map[movie_name]["revenue"] += price

        if venue_name not in venue_sales_map:
            venue_sales_map[venue_name] = 0
        venue_sales_map[venue_name] += 1

    top_movie = None
    if movie_sales_map:
        top_movie_name, top_movie_stats = max(movie_sales_map.items(), key=lambda item: item[1]["revenue"])
        top_movie = {
            "name": top_movie_name,
            "tickets": top_movie_stats["tickets"],
            "revenue": top_movie_stats["revenue"],
        }

    top_venue = None
    if venue_sales_map:
        top_venue_name, top_venue_tickets = max(venue_sales_map.items(), key=lambda item: item[1])
        top_venue = {
            "name": top_venue_name,
            "tickets": top_venue_tickets,
        }

    recent_users = User.query.order_by(User.created_at.desc()).limit(6).all()
    recent_movies = Movies.query.order_by(Movies.movie_date_created.desc()).limit(6).all()
    recent_logs = SystemLog.query.order_by(SystemLog.timestamp.desc()).limit(8).all()

    return render_template(
        'overviewAdmin.html',
        user=user,
        users=recent_users,
        movies=recent_movies,
        count_users=total_users,
        count_movies=total_movies,
        total_tickets=total_tickets,
        total_schedules=total_schedules,
        total_venues=total_venues,
        total_logs=total_logs,
        admins_count=admins_count,
        regular_users_count=regular_users_count,
        active_users_count=active_users_count,
        verified_users_count=verified_users_count,
        inactive_users_count=inactive_users_count,
        banned_users_count=banned_users_count,
        active_schedules_count=active_schedules_count,
        inactive_schedules_count=inactive_schedules_count,
        schedules_today_count=schedules_today_count,
        upcoming_schedules_count=upcoming_schedules_count,
        movies_with_schedules_count=movies_with_schedules_count,
        movies_without_schedules_count=movies_without_schedules_count,
        showing_now_count=showing_now_count,
        coming_soon_count=coming_soon_count,
        ended_movies_count=ended_movies_count,
        total_revenue=total_revenue,
        revenue_today=revenue_today,
        revenue_this_month=revenue_this_month,
        premium_tickets_count=premium_tickets_count,
        standard_tickets_count=standard_tickets_count,
        unique_buyers_count=unique_buyers_count,
        top_movie=top_movie,
        top_venue=top_venue,
        recent_logs=recent_logs
    )


@app.route('/user_dashboard')
@user_required
def user_dashboard():
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

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)
    
    return render_template(
        'luma_dashboard.html', 
        user=user, 
        profile=profile,
        profile_image=profile_image,
        movies=movies,
        showing_movies=showing_movies,
        coming_soon_movies=coming_soon_movies,
        ended_movies=ended_movies
    )

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()  # removes all session data
    flash("You have been logged out.", "info")
    return redirect(url_for('gotologin'))

@app.route('/login', methods=['POST'])
def login():
    password = request.form['password']
    email = request.form['email']

    user = User.query.filter_by(email=email).first()

    if not user:
        log_event(actor='system', action='Failed login attempt', target=f'Email: {email}',
                  details='Account does not exist', level='WARNING', user_id=None)
        flash("Account does not exist!.", "danger")
        return redirect(url_for('gotologin'))

    if user.access.lower() == "inactive":
        log_event(actor='system', action='Failed login attempt', target=f'User: {user.username}',
                details='Account not yet verified', level='WARNING', user_id=user.id)
        flash("Please verify your email before logging in. Check your inbox.", "danger")
        return redirect(url_for('gotologin'))

    if user.access.lower() == "banned":
        log_event(actor='system', action='Failed login attempt', target=f'User: {user.username}',
                details='Account is banned', level='WARNING', user_id=user.id)
        flash("Your account has been banned. Contact support for assistance.", "danger")
        return redirect(url_for('gotologin'))

    if not user.check_password(password):
        log_event(actor='system', action='Failed login attempt', target=f'User: {user.username}',
                  details='Incorrect password', level='WARNING', user_id=user.id)
        flash("Incorrect password or email!", "danger")
        return redirect(url_for('gotologin'))

    session['user_id'] = user.id
    session['email'] = email
    session['role'] = user.role
    session['username'] = user.username

    if user.role == "admin" and user.access == "active":
        log_event(actor=user.username, action='Admin logged in', target=f'User #{user.id}', user_id=user.id)
        flash(f"Welcome back {user.username}, you have been logged in successfully!", "success")
        return redirect(url_for('overview'))
    elif user.role in ("user", "verified") and user.access == "active":
        log_event(actor=user.username, action='User logged in', target=f'User #{user.id}', user_id=user.id)
        flash(f"Welcome back {user.username}, you have been logged in successfully!", "success")
        return redirect(url_for('user_dashboard'))
    else:
        flash("Invalid user role", "danger")
        return redirect(url_for('gotologin'))

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json(silent=True) or {}
    credential = data.get('credential', '').strip()

    if not credential:
        return jsonify({"ok": False, "message": "Missing Google credential."}), 400

    try:
        google_user = verify_google_credential(credential)
        email = (google_user.get("email") or "").strip().lower()
        username = (google_user.get("name") or email.split("@")[0] or "Google User").strip()

        if not email:
            return jsonify({"ok": False, "message": "Google account email is missing."}), 400

        user = User.query.filter_by(email=email).first()
        created = False

        if not user:
            user = User(username=username, email=email, role='user', access='active')
            user.set_password(uuid.uuid4().hex)
            db.session.add(user)
            db.session.flush()
            create_default_profile_for_user(user)
            db.session.commit()
            created = True
            log_event(
                actor=user.username,
                action='New user registered with Google',
                target=f'User #{user.id}',
                details=f'Email: {email}',
                user_id=user.id
            )

        access_value = (user.access or "").strip().lower()
        if access_value == "inactive":
            return jsonify({"ok": False, "message": "Account disabled. Contact support."}), 403
        if access_value == "banned":
            return jsonify({"ok": False, "message": "Account is banned."}), 403

        start_user_session(user)

        if user.role == "admin" and access_value == "active":
            log_event(actor=user.username, action='Admin logged in with Google', target=f'User #{user.id}', user_id=user.id)
            redirect_url = url_for('overview')
        else:
            log_event(actor=user.username, action='User logged in with Google', target=f'User #{user.id}', user_id=user.id)
            redirect_url = url_for('user_dashboard')

        return jsonify({
            "ok": True,
            "created": created,
            "redirect_url": redirect_url
        })
    except RuntimeError as exc:
        return jsonify({"ok": False, "message": str(exc)}), 400
    except Exception:
        traceback.print_exc()
        return jsonify({"ok": False, "message": "Google sign-in failed. Please try again."}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.form.get('email', '').strip().lower()

    if not email:
        flash("Enter your email address first.", "danger")
        return redirect(url_for('gotologin'))

    user = User.query.filter_by(email=email).first()

    if user:
        try:
            token = create_password_reset_token(user.id)
            pin = create_password_reset_pin()
            set_password_reset_session(token, pin, verified=False)
            send_password_reset_email(user, token=token, pin=pin)
            log_event(
                actor='system',
                action='Password reset email sent',
                target=f'User #{user.id}',
                details=f'Email: {user.email}',
                user_id=user.id
            )
        except Exception as exc:
            log_event(
                actor='system',
                action='Password reset email failed',
                target=f'Email: {email}',
                details=str(exc),
                level='ERROR',
                user_id=user.id
            )
            flash(str(exc), "danger")
            return redirect(url_for('gotologin'))

    flash("If that email is registered, a password reset link has been sent.", "info")
    return redirect(url_for('gotologin'))

@app.route('/api/forgot-password/start', methods=['POST'])
def forgot_password_start_api():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({"ok": False, "message": "Enter your email address first."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"ok": False, "message": "No account found for that email."}), 404

    try:
        token = create_password_reset_token(user.id)
        pin = create_password_reset_pin()
        set_password_reset_session(token, pin, verified=False)
        send_password_reset_email(user, token=token, pin=pin)

        log_event(
            actor='system',
            action='Password reset API started',
            target=f'User #{user.id}',
            details=f'Email: {user.email}',
            user_id=user.id
        )
        return jsonify({
            "ok": True,
            "message": "We sent a 6-digit PIN to the account email.",
            "reset_token": token
        })
    except Exception as exc:
        log_event(
            actor='system',
            action='Password reset API failed',
            target=f'Email: {email}',
            details=str(exc),
            level='ERROR',
            user_id=user.id
        )
        return jsonify({
            "ok": False,
            "message": str(exc)
        }), 500

@app.route('/api/forgot-password/verify-pin', methods=['POST'])
def forgot_password_verify_pin_api():
    data = request.get_json(silent=True) or {}
    token = data.get('reset_token', '').strip()
    pin = data.get('pin', '').strip()

    if not token:
        return jsonify({"ok": False, "message": "Missing reset token."}), 400

    if not pin or len(pin) != 6 or not pin.isdigit():
        return jsonify({"ok": False, "message": "Enter the 6-digit PIN from your email."}), 400

    try:
        payload = load_password_reset_token(token)
        user = User.query.get(payload.get("user_id"))

        if not user:
            return jsonify({"ok": False, "message": "Account not found."}), 404

        if not verify_password_reset_pin(token, pin):
            return jsonify({"ok": False, "message": "That PIN is incorrect. Try again."}), 400

        log_event(
            actor='system',
            action='Password reset PIN verified',
            target=f'User #{user.id}',
            user_id=user.id
        )
        return jsonify({"ok": True, "message": "PIN verified."})
    except SignatureExpired:
        return jsonify({"ok": False, "message": "That reset session has expired. Please start again."}), 400
    except BadSignature:
        return jsonify({"ok": False, "message": "Invalid reset session."}), 400

@app.route('/api/forgot-password/complete', methods=['POST'])
def forgot_password_complete_api():
    data = request.get_json(silent=True) or {}
    token = data.get('reset_token', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not token:
        return jsonify({"ok": False, "message": "Missing reset token."}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "message": "New password must be at least 6 characters long."}), 400

    if password != confirm_password:
        return jsonify({"ok": False, "message": "Passwords do not match."}), 400

    try:
        payload = load_password_reset_token(token)
        user = User.query.get(payload.get("user_id"))

        if not user:
            return jsonify({"ok": False, "message": "Account not found."}), 404

        if not is_password_reset_verified(token):
            return jsonify({"ok": False, "message": "Verify the 6-digit PIN from your email first."}), 403

        user.set_password(password)
        db.session.commit()
        password_reset_sessions.pop(token, None)

        log_event(
            actor=user.username,
            action='Password reset completed via modal flow',
            target=f'User #{user.id}',
            user_id=user.id
        )
        return jsonify({"ok": True, "message": "Your password has been updated. Please log in."})
    except SignatureExpired:
        return jsonify({"ok": False, "message": "That reset session has expired. Please start again."}), 400
    except BadSignature:
        return jsonify({"ok": False, "message": "Invalid reset session."}), 400

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        data = load_password_reset_token(token)
    except SignatureExpired:
        flash("That reset link has expired. Please request a new one.", "danger")
        return redirect(url_for('gotologin'))
    except BadSignature:
        flash("That reset link is invalid.", "danger")
        return redirect(url_for('gotologin'))

    user = User.query.get(data.get("user_id"))
    if not user:
        flash("Account not found for that reset link.", "danger")
        return redirect(url_for('gotologin'))

    if not is_password_reset_verified(token):
        flash("Enter the 6-digit PIN from your email first.", "danger")
        return redirect(url_for('gotologin'))

    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if len(password) < 6:
            flash("New password must be at least 6 characters long.", "danger")
            return render_template('reset_password.html', token=token)

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template('reset_password.html', token=token)

        user.set_password(password)
        db.session.commit()
        password_reset_sessions.pop(token, None)

        log_event(
            actor=user.username,
            action='Password reset completed',
            target=f'User #{user.id}',
            user_id=user.id
        )
        flash("Your password has been updated. Please log in.", "success")
        return redirect(url_for('gotologin'))

    return render_template('reset_password.html', token=token)

@app.route('/register', methods=['POST'])
def register():
    name_parts = [request.form.get('last', ''), request.form.get('first', '')]
    username = " ".join([p.capitalize() for p in name_parts if p.strip()]).strip()
    password = request.form['password']
    email    = request.form['email'].strip().lower()

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        flash("Email already exists. Please choose a different one.", "error")
        return render_template('login.html', google_client_id=app.config.get("GOOGLE_CLIENT_ID", ""))

    # Create user as inactive until PIN verified
    new_user = User(username=username, email=email, role='user', access='inactive')
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    first_letter = username[0].lower() if username else "default"
    new_profile = Profiles(
        user_id=new_user.id,
        profile_image=f"{first_letter}.jpg",
        bio="", nationality="", gender="",
        dob=datetime.date.today(),
        preffered_genre=""
    )
    db.session.add(new_profile)
    db.session.commit()

    # Generate PIN and store in session
    pin = create_password_reset_pin()  # reuses your existing 6-digit generator
    session['verify_user_id'] = new_user.id
    session['verify_pin'] = pin

    try:
        send_email_verification_pin(new_user, pin)
        log_event(actor=new_user.username, action='Email verification PIN sent',
                  target=f'User #{new_user.id}', details=f'Email: {email}', user_id=new_user.id)
    except Exception as e:
        log_event(actor='system', action='Verification PIN email failed',
                  details=str(e), level='ERROR', user_id=new_user.id)

    # Return with flag so frontend shows the PIN modal
    return render_template('login.html',
                           google_client_id=app.config.get("GOOGLE_CLIENT_ID", ""),
                           show_verify_modal=True)

@app.route('/verify-email/<token>')
def verify_email(token):
    try:
        data = load_email_verification_token(token)
    except SignatureExpired:
        flash("That verification link has expired. Please register again.", "danger")
        return redirect(url_for('gotologin'))
    except BadSignature:
        flash("Invalid verification link.", "danger")
        return redirect(url_for('gotologin'))

    user = User.query.get(data.get("user_id"))
    if not user:
        flash("Account not found.", "danger")
        return redirect(url_for('gotologin'))

    if user.access == 'active':
        flash("Your email is already verified. Please log in.", "info")
        return redirect(url_for('gotologin'))

    user.access = 'active'
    db.session.commit()
    log_event(actor=user.username, action='Email verified',
              target=f'User #{user.id}', user_id=user.id)
    flash("Email verified! You can now log in.", "success")
    return redirect(url_for('gotologin'))

def send_email_verification_pin(user, pin):
    mail_username = app.config.get("MAIL_USERNAME")
    mail_password = app.config.get("MAIL_PASSWORD")
    mail_from     = app.config.get("MAIL_FROM")

    message = EmailMessage()
    message["Subject"] = "LUMA – Email Verification PIN"
    message["From"]    = mail_from
    message["To"]      = user.email
    message.set_content(
        f"Hello {user.username},\n\n"
        f"Your LUMA email verification PIN is:\n\n"
        f"{pin}\n\n"
        "Enter this 6-digit PIN to complete your registration.\n"
        "This PIN expires in 10 minutes. If you did not register, ignore this email."
    )

    with smtplib.SMTP(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]) as server:
        if app.config.get("MAIL_USE_TLS", True):
            server.starttls()
        server.login(mail_username, mail_password)
        server.send_message(message)
        
@app.route('/api/verify-registration-pin', methods=['POST'])
def verify_registration_pin():
    data = request.get_json(silent=True) or {}
    pin  = str(data.get('pin', '')).strip()

    user_id     = session.get('verify_user_id')
    stored_pin  = str(session.get('verify_pin', ''))

    if not user_id or not stored_pin:
        return jsonify({"ok": False, "message": "No pending verification. Please register again."}), 400

    if pin != stored_pin:
        return jsonify({"ok": False, "message": "Incorrect PIN. Please try again."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"ok": False, "message": "Account not found."}), 404

    user.access = 'active'
    db.session.commit()

    # Clear verify session keys and start real session
    session.pop('verify_user_id', None)
    session.pop('verify_pin', None)
    start_user_session(user)

    log_event(actor=user.username, action='Email verified via PIN',
              target=f'User #{user.id}', user_id=user.id)

    flash("Email verified! You are now logged in.", "success")
    return jsonify({"ok": True, "redirect_url": url_for('user_dashboard')})


# ======================= CRUD FOR MOVIE =======================
@app.route('/add_movie', methods=['POST'])
@admin_required
def add_movie():
    try:
        
        print("🔥 ADD MOVIE HIT")
        
        poster_file = request.files.get('poster')
        trailer_file = request.files.get('trailer')
        venue_image_file = request.files.get('venue_image')
        
        print("Poster: ", poster_file)
        print("Trailer: ", trailer_file)
        print("Venue: ", venue_image_file)
        
        print("Poster allowed:", allowed_file(poster_file.filename, ALLOWED_IMAGE_EXTENSIONS))
        print("Trailer allowed:", allowed_file(trailer_file.filename, ALLOWED_VIDEO_EXTENSIONS))
        print("Venue allowed:", allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS))

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

            save_path = os.path.join(app.config['UPLOAD_FOLDER'], trailer_filename)
            trailer_file.save(save_path)

        # --- Venue Image OPTIONAL ---
        venue_filename = None
        if venue_image_file and venue_image_file.filename != "":
            if not allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
                flash("Venue image must be an image file.", "danger")
                return redirect(url_for('admin_dashboard'))
            venue_filename = secure_filename(venue_image_file.filename)
            venue_image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], venue_filename))

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

        # --- Conditional Validation: if venue is provided, schedule is required ---
        has_venue = bool(venue_name and venue_name.strip())
        has_schedule = bool(scheduled_date and scheduled_date.strip())

        if has_venue and not has_schedule:
            flash("A schedule is required when a venue is added. Please add at least one schedule.", "danger")
            return redirect(url_for('admin_dashboard'))

        # --- Save Files: only store filename in DB ---
        poster_filename = None

        if allowed_file(poster_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            poster_filename = secure_filename(poster_file.filename)
            poster_file.save(os.path.join(app.config['UPLOAD_FOLDER'], poster_filename))

        genre_string = ", ".join(genres)
        
        if release_date:
            try:
                release_date_obj = datetime.datetime.strptime(release_date, '%Y-%m-%d').date()
            except ValueError:
                flash("Invalid release date format. Use YYYY-MM-DD.", "danger")
                return redirect(url_for('admin_dashboard'))
        else:
            release_date_obj = None

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
        
        print("DEBUG: New Movie Data:", {
            "movie_name": movie_name,
            "description": description,
            })

        db.session.add(new_movie)
        db.session.flush()  # get movie id without committing

        # --- Venue and Schedule: only process if venue was provided ---
        venue_id_to_use = None

        if has_venue:
            rows_str = request.form.get('rows', '10')
            cols_str = request.form.get('cols', '16')
            row_gap_str = request.form.get('row-gap', '0')
            col_gap_str = request.form.get('col-gap', '4')

            rows = int(rows_str)
            cols = int(cols_str)
            capacity = rows * cols

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

        if has_venue and has_schedule and venue_id_to_use:
            try:
                schedules = [s for s in scheduled_date.split('|||') if s.strip()]
                print(f"DEBUG: Split into {len(schedules)} schedules")

                schedule_count = 0

                for sched in schedules:
                    parts = [p.strip() for p in sched.split("|")]

                    if len(parts) != 3:
                        print(f"Skipping invalid schedule: {sched}")
                        continue

                    date_str, start_time_str, end_time_str = parts

                    try:
                        schedule_date_obj = datetime.datetime.strptime(date_str, "%b %d, %Y").date()

                        # Parse start time
                        if ':' in start_time_str:
                            start_hour = int(start_time_str.split(':')[0])
                        else:
                            start_hour = int(start_time_str)

                        # Parse end time
                        if ':' in end_time_str:
                            end_hour = int(end_time_str.split(':')[0])
                        else:
                            end_hour = int(end_time_str)

                        start_time_input = dt_time(start_hour, 0)
                        end_time_input = dt_time(end_hour, 0)

                    except Exception as e:
                        print(f"Error parsing schedule '{sched}': {e}")
                        continue

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

            except Exception as e:
                print(f"Error processing schedules: {e}")

            except ValueError as e:
                flash(f'Schedule date/time parse error: {str(e)}', 'danger')
                print(f"Parse error: {e}")
            except Exception as e:
                flash(f'Schedule creation error: {str(e)}', 'danger')
                print(f"Unexpected error: {e}")

        db.session.commit()

        log_event(
            actor=session.get('username', 'admin'),
            action='Added movie',
            target=f'Movie: {movie_name}',
            details=f'{schedule_count if "schedule_count" in locals() else 0} schedule(s) created',
            user_id=session.get('user_id')
        )

        flash(f"Movies added successfully! Schedules: {schedule_count if 'schedule_count' in locals() else 0}", "success")
        return redirect(url_for('admin_dashboard'))
    
    except Exception as e:
        print("💥 ERROR IN /add_movie")
        print(str(e))
        traceback.print_exc()

        log_event(actor=session.get('username', 'admin'), action='Failed to add movie',
                  details=str(e), level='ERROR', user_id=session.get('user_id'))
        flash("Something went wrong while adding the movie.", "danger")
        return redirect(url_for('admin_dashboard'))

@app.route('/delete_movie/<int:movie_id>', methods=['DELETE'])
@admin_required
def delete_movie(movie_id):
    try:
        movie = Movies.query.get_or_404(movie_id)
        movie_name = movie.movie_name

        for s in movie.schedules:
            db.session.delete(s)

        db.session.delete(movie)
        db.session.commit()

        log_event(actor=session.get('username', 'admin'), action='Deleted movie',
                  target=f'Movie #{movie_id}: {movie_name}', level='WARNING', user_id=session.get('user_id'))
        return jsonify({"success": True})

    except Exception as e:
        print("DELETE ERROR:", e)
        log_event(actor=session.get('username', 'admin'), action='Failed to delete movie',
                  target=f'Movie #{movie_id}', details=str(e), level='ERROR', user_id=session.get('user_id'))
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/delete_schedule/<int:schedule_id>', methods=['DELETE'])
@app.route('/delete_schedule/<int:schedule_id>', methods=['DELETE'])
@admin_required
def delete_schedule(schedule_id):

    schedule = Schedule.query.get_or_404(schedule_id)
    movie_name = schedule.movie.movie_name if schedule.movie else '?'

    db.session.delete(schedule)
    db.session.commit()

    log_event(actor=session.get('username', 'admin'), action='Deleted schedule',
              target=f'Schedule #{schedule_id} ({movie_name})', level='WARNING', user_id=session.get('user_id'))
    return jsonify({"success": True})

@app.route("/create_schedule", methods=["POST"])
@admin_required
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
@admin_required
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

    log_event(actor=session.get('username', 'admin'), action='Updated schedule',
              target=f'Schedule #{schedule_id}',
              details=f'Date: {data["date"]} | {data["start"]}–{data["end"]} | Status: {stat}',
              user_id=session.get('user_id'))

    return jsonify({
        "success": True,
        "message": "Schedule updated"
    })
@app.route('/update_movie/<int:movie_id>', methods=['POST'])
@admin_required
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

    log_event(actor=session.get('username', 'admin'), action='Updated movie',
              target=f'Movie #{movie_id}: {movie.movie_name}', user_id=session.get('user_id'))
    flash("Movie updated successfully", "success")
    return redirect(url_for('movieViewAdmin'))

@app.route("/api/venue/create", methods=["POST"])
@admin_required
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
        log_event(actor=session.get('username', 'admin'), action='Failed to create venue/schedule',
                  details=str(e), level='ERROR', user_id=session.get('user_id'))
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
@admin_required
def edit_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.id == session.get('user_id'):
        flash("You cannot edit your own account from Users Management. Use the Account page instead.", "warning")
        return redirect(url_for('view_users'))

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

    log_event(actor=session.get('username', 'admin'), action='Edited user',
              target=f'User #{user_id}: {user.username}',
              details=f'Role: {user.role} | Access: {user.access}',
              user_id=session.get('user_id'))
    flash(f"User '{user.username}' updated successfully.", "success")
    return redirect(url_for('view_users'))

@app.route('/delete_user/<int:user_id>', methods=['POST'])
@admin_required
def delete_user(user_id):
    userSession = User.query.get(session['user_id'])

    if userSession and user_id == userSession.id:
        flash("You cannot delete your own account from Users Management.", "warning")
        return redirect(url_for('view_users'))

    user = User.query.get_or_404(user_id)

    profile = Profiles.query.filter_by(user_id=user.id).first()

    if profile:
        db.session.delete(profile)

    db.session.delete(user)
    db.session.commit()

    log_event(actor=session.get('username', 'admin'), action='Deleted user',
              target=f'User #{user_id}', level='WARNING', user_id=session.get('user_id'))
    flash("User deleted successfully.", "success")
    return redirect(url_for('view_users'))

@app.route('/add_user', methods=['POST'])
@admin_required
def add_user():
    username = request.form.get('username', '').strip()
    email    = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()
    role     = request.form.get('role', 'user')
    access   = request.form.get('access', 'active')

    if not username or not email or not password:
        flash("All fields are required.", "error")
        return redirect(url_for('view_users'))

    if User.query.filter_by(email=email).first():
        flash("A user with that email already exists.", "error")
        return redirect(url_for('view_users'))

    new_user = User(username=username, email=email, role=role, access=access)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()

    first_letter = username[0].lower() if username else "default"
    new_profile = Profiles(
        user_id=new_user.id,
        profile_image=f"{first_letter}.jpg",
        bio="", nationality="", gender="Male",
        dob=datetime.date.today(),
        preffered_genre=""
    )
    db.session.add(new_profile)
    db.session.commit()

    log_event(actor=session.get('username', 'admin'), action='Admin created user',
              target=f'User #{new_user.id}', details=f'Email: {email}',
              user_id=session.get('user_id'))

    flash(f"User '{username}' created successfully.", "success")
    return redirect(url_for('view_users'))

@app.route('/get_profile/<int:user_id>')
@admin_required
def get_profile(user_id):
    user = User.query.get(user_id)
    profile = Profiles.query.filter_by(user_id=user_id).first()

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
@login_required
def movie_detail(movie_id):

    movie = Movies.query.get_or_404(movie_id)
    user = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()

    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)
    
    in_library = Libraries.query.filter_by(
        user_id=session['user_id'],
        movie_id=movie_id
    ).first() is not None
    
    print(in_library)

    return render_template(
        'view_movie.html', 
        movie=movie, 
        user=user, 
        profile_image=profile_image,
        in_library=in_library
        )

@app.route('/movie_schedule')
@login_required
def view_schedule():

    user = User.query.get(session['user_id'])
    
    profile = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)
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

    return render_template(
        'movie_schedule.html', 
        user=user, 
        profile_image=profile_image
        )

@app.route('/view_venues')
@login_required
def view_venues():

    venues = Venue.query.all()
    user = User.query.get(session['user_id'])
    
    profile = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)

    return render_template(
        'movie_venues.html', 
        venues=venues, 
        user=user, 
        profile_image=profile_image
        )

@app.route('/view_tickets')
@login_required
def view_tickets():

    user = User.query.get(session['user_id'])

    # ── Profile image ──────────────────────────────────────────────────
    profile      = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path, "static", "uploads",
            "uploadedPictures", profile.profile_image
        )
        profile_image = (
            url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
            if os.path.exists(uploaded_path)
            else url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
        )
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')

    # ── Fetch tickets with joined schedule / movie / venue data ────────
    raw_tickets = (
        UserTickets.query
        .filter_by(user_id=user.id)
        .order_by(UserTickets.booking_time.desc())
        .all()
    )

    now = datetime.datetime.now()
    tickets = []

    for t in raw_tickets:
        schedule = t.schedule
        movie    = schedule.movie
        venue    = schedule.venue

        # Convert seat_row int → letter, seat_col int → number  e.g. row=6,col=8 → "F8"
        seat_label = f"{chr(64 + t.seat_row)}{t.seat_col}"

        # Determine if the show is in the past
        show_date = schedule.date.date() if isinstance(schedule.date, datetime.datetime) else schedule.date
        show_end  = datetime.datetime.combine(show_date, schedule.end_time)
        is_past   = show_end < now

        tickets.append({
            "id":           t.id,
            "reference_code": t.reference_code,
            "movie_name":   movie.movie_name,
            "movie_image":  movie.movie_image,
            "date":         schedule.date.strftime("%b %d, %Y") if hasattr(schedule.date, 'strftime') else str(schedule.date),
            "start_time":   schedule.start_time.strftime("%H:%M"),
            "end_time":     schedule.end_time.strftime("%H:%M"),
            "venue_name":   venue.venue_name,
            "venue_room":   venue.venue_room,
            "seat_label":   seat_label,
            "ticket_type":  t.ticket_type,
            "booking_time": t.booking_time,
            "is_past":      is_past,
            "user_id":      user.id,
            "schedule_id":  t.schedule_id,
        })

    return render_template(
        'movie_tickets.html',
        user=user,
        profile_image=profile_image,
        tickets=tickets,
    )

@app.route('/library')
@login_required
def view_library():

    user = User.query.get(session['user_id'])

    # ── Profile image ──────────────────────────────────────────────────
    profile      = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path, "static", "uploads",
            "uploadedPictures", profile.profile_image
        )
        profile_image = (
            url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
            if os.path.exists(uploaded_path)
            else url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
        )
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')

    # ── Fetch library movies ───────────────────────────────────────────
    library_entries = Libraries.query.filter_by(user_id=user.id).all()
    movie_ids = [entry.movie_id for entry in library_entries]
    movies = Movies.query.filter(Movies.id.in_(movie_ids)).all()

    return render_template(
        'library.html',
        user=user,
        profile_image=profile_image,
        movies=movies,
    )

@app.route('/ticket_info/<int:user_id>/<int:schedule_id>')
@login_required
def ticket_info(user_id, schedule_id):

    user     = User.query.get_or_404(user_id)
    schedule = Schedule.query.get_or_404(schedule_id)
    movie    = Movies.query.get(schedule.movie_id)
    venue    = Venue.query.get(schedule.venue_id)

    tickets = UserTickets.query.filter_by(
        user_id=user_id,
        schedule_id=schedule_id
    ).order_by(UserTickets.seat_row, UserTickets.seat_col).all()

    if not tickets:
        return "No tickets found.", 404

    ticket_rows = []
    for t in tickets:
        seat_label = f"{chr(t.seat_row + 64)}{t.seat_col}"
        price      = 500 if t.ticket_type == 'premium' else 350
        ticket_rows.append({
            "seat_label":  seat_label,
            "ticket_type": t.ticket_type,
            "price":       price,
        })

    standard_seats = [r for r in ticket_rows if r['ticket_type'] == 'standard']
    premium_seats  = [r for r in ticket_rows if r['ticket_type'] == 'premium']
    total_price    = sum(r['price'] for r in ticket_rows)
    qr_filename    = f"USER{user_id}_SCHED{schedule_id}.png"

    # Profile image
    profile      = Profiles.query.filter_by(user_id=user.id).first()
    first_letter = user.username[0].lower() if user.username else "a"
    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path, "static", "uploads",
            "uploadedPictures", profile.profile_image
        )
        profile_image = (
            url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
            if os.path.exists(uploaded_path)
            else url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
        )
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')

    return render_template('ticket_info.html',
        user=user,
        schedule=schedule,
        movie=movie,
        venue=venue,
        ticket_rows=ticket_rows,
        standard_seats=standard_seats,
        premium_seats=premium_seats,
        total_price=total_price,
        qr_filename=qr_filename,
        profile_image=profile_image,
    )

@app.route('/book/<int:schedule_id>')
@login_required
def book_seat(schedule_id):
 
    schedule = Schedule.query.get_or_404(schedule_id)
    movie    = Movies.query.get_or_404(schedule.movie_id)
    venue    = Venue.query.get_or_404(schedule.venue_id)
    user     = User.query.get(session['user_id'])
    profile  = Profiles.query.filter_by(user_id=user.id).first()
 
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)
 
    return render_template(
        'book_seat.html',
        schedule=schedule,
        movie=movie,
        venue=venue,
        user=user,
        profile_image=profile_image,
    )
 
 
@app.route('/api/booked_seats/<int:schedule_id>')
def api_booked_seats(schedule_id):
    try:
        bookings = UserTickets.query.filter_by(schedule_id=schedule_id).all()
        result = []
        for b in bookings:
            if b.seat_row and b.seat_col:
                result.append({
                    "seat": f"{chr(64 + b.seat_row)}{b.seat_col}",
                    "type": "standard"
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
 
@app.route('/api/book', methods=['POST'])
@login_required
def api_book():
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

@app.route('/profile')
@user_required
def view_profile():
    user    = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()
 
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    
    print("DEBUG: Profile Image Path:", profile_image)
 
    # Ticket stats
    all_tickets      = UserTickets.query.filter_by(user_id=user.id).all()
    ticket_count     = len(all_tickets)
    now              = datetime.datetime.now()
 
    movies_watched = sum(
        1 for t in all_tickets
        if datetime.datetime.combine(
            t.schedule.date.date() if isinstance(t.schedule.date, datetime.datetime) else t.schedule.date,
            t.schedule.end_time
        ) < now
    )
 
    upcoming_count = sum(
        1 for t in all_tickets
        if datetime.datetime.combine(
            t.schedule.date.date() if isinstance(t.schedule.date, datetime.datetime) else t.schedule.date,
            t.schedule.start_time
        ) >= now
    )
 
    # Most recent 5 tickets
    recent_tickets = (
        UserTickets.query
        .filter_by(user_id=user.id)
        .order_by(UserTickets.booking_time.desc())
        .limit(5)
        .all()
    )
 
    from national import nationalities as all_nationalities
 
    return render_template(
        'view_profile.html',
        user=user,
        profile=profile,
        profile_image=profile_image,
        ticket_count=ticket_count,
        movies_watched=movies_watched,
        upcoming_count=upcoming_count,
        recent_tickets=recent_tickets,
        nationalities=all_nationalities
    )
 
 
@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    user    = User.query.get(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()
 
    if not profile:
        profile = Profiles(user_id=user.id, profile_image="", nationality="", gender="", preffered_genre="")
        db.session.add(profile)
 
    # Bio
    profile.bio              = request.form.get('bio', '').strip()
    profile.gender           = request.form.get('gender', '')
    profile.nationality      = request.form.get('nationality', '')
    profile.preffered_genre  = request.form.get('preffered_genre', '')
 
    # Date of birth
    dob_str = request.form.get('dob', '')
    if dob_str:
        try:
            profile.dob = datetime.datetime.strptime(dob_str, '%Y-%m-%d').date()
        except ValueError:
            pass
 
    # Profile image upload
    pic = request.files.get('profile_image')
    if pic and pic.filename:
        if allowed_file(pic.filename, ALLOWED_IMAGE_EXTENSIONS):
            filename = f"user_{user.id}_{secure_filename(pic.filename)}"
            pic.save(os.path.join(app.config['PROFILE_PICTURE_FOLDER'], filename))
            profile.profile_image = filename
        else:
            flash("Invalid image type.", "danger")
            return redirect(url_for('view_profile'))
 
    db.session.commit()
    log_event(actor=user.username, action='Updated profile', target=f'User #{user.id}', user_id=user.id)
    flash("Profile updated successfully!", "success")
    return redirect(url_for('view_profile'))

@app.route('/api/create-payment', methods=['POST'])
@login_required
def create_payment():
    data            = request.get_json()
    schedule_id     = data.get('schedule_id')
    seats           = data.get('seats', [])
    ticket_type     = data.get('type', 'standard')
    payment_method  = data.get('payment_method', 'GCash')

    if not seats or not schedule_id:
        return jsonify({"error": "Missing fields"}), 400

    price_per_seat = 500 if ticket_type == 'premium' else 350
    method_map     = {"GCash": "gcash", "PayMaya": "paymaya"}
    pm_method      = method_map.get(payment_method, "gcash")

    auth    = base64.b64encode(f"{PAYMONGO_SECRET}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth}", "Content-Type": "application/json"}

    payload = {
        "data": {
            "attributes": {
                "line_items": [
                    {
                        "currency": "PHP",
                        "amount": price_per_seat * 100,
                        "name": f"{'Premium' if ticket_type == 'premium' else 'Standard'} Seat — {', '.join(seats)}",
                        "quantity": len(seats),
                    }
                ],
                "payment_method_types": [pm_method],
                # ✅ CORRECT - directly inside attributes
                "success_url": "http://127.0.0.1:5000/payment/success",
                "cancel_url":  "http://127.0.0.1:5000/payment/failed",
                "description": f"LUMA - Schedule #{schedule_id}",
                "metadata": {
                    "user_id":     str(session['user_id']),
                    "schedule_id": str(schedule_id),
                    "seats":       ",".join(seats),
                    "type":        ticket_type
                }
            }
        }
    }

    res  = requests.post("https://api.paymongo.com/v1/checkout_sessions", json=payload, headers=headers)
    resp = res.json()

    # Log the full response so you can debug
    print("PayMongo response:", resp)

    checkout_url = resp.get("data", {}).get("attributes", {}).get("checkout_url")
    if checkout_url:
        # Add this just before the return jsonify({"checkout_url": ...})
        session['pending_booking'] = {
            "user_id":     session['user_id'],
            "schedule_id": schedule_id,
            "seats":       ",".join(seats),
            "type":        ticket_type
        }

        return jsonify({"checkout_url": checkout_url})
    else:
        return jsonify({"error": resp.get("errors", [{}])[0].get("detail", "Payment failed")}), 400

@app.route('/payment/success')
@login_required
def payment_success():
    session_id = request.args.get('session_id')
    pending    = session.get('pending_booking')

    if not pending and not session_id:
        flash("No booking data found.", "danger")
        return redirect(url_for('user_dashboard'))

    if session_id:
        auth    = base64.b64encode(f"{PAYMONGO_SECRET}:".encode()).decode()
        headers = {"Authorization": f"Basic {auth}"}
        res     = requests.get(
            f"https://api.paymongo.com/v1/checkout_sessions/{session_id}",
            headers=headers
        )
        resp   = res.json()
        attrs  = resp.get("data", {}).get("attributes", {})

        if attrs.get("payment_status") != "paid":
            flash("Payment not confirmed.", "danger")
            return redirect(url_for('user_dashboard'))

        meta        = attrs.get("metadata", {})
        user_id     = int(meta.get("user_id", session['user_id']))
        schedule_id = int(meta.get("schedule_id", 0))
        seats_str   = meta.get("seats", "")
        ticket_type = meta.get("type", "standard")
    else:
        user_id     = pending['user_id']
        schedule_id = pending['schedule_id']
        seats_str   = pending['seats']
        ticket_type = pending['type']

    seat_labels = [s.strip() for s in seats_str.split(",") if s.strip()]

    # ── Fetch related data for QR content ──────────────────────────────
    user     = User.query.get(user_id)
    schedule = Schedule.query.get(schedule_id)
    movie    = Movies.query.get(schedule.movie_id)
    venue    = Venue.query.get(schedule.venue_id)

    saved = []
    for label in seat_labels:
        row_letter = label[0].upper()
        col_number = int(label[1:])
        seat_row   = ord(row_letter) - 64

        # Skip already booked seats
        already = UserTickets.query.filter_by(
            schedule_id=schedule_id,
            seat_row=seat_row,
            seat_col=col_number
        ).first()
        if already:
            continue

        # ── Generate unique reference code per seat ──────────────────────
        ref_code = f"LUMA-{uuid.uuid4().hex[:10].upper()}"
        while UserTickets.query.filter_by(reference_code=ref_code).first():
            ref_code = f"LUMA-{uuid.uuid4().hex[:10].upper()}"

        # ── Save ticket ─────────────────────────────────────────────────
        ticket = UserTickets(
            user_id        = user_id,
            schedule_id    = schedule_id,
            seat_row       = seat_row,
            seat_col       = col_number,
            ticket_type    = ticket_type,
            reference_code = ref_code,
        )
        db.session.add(ticket)
        saved.append(label)

    db.session.flush()  # flush all new tickets before generating QR

    # ── One QR per user+schedule (create or overwrite) ──────────────────
    # Stable filename based on user_id + schedule_id
    qr_filename = f"USER{user_id}_SCHED{schedule_id}.png"
    qr_path     = os.path.join(QR_TICKET_CODES, qr_filename)

    # Build QR URL pointing to the grouped ticket view
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    local_ip = s.getsockname()[0]
    s.close()
    qr_data = f"http://{local_ip}:5000/ticket/{user_id}/{schedule_id}"

    # Regenerate the QR image (overwrites old one automatically)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(qr_path)

    # ── Upsert QrCode record (one row per user+schedule) ────────────────
    qr_record = QrCode.query.filter_by(user_id=user_id, schedule_id=schedule_id).first()
    if qr_record:
        qr_record.qr_code_path_image = qr_filename  # update in case filename changed
    else:
        qr_record = QrCode(
            user_id            = user_id,
            schedule_id        = schedule_id,
            qr_code_path_image = qr_filename,
        )
        db.session.add(qr_record)

    db.session.commit()
    session.pop('pending_booking', None)

    log_event(
        actor=user.username,
        action='Booked ticket(s)',
        target=f'Schedule #{schedule_id} — {movie.movie_name} @ {venue.venue_name}',
        details=f'Seats: {", ".join(saved)} | Type: {ticket_type} | Count: {len(saved)}',
        user_id=user.id
    )

    flash(f"Booking confirmed! Seats: {', '.join(saved)}", "success")
    return redirect(url_for('view_tickets'))

@app.route('/ticket/<int:user_id>/<int:schedule_id>')
def view_ticket(user_id, schedule_id):
    user     = User.query.get_or_404(user_id)
    schedule = Schedule.query.get_or_404(schedule_id)
    movie    = Movies.query.get(schedule.movie_id)
    venue    = Venue.query.get(schedule.venue_id)

    # All tickets for this user on this schedule
    tickets = UserTickets.query.filter_by(
        user_id=user_id,
        schedule_id=schedule_id
    ).order_by(UserTickets.seat_row, UserTickets.seat_col).all()

    if not tickets:
        return "No tickets found.", 404

    # Build per-ticket seat info with type and price
    ticket_rows = []
    for t in tickets:
        seat_label = f"{chr(t.seat_row + 64)}{t.seat_col}"
        price      = 500 if t.ticket_type == 'premium' else 350
        ticket_rows.append({
            "seat_label":  seat_label,
            "ticket_type": t.ticket_type,
            "price":       price,
        })

    standard_seats = [r for r in ticket_rows if r['ticket_type'] == 'standard']
    premium_seats  = [r for r in ticket_rows if r['ticket_type'] == 'premium']
    total_price    = sum(r['price'] for r in ticket_rows)
    qr_filename    = f"USER{user_id}_SCHED{schedule_id}.png"

    return render_template('ticket.html',
        user=user,
        schedule=schedule,
        movie=movie,
        venue=venue,
        ticket_rows=ticket_rows,
        standard_seats=standard_seats,
        premium_seats=premium_seats,
        total_price=total_price,
        qr_filename=qr_filename
    )


@app.route('/payment/failed')
def payment_failed():
    log_event(actor=session.get('username', 'system'), action='Payment cancelled or failed',
              level='WARNING', user_id=session.get('user_id'))
    flash("Payment was cancelled or failed. Please try again.", "danger")
    return redirect(url_for('user_dashboard'))

@app.route('/movie/<int:movie_id>/rate')
@login_required
def movie_rating_page(movie_id):
    """Show the rate-and-review page for a movie."""
    user  = User.query.get_or_404(session['user_id'])
    movie = Movies.query.get_or_404(movie_id)
    profile = Profiles.query.filter_by(user_id=user.id).first()
 
    # User can only rate if they have at least one ticket for this movie
    has_ticket = db.session.query(UserTickets).join(Schedule).filter(
        UserTickets.user_id  == user.id,
        Schedule.movie_id    == movie_id
    ).first() is not None
 
    user_rating = MovieRating.query.filter_by(
        user_id=user.id, movie_id=movie_id
    ).first()
 
    all_ratings = MovieRating.query.filter_by(movie_id=movie_id)\
        .order_by(MovieRating.created_at.desc()).all()
 
    total_ratings   = len(all_ratings)
    avg_rating      = (sum(r.stars for r in all_ratings) / total_ratings) if total_ratings else None
    rating_breakdown = {s: sum(1 for r in all_ratings if r.stars == s) for s in range(1, 6)}
 
    # Profile image helper (same pattern as your other pages)
    first_letter = user.username[0].lower() if user.username else "a"

    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path,
            "static",
            "uploads",
            "uploadedPictures",
            profile.profile_image
        )

        if os.path.exists(uploaded_path):
            profile_image = url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
        else:
            profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
 
    return render_template(
        'movie_ratings.html',
        user            = user,
        movie           = movie,
        can_rate        = has_ticket,
        user_rating     = user_rating,
        all_ratings     = all_ratings,
        avg_rating      = avg_rating,
        total_ratings   = total_ratings,
        rating_breakdown= rating_breakdown,
        profile_image   = profile_image,
    )
 
 
@app.route('/movie/<int:movie_id>/rate', methods=['POST'])
@login_required
def submit_rating(movie_id):
    """Create or update a rating."""
    stars_raw = request.form.get('stars', '').strip()
    if not stars_raw or not stars_raw.isdigit() or not (1 <= int(stars_raw) <= 5):
        flash("Please select a star rating (1–5).", "danger")
        return redirect(url_for('movie_rating_page', movie_id=movie_id))
 
    stars  = int(stars_raw)
    review = request.form.get('review', '').strip()[:500]
 
    existing = MovieRating.query.filter_by(
        user_id=session['user_id'], movie_id=movie_id
    ).first()
 
    if existing:
        existing.stars      = stars
        existing.review     = review or None
        existing.updated_at = datetime.datetime.now()
        log_event(actor=session.get('username', 'user'), action='Updated movie rating',
                  target=f'Movie #{movie_id}', details=f'Stars: {stars}', user_id=session.get('user_id'))
        flash("Your rating has been updated!", "success")
    else:
        db.session.add(MovieRating(
            user_id  = session['user_id'],
            movie_id = movie_id,
            stars    = stars,
            review   = review or None,
        ))
        log_event(actor=session.get('username', 'user'), action='Submitted movie rating',
                  target=f'Movie #{movie_id}', details=f'Stars: {stars}', user_id=session.get('user_id'))
        flash("Thanks for your rating!", "success")
 
    db.session.commit()
    return redirect(url_for('movie_rating_page', movie_id=movie_id))
 
 
@app.route('/movie/<int:movie_id>/rate/delete', methods=['POST'])
@login_required
def delete_rating(movie_id):
    """Remove a user's rating."""
    rating = MovieRating.query.filter_by(
        user_id=session['user_id'], movie_id=movie_id
    ).first()
 
    if rating:
        db.session.delete(rating)
        db.session.commit()
        log_event(actor=session.get('username', 'user'), action='Deleted movie rating',
                  target=f'Movie #{movie_id}', level='WARNING', user_id=session.get('user_id'))
        flash("Your rating has been removed.", "success")
 
    return redirect(url_for('movie_rating_page', movie_id=movie_id))

@app.route('/ratings')
@user_required
def view_ratings():
    user    = User.query.get_or_404(session['user_id'])
    profile = Profiles.query.filter_by(user_id=user.id).first()
    movies  = Movies.query.all()
 
    # ── Profile image (same helper used on other pages) ──────────────────────
    first_letter  = user.username[0].lower() if user.username else "a"
    if profile and profile.profile_image:
        uploaded_path = os.path.join(
            current_app.root_path, "static", "uploads",
            "uploadedPictures", profile.profile_image
        )
        profile_image = (
            url_for('static', filename=f'uploads/uploadedPictures/{profile.profile_image}')
            if os.path.exists(uploaded_path)
            else url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
        )
    else:
        profile_image = url_for('static', filename=f'uploads/defaultPictures/{first_letter}.jpg')
 
    # ── Build per-movie rating data ───────────────────────────────────────────
    movies_data = []
 
    for movie in movies:
        all_ratings = (
            MovieRating.query
            .filter_by(movie_id=movie.id)
            .order_by(MovieRating.created_at.desc())
            .all()
        )
 
        total_ratings   = len(all_ratings)
        avg_rating      = (sum(r.stars for r in all_ratings) / total_ratings) if total_ratings else None
        breakdown       = {s: sum(1 for r in all_ratings if r.stars == s) for s in range(1, 6)}
        user_rated      = any(r.user_id == user.id for r in all_ratings)
 
        # Build reviewer info for up to 3 most recent reviews
        latest_reviews = []
        for r in all_ratings[:3]:
            reviewer      = r.user
            rev_profile   = Profiles.query.filter_by(user_id=reviewer.id).first()
            rev_letter    = reviewer.username[0].lower() if reviewer.username else "a"
 
            if rev_profile and rev_profile.profile_image:
                rev_path = os.path.join(
                    current_app.root_path, "static", "uploads",
                    "uploadedPictures", rev_profile.profile_image
                )
                rev_img = (
                    url_for('static', filename=f'uploads/uploadedPictures/{rev_profile.profile_image}')
                    if os.path.exists(rev_path)
                    else url_for('static', filename=f'uploads/defaultPictures/{rev_letter}.jpg')
                )
            else:
                rev_img = url_for('static', filename=f'uploads/defaultPictures/{rev_letter}.jpg')
 
            latest_reviews.append({
                "username":   reviewer.username,
                "stars":      r.stars,
                "review":     r.review,
                "created_at": r.created_at,
                "profile_image": rev_img,
            })
 
        movies_data.append({
            "movie":          movie,
            "total_ratings":  total_ratings,
            "avg_rating":     avg_rating,
            "breakdown":      breakdown,
            "user_rated":     user_rated,
            "latest_reviews": latest_reviews,
        })
 
    return render_template(
        'ratings.html',
        user          = user,
        profile_image = profile_image,
        movies_data   = movies_data,
    )

@app.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    user_id = session['user_id']

    try:
        # delete user from database
        user = User.query.get(user_id)
        if user:
            log_admin_action(f'Deleted own admin account (username: {user.username})')
            db.session.delete(user)
            db.session.commit()

        # clear session
        session.clear()

        flash("Account deleted successfully.", "success")
        return redirect(url_for('gotologin'))

    except Exception as e:
        db.session.rollback()
        print(e)
        flash("Error deleting account.", "danger")
        return redirect(url_for('settings'))
    
@app.route("/reset_system", methods=["POST"])
@admin_required
def reset_system():
    try:
        log_admin_action('Triggered full system reset — all data wiped')
        # 🚨 Drop ALL tables
        db.drop_all()

        # 🔄 Recreate ALL tables from models
        db.create_all()

        admin = User(
            username="admin",
            email="admin@luma.com",
            role="admin",
            access="active"
        )
        admin.set_password("12345")
        db.session.add(admin)
        db.session.commit()

        flash("System successfully reset.", "success")
        return redirect(url_for("logout"))

    except Exception as e:
        flash(f"Reset failed: {str(e)}", "danger")
        return redirect(url_for("admin_dashboard"))
    
@app.route("/alter_all_roles", methods=["POST"])
@admin_required
def alter_all_roles():
    new_role = request.form.get("new_role")
    
    print(f"DEBUG: Requested new role for all users: {new_role}")

    if new_role not in ["user", "admin"]:
        return "Invalid role", 400
    

    # Example SQLAlchemy usage
    users = User.query.all()

    for user in users:
        user.role = new_role

    db.session.commit()

    log_admin_action(f'Changed ALL user roles to "{new_role}"')

    # Sync the session role so the current user's role matches what was just set
    session['role'] = new_role

    if new_role == "admin":
        flash("All users have been promoted to admin.", "success")
        return redirect(url_for("AdminAccount"))
    else:
        flash("All users have been demoted to user.", "success")
        return redirect(url_for("user_dashboard"))
    
@app.route("/api/verify-admin", methods=["POST"])
@admin_required
def verify_admin():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"valid": False, "error": "No data received"}), 400

    password = data.get("password", "")
    if not password:
        return jsonify({"valid": False, "error": "Missing password"}), 400

    admin = User.query.get(session["user_id"])
    if not admin:
        return jsonify({"valid": False, "error": "Admin not found"}), 404

    if admin.check_password(password):
        return jsonify({"valid": True}), 200

    return jsonify({"valid": False, "error": "Incorrect password"}), 401


@app.route("/api/system-stats", methods=["GET"])
@admin_required
def system_stats():
    return jsonify({
        "users":     User.query.count(),
        "movies":    Movies.query.count(),
        "tickets":   UserTickets.query.count(),
        "schedules": Schedule.query.count(),
        "venues":    Venue.query.count(),
        "logs":      SystemLog.query.count(),
    })

if __name__ == '__main__':

    with app.app_context():
        db.create_all()
        db.session.commit()

    app.run(host='0.0.0.0', port=5000, debug=True)
