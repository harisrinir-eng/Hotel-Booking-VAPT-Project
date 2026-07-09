import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '480px', margin: '0 auto', textAlign: 'center'
  },
  icon: { fontSize: '52px', marginBottom: '16px' },
  title: { color: '#e74c3c', fontSize: '22px', fontWeight: 700, marginBottom: '12px' },
  desc: { color: '#666', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 },
  warn: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#856404', textAlign: 'left'
  },
  row: { display: 'flex', gap: '12px', justifyContent: 'center' },
  btnConfirm: {
    background: '#e74c3c', color: '#fff', border: 'none', padding: '12px 28px',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'
  },
  btnBack: {
    background: '#95a5a6', color: '#fff', border: 'none', padding: '12px 28px',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'
  },
  success: { color: '#27ae60', fontWeight: 700, fontSize: '18px', marginTop: '16px' }
};

function CancelBooking() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

  const handleCancel = async () => {
    try {
      // ⚠️ IDOR: no ownership check — anyone can cancel any booking by ID
      await axios.post(`${API}/api/bookings/${bookingId}/cancel`);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Cancellation failed');
    }
  };

  if (done) return (
    <div style={s.card}>
      <div style={s.icon}>✅</div>
      <div style={s.success}>Booking #{bookingId} cancelled!</div>
      <button style={{...s.btnBack, marginTop:'20px'}} onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  return (
    <div style={s.card}>
      <div style={s.icon}>⚠️</div>
      <h2 style={s.title}>Cancel Booking #{bookingId}?</h2>
      <p style={s.desc}>This action will permanently delete your booking. You will need to re-book if you change your mind.</p>

      <div style={s.warn}>
        ⚠️ IDOR DEMO: Cancel endpoint has no ownership check.
        Any user can cancel <em>any</em> booking by changing the ID in the URL.
      </div>

      {error && <div style={{color:'#e74c3c',marginBottom:'16px'}}>{error}</div>}

      <div style={s.row}>
        <button style={s.btnBack}    onClick={() => navigate(-1)}>← Go Back</button>
        <button style={s.btnConfirm} onClick={handleCancel}>Confirm Cancel</button>
      </div>
    </div>
  );
}

export default CancelBooking;
