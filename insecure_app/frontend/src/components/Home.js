import React from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  hero: {
    background: 'linear-gradient(135deg,#2c3e50,#3498db)',
    borderRadius: '12px', padding: '60px 40px', textAlign: 'center', color: '#fff', marginBottom: '32px'
  },
  h1: { fontSize: '36px', marginBottom: '12px' },
  p:  { fontSize: '16px', opacity: 0.85, marginBottom: '28px' },
  btn: {
    background: '#f39c12', color: '#fff', border: 'none', padding: '14px 32px',
    borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 600
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
  row: { display: 'flex', gap: '12px', marginTop: '12px' },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: '6px',
    border: '1px solid #ccc', fontSize: '14px'
  },
  sbtn: {
    background: '#2c3e50', color: '#fff', border: 'none', padding: '10px 20px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
  }
};

function Home() {
  const navigate = useNavigate();
  const [bookingId, setBookingId] = React.useState('');

  return (
    <div>
      <div style={styles.hero}>
        <div style={styles.h1}>Find Your Perfect Stay</div>
        <p style={styles.p}>Discover hotels across India — book in minutes, travel in comfort.</p>
        <button style={styles.btn} onClick={() => navigate('/search')}>Search Rooms →</button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.icon}>🔍</div>
          <div style={styles.ctitle}>Search</div>
          <div style={styles.cdesc}>Browse hotels by city, room type and dates.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.icon}>📋</div>
          <div style={styles.ctitle}>Book</div>
          <div style={styles.cdesc}>Reserve your room with a simple form.</div>
        </div>
        <div style={styles.card}>
          <div style={styles.icon}>💳</div>
          <div style={styles.ctitle}>Pay</div>
          <div style={styles.cdesc}>Simulated mock payment for demo purposes.</div>
        </div>
      </div>

      <div style={styles.viewSection}>
        <h3 style={{color:'#2c3e50',marginBottom:'4px'}}>View Existing Booking</h3>
        <p style={{fontSize:'13px',color:'#777'}}>Enter your Booking ID below to view or manage your reservation.</p>
        <div style={styles.row}>
          <input
            style={styles.input}
            type="number"
            placeholder="Enter Booking ID (e.g. 1)"
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
          />
          <button style={styles.sbtn} onClick={() => bookingId && navigate(`/booking/${bookingId}`)}>
            View Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
