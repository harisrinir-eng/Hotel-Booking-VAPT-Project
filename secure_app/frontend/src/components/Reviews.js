import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001';

const s = {
  card: {
    background: '#fff', borderRadius: '10px', padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  title: { color: '#2c3e50', fontSize: '22px', fontWeight: 700, marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px', marginBottom: '12px'
  },
  textarea: {
    width: '100%', padding: '10px 12px', border: '1px solid #ccc',
    borderRadius: '6px', fontSize: '14px', resize: 'vertical', minHeight: '80px', marginBottom: '12px'
  },
  btn: {
    background: '#27ae60', color: '#fff', border: 'none', padding: '10px 22px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600
  },
  review: {
    background: '#f9f9f9', borderRadius: '8px', padding: '14px 18px',
    marginBottom: '12px', border: '1px solid #eee'
  },
  fix: {
    background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#155724'
  }
};

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ author: '', hotel: '', content: '' });
  const [submitted, setSubmitted] = useState(false);

  const loadReviews = () => {
    axios.get(`${API}/api/reviews`).then(r => setReviews(r.data));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleSubmit = async () => {
    if (!form.content.trim()) { alert('Review content required'); return; }
    await axios.post(`${API}/api/reviews`, form);
    setForm({ author: '', hotel: '', content: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    loadReviews();
  };

  return (
    <div>
      <h2 style={s.title}>Guest Reviews</h2>

      <div style={s.card}>
        <h3 style={{color:'#2c3e50',marginBottom:'14px'}}>Write a Review</h3>
        <div style={s.fix}>
          ✅ XSS FIX: All review content is sanitized server-side using
          <code> bleach.clean(tags=[], strip=True)</code> before storage.
          React renders content as text — not HTML — so even if tags slipped through, they'd be harmless.
        </div>
        <label style={s.label}>Your Name</label>
        <input style={s.input} placeholder="Guest name"
          value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
        <label style={s.label}>Hotel</label>
        <input style={s.input} placeholder="Hotel name"
          value={form.hotel} onChange={e => setForm({...form, hotel: e.target.value})} />
        <label style={s.label}>Review</label>
        <textarea style={s.textarea}
          placeholder="Write your review here (HTML will be stripped)…"
          value={form.content}
          onChange={e => setForm({...form, content: e.target.value})} />
        <button style={s.btn} onClick={handleSubmit}>
          {submitted ? '✅ Submitted!' : 'Submit Review'}
        </button>
      </div>

      <div>
        <h3 style={{color:'#2c3e50',marginBottom:'14px'}}>All Reviews</h3>
        {reviews.length === 0 && <p style={{color:'#777'}}>No reviews yet.</p>}
        {reviews.map(r => (
          <div key={r.id} style={s.review}>
            <strong>{r.author || 'Anonymous'}</strong>
            {r.hotel && <> &nbsp;·&nbsp; <em>{r.hotel}</em></>}
            <div style={{marginTop:'6px',fontSize:'14px',color:'#444'}}>
              {/* SECURE: plain text rendering — React escapes all content automatically */}
              {r.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reviews;
