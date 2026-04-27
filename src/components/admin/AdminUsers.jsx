import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth.jsx'
import { PageShell, PageHeader } from './AdminDashboard'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile: currentUser } = useAuth()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateRole(userId, role) {
    if (userId === currentUser?.id && role === 'reader') {
      if (!confirm("You're about to remove your own admin access. Are you sure?")) return
    }
    await supabase.from('profiles').update({ role }).eq('id', userId)
    load()
  }

  return (
    <PageShell>
      <PageHeader title="Users" subtitle="Manage team roles and access levels" />

      <div style={{ padding: '14px 16px', background: '#0a0f0a', border: '1px solid #141e14', borderRadius: '10px', marginBottom: '24px', fontSize: '12px', color: '#3a6a3a', lineHeight: '1.6' }}>
        <strong style={{ color: '#2a8a4a' }}>Role guide:</strong> Readers can comment. Editors can add/edit places and articles. Admins have full access including user management.
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: '13px' }}>Loading users...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', background: '#0f0f0f',
              border: `1px solid ${user.id === currentUser?.id ? '#1a2a1a' : '#141414'}`,
              borderRadius: '10px'
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#1a2a3a', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', fontWeight: '500',
                color: '#5b9bd5', flexShrink: 0
              }}>
                {user.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#e8e8e8' }}>
                  {user.display_name || user.username}
                  {user.id === currentUser?.id && <span style={{ fontSize: '10px', color: '#444', marginLeft: '8px' }}>(you)</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#444' }}>@{user.username}</div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {['reader', 'editor', 'admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => updateRole(user.id, role)}
                    disabled={currentUser?.role !== 'admin'}
                    style={{
                      padding: '5px 12px', fontSize: '11px', cursor: 'pointer',
                      borderRadius: '6px', textTransform: 'capitalize',
                      background: user.role === role ? (role === 'admin' ? '#1a2a0a' : role === 'editor' ? '#0a1a2a' : '#1a1a1a') : 'transparent',
                      color: user.role === role ? (role === 'admin' ? '#4a9a2a' : role === 'editor' ? '#2a6a9a' : '#888') : '#444',
                      border: user.role === role ? `1px solid ${role === 'admin' ? '#2a4a1a' : role === 'editor' ? '#1a3a5a' : '#2a2a2a'}` : '1px solid #141414',
                      opacity: currentUser?.role !== 'admin' ? 0.5 : 1
                    }}
                  >{role}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser?.role !== 'admin' && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#444' }}>
          Only admins can change user roles.
        </div>
      )}
    </PageShell>
  )
}
