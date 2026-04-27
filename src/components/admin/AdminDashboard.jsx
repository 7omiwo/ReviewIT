import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [unanswered, setUnanswered] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: totalPlaces },
        { count: publishedPlaces },
        { count: totalArticles },
        { count: publishedArticles },
        { count: totalComments },
        { count: unansweredBot },
        { data: recent }
      ] = await Promise.all([
        supabase.from('places').select('*', { count: 'exact', head: true }),
        supabase.from('places').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('bot_inquiries').select('*', { count: 'exact', head: true }).eq('was_answered', false),
        supabase.from('bot_inquiries')
          .select('question, was_answered, created_at, city')
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      setStats({ totalPlaces, publishedPlaces, totalArticles, publishedArticles, totalComments })
      setUnanswered(unansweredBot || 0)
      setRecentActivity(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <PageShell><div style={{ color: '#444', fontSize: '14px' }}>Loading...</div></PageShell>

  return (
    <PageShell>
      <PageHeader title="Dashboard" subtitle="ReviewIT at a glance" />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <StatCard label="Published Places" value={stats.publishedPlaces} sub={`${stats.totalPlaces} total`} accent />
        <StatCard label="Published Articles" value={stats.publishedArticles} sub={`${stats.totalArticles} total`} />
        <StatCard label="Comments" value={stats.totalComments} sub="all time" />
        <StatCard label="Unanswered Bot Qs" value={unanswered} sub="content gaps" warn={unanswered > 0} />
      </div>

      {/* Quick actions */}
      <SectionHead label="Quick Actions" />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <QuickAction to="/admin/places?new=1" label="+ Add Place" primary />
        <QuickAction to="/admin/articles?new=1" label="+ New Article" primary />
        <QuickAction to="/admin/scores" label="Edit Scores" />
        <QuickAction to="/admin/bot-logs" label={`View ${unanswered} Content Gaps`} warn={unanswered > 0} />
      </div>

      {/* Recent bot questions */}
      <SectionHead label="Recent Bot Questions" />
      {recentActivity.length === 0 ? (
        <div style={{ fontSize: '13px', color: '#333' }}>No bot inquiries yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {recentActivity.map((q, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', background: '#0f0f0f',
              border: '1px solid #141414', borderRadius: '8px'
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50', flexShrink: 0,
                background: q.was_answered ? '#2a8a4a' : '#C8822A'
              }} />
              <div style={{ flex: 1, fontSize: '13px', color: '#aaa' }}>{q.question}</div>
              <div style={{ fontSize: '11px', color: '#333', flexShrink: 0 }}>
                {q.was_answered ? 'Answered' : 'No match'}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/admin/bot-logs" style={{ fontSize: '13px', color: '#C8822A', textDecoration: 'none' }}>
        View all bot inquiries →
      </Link>
    </PageShell>
  )
}

function StatCard({ label, value, sub, accent, warn }) {
  return (
    <div style={{
      background: '#0f0f0f', border: `1px solid ${warn ? '#2a1a0a' : '#141414'}`,
      borderRadius: '10px', padding: '16px'
    }}>
      <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '500', color: warn ? '#C8822A' : accent ? '#fff' : '#888', fontFamily: "'Playfair Display', serif" }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function QuickAction({ to, label, primary, warn }) {
  return (
    <Link to={to} style={{
      padding: '8px 18px', borderRadius: '8px', textDecoration: 'none',
      fontSize: '13px', fontWeight: primary ? '500' : '400',
      background: primary ? '#C8822A' : warn ? '#1a0e04' : '#0f0f0f',
      color: primary ? '#fff' : warn ? '#C8822A' : '#888',
      border: primary ? 'none' : `1px solid ${warn ? '#2a1a0a' : '#141414'}`
    }}>{label}</Link>
  )
}

export function PageShell({ children }) {
  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '500', color: '#fff', marginBottom: '4px' }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: '13px', color: '#444' }}>{subtitle}</p>}
    </div>
  )
}

export function SectionHead({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.2px', color: '#444', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#141414' }} />
    </div>
  )
}
