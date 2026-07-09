import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import SearchRooms from './components/SearchRooms';
import BookingForm from './components/BookingForm';
import ViewBooking from './components/ViewBooking';
import CancelBooking from './components/CancelBooking';
import Payment from './components/Payment';
import Reviews from './components/Reviews';

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  main: { flex: 1, padding: '24px', maxWidth: '960px', margin: '0 auto', width: '100%' },
  banner: {
    background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724',
    padding: '8px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600
  }
};

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <div style={styles.banner}>
          ✅ SECURE VERSION — Input sanitized · IDOR protected · Redirects validated
        </div>
        <Navbar />
        <main style={styles.main}>
          <Routes>
            <Route path="/"                     element={<Home />} />
            <Route path="/search"               element={<SearchRooms />} />
            <Route path="/book/:roomId"         element={<BookingForm />} />
            <Route path="/booking/:bookingId"   element={<ViewBooking />} />
            <Route path="/cancel/:bookingId"    element={<CancelBooking />} />
            <Route path="/pay/:bookingId"       element={<Payment />} />
            <Route path="/reviews"             element={<Reviews />} />
          </Routes>
        </main>
        <footer style={{textAlign:'center',padding:'16px',background:'#27ae60',color:'#fff',fontSize:'13px'}}>
          StayEasy Hotels © 2024 — ACADEMIC DEMO (Secure Version)
        </footer>
      </div>
    </Router>
  );
}

export default App;
