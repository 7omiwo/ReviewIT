import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      const { error } = await signUp(email, password, username)
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '500', color: '#fff' }}>
              Review<span style={{ color: '#C8822A' }}>IT</span>
            </span>
          </Link>
          <div style={{ fontSize: '14px', color: '#555', marginTop: '8px' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </div>
        </div>

        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }} style={{
                flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0a0a0a' : '#555',
                border: mode === m ? '1px solid #fff' : '1px solid #1a1a1a',
                fontWeight: mode === m ? '500' : '400'
              }}>{m === 'signin' ? 'Sign In' : 'Sign Up'}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <Field label="Username" value={username} onChange={setUsername} placeholder="your_username" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <div style={{ fontSize: '12px', color: '#e24b4b', padding: '8px 12px', background: '#1a0a0a', borderRadius: '6px', border: '1px solid #3a1a1a' }}>{error}</div>}
            {success && <div style={{ fontSize: '12px', color: '#2a8a4a', padding: '8px 12px', background: '#0a1a0a', borderRadius: '6px', border: '1px solid #1a3a1a' }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              padding: '10px', background: '#C8822A', border: 'none',
              borderRadius: '8px', color: '#fff', fontSize: '14px',
              cursor: 'pointer', fontWeight: '500', marginTop: '4px',
              opacity: loading ? 0.6 : 1
            }}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.6px', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        style={{
          width: '100%', padding: '9px 12px',
          background: '#0a0a0a', border: '1px solid #1a1a1a',
          borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', boxSizing: 'border-box'
        }}
      />
    </div>
  )
}
