# 🎬 Luma Cinemas

A modern cinema management and booking system built with Flask.
Designed for seamless movie browsing, scheduling, and secure transactions.

---

## ✨ Features

* Legit Account Registration
* Account Verification and Change Password
* 🎥 Movie listing and management
* 📅 Schedule creation and viewing
* 🔍 Advanced search and filtering
* 👤 User authentication & role management (Admin/User)
* 💳 Payment integration (PayMongo)
* 📧 Email notifications (Flask-Mail)
* ⚡ Flash notifications for user feedback

---

## 🛠️ Tech Stack

* **Backend:** Flask (Python)
* **Frontend:** HTML, CSS, JavaScript
* **Database:** SQLite / CSV (custom persistence)
* **Email Service:** SMTP (Gmail App Password)
* **Payments:** PayMongo API TestPayment

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/luma-cinemas.git
cd luma-cinemas
```

---

### 2. Create virtual environment

```bash (skip if must)
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

---

### 3. Install dependencies

```bash (skip if must)
pip install -r requirements.txt
```

---

### 4. Configure environment variables

Create a `.env` file:

```env (copy)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=luma.cinemas21@gmail.com
MAIL_PASSWORD=ritk bijx vjoy ibzi
MAIL_FROM=luma.cinemas21@gmail.com
PASSWORD_RESET_SALT=luma-password-reset
RESET_CONFIRM_PHONE_LABEL=your phone
GOOGLE_CLIENT_ID=444521067065-r3vde4cjijq9f5b11p34ciqoie42s509.apps.googleusercontent.com

then bash:
    copy .env.example .env
```

⚠️ **Do NOT push `.env` to GitHub**

---

### 5. Run the app

```bash
py main.py
```

---

## 🔐 Security Notes

* Keep all secret keys in `.env`
* Never expose backend keys in frontend
* Rotate credentials if leaked
* Use App Passwords for email (not your real password)

---

## 📁 Project Structure

```
luma-cinemas/
│── app.py
│── static/
│── templates/
│── .env
│── requirements.txt
```

---

## 🚀 Future Improvements

* 🎟️ Online seat selection UI
* 📊 Admin dashboard analytics
* 🔔 Real-time notifications
* 🧾 Booking history system

---

## 👨‍💻 Author

Developed by **Craig Frenan and Team**

---

## 📄 License

This project is for educational purposes.

