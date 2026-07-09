import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '500px', margin: '0 auto'
  },
  title: { color: '#2c3e50', fontSize: '22px', fontWeight: 700, marginBottom: '20px' },
  group: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px'
  },
  mock: {
    background: '#eaf4ff', borderRadius: '8px', padding: '14px',
    marginBottom: '20px', fontSize: '13px', color: '#2980b9', border: '1px solid #bee3f8'
  },
  btn: {
    width: '100%', background: '#27ae60', color: '#fff', border: 'none',
    padding: '13px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 600
  },
  success: {
    textAlign: 'center', padding: '32px'
  },
  successIcon: { fontSize: '52px', marginBottom: '12px' },
  warn: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#856404'
  },
  redirectRow: {
    display: 'flex', gap: '8px', marginTop: '8px'
  },
  redirectInput: {
    flex: 1, padding: '8px 10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px'
  },
  redirectBtn: {
    background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 14px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  }
};

function Payment() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const [paid,    setPaid]    = useState(false);
  const [card,    setCard]    = useState({ number: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('https://evil.example.com');

  const handlePay = async () => {
    if (!card.number || !card.expiry || !card.cvv) {
      alert('Please enter card details');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/bookings/${bookingId}/pay`);
      setPaid(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
    }
    setLoading(false);
  };

  // ⚠️ INSECURE REDIRECT DEMO: uses next= param without validation
  const handleInsecureRedirect = () => {
    // Calls backend open redirect endpoint
    window.location.href = `${API}/api/redirect?next=${encodeURIComponent(redirectUrl)}`;
  };

  if (paid) return (
    <div style={{...s.card, ...s.success}}>
      <div style={s.successIcon}>🎉</div>
      <h2 style={{color:'#27ae60',marginBottom:'10px'}}>Payment Successful!</h2>
      <p style={{color:'#555',marginBottom:'24px'}}>Booking #{bookingId} is confirmed. Enjoy your stay!</p>
      <button style={{...s.btn,width:'auto',padding:'10px 28px'}} onClick={() => navigate(`/booking/${bookingId}`)}>
        View Booking Details
      </button>
    </div>
  );

  return (
    <div style={s.card}>
      <h2 style={s.title}>💳 Mock Payment</h2>

      <div style={s.mock}>
        🔒 This is a SIMULATED payment for Booking #{bookingId}. No real transactions occur.
      </div>

      <div style={s.group}>
        <label style={s.label}>Card Number</label>
        <input style={s.input} placeholder="4111 1111 1111 1111"
          value={card.number} onChange={e => setCard({...card, number: e.target.value})} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
        <div>
          <label style={s.label}>Expiry Date</label>
          <input style={s.input} placeholder="MM/YY"
            value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} />
        </div>
        <div>
          <label style={s.label}>CVV</label>
          <input style={s.input} placeholder="123" type="password"
            value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} />
        </div>
      </div>

      <button style={s.btn} onClick={handlePay} disabled={loading}>
        {loading ? 'Processing...' : '✅ Pay Now'}
      </button>

      {/* ⚠️ INSECURE REDIRECT DEMO SECTION */}
      <div style={{marginTop:'28px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
        <h4 style={{color:'#e74c3c',marginBottom:'8px'}}>⚠️ Insecure Redirect Demo</h4>
        <div style={s.warn}>
          This demonstrates an Open Redirect vulnerability via <code>/api/redirect?next=URL</code>.
          The backend will redirect to ANY URL without validation.
        </div>
        <label style={s.label}>Redirect Target URL</label>
        <div style={s.redirectRow}>
          <input style={s.redirectInput} value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)}
            placeholder="https://evil.example.com" />
          <button style={s.redirectBtn} onClick={handleInsecureRedirect}>
            Test Redirect →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
