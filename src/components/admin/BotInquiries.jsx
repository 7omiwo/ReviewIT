import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PageShell, PageHeader } from './AdminDashboard'

export default function BotInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unanswered' | 'answered'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('bot_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setInquiries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = inquiries.filter(i =>
    filter === 'all' ? true :
    filter === 'unanswered' ? !i.was_answered :
    i.was_answered
  )

  const unansweredCount = inquiries.filter(i => !i.was_answered).length

  // Group unanswered by theme for content gap analysis
  const gapQuestions = inquiries.filter(i => !i.was_answered).map(i => i.question)

  function timeAgo(ts) {
    const mins = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <PageShell>
      <PageHeader
        title="Bot Inquiries"
        subtitle="Every question asked to the ReviewIT Guide — your editorial content roadmap"
      />

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Total Questions" value={inquiries.length} />
        <StatCard label="Answered" value={inquiries.length - unansweredCount} color="#2a8a4a" />
        <StatCard label="Content Gaps" value={unansweredCount} color="#C8822A" />
      </div>

      {/* Content gaps callout */}
      {unansweredCount > 0 && (
        <div style={{ padding: '16px', background: '#0f0a04', border: '1px solid #2a1a0a', borderRadius: '10px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: '#C8822A', textTransform: 'uppercase', marginBottom: '8px' }}>
            📋 Editorial Action Required — {unansweredCount} unanswered questions
          </div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
            The questions below couldn't be answered because the places or experiences weren't in the database.
            These represent your highest-demand content — add these places first.
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: `All (${inquiries.length})` },
          { key: 'unanswered', label: `Content Gaps (${unansweredCount})` },
          { key: 'answered', label: `Answered (${inquiries.length - unansweredCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            background: filter === f.key ? '#fff' : 'transparent',
            color: filter === f.key ? '#0a0a0a' : '#555',
            border: filter === f.key ? '1px solid #fff' : '1px solid #1a1a1a',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: '13px' }}>Loading inquiries...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed #1a1a1a', borderRadius: '12px', color: '#444', fontSize: '13px' }}>
          {filter === 'unanswered' ? 'No content gaps — the bot is answering everything! Great database coverage.' : 'No inquiries yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map((inquiry, i) => (
            <div key={inquiry.id || i} style={{
              padding: '12px 16px', background: '#0f0f0f',
              border: `1px solid ${inquiry.was_answered ? '#141414' : '#2a1a0a'}`,
              borderRadius: '10px',
              borderLeft: `3px solid ${inquiry.was_answered ? '#141414' : '#C8822A'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#e8e8e8', marginBottom: '6px', lineHeight: '1.4' }}>
                    "{inquiry.question}"
                  </div>
                  {inquiry.answer && (
                    <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5', padding: '8px 12px', background: '#141414', borderRadius: '6px', marginBottom: '6px' }}>
                      <span style={{ color: '#444' }}>Bot answered: </span>{inquiry.answer.slice(0, 160)}{inquiry.answer.length > 160 ? '...' : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#444' }}>
                    {inquiry.city && <span>📍 {inquiry.city}</span>}
                    {inquiry.category && <span>{inquiry.category}</span>}
                    <span>{timeAgo(inquiry.created_at)}</span>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '3px 10px', borderRadius: '20px', flexShrink: 0,
                  background: inquiry.was_answered ? '#0a1a0a' : '#1a0e04',
                  color: inquiry.was_answered ? '#2a8a4a' : '#C8822A',
                  border: `1px solid ${inquiry.was_answered ? '#1a3a1a' : '#2a1a0a'}`
                }}>{inquiry.was_answered ? 'Answered' : 'Gap'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #141414', borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '500', color: color || '#888', fontFamily: "'Playfair Display', serif" }}>{value}</div>
    </div>
  )
}
