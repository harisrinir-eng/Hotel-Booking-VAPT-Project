import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5001';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px'
  },
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px'
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px', background: '#fff'
  },
  btn: {
    background: '#27ae60', color: '#fff', border: 'none', padding: '10px 22px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600
  },
  room: {
    background: '#fff', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  bookBtn: {
    background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600
  },
  tag: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600, background: '#d4edda', color: '#155724', marginRight: '8px'
  },
  echo: {
    background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px',
    padding: '10px 14px', fontSize: '13px', marginBottom: '16px', color: '#155724'
  }
};

function SearchRooms() {
  const navigate   = useNavigate();
  const [city,      setCity]     = useState('');
  const [roomType,  setRoomType] = useState('');
  const [rooms,     setRooms]    = useState([]);
  const [echo,      setEcho]     = useState(null);
  const [searched,  setSearched] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/rooms`, { params: { city, room_type: roomType } });
      setRooms(res.data.results);
      setEcho(res.data.query);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching rooms');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Search Available Rooms</h2>

      <div style={s.card}>
        <div style={s.form}>
          <div>
            <label style={s.label}>City</label>
            <input style={s.input} placeholder="e.g. Mumbai" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Room Type</label>
            <select style={s.select} value={roomType} onChange={e => setRoomType(e.target.value)}>
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div>
            <label style={s.label}>&nbsp;</label>
            <button style={s.btn} onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
        </div>
      </div>

      {error && <div style={{color:'#e74c3c',marginBottom:'12px',padding:'10px',background:'#fdf',borderRadius:'6px'}}>{error}</div>}

      {searched && echo && (
        /* SECURE: echo.city is HTML-escaped by the backend. React renders it as text — no XSS. */
        <div style={s.echo}>
          ✅ Showing results for city: <strong>{echo.city || 'All'}</strong>
          {echo.room_type && <> &nbsp;| Type: <strong>{echo.room_type}</strong></>}
          &nbsp;— Output is text-encoded, not raw HTML.
        </div>
      )}

      <div>
        {searched && rooms.length === 0 && (
          <div style={{textAlign:'center',color:'#777',padding:'40px'}}>No rooms found.</div>
        )}
        {rooms.map(room => (
          <div key={room.id} style={s.room}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '17px', color: '#2c3e50', marginBottom: '6px' }}>
                {/* SECURE: React auto-escapes text content */}
                {room.hotel_name}
              </div>
              <span style={s.tag}>{room.city}</span>
              <span style={s.tag}>{room.room_type}</span>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                Room ID: <strong>#{room.id}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#27ae60' }}>
                ₹{room.price.toLocaleString()}
                <span style={{ fontSize: '13px', color: '#888', fontWeight: 400 }}>/night</span>
              </div>
              <button style={{ ...s.bookBtn, marginTop: '10px' }} onClick={() => navigate(`/book/${room.id}`)}>
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchRooms;
