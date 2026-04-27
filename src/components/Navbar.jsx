import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '60px',
      borderBottom: '1px solid #1a1a1a',
      background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px', fontWeight: '500', color: '#fff', letterSpacing: '-0.5px'
        }}>
          Review<span style={{ color: '#C8822A' }}>IT</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/places">Places</NavLink>
        <NavLink to="/compare">Compare</NavLink>
        <NavLink to="/ask">Ask the Bot</NavLink>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                marginLeft: '8px', padding: '6px 14px',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: '20px', color: '#fff', cursor: 'pointer', fontSize: '13px'
              }}
            >
              {profile?.display_name || 'Account'}
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '38px',
                background: '#111', border: '1px solid #222',
                borderRadius: '8px', padding: '8px', minWidth: '140px', zIndex: 200
              }}>
                {profile?.role === 'admin' || profile?.role === 'editor' ? (
                  <DropItem to="/admin" label="Admin Panel" close={() => setMenuOpen(false)} />
                ) : null}
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%', padding: '8px 12px', background: 'none',
                    border: 'none', color: '#999', fontSize: '13px',
                    cursor: 'pointer', textAlign: 'left', borderRadius: '4px'
                  }}
                >Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={{
            marginLeft: '8px', padding: '6px 16px',
            background: '#C8822A', border: 'none',
            borderRadius: '20px', color: '#fff', cursor: 'pointer',
            fontSize: '13px', textDecoration: 'none', fontWeight: '500'
          }}>Sign in</Link>
        )}
      </div>
    </nav>
  )
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{
      padding: '6px 12px', borderRadius: '20px',
      color: '#aaa', fontSize: '13px', textDecoration: 'none',
      transition: 'color .15s'
    }}
      onMouseEnter={e => e.target.style.color = '#fff'}
      onMouseLeave={e => e.target.style.color = '#aaa'}
    >{children}</Link>
  )
}

function DropItem({ to, label, close }) {
  return (
    <Link to={to} onClick={close} style={{
      display: 'block', padding: '8px 12px', color: '#ccc',
      fontSize: '13px', textDecoration: 'none', borderRadius: '4px'
    }}>{label}</Link>
  )
}
