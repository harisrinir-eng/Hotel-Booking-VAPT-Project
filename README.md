# Hotel-Booking-VAPT-Project
Hotel Booking Web Application Security Testing using OWASP ZAP | Demonstrates XSS, IDOR, Open Redirect vulnerabilities and their secure mitigations using React and Flask.


> ⚠️ **DISCLAIMER**: This project is built **exclusively for academic and local use**.
> The insecure version contains **intentional, controlled vulnerabilities** for demonstration only.
> **Do NOT deploy to a public server.**

---

## 📌 Project Overview

This project demonstrates a **Vulnerability Assessment and Penetration Testing (VAPT)** workflow applied to a simple hotel booking web application. It contains two versions of the same app:

| Version | Port (Backend) | Port (Frontend) | Purpose |
|---------|---------------|-----------------|---------|
| **Insecure** | `5000` | `3000` | Demonstrates XSS, IDOR, Open Redirect |
| **Secure**   | `5001` | `3001` | Demonstrates mitigations for all three |

---

## ✨ Features

- Search rooms by city and room type
- Book a room with guest details
- Mock payment simulation
- View and cancel bookings
- Guest reviews section
- Dual-mode: insecure and secure versions for direct comparison

---

## 🧰 Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | React 18, React Router v6, Axios |
| Backend    | Python Flask 3.x      |
| Database   | SQLite (auto-seeded)  |
| Security   | OWASP ZAP (external)  |
| Sanitization (secure) | bleach 6.x |

---

## 📁 Folder Structure

```
hotel-booking-vapt-project/
├── insecure_app/
│   ├── backend/
│   │   ├── app.py            # Flask API with intentional vulnerabilities
│   │   ├── seed.py           # DB seed script
│   │   └── requirements.txt
│   └── frontend/
│       ├── public/index.html
│       ├── package.json
│       └── src/
│           ├── App.js
│           ├── index.js
│           └── components/
│               ├── Navbar.js
│               ├── Home.js
│               ├── SearchRooms.js   ← Reflected XSS demo
│               ├── BookingForm.js   ← Stored XSS demo
│               ├── ViewBooking.js   ← IDOR demo + Stored XSS render
│               ├── CancelBooking.js ← IDOR demo
│               ├── Payment.js       ← Open Redirect demo
│               └── Reviews.js       ← Stored XSS demo
├── secure_app/
│   ├── backend/
│   │   ├── app.py            # Flask API with all fixes applied
│   │   ├── seed.py
│   │   └── requirements.txt  # includes bleach
│   └── frontend/
│       └── src/components/   # Same structure, secure implementations
└── docs/
    ├── README.md             ← This file
    ├── REPORT_NOTES.md       ← Seminar/report style notes
    ├── TESTING_GUIDE.md      ← Step-by-step ZAP demo guide
    └── FOLDER_STRUCTURE.txt  ← Full file tree
```

---

## ⚙️ Setup & Run Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- (Optional) Python virtual environment tool

---

### 🔴 Running the Insecure App

#### Backend
```bash
cd insecure_app/backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend starts at: **http://localhost:5000**

#### Frontend
```bash
cd insecure_app/frontend
npm install
npm start
```
Frontend starts at: **http://localhost:3000**

---

### 🟢 Running the Secure App

#### Backend
```bash
cd secure_app/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Backend starts at: **http://localhost:5001**

#### Frontend
```bash
cd secure_app/frontend
npm install
npm start
```
Frontend starts at: **http://localhost:3001**

---

## 🌐 Application URLs

### Insecure App (http://localhost:3000)

| Page | URL |
|------|-----|
| Home | http://localhost:3000/ |
| Search Rooms | http://localhost:3000/search |
| Book Room | http://localhost:3000/book/1 |
| View Booking | http://localhost:3000/booking/1 |
| Cancel Booking | http://localhost:3000/cancel/1 |
| Payment | http://localhost:3000/pay/1 |
| Reviews | http://localhost:3000/reviews |

### Insecure Backend API (http://localhost:5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | GET | Search rooms |
| `/api/rooms/<id>` | GET | Get room details |
| `/api/bookings` | POST | Create booking |
| `/api/bookings/<id>` | GET | **IDOR** — get booking by ID |
| `/api/bookings/<id>/cancel` | POST | **IDOR** — cancel any booking |
| `/api/bookings/<id>/pay` | POST | Mark booking paid |
| `/api/redirect` | GET | **Open Redirect** — `?next=` unvalidated |
| `/api/reviews` | GET/POST | **Stored XSS** — raw content |

---

## 🔍 OWASP ZAP Testing Guide

### 1. Initial Setup

1. Download OWASP ZAP from https://www.zaproxy.org/
2. Start ZAP. Go to **Tools → Options → Local Proxies** — note the proxy port (default: 8080).
3. Configure your browser (Chrome) to use proxy: `localhost:8080`
4. Install ZAP's root CA certificate in Chrome for HTTPS interception.

