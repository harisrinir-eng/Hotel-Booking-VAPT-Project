import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '600px', margin: '0 auto'
  },
  title: { color: '#2c3e50', marginBottom: '20px', fontSize: '22px', fontWeight: 700 },
  row: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
    borderBottom: '1px solid #f0f0f0', fontSize: '14px'
  },
  key: { color: '#777', fontWeight: 600 },
  val: { color: '#2c3e50', fontWeight: 500 },
  badge: (status) => ({
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    background: status === 'paid' ? '#d4edda' : '#fff3cd',
    color:      status === 'paid' ? '#155724' : '#856404'
  }),
  actions: { display: 'flex', gap: '12px', marginTop: '24px' },
  btnCancel: {
    flex: 1, background: '#e74c3c', color: '#fff', border: 'none',
    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
  },
  btnPay: {
    flex: 1, background: '#27ae60', color: '#fff', border: 'none',
    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
  },
  fix: {
    background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#155724'
  }
};

function ViewBooking() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    // SECURE: retrieve stored token and send as header
    const token = sessionStorage.getItem(`token_${bookingId}`);
    if (!token) {
      setError('Access denied: no owner token found. Please use your booking confirmation token.');
      return;
    }

    axios.get(`${API}/api/bookings/${bookingId}`, {
      headers: { 'X-Owner-Token': token }
    })
      .then(r => setBooking(r.data))
      .catch(() => setError('Booking not found or access denied.'));
  }, [bookingId]);

  if (error) return (
    <div style={{...s.card, textAlign:'center'}}>
      <div style={{color:'#e74c3c',fontWeight:600,marginBottom:'12px'}}>🔒 {error}</div>
      <button style={{...s.btnPay,width:'auto',padding:'10px 24px'}} onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
  if (!booking) return <div style={{textAlign:'center',padding:'40px',color:'#777'}}>Loading booking…</div>;

  return (
    <div style={s.card}>
      <h2 style={s.title}>📄 Booking Details</h2>

      <div style={s.fix}>
        ✅ IDOR FIX: This booking was retrieved using your unique owner token sent as a request header.
        Changing the booking ID in the URL will not grant access without the matching token.
      </div>

      {/* SECURE: React renders all values as text — no dangerouslySetInnerHTML */}
      <div style={s.row}><span style={s.key}>Booking ID</span><span style={s.val}>#{booking.id}</span></div>
      <div style={s.row}><span style={s.key}>Guest Name</span><span style={s.val}>{booking.guest_name}</span></div>
      <div style={s.row}><span style={s.key}>Email</span><span style={s.val}>{booking.guest_email}</span></div>
      <div style={s.row}><span style={s.key}>Hotel</span><span style={s.val}>{booking.hotel_name}</span></div>
      <div style={s.row}><span style={s.key}>City</span><span style={s.val}>{booking.city}</span></div>
      <div style={s.row}><span style={s.key}>Room Type</span><span style={s.val}>{booking.room_type}</span></div>
      <div style={s.row}><span style={s.key}>Check-In</span><span style={s.val}>{booking.check_in}</span></div>
      <div style={s.row}><span style={s.key}>Check-Out</span><span style={s.val}>{booking.check_out}</span></div>
      <div style={s.row}><span style={s.key}>Special Request</span><span style={s.val}>{booking.special_request || '—'}</span></div>
      <div style={s.row}><span style={s.key}>Price/night</span><span style={s.val}>₹{booking.price?.toLocaleString()}</span></div>
      <div style={s.row}>
        <span style={s.key}>Payment</span>
        <span style={s.badge(booking.payment_status)}>{booking.payment_status?.toUpperCase()}</span>
      </div>

      <div style={s.actions}>
        {booking.payment_status !== 'paid' && (
          <button style={s.btnPay} onClick={() => navigate(`/pay/${booking.id}`)}>💳 Pay Now</button>
        )}
        <button style={s.btnCancel} onClick={() => navigate(`/cancel/${booking.id}`)}>❌ Cancel</button>
      </div>
    </div>
  );
}

export default ViewBooking;
