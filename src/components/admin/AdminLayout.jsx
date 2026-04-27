import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',   icon: '◈',  end: true },
  { to: '/admin/places',    label: 'Places',      icon: '📍' },
  { to: '/admin/articles',  label: 'Articles',    icon: '📝' },
  { to: '/admin/scores',    label: 'Scores',      icon: '★'  },
  { to: '/admin/bot-logs',  label: 'Bot Inquiries', icon: '💬' },
  { to: '/admin/users',     label: 'Users',       icon: '👤' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080808' }}>

      {/* Sidebar */}
      <div style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid #141414',
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #141414' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#fff' }}>
            Review<span style={{ color: '#C8822A' }}>IT</span>
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#333', textTransform: 'uppercase', marginTop: '2px' }}>
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '13px',
                background: isActive ? '#161616' : 'transparent',
                color: isActive ? '#fff' : '#555',
                borderLeft: isActive ? '2px solid #C8822A' : '2px solid transparent',
                transition: 'all .15s'
              })}
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user strip */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #141414' }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
            {profile?.display_name || 'Admin'}
          </div>
          <div style={{ fontSize: '10px', color: '#333', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.6px' }}>
            {profile?.role}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/')} style={{
              flex: 1, padding: '6px', background: 'transparent',
              border: '1px solid #1a1a1a', borderRadius: '6px',
              color: '#555', fontSize: '11px', cursor: 'pointer'
            }}>← Site</button>
            <button onClick={() => signOut().then(() => navigate('/login'))} style={{
              flex: 1, padding: '6px', background: 'transparent',
              border: '1px solid #1a1a1a', borderRadius: '6px',
              color: '#555', fontSize: '11px', cursor: 'pointer'
            }}>Sign out</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
