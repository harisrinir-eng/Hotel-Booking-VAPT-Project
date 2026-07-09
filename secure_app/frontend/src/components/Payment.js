import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001';

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
    background: '#d4edda', borderRadius: '8px', padding: '14px',
    marginBottom: '20px', fontSize: '13px', color: '#155724', border: '1px solid #c3e6cb'
  },
  btn: {
    width: '100%', background: '#27ae60', color: '#fff', border: 'none',
    padding: '13px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 600
  },
  success: { textAlign: 'center', padding: '32px' },
  successIcon: { fontSize: '52px', marginBottom: '12px' },
  fix: {
    background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#155724'
  },
  redirectRow: { display: 'flex', gap: '8px', marginTop: '8px' },
  redirectInput: {
    flex: 1, padding: '8px 10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px'
  },
  redirectBtn: {
    background: '#27ae60', color: '#fff', border: 'none', padding: '8px 14px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  },
  redirectError: {
    color: '#e74c3c', fontSize: '13px', marginTop: '6px', fontWeight: 600
  }
};

function Payment() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [paid,    setPaid]    = useState(false);
  const [card,    setCard]    = useState({ number: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [redirectUrl,    setRedirectUrl]    = useState('https://evil.example.com');
  const [redirectResult, setRedirectResult] = useState('');

  const handlePay = async () => {
    if (!card.number || !card.expiry || !card.cvv) {
      alert('Please enter card details');
      return;
    }
    const token = sessionStorage.getItem(`token_${bookingId}`);
    if (!token) { alert('Owner token not found. Please re-access from your booking.'); return; }

    setLoading(true);
    try {
      await axios.post(`${API}/api/bookings/${bookingId}/pay`, {}, {
        headers: { 'X-Owner-Token': token }
      });
      setPaid(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
    }
    setLoading(false);
  };

  // SECURE: calls the backend redirect endpoint — backend will reject external URLs
  const handleSecureRedirect = async () => {
    try {
      const res = await axios.get(`${API}/api/redirect`, {
        params: { next: redirectUrl },
        maxRedirects: 0
      });
      setRedirectResult('✅ Redirect allowed (internal path)');
    } catch (err) {
      if (err.response?.status === 400) {
        setRedirectResult('🛡️ Redirect BLOCKED: ' + err.response.data.error);
      } else if (err.response?.status === 302 || err.request) {
        setRedirectResult('✅ Internal redirect allowed by backend');
      } else {
        setRedirectResult('Redirect test completed (check backend logs)');
      }
    }
  };

  if (paid) return (
    <div style={{...s.card, ...s.success}}>
      <div style={s.successIcon}>🎉</div>
      <h2 style={{color:'#27ae60',marginBottom:'10px'}}>Payment Successful!</h2>
      <p style={{color:'#555',marginBottom:'24px'}}>Booking #{bookingId} is confirmed!</p>
      <button style={{...s.btn,width:'auto',padding:'10px 28px'}} onClick={() => navigate(`/booking/${bookingId}`)}>
        View Booking
      </button>
    </div>
  );

  return (
    <div style={s.card}>
      <h2 style={s.title}>💳 Mock Payment</h2>
      <div style={s.mock}>🔒 Simulated payment for Booking #{bookingId}. No real transactions occur.</div>

      <div style={s.group}>
        <label style={s.label}>Card Number</label>
        <input style={s.input} placeholder="4111 1111 1111 1111"
          value={card.number} onChange={e => setCard({...card, number: e.target.value})} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
        <div>
          <label style={s.label}>Expiry</label>
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

      {/* SECURE REDIRECT DEMO */}
      <div style={{marginTop:'28px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
        <h4 style={{color:'#27ae60',marginBottom:'8px'}}>✅ Secure Redirect Demo</h4>
        <div style={s.fix}>
          The backend validates the <code>next=</code> parameter against an allowlist.
          External URLs are rejected with HTTP 400. Only relative paths are allowed.
        </div>
        <label style={s.label}>Test Redirect Target</label>
        <div style={s.redirectRow}>
          <input style={s.redirectInput} value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)} placeholder="https://evil.example.com" />
          <button style={s.redirectBtn} onClick={handleSecureRedirect}>Test →</button>
        </div>
        {redirectResult && <div style={s.redirectError}>{redirectResult}</div>}
      </div>
    </div>
  );
}

export default Payment;
