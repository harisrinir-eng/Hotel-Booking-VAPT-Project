import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

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
  warn: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#856404'
  }
};

// ⚠️ INSECURE: renders HTML from DB without escaping — stored XSS trigger
function UnsafeHtml({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function ViewBooking() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    // ⚠️ IDOR: fetches booking by raw ID — no session or ownership check
    axios.get(`${API}/api/bookings/${bookingId}`)
      .then(r => setBooking(r.data))
      .catch(() => setError('Booking not found'));
  }, [bookingId]);

  if (error)   return <div style={{textAlign:'center',padding:'40px',color:'#e74c3c'}}>{error}</div>;
  if (!booking) return <div style={{textAlign:'center',padding:'40px',color:'#777'}}>Loading booking…</div>;

  return (
    <div style={s.card}>
      <h2 style={s.title}>📄 Booking Details</h2>

      <div style={s.warn}>
        ⚠️ IDOR DEMO: This page fetches booking #{bookingId} with no ownership check.
        Try changing the ID in the URL to see other bookings.
      </div>

      <div style={s.row}><span style={s.key}>Booking ID</span><span style={s.val}>#{booking.id}</span></div>
      <div style={s.row}>
        <span style={s.key}>Guest Name</span>
        {/* ⚠️ INSECURE: stored XSS triggered here */}
        <span style={s.val}><UnsafeHtml html={booking.guest_name} /></span>
      </div>
      <div style={s.row}><span style={s.key}>Email</span><span style={s.val}>{booking.guest_email}</span></div>
      <div style={s.row}><span style={s.key}>Hotel</span><span style={s.val}>{booking.hotel_name}</span></div>
      <div style={s.row}><span style={s.key}>City</span><span style={s.val}>{booking.city}</span></div>
      <div style={s.row}><span style={s.key}>Room Type</span><span style={s.val}>{booking.room_type}</span></div>
      <div style={s.row}><span style={s.key}>Check-In</span><span style={s.val}>{booking.check_in}</span></div>
      <div style={s.row}><span style={s.key}>Check-Out</span><span style={s.val}>{booking.check_out}</span></div>
      <div style={s.row}>
        <span style={s.key}>Special Request</span>
        {/* ⚠️ INSECURE: stored XSS triggered here */}
        <span style={s.val}><UnsafeHtml html={booking.special_request || '—'} /></span>
      </div>
      <div style={s.row}>
        <span style={s.key}>Price/night</span>
        <span style={s.val}>₹{booking.price?.toLocaleString()}</span>
      </div>
      <div style={s.row}>
        <span style={s.key}>Payment</span>
        <span style={s.badge(booking.payment_status)}>{booking.payment_status?.toUpperCase()}</span>
      </div>

      <div style={s.actions}>
        {booking.payment_status !== 'paid' && (
          <button style={s.btnPay} onClick={() => navigate(`/pay/${booking.id}`)}>💳 Pay Now</button>
        )}
        <button style={s.btnCancel} onClick={() => navigate(`/cancel/${booking.id}`)}>❌ Cancel Booking</button>
      </div>
    </div>
  );
}

export default ViewBooking;
