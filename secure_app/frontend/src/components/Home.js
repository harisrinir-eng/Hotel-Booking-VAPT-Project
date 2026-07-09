import React from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  hero: {
    background: 'linear-gradient(135deg,#27ae60,#2ecc71)',
    borderRadius: '12px', padding: '60px 40px', textAlign: 'center', color: '#fff', marginBottom: '32px'
  },
  h1: { fontSize: '36px', marginBottom: '12px' },
  p:  { fontSize: '16px', opacity: 0.9, marginBottom: '28px' },
  btn: {
    background: '#fff', color: '#27ae60', border: 'none', padding: '14px 32px',
    borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 700
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginTop: '16px' },
  card: {
    background: '#fff', borderRadius: '10px', padding: '24px', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  icon: { fontSize: '36px', marginBottom: '12px' },
  ctitle: { fontWeight: 700, marginBottom: '8px', color: '#2c3e50' },
  cdesc: { fontSize: '14px', color: '#666' },
  viewSection: {
    background: '#fff', borderRadius: '10px', padding: '28px', marginTop: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  hint: {
    background: '#d4edda', borderRadius: '6px', padding: '10px 14px',
    fontSize: '13px', color: '#155724', marginTop: '10px'
  },
  row: { display: 'flex', gap: '12px', marginTop: '12px' },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: '6px',
    border: '1px solid #ccc', fontSize: '14px'
  },
  tokenInput: {
    flex: 2, padding: '10px 14px', borderRadius: '6px',
    border: '1px solid #ccc', fontSize: '14px'
  },
  sbtn: {
    background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
  }
};

function Home() {
  const navigate   = useNavigate();
  const [bookingId, setBookingId] = React.useState('');
  const [token,     setToken]     = React.useState('');

  const handleView = () => {
    if (bookingId && token) {
      // Store the token in sessionStorage so ViewBooking can use it
      sessionStorage.setItem(`token_${bookingId}`, token);
      navigate(`/booking/${bookingId}`);
    } else {
      alert('Please enter both Booking ID and your Owner Token');
    }
  };

  return (
    <div>
      <div style={styles.hero}>
        <div style={styles.h1}>Find Your Perfect Stay</div>
        <p style={styles.p}>Secure booking with input validation and access control.</p>
        <button style={styles.btn} onClick={() => navigate('/search')}>Search Rooms →</button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.icon}>🛡️</div>
          <div style={styles.ctitle}>XSS Protected</div>
          <div style={styles.cdesc}>All inputs sanitized with bleach before storage and display.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.icon}>🔒</div>
          <div style={styles.ctitle}>IDOR Mitigated</div>
          <div style={styles.cdesc}>Bookings protected by unique owner tokens — not guessable IDs.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <div style={styles.ctitle}>Safe Redirects</div>
          <div style={styles.cdesc}>Redirect targets validated against an allowlist of trusted hosts.</div>
        </div>
      </div>

      <div style={styles.viewSection}>
        <h3 style={{color:'#2c3e50',marginBottom:'4px'}}>View Existing Booking</h3>
        <p style={{fontSize:'13px',color:'#777'}}>You need both your Booking ID and your personal Owner Token to access your booking.</p>
        <div style={styles.hint}>
          🔐 Your owner token was returned when you created the booking. This prevents unauthorized access (IDOR mitigation).
        </div>
        <div style={styles.row}>
          <input style={styles.input} type="number" placeholder="Booking ID" value={bookingId} onChange={e => setBookingId(e.target.value)} />
          <input style={styles.tokenInput} type="text" placeholder="Owner Token (from booking confirmation)" value={token} onChange={e => setToken(e.target.value)} />
          <button style={styles.sbtn} onClick={handleView}>View</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
