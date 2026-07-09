import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

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
    background: '#3498db', color: '#fff', border: 'none', padding: '10px 22px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600
  },
  review: {
    background: '#f9f9f9', borderRadius: '8px', padding: '14px 18px',
    marginBottom: '12px', border: '1px solid #eee'
  },
  warn: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
    padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#856404'
  }
};

// ⚠️ INSECURE: renders raw HTML — stored XSS vector
function UnsafeHtml({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ author: '', hotel: '', content: '' });

  const loadReviews = () => {
    axios.get(`${API}/api/reviews`).then(r => setReviews(r.data));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleSubmit = async () => {
    if (!form.content) { alert('Review content required'); return; }
    await axios.post(`${API}/api/reviews`, form);
    setForm({ author: '', hotel: '', content: '' });
    loadReviews();
  };

  return (
    <div>
      <h2 style={s.title}>Guest Reviews</h2>

      <div style={s.card}>
        <h3 style={{color:'#2c3e50',marginBottom:'14px'}}>Write a Review</h3>
        <div style={s.warn}>
          ⚠️ STORED XSS DEMO: Review content is stored without sanitization and rendered as HTML.
          Try submitting: <code>&lt;script&gt;alert('Stored XSS')&lt;/script&gt;</code>
        </div>
        <label style={s.label}>Your Name</label>
        <input style={s.input} placeholder="Guest name"
          value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
        <label style={s.label}>Hotel</label>
        <input style={s.input} placeholder="Hotel name"
          value={form.hotel} onChange={e => setForm({...form, hotel: e.target.value})} />
        <label style={s.label}>Review</label>
        {/* ⚠️ INSECURE: stored XSS entry point */}
        <textarea style={s.textarea} placeholder="Write your review here..."
          value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
        <button style={s.btn} onClick={handleSubmit}>Submit Review</button>
      </div>

      <div>
        <h3 style={{color:'#2c3e50',marginBottom:'14px'}}>All Reviews</h3>
        {reviews.length === 0 && <p style={{color:'#777'}}>No reviews yet.</p>}
        {reviews.map(r => (
          <div key={r.id} style={s.review}>
            <strong>{r.author || 'Anonymous'}</strong>
            {r.hotel && <> &nbsp;·&nbsp; <em>{r.hotel}</em></>}
            <div style={{marginTop:'6px',fontSize:'14px',color:'#444'}}>
              {/* ⚠️ INSECURE: renders stored HTML without escaping */}
              <UnsafeHtml html={r.content} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reviews;
