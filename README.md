🎬 Luma Cinemas

A modern cinema management and booking system built with Flask. Designed for seamless movie browsing, scheduling, and secure transactions.

✨ Features
Legit Account Registration
Account Verification and Change Password
🎥 Movie listing and management
📅 Schedule creation and viewing
🔍 Advanced search and filtering
👤 User authentication & role management (Admin/User)
💳 Payment integration (PayMongo)
📧 Email notifications (Flask-Mail)
⚡ Flash notifications for user feedback
🛠️ Tech Stack
Backend: Flask (Python)
Frontend: HTML, CSS, JavaScript
Database: SQLite / CSV (custom persistence)
Email Service: SMTP (Gmail App Password)
Payments: PayMongo API (Test Mode)
⚙️ Setup Instructions
1. Clone the repository
git clone https://github.com/your-username/luma-cinemas.git
cd luma-cinemas
2. Create virtual environment (optional)
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
3. Install dependencies (optional)
pip install -r requirements.txt
4. Configure environment variables

Create a .env file:

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
PASSWORD_RESET_SALT=luma-password-reset
RESET_CONFIRM_PHONE_LABEL=your phone
GOOGLE_CLIENT_ID=your-google-client-id

⚠️ Do NOT push .env to GitHub

5. Run the app & allow local network access
Allow port 5000 (Run CMD as Administrator)
netsh advfirewall firewall add rule name="Flask Port 5000" dir=in action=allow protocol=TCP localport=5000
Run the app
py main.py
Access on other devices (QR / Local Network)
Find your local IP (e.g. 192.168.1.5)
Open in browser:
http://192.168.1.5:5000
Share via QR code for easy access
🔐 Security Notes
Keep all secret keys in .env
Never expose backend keys in frontend
Rotate credentials if leaked
Use App Passwords for email (not your real password)
📁 Project Structure
luma-cinemas/
│── app.py
│── static/
│── templates/
│── .env
│── requirements.txt
🚀 Future Improvements
🎟️ Online seat selection UI
📊 Admin dashboard analytics
🔔 Real-time notifications
🧾 Booking history system
👨‍💻 Author

Developed by Craig Frenan and Team

📄 License

This project is for educational purposes.