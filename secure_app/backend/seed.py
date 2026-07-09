"""
seed.py - Standalone seed script for the secure app.
Run: python seed.py
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "hotel_secure.db")

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL, room_type TEXT NOT NULL,
            hotel_name TEXT NOT NULL, price REAL NOT NULL, available INTEGER NOT NULL DEFAULT 1
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL, guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL,
            special_request TEXT, payment_status TEXT NOT NULL DEFAULT 'pending',
            owner_token TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT, hotel TEXT, content TEXT NOT NULL
        )
    """)

    cur.execute("DELETE FROM rooms")
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
    conn.commit()
    conn.close()
    print(f"Secure database seeded at {DB_PATH}")

if __name__ == "__main__":
    seed()