### 2. Automated Scans

**Passive Scan** (safe, no attack traffic):
1. In ZAP, click **Automated Scan**
2. Enter URL: `http://localhost:3000`
3. Click **Attack** — ZAP will spider the site and run passive checks.

**Active Scan** (sends attack probes):
1. After spidering, right-click the site in the Sites tree
2. Click **Active Scan → Start Scan**
3. Review alerts in the **Alerts** tab

### 3. Manual Vulnerability Tests

---

#### 🔴 Test 1: Reflected XSS

**Endpoint:** `GET /api/rooms?city=<PAYLOAD>`

**Steps:**
1. Open browser with ZAP proxy active
2. Navigate to `http://localhost:3000/search`
3. In the City field, enter:
   ```
   <script>alert('XSS')</script>
   ```
4. Click Search
5. **Expected (insecure)**: Alert dialog pops up — script executes
6. **Expected (secure)**: Text is displayed literally, no execution

**Direct API test:**
```
http://localhost:5000/api/rooms?city=<script>alert('Reflected XSS')</script>
```

---

#### 🔴 Test 2: Stored XSS

**Endpoint:** `POST /api/bookings` or `POST /api/reviews`

**Steps:**
1. Navigate to any room and click Book Now
2. In **Guest Name** or **Special Requests**, enter:
   ```
   <script>alert('Stored XSS')</script>
   ```
3. Complete the booking
4. Navigate to `http://localhost:3000/booking/<id>`
5. **Expected (insecure)**: Alert fires when the booking details page loads
6. **Expected (secure)**: Text renders literally as a string

**Curl test:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"room_id":1,"guest_name":"<script>alert(1)</script>","guest_email":"a@b.com","check_in":"2024-12-01","check_out":"2024-12-03"}'
```

---

#### 🔴 Test 3: IDOR (Insecure Direct Object Reference)

**Endpoint:** `GET /api/bookings/<id>`

**Steps:**
1. Create a booking and note the booking ID (e.g., `3`)
2. In the browser, navigate to:
   ```
   http://localhost:3000/booking/1
   http://localhost:3000/booking/2
   ```
3. **Expected (insecure)**: All bookings are visible regardless of who created them
4. **Expected (secure)**: Returns 401/404 without a valid owner token

**Curl test:**
```bash
# Insecure — works without any credential
curl http://localhost:5000/api/bookings/1
curl http://localhost:5000/api/bookings/2

# Secure — requires owner token header
curl http://localhost:5001/api/bookings/1 -H "X-Owner-Token: <token>"
```

---

#### 🔴 Test 4: Open Redirect

**Endpoint:** `GET /api/redirect?next=<URL>`

**Steps:**
1. In your browser (with ZAP proxy), navigate to:
   ```
   http://localhost:5000/api/redirect?next=https://www.google.com
   http://localhost:5000/api/redirect?next=https://evil.example.com
   ```
2. **Expected (insecure)**: Browser follows redirect to the external site
3. **Expected (secure)**: Server returns HTTP 400 — external redirect denied

**Curl test:**
```bash
# Insecure — follows any redirect
curl -L "http://localhost:5000/api/redirect?next=https://evil.example.com"

# Secure — blocked
curl -v "http://localhost:5001/api/redirect?next=https://evil.example.com"
# Should return: 400 Bad Request
```

---

### 4. ZAP Alert Interpretation

After scanning, look for these alerts in ZAP:

| Alert Name | Risk | Related To |
|-----------|------|-----------|
| Cross-Site Scripting (Reflected) | High | XSS in search |
| Cross-Site Scripting (Persistent) | High | Stored XSS in bookings/reviews |
| Open Redirect | Medium | `/api/redirect` |
| X-Frame-Options Header Missing | Low | IDOR-adjacent |
| Content-Type Header Missing | Informational | General headers |

---

## 🔐 Sample Payloads for Testing

```html
<!-- Basic XSS -->
<script>alert('XSS')</script>

<!-- Image-based XSS -->
<img src=x onerror=alert('XSS')>

<!-- SVG-based XSS -->
<svg onload=alert(1)>

<!-- DOM manipulation -->
<script>document.body.innerHTML='<h1>Hacked</h1>'</script>
```

```
# Open Redirect payloads
/api/redirect?next=https://evil.example.com
/api/redirect?next=//evil.example.com
/api/redirect?next=javascript:alert(1)
```

```
# IDOR payloads — enumerate bookings
/api/bookings/1
/api/bookings/2
/api/bookings/3
```

---

## 📝 Academic Note

This project is submitted as part of the **Advanced Software Testing** seminar.
It demonstrates VAPT methodology on a controlled local application.
All vulnerabilities are intentional, documented, and confined to local execution.
No real user data, real payments, or network exploitation is involved.
