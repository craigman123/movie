<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Cinzel+Decorative&size=40&duration=3000&pause=1000&color=E8B86D&center=true&vCenter=true&width=600&lines=🎬+LUMA+CINEMAS" alt="Luma Cinemas" />

<p align="center">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/PayMongo-00B4D8?style=for-the-badge&logo=stripe&logoColor=white" />
  <img src="https://img.shields.io/badge/Gmail_SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
</p>

<p align="center">
  <i>A modern cinema management and booking system built with Flask.<br/>Designed for seamless movie browsing, scheduling, and secure transactions.</i>
</p>

<br/>

[![GitHub stars](https://img.shields.io/github/stars/your-username/luma-cinemas?style=social)](https://github.com/your-username/luma-cinemas)
[![GitHub forks](https://img.shields.io/github/forks/your-username/luma-cinemas?style=social)](https://github.com/your-username/luma-cinemas)

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 **Account Registration** | Secure sign-up with email verification and password change |
| 🎥 **Movie Management** | Full movie listing, creation, and admin controls |
| 📅 **Scheduling** | Create and browse showtimes with ease |
| 🔍 **Smart Search** | Advanced search and filtering for movies and schedules |
| 👤 **Role Management** | Separate Admin and User access levels |
| 💳 **Payment Integration** | Seamless checkout via PayMongo (Test Mode) |
| 📧 **Email Notifications** | Automated emails via Flask-Mail (Gmail SMTP) |
| ⚡ **Flash Notifications** | Real-time user feedback messages |

---

## 🛠️ Tech Stack

```
🐍 Backend    →   Flask (Python)
🌐 Frontend   →   HTML, CSS, JavaScript
🗃️ Database   →   SQLite / CSV (custom persistence)
📬 Email      →   SMTP via Gmail App Password
💳 Payments   →   PayMongo API (Test Mode)
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/luma-cinemas.git
cd luma-cinemas
```

### 2. Create a Virtual Environment *(optional but recommended)*

```bash
# Create
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
PASSWORD_RESET_SALT=luma-password-reset
RESET_CONFIRM_PHONE_LABEL=your phone
GOOGLE_CLIENT_ID=your-google-client-id
```

> ⚠️ **Important:** Never push your `.env` file to GitHub. Add it to `.gitignore`.

### 5. Allow Port 5000 to Firewall

**Allow port 5000 through Windows Firewall** *(Run CMD as Administrator)*:

```cmd
netsh advfirewall firewall add rule name="Flask Port 5000" dir=in action=allow protocol=TCP localport=5000
```

**Start the server:**

```bash
py main.py
```

**Access on local network:**

```
http://<your-local-ip>:5000
# Example: http://192.168.1.5:5000
```

> 💡 Share via QR code for easy access from other devices on the same network.

---

## 📁 Project Structure

```
luma-cinemas/
├── main.py
├── app.py
├── requirements.txt
├── .env                  ← (not committed)
├── static/
│   ├── css/
│   ├── js/
│   └── images/
└── templates/
    ├── index.html
    └── ...
```

---

## 🔐 Security Notes

- 🔑 Keep all secret keys in `.env` — never hardcode them
- 🚫 Never expose backend keys in frontend code
- 🔄 Rotate credentials immediately if leaked
- 📱 Use **Gmail App Passwords** — not your real account password
- 🛡️ Validate and sanitize all user inputs

---

## 🚀 Roadmap

- [ ] 🎟️ Online seat selection UI
- [ ] 📊 Admin dashboard with analytics
- [ ] 🔔 Real-time notifications
- [ ] 🧾 Full booking history system
- [ ] 📱 Mobile-responsive redesign

---

## 👨‍💻 Author

<div align="center">

**Developed with ❤️ by Craig Frenan and Team**

</div>

---

## 📄 License

This project is intended for **educational purposes** only.

---

<div align="center">
  <sub>⭐ If you found this useful, consider starring the repo!</sub>
</div>