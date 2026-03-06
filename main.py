from flask import Flask, render_template, request, redirect, session, url_for, send_from_directory, flash, jsonify, after_this_request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import time, os, uuid, json
from datetime import datetime
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

class Tickets(db.Model):
    id = db.Column(db.Integer, primary_key=True) 
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False) #/checked
    standard_tickets = db.Column(db.Integer, nullable=False) #/checked
    premium_tickets = db.Column(db.Integer, nullable=False) #/checked
    
class Venue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'), nullable=False)
    venue_name = db.Column(db.String(100), nullable=False) #/checked
    location = db.Column(db.String(200), nullable=False) #/checked
    seating_capacity = db.Column(db.Integer, nullable=False) #/checked
    venue_image = db.Column(db.String(1000), nullable=False) #/checked
    schedule_open = db.Column(db.String(1000), nullable=False) #/checked
    venue_linkMap = db.Column(db.String(1000), nullable=False) #/checked
    
class Libraries(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    library_name = db.Column(db.String(100), nullable=False) #/checked
    user_id = db.Column(db.String(200), nullable=False) #/checked
    seating_capacity = db.Column(db.Integer, nullable=False) #/checked
    library_image = db.Column(db.String(1000), nullable=False) #/checked
    schedule_open = db.Column(db.String(1000), nullable=False) #/checked
    library_linkMap = db.Column(db.String(1000), nullable=False) #/checked

class Movies(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_name = db.Column(db.Text, nullable=False) #/checked
    description = db.Column(db.Text, nullable=False) #/checked
    movie_image = db.Column(db.String(1000), nullable=False) #/checked
    movie_trailer = db.Column(db.String(1000), nullable=False) #/checked
    movie_date = db.Column(db.String(50), nullable=False) #/checked
    status = db.Column(db.String(50), nullable=False) #/checked
    age_rating = db.Column(db.String(10), nullable=False) #/checked
    language = db.Column(db.String(50), nullable=False) #/checked
    duration = db.Column(db.String(20), nullable=False) #/checked
    genre = db.Column(db.String(50), nullable=False) #/checked
    movie_schedule = db.Column(db.String(1000), nullable=False) #/checked
    scheduled_date = db.Column(db.String(1000), nullable=False) #/checked
    
    tickets = db.relationship('Tickets', backref='movie', lazy=True)
    venue = db.relationship('Venue', backref='movie', lazy=True)

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

        # --- Validation ---
        if not poster_file or poster_file.filename == "":
            flash("Please upload a movie poster.", "danger")
            return redirect(url_for('admin_dashboard'))

        if not trailer_file or trailer_file.filename == "":
            flash("Please upload a movie trailer.", "danger")
            return redirect(url_for('admin_dashboard'))

        if not venue_image_file or venue_image_file.filename == "":
            flash("Please upload a venue image.", "danger")
            return redirect(url_for('admin_dashboard'))

        # --- Movie Info ---
        movie_name = request.form.get('movie_name')
        duration = request.form.get('duration')
        language = request.form.get('language')
        release_date = request.form.get('release_date')
        genres = request.form.getlist('genres[]')
        regular_count = int(request.form.get('regular_count', 0))
        premium_count = int(request.form.get('premium_count', 0))
        venue_name = request.form.get('venue_name')
        venue_availability = request.form.get('venue_availability')
        room = request.form.get('room')
        venue_date = request.form.get('venue_date')
        venue_link = request.form.get('venue_link')
        description = request.form.get('description')

        # --- Save Files ---
        poster_path = trailer_path = venue_image_path = None

        if allowed_file(poster_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            poster_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(poster_file.filename))
            poster_file.save(poster_path)

        if allowed_file(trailer_file.filename, ALLOWED_VIDEO_EXTENSIONS):
            trailer_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(trailer_file.filename))
            trailer_file.save(trailer_path)

        if allowed_file(venue_image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            venue_image_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(venue_image_file.filename))
            venue_image_file.save(venue_image_path)

        flash("Movie uploaded successfully!", "success")
        return redirect(url_for('admin_dashboard'))

    return render_template('admin_dashboard.html', form=request.form)

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash("Unauthorized access", "danger")
        return redirect(url_for('login'))
    
    today = datetime.today().strftime('%B %d, %Y')

    user = User.query.get(session['user_id'])
    return render_template('admin_dashboard.html', user=user, current_date=today)

@app.route('/user_dashboard')
def user_dashboard():
    if 'user_id' not in session:
        flash("Please log in first", "danger")
        return redirect(url_for('gotologin'))
    
    if session.get('role') != 'user':
        flash("Unauthorized access", "danger")
        return redirect(url_for('admin_dashboard'))
    
    user = User.query.get(session['user_id'])
    # Fetch movies or whatever is needed
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
        return render_template('login.html', error="User not found. Please register first.")

    if user.access == "Inactive":
        flash("Account disable contact support, or make a new account!", "danger")
        return render_template('login.html', error="Your account is disabled ask for access.")

    if not user.check_password(password):
        flash("Incorrect password or email!", "danger")
        return render_template('login.html', error="Incorrect password or email. Please try again.")

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
        return render_template('login.html', error="Email already exists. Please choose a different one.")

    new_user = User(username=username, email=email, access='active')
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # Log the user in after registration
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