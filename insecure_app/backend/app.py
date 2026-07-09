"""
INSECURE VERSION - Hotel Booking API (Flask)
============================================
WARNING: This file intentionally contains security vulnerabilities
for ACADEMIC / OWASP ZAP DEMO purposes ONLY.

Vulnerabilities present:
  1. XSS  - user input rendered without sanitization
  2. IDOR - booking lookup by raw ID with no ownership check
  3. Insecure Redirect - open redirect via ?next= parameter

DO NOT use this code in production.
"""

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)   # Allow all origins (also insecure, but needed for local demo)

DB_PATH = os.path.join(os.path.dirname(__file__), "hotel.db")

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
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
    """)

    # Seed rooms if table is empty
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
    return jsonify({"message": "Hotel Booking API (INSECURE VERSION)", "status": "running"})


# --- Rooms ---

@app.route("/api/rooms", methods=["GET"])
def search_rooms():
    """
    Search rooms by city, room_type.
    VULNERABILITY (XSS): city and room_type query params are echoed back
    in the JSON response without sanitization.
    """
    city      = request.args.get("city", "")
    room_type = request.args.get("room_type", "")

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

    # INSECURE: raw user input echoed back — enables reflected XSS in UI
    return jsonify({
        "query":      {"city": city, "room_type": room_type},   # raw echo
        "results":    rooms,
        "count":      len(rooms)
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
    Create a new booking.
    VULNERABILITY (Stored XSS): guest_name and special_request are stored
    raw in the DB and later rendered without escaping in view booking.
    """
    data = request.json or {}

    required = ["room_id", "guest_name", "guest_email", "check_in", "check_out"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    conn = get_db()
    cur  = conn.cursor()

    # Check room exists
    cur.execute("SELECT * FROM rooms WHERE id=?", (data["room_id"],))
    if not cur.fetchone():
        conn.close()
        return jsonify({"error": "Room not found"}), 404

    # INSECURE: no sanitization of guest_name or special_request
    cur.execute("""
        INSERT INTO bookings
            (room_id, guest_name, guest_email, check_in, check_out, special_request, payment_status)
        VALUES (?,?,?,?,?,?,?)
    """, (
        data["room_id"],
        data["guest_name"],          # raw — stored XSS vector
        data["guest_email"],
        data["check_in"],
        data["check_out"],
        data.get("special_request", ""),   # raw — stored XSS vector
        "pending"
    ))
    booking_id = cur.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"message": "Booking created", "booking_id": booking_id}), 201


@app.route("/api/bookings/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    """
    View booking by ID.
    VULNERABILITY (IDOR): No ownership/session check.
    Any user can access /api/bookings/1, /api/bookings/2, etc.
    """
    conn = get_db()
    cur  = conn.cursor()

    # INSECURE: no user authentication or ownership validation
    cur.execute("""
        SELECT b.*, r.hotel_name, r.city, r.room_type, r.price
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.id = ?
    """, (booking_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Booking not found"}), 404

    return jsonify(dict(row))


@app.route("/api/bookings/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    """
    Cancel booking.
    VULNERABILITY (IDOR): No ownership check — any caller can cancel any booking.
    """
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM bookings WHERE id=?", (booking_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Booking not found"}), 404

    # INSECURE: no ownership check
    cur.execute("DELETE FROM bookings WHERE id=?", (booking_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Booking {booking_id} cancelled successfully"})


@app.route("/api/bookings/<int:booking_id>/pay", methods=["POST"])
def pay_booking(booking_id):
    """Mock payment — updates payment_status to 'paid'."""
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM bookings WHERE id=?", (booking_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Booking not found"}), 404

    cur.execute(
        "UPDATE bookings SET payment_status=? WHERE id=?",
        ("paid", booking_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Payment successful", "booking_id": booking_id, "status": "paid"})


# --- Insecure Redirect ---

@app.route("/api/redirect", methods=["GET"])
def insecure_redirect():
    """
    VULNERABILITY (Open Redirect): The `next` parameter is used directly
    in the redirect without validation.
    Example exploit:
      /api/redirect?next=https://evil.com
    """
    next_url = request.args.get("next", "/")
    # INSECURE: no validation of redirect target
    return redirect(next_url)


# --- Reviews (extra Stored XSS demo surface) ---

reviews_store = []   # in-memory for simplicity

@app.route("/api/reviews", methods=["POST"])
def add_review():
    """
    VULNERABILITY (Stored XSS): Review content stored and returned raw.
    """
    data = request.json or {}
    if not data.get("content"):
        return jsonify({"error": "content required"}), 400

    # INSECURE: raw content stored
    reviews_store.append({
        "id":      len(reviews_store) + 1,
        "author":  data.get("author", "Anonymous"),
        "content": data["content"],      # XSS vector
        "hotel":   data.get("hotel", "")
    })
    return jsonify({"message": "Review added", "id": len(reviews_store)}), 201


@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    """Returns raw stored reviews — rendered in UI without escaping."""
    return jsonify(reviews_store)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("[INSECURE APP] Running on http://localhost:5000")
    app.run(debug=True, port=5000)
