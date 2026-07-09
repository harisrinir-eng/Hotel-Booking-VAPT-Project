import React from 'react';
import { Link } from 'react-router-dom';

const styles = {
  nav: {
    background: '#27ae60', padding: '0 24px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', height: '56px'
  },
  brand: { color: '#fff', fontSize: '20px', fontWeight: 700, textDecoration: 'none' },
  links: { display: 'flex', gap: '20px' },
  link: { color: '#fff', textDecoration: 'none', fontSize: '14px' }
};

function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🏨 StayEasy <span style={{fontSize:'11px',opacity:0.8}}>(Secure)</span></Link>
      <div style={styles.links}>
        <Link to="/"        style={styles.link}>Home</Link>
        <Link to="/search"  style={styles.link}>Search Rooms</Link>
        <Link to="/reviews" style={styles.link}>Reviews</Link>
      </div>
    </nav>
  );
}

export default Navbar;
