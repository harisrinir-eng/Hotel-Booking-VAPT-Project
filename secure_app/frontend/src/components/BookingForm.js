import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001';

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
    background: '#d4edda', borderRadius: '8px', padding: '14px 18px',
    marginBottom: '24px', border: '1px solid #c3e6cb'
  },
  fix: {
    background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px',
    padding: '8px 12px', fontSize: '12px', color: '#155724', marginTop: '4px'
  }
};

// Simple client-side validators (backend also validates)
const validateName  = v => v.trim().length >= 2 && !/[<>]/.test(v);
const validateEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const validateDate  = v => /^\d{4}-\d{2}-\d{2}$/.test(v);

function BookingForm() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const [room, setRoom] = useState(null);
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', check_in: '', check_out: '', special_request: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get(`${API}/api/rooms/${roomId}`)
      .then(r => setRoom(r.data))
      .catch(() => alert('Room not found'));
  }, [roomId]);

  const validate = () => {
    const e = {};
    if (!validateName(form.guest_name))   e.guest_name  = 'Name must be at least 2 characters and contain no HTML.';
    if (!validateEmail(form.guest_email)) e.guest_email = 'Enter a valid email address.';
    if (!validateDate(form.check_in))     e.check_in    = 'Select a check-in date.';
    if (!validateDate(form.check_out))    e.check_out   = 'Select a check-out date.';
    if (form.check_in >= form.check_out)  e.check_out   = 'Check-out must be after check-in.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    try {
      const res = await axios.post(`${API}/api/bookings`, { ...form, room_id: parseInt(roomId) });
      // SECURE: store owner token in sessionStorage for this booking
      sessionStorage.setItem(`token_${res.data.booking_id}`, res.data.owner_token);
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
        <input style={{...s.input, borderColor: errors.guest_name ? '#e74c3c' : '#ccc'}}
          placeholder="Your full name" value={form.guest_name}
          onChange={e => setForm({...form, guest_name: e.target.value})} />
        {errors.guest_name && <div style={{color:'#e74c3c',fontSize:'12px',marginTop:'3px'}}>{errors.guest_name}</div>}
        <div style={s.fix}>✅ FIX: HTML tags stripped server-side via bleach before storage.</div>
      </div>

      <div style={s.group}>
        <label style={s.label}>Email Address *</label>
        <input style={{...s.input, borderColor: errors.guest_email ? '#e74c3c' : '#ccc'}}
          type="email" placeholder="you@example.com" value={form.guest_email}
          onChange={e => setForm({...form, guest_email: e.target.value})} />
        {errors.guest_email && <div style={{color:'#e74c3c',fontSize:'12px',marginTop:'3px'}}>{errors.guest_email}</div>}
      </div>

      <div style={{ ...s.group, ...s.row }}>
        <div>
          <label style={s.label}>Check-In Date *</label>
          <input style={{...s.input, borderColor: errors.check_in ? '#e74c3c' : '#ccc'}}
            type="date" value={form.check_in}
            onChange={e => setForm({...form, check_in: e.target.value})} />
          {errors.check_in && <div style={{color:'#e74c3c',fontSize:'12px',marginTop:'3px'}}>{errors.check_in}</div>}
        </div>
        <div>
          <label style={s.label}>Check-Out Date *</label>
          <input style={{...s.input, borderColor: errors.check_out ? '#e74c3c' : '#ccc'}}
            type="date" value={form.check_out}
            onChange={e => setForm({...form, check_out: e.target.value})} />
          {errors.check_out && <div style={{color:'#e74c3c',fontSize:'12px',marginTop:'3px'}}>{errors.check_out}</div>}
        </div>
      </div>

      <div style={s.group}>
        <label style={s.label}>Special Requests</label>
        <textarea style={s.textarea}
          placeholder="e.g. Early check-in, extra pillows…"
          value={form.special_request}
          onChange={e => setForm({...form, special_request: e.target.value})} />
        <div style={s.fix}>✅ FIX: Content sanitized with bleach.clean(tags=[], strip=True).</div>
      </div>

      <button style={s.btn} onClick={handleSubmit}>Proceed to Payment →</button>
    </div>
  );
}

export default BookingForm;
