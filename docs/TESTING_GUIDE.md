# TESTING GUIDE
## Step-by-Step Vulnerability Demonstration with OWASP ZAP
### Hotel Booking VAPT — Academic Demo

---

## Prerequisites

Before beginning, ensure:

- [ ] Insecure backend running: `python app.py` → `http://localhost:5000`
- [ ] Insecure frontend running: `npm start` → `http://localhost:3000`
- [ ] OWASP ZAP installed and running (download from https://www.zaproxy.org/)
- [ ] Chrome browser configured with ZAP proxy (`localhost:8080`)
- [ ] ZAP certificate installed in Chrome (ZAP → Tools → Options → Dynamic SSL Certificates → Save → Import in Chrome)

---

## PART A: OWASP ZAP Automated Scan

### Step A1 — Spider the Application

1. In ZAP, click **Quick Start** tab
2. Select **Automated Scan**
3. Enter URL: `http://localhost:3000`
4. Click **Attack**
5. ZAP will crawl all pages and populate the **Sites** tree on the left panel.
6. Watch the **Spider** tab at the bottom for discovered URLs.

### Step A2 — Passive Scan Review

1. After spidering completes, click the **Alerts** tab at the bottom
2. Passive scan runs automatically — look for:
   - `Information Disclosure` alerts
   - `Missing Anti-CSRF Tokens`
   - `X-Content-Type-Options Header Missing`
   - `Content Security Policy Header Not Set`

### Step A3 — Active Scan

1. In the Sites tree, right-click `http://localhost:3000`
2. Select **Attack → Active Scan**
3. Leave settings at default, click **Start Scan**
4. Monitor the **Active Scan** tab and **Alerts** tab
5. ZAP will inject XSS payloads, path traversal, and other probes automatically
6. Look for High-risk alerts: **Cross-Site Scripting (Reflected)**

### Step A4 — Generate ZAP Report

1. Click **Report → Generate HTML Report** (or PDF)
2. Save to a local folder
3. Open in browser to view formatted vulnerability report

---

## PART B: Manual Vulnerability Demonstrations

---

## TEST 1: Reflected XSS

### 1.1 Browser-Based Demo

**Steps**:
1. Open Chrome with ZAP proxy enabled.
2. Navigate to `http://localhost:3000/search`
3. In the **City** input field, type exactly:
   ```
   <script>alert('Reflected XSS')</script>
   ```
4. Click **Search**

**Expected insecure behavior**:
- An alert box appears with the text `Reflected XSS`
- The script tag from the input is echoed back by the server in the JSON `query.city` field
- The frontend renders this using `dangerouslySetInnerHTML`, executing the script

**Expected secure behavior (port 3001)**:
- No alert appears
- The search results section shows the text literally: `<script>alert('Reflected XSS')</script>`
- Input was HTML-encoded server-side before echo

### 1.2 ZAP Manual Request

1. In ZAP, go to **Tools → Manual Request Editor**
2. Enter:
   ```
   GET http://localhost:5000/api/rooms?city=<script>alert(1)</script> HTTP/1.1
   Host: localhost:5000
   ```
3. Click **Send**
4. In the **Response** tab, observe the raw JSON:
   - **Insecure**: `"city": "<script>alert(1)</script>"` — raw, unescaped
   - **Secure**: `"city": "&lt;script&gt;alert(1)&lt;/script&gt;"` — HTML-encoded

### 1.3 ZAP Fuzzer (XSS)

1. In ZAP Sites tree, right-click: `GET http://localhost:5000/api/rooms?city=<value>`
2. Click **Attack → Fuzz**
3. Highlight the `city` parameter value in the Request panel
4. Click **Add** → **File Fuzzers** → `jbrofuzz/XSS`
5. Click **Start Fuzzer**
6. Review results for responses containing unencoded script tags

---

## TEST 2: Stored XSS

### 2.1 Inject via Booking Form

**Steps**:
1. Navigate to `http://localhost:3000/search`
2. Search for any city (e.g., "Mumbai"), click **Book Now** on any result
3. In the **Guest Name** field, enter:
   ```
   Alice<script>alert('Stored XSS - Name')</script>
   ```
4. In the **Special Requests** field, enter:
   ```
   <img src=x onerror="alert('Stored XSS - Request')">
   ```
5. Fill in valid email and dates, click **Proceed to Payment**
6. Complete the mock payment
7. Navigate to the booking details page

**Expected insecure behavior**:
- Alert box fires as the booking details page loads
- The stored script/img tag payload is executed in the browser

**Expected secure behavior (port 3001)**:
- No alert. Both fields display as plain text.
- `bleach.clean()` stripped HTML tags before storage.

### 2.2 Inject via Reviews

**Steps**:
1. Navigate to `http://localhost:3000/reviews`
2. In the **Review** textarea, enter:
   ```
   <script>document.body.style.background='red'</script>
   ```
3. Click **Submit Review**
4. Scroll to **All Reviews** section

**Expected insecure behavior**:
- Page background turns red — stored DOM manipulation executed
- Every user who loads the reviews page triggers the payload

**Expected secure behavior (port 3001)**:
- Review appears as literal text: `<script>document.body...`

### 2.3 Direct API Injection Test

```bash
# Inject malicious name via API
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "guest_name": "<script>alert(document.cookie)</script>",
    "guest_email": "test@test.com",
    "check_in": "2024-12-01",
    "check_out": "2024-12-05",
    "special_request": "<img src=x onerror=alert(1)>"
  }'
```

Note the `booking_id` in the response.

```bash
# Retrieve and check stored value
curl http://localhost:5000/api/bookings/<booking_id>
```

**Insecure result**: Raw script tags visible in `guest_name` field.
**Secure result**: Tags stripped — only text content remains.

---

## TEST 3: IDOR (Insecure Direct Object Reference)

### 3.1 Enumerate Bookings via Browser

**Steps**:
1. Create a booking in the insecure app. Note your booking ID (e.g., `3`).
2. Now change the URL to access OTHER users' bookings:
   - `http://localhost:3000/booking/1`
   - `http://localhost:3000/booking/2`
3. Also try cancelling others' bookings:
   - `http://localhost:3000/cancel/1`
   - Click **Confirm Cancel**

**Expected insecure behavior**:
- Full booking details (name, email, dates) of ANY booking are visible
- Any booking can be cancelled without authentication

**Expected secure behavior (port 3001)**:
- `http://localhost:3001/booking/1` shows error: "No owner token found"
- API returns `401 Unauthorized` without the correct token header

### 3.2 API-Level IDOR Test

```bash
# Insecure — returns full booking data for ANY ID
curl http://localhost:5000/api/bookings/1
curl http://localhost:5000/api/bookings/2
curl http://localhost:5000/api/bookings/3

# Cancel someone else's booking (no auth needed)
curl -X POST http://localhost:5000/api/bookings/1/cancel
```

```bash
# Secure — requires owner token
curl http://localhost:5001/api/bookings/1
# Returns: {"error": "Unauthorized: missing owner token"}

# With wrong token
curl http://localhost:5001/api/bookings/1 -H "X-Owner-Token: wrong-token"
# Returns: {"error": "Booking not found or access denied"}

# With correct token (get from booking creation response)
curl http://localhost:5001/api/bookings/1 -H "X-Owner-Token: <your-token>"
# Returns: booking details
```

### 3.3 ZAP Automated IDOR Check

1. In ZAP, go to **Sites** tree
2. Find: `GET http://localhost:5000/api/bookings/1`
3. Right-click → **Attack → Fuzz**
4. Highlight `1` in the URL path
5. Add fuzzer: **Numberzz** (1 to 20, increment 1)
6. Click **Start Fuzzer**
7. Observe all responses return 200 OK with booking data — confirms IDOR

---

## TEST 4: Open Redirect

### 4.1 Browser Demo

**Steps**:
1. With ZAP proxy active, navigate to:
   ```
   http://localhost:5000/api/redirect?next=https://www.google.com
   ```
2. Observe: browser immediately redirects to Google.
3. Try with a phishing simulation:
   ```
   http://localhost:5000/api/redirect?next=https://evil.example.com
   ```
4. Browser follows the redirect — the trusted `localhost` URL was used as a launcher.

**Expected insecure behavior**: Browser follows ANY URL in the `next` parameter.

**Expected secure behavior (port 5001)**:
```
http://localhost:5001/api/redirect?next=https://evil.example.com
```
Returns: `{"error": "Redirect to external URL denied"}` with HTTP 400.

### 4.2 Curl Test

```bash
# Insecure — follows external redirect
curl -v "http://localhost:5000/api/redirect?next=https://www.google.com"
# Location: https://www.google.com
# HTTP 302

# Secure — blocks external
curl -v "http://localhost:5001/api/redirect?next=https://www.google.com"
# HTTP 400 Bad Request
# {"error": "Redirect to external URL denied"}

# Secure — allows internal
curl -v "http://localhost:5001/api/redirect?next=/search"
# HTTP 302 → /search (allowed)
```

### 4.3 ZAP Alert

1. After active scanning, ZAP typically raises an alert: **External Redirect**
2. Found under Alerts → Risk: Medium
3. Click the alert to see the exact request/response that triggered it

---

## PART C: Comparing Insecure vs Secure

| Vulnerability | Insecure App Behavior | Secure App Behavior |
|---|---|---|
| Reflected XSS | `<script>alert(1)</script>` in city field → alert fires | Input HTML-encoded → displays as literal text |
| Stored XSS (booking) | Script in guest_name/special_request → fires on view | Stripped by bleach → stored as plain text |
| Stored XSS (reviews) | Script in review → fires for all viewers | Stripped server-side, rendered as React text |
| IDOR (view) | `/api/bookings/1` returns data to anyone | Returns 401 without valid owner token |
| IDOR (cancel) | `POST /api/bookings/1/cancel` — anyone can cancel | Returns 401 without owner token |
| Open Redirect | `/api/redirect?next=https://evil.com` → redirects | Returns 400 Bad Request |
| Security Headers | None | CSP, X-Frame-Options, X-Content-Type-Options present |
| CORS | All origins allowed | Restricted to localhost:3001 |

---

## PART D: ZAP Report Comparison

### Running on Insecure App

Expected ZAP findings:
- **High**: Cross-Site Scripting (Reflected) — 1+ instances
- **High**: Cross-Site Scripting (Stored) — 1+ instances
- **Medium**: External Redirect — 1 instance
- **Medium**: X-Frame-Options Header Not Set
- **Low**: Content-Security-Policy Header Not Set
- **Informational**: IDOR (requires manual testing — ZAP cannot detect logic flaws automatically)

### Running on Secure App

Expected ZAP findings:
- High severity alerts: 0 (or significantly reduced)
- Security headers now present
- Redirect blocked
- Some informational notices may remain (acceptable)

---

## PART E: Cleanup After Testing

```bash
# Delete test databases (resets all seed data)
rm insecure_app/backend/hotel.db
rm secure_app/backend/hotel_secure.db

# On next run, databases are re-created and re-seeded automatically
```

---

> ⚠️ All tests in this guide are designed for local academic execution only.
> Do not run these tests against any system you do not own or have explicit permission to test.
