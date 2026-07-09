import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '600px', margin: '0 auto'
  },
  title: { color: '#2c3e50', marginBottom: '24px', fontSize: '22px', fontWeight: 700 },
  group: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px'
  },
  textarea: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px', resize: 'vertical', minHeight: '80px'
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  btn: {
    width: '100%', background: '#27ae60', color: '#fff', border: 'none',
    padding: '13px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 600
  },
  roomInfo: {
    background: '#eaf4ff', borderRadius: '8px', padding: '14px 18px',
    marginBottom: '24px', border: '1px solid #bee3f8'
  }
};

function BookingForm() {
  const { roomId }   = useParams();
  const navigate     = useNavigate();
  const [room,  setRoom]   = useState(null);
  const [form,  setForm]   = useState({
    guest_name: '', guest_email: '', check_in: '', check_out: '',
    special_request: ''   // ⚠️ INSECURE: stored without sanitization
  });

  useEffect(() => {
    axios.get(`${API}/api/rooms/${roomId}`)
      .then(r => setRoom(r.data))
      .catch(() => alert('Room not found'));
  }, [roomId]);

  const handleSubmit = async () => {
    if (!form.guest_name || !form.guest_email || !form.check_in || !form.check_out) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const res = await axios.post(`${API}/api/bookings`, { ...form, room_id: parseInt(roomId) });
      navigate(`/pay/${res.data.booking_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  if (!room) return <div style={{textAlign:'center',padding:'40px',color:'#777'}}>Loading room info…</div>;

  return (
    <div style={s.card}>
      <h2 style={s.title}>📋 Complete Your Booking</h2>

      <div style={s.roomInfo}>
        <strong>{room.hotel_name}</strong> — {room.city} &nbsp;|&nbsp; {room.room_type}
        &nbsp;|&nbsp; <strong>₹{room.price.toLocaleString()}/night</strong>
      </div>

      <div style={s.group}>
        <label style={s.label}>Guest Name *</label>
        {/* ⚠️ INSECURE: name stored raw — stored XSS vector */}
        <input style={s.input} placeholder="Your full name"
          value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} />
      </div>

      <div style={s.group}>
        <label style={s.label}>Email Address *</label>
        <input style={s.input} type="email" placeholder="you@example.com"
          value={form.guest_email} onChange={e => setForm({...form, guest_email: e.target.value})} />
      </div>

      <div style={{ ...s.group, ...s.row }}>
        <div>
          <label style={s.label}>Check-In Date *</label>
          <input style={s.input} type="date"
            value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} />
        </div>
        <div>
          <label style={s.label}>Check-Out Date *</label>
          <input style={s.input} type="date"
            value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} />
        </div>
      </div>

      <div style={s.group}>
        <label style={s.label}>Special Requests</label>
        {/* ⚠️ INSECURE: stored without sanitization — stored XSS vector */}
        <textarea style={s.textarea}
          placeholder="e.g. Early check-in, extra pillows… or try: <script>alert('XSS')</script>"
          value={form.special_request}
          onChange={e => setForm({...form, special_request: e.target.value})}
        />
        <small style={{color:'#e74c3c',fontSize:'12px'}}>
          ⚠️ INSECURE: This field is stored without sanitization (demo XSS vector)
        </small>
      </div>

      <button style={s.btn} onClick={handleSubmit}>Proceed to Payment →</button>
    </div>
  );
}

export default BookingForm;
