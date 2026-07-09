"""
SECURE VERSION - Hotel Booking API (Flask)
==========================================
This file demonstrates mitigations for the vulnerabilities present
in the insecure version.

Fixes applied:
  1. XSS     - Input sanitized with bleach before storage; output encoding on echo.
  2. IDOR    - Booking ownership enforced via session token stored in booking.
  3. Redirect - Redirect target validated against an allowlist of safe URLs.
  4. CORS    - Restricted to known frontend origin only.
  5. Headers - Security headers added to every response.
"""

from flask import Flask, request, jsonify, redirect, make_response, session
from flask_cors import CORS
import sqlite3
import os
import html
import re
import bleach         # pip install bleach
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Restrict CORS to the React dev server only
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3001"}}, supports_credentials=True)

DB_PATH = os.path.join(os.path.dirname(__file__), "hotel_secure.db")

# Allowlist for redirect targets
ALLOWED_REDIRECT_HOSTS = {"localhost", "127.0.0.1"}

# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------

@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "DENY"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "no-referrer"
    response.headers["Content-Security-Policy"]   = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    )
    return response


# ---------------------------------------------------------------------------
# Input sanitization helpers
# ---------------------------------------------------------------------------

def sanitize(value: str, max_length: int = 200) -> str:
    """Strip all HTML tags and limit length."""
    if not value:
        return ""
    cleaned = bleach.clean(str(value), tags=[], strip=True)
    return cleaned[:max_length]


def sanitize_email(value: str) -> str:
    """Basic email format validation."""
    value = sanitize(value, 200)
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(pattern, value):
        return ""
    return value


def escape_for_json(value: str) -> str:
    """HTML-escape a value before including in JSON response."""
    return html.escape(str(value), quote=True)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            city        TEXT NOT NULL,
            room_type   TEXT NOT NULL,
            hotel_name  TEXT NOT NULL,
            price       REAL NOT NULL,
            available   INTEGER NOT NULL DEFAULT 1
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id         INTEGER NOT NULL,
            guest_name      TEXT NOT NULL,
            guest_email     TEXT NOT NULL,
            check_in        TEXT NOT NULL,
            check_out       TEXT NOT NULL,
            special_request TEXT,
            payment_status  TEXT NOT NULL DEFAULT 'pending',
            owner_token     TEXT NOT NULL,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            author  TEXT,
            hotel   TEXT,
            content TEXT NOT NULL
        )
    """)

    cur.execute("SELECT COUNT(*) FROM rooms")
    if cur.fetchone()[0] == 0:
        seed_rooms(cur)

    conn.commit()
    conn.close()


def seed_rooms(cur):
    rooms = [
        ("Mumbai",    "Standard",  "Sea Breeze Inn",      2500.0),
        ("Mumbai",    "Deluxe",    "Sea Breeze Inn",      4500.0),
        ("Mumbai",    "Suite",     "Sea Breeze Inn",      8000.0),
        ("Delhi",     "Standard",  "Capital Comfort",     2200.0),
        ("Delhi",     "Deluxe",    "Capital Comfort",     4000.0),
        ("Delhi",     "Suite",     "Raj Palace Hotel",    9000.0),
        ("Goa",       "Standard",  "Sunset Sands Resort", 3000.0),
        ("Goa",       "Deluxe",    "Sunset Sands Resort", 5500.0),
        ("Goa",       "Suite",     "Sunset Sands Resort", 11000.0),
        ("Chennai",   "Standard",  "Marina Bay Lodge",    2000.0),
        ("Chennai",   "Deluxe",    "Marina Bay Lodge",    3800.0),
        ("Bengaluru", "Standard",  "Garden City Stays",   2100.0),
        ("Bengaluru", "Deluxe",    "Garden City Stays",   4200.0),
        ("Bengaluru", "Suite",     "Garden City Stays",   7500.0),
    ]
    cur.executemany(
        "INSERT INTO rooms (city, room_type, hotel_name, price) VALUES (?,?,?,?)",
        rooms
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return jsonify({"message": "Hotel Booking API (SECURE VERSION)", "status": "running"})


# --- Rooms ---

@app.route("/api/rooms", methods=["GET"])
def search_rooms():
    """
    FIX (XSS): User-supplied query params are sanitized before echoing back.
    """
    city      = sanitize(request.args.get("city", ""), 100)
    room_type = sanitize(request.args.get("room_type", ""), 50)

    # Validate room_type against known values
    allowed_types = {"standard", "deluxe", "suite", ""}
    if room_type.lower() not in allowed_types:
        return jsonify({"error": "Invalid room_type"}), 400

    conn = get_db()
    cur  = conn.cursor()

    query  = "SELECT * FROM rooms WHERE 1=1"
    params = []

    if city:
        query += " AND LOWER(city) LIKE LOWER(?)"
        params.append(f"%{city}%")

    if room_type:
        query += " AND LOWER(room_type) = LOWER(?)"
        params.append(room_type)

    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    rooms = [dict(r) for r in rows]

    # SECURE: sanitized echo — safe to render
    return jsonify({
        "query":   {"city": escape_for_json(city), "room_type": escape_for_json(room_type)},
        "results": rooms,
        "count":   len(rooms)
    })


@app.route("/api/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    conn = get_db()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM rooms WHERE id=?", (room_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Room not found"}), 404
    return jsonify(dict(row))


# --- Bookings ---

@app.route("/api/bookings", methods=["POST"])
def create_booking():
    """
    FIX (XSS): guest_name and special_request sanitized with bleach before storage.
    """
    data = request.json or {}

    required = ["room_id", "guest_name", "guest_email", "check_in", "check_out"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    # SECURE: sanitize all text inputs
    guest_name      = sanitize(data["guest_name"], 100)
    guest_email     = sanitize_email(data["guest_email"])
    special_request = sanitize(data.get("special_request", ""), 500)
    check_in        = sanitize(data["check_in"], 20)
    check_out       = sanitize(data["check_out"], 20)

    if not guest_name:
        return jsonify({"error": "Invalid guest_name"}), 400
    if not guest_email:
        return jsonify({"error": "Invalid email address"}), 400

    # Validate date format
    date_pattern = r"^\d{4}-\d{2}-\d{2}$"
    if not re.match(date_pattern, check_in) or not re.match(date_pattern, check_out):
        return jsonify({"error": "Dates must be YYYY-MM-DD format"}), 400

    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM rooms WHERE id=?", (data["room_id"],))
    if not cur.fetchone():
        conn.close()
        return jsonify({"error": "Room not found"}), 404

    # SECURE (IDOR fix): generate a unique owner token per booking
    owner_token = secrets.token_urlsafe(32)

    cur.execute("""
        INSERT INTO bookings
            (room_id, guest_name, guest_email, check_in, check_out,
             special_request, payment_status, owner_token)
        VALUES (?,?,?,?,?,?,?,?)
    """, (
        data["room_id"], guest_name, guest_email,
        check_in, check_out, special_request, "pending", owner_token
    ))
    booking_id = cur.lastrowid
    conn.commit()
    conn.close()

    # Return the token so the client can store it
    return jsonify({
        "message":     "Booking created",
        "booking_id":  booking_id,
        "owner_token": owner_token
    }), 201


@app.route("/api/bookings/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    """
    FIX (IDOR): Caller must supply the correct owner_token via header.
    Without the matching token the booking is not returned.
    """
    owner_token = request.headers.get("X-Owner-Token", "")
    if not owner_token:
        return jsonify({"error": "Unauthorized: missing owner token"}), 401

    conn = get_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT b.*, r.hotel_name, r.city, r.room_type, r.price
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.id = ? AND b.owner_token = ?
    """, (booking_id, owner_token))  # SECURE: token must match
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Booking not found or access denied"}), 404

    result = dict(row)
    del result["owner_token"]   # never expose the token back
    return jsonify(result)


@app.route("/api/bookings/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    """
    FIX (IDOR): Ownership verified via owner_token before cancellation.
    """
    owner_token = request.headers.get("X-Owner-Token", "")
    if not owner_token:
        return jsonify({"error": "Unauthorized: missing owner token"}), 401

    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM bookings WHERE id=? AND owner_token=?", (booking_id, owner_token))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Booking not found or access denied"}), 404

    cur.execute("DELETE FROM bookings WHERE id=?", (booking_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Booking {booking_id} cancelled"})


@app.route("/api/bookings/<int:booking_id>/pay", methods=["POST"])
def pay_booking(booking_id):
    """Payment with ownership check."""
    owner_token = request.headers.get("X-Owner-Token", "")
    if not owner_token:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM bookings WHERE id=? AND owner_token=?", (booking_id, owner_token))
    if not cur.fetchone():
        conn.close()
        return jsonify({"error": "Booking not found or access denied"}), 404

    cur.execute("UPDATE bookings SET payment_status=? WHERE id=?", ("paid", booking_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Payment successful", "booking_id": booking_id, "status": "paid"})


# --- Secure Redirect ---

@app.route("/api/redirect", methods=["GET"])
def secure_redirect():
    """
    FIX (Open Redirect): Validate the next= parameter against an allowlist.
    Reject any redirect that would leave the trusted domain.
    """
    from urllib.parse import urlparse
    next_url = request.args.get("next", "/")

    parsed = urlparse(next_url)

    # Allow only relative paths or explicitly trusted hosts
    if parsed.scheme and parsed.netloc:
        host = parsed.hostname or ""
        if host not in ALLOWED_REDIRECT_HOSTS:
            return jsonify({"error": "Redirect to external URL denied"}), 400

    # Default safe fallback
    return redirect(next_url if next_url.startswith("/") else "/")


# --- Reviews ---

@app.route("/api/reviews", methods=["POST"])
def add_review():
    """FIX (XSS): Review content sanitized with bleach before storage."""
    data = request.json or {}
    if not data.get("content"):
        return jsonify({"error": "content required"}), 400

    # SECURE: sanitize before storing
    author  = sanitize(data.get("author", "Anonymous"), 100)
    content = sanitize(data["content"], 1000)   # strips all HTML tags
    hotel   = sanitize(data.get("hotel", ""), 100)

    conn = get_db()
    cur  = conn.cursor()
    cur.execute(
        "INSERT INTO reviews (author, content, hotel) VALUES (?,?,?)",
        (author, content, hotel)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Review added"}), 201


@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    conn = get_db()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM reviews")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("[SECURE APP] Running on http://localhost:5001")
    app.run(debug=False, port=5001)
