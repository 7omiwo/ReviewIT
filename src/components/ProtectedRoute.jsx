import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole = 'editor' }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#444', fontSize: '14px' }}>
      Checking permissions...
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  const roles = { reader: 0, editor: 1, admin: 2 }
  const userLevel = roles[profile?.role] ?? 0
  const requiredLevel = roles[requiredRole] ?? 1

  if (userLevel < requiredLevel) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <div style={{ fontSize: '14px', color: '#444' }}>
        You need {requiredRole} access to view this page.
      </div>
    </div>
  )

  return children
}
