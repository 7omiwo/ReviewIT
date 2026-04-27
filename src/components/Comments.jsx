import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useComments } from '../hooks/useData.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Comments({ type, id }) {
  const { comments, loading } = useComments(type, id)
  const { user, profile } = useAuth()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function postComment(e) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setSubmitting(true)
    setError(null)
    const payload = { author_id: user.id, body: body.trim() }
    if (type === 'article') payload.article_id = id
    else payload.place_id = id

    const { error: err } = await supabase.from('comments').insert(payload)
    if (err) setError(err.message)
    else setBody('')
    setSubmitting(false)
  }

  return (
    <div>
      <SectionHead label={`Comments (${comments.length})`} />

      {/* Post a comment */}
      {user ? (
        <form onSubmit={postComment} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <Avatar name={profile?.display_name || 'You'} />
          <div style={{ flex: 1 }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#111', border: '1px solid #1a1a1a',
                borderRadius: '8px', color: '#e8e8e8',
                fontSize: '13px', resize: 'vertical', fontFamily: 'inherit'
              }}
            />
            {error && <div style={{ fontSize: '12px', color: '#e24b4b', marginTop: '4px' }}>{error}</div>}
            <button type="submit" disabled={submitting || !body.trim()} style={{
              marginTop: '6px', padding: '7px 16px',
              background: '#C8822A', border: 'none', borderRadius: '6px',
              color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500',
              opacity: submitting || !body.trim() ? 0.5 : 1
            }}>
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '14px', background: '#111', border: '1px solid #1a1a1a',
          borderRadius: '8px', fontSize: '13px', color: '#666', marginBottom: '20px'
        }}>
          <a href="/login" style={{ color: '#C8822A' }}>Sign in</a> to join the conversation.
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div style={{ color: '#444', fontSize: '13px' }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: '#444', fontSize: '13px', padding: '12px 0' }}>No comments yet. Be the first.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} type={type} contentId={id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment, type, contentId, user }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replies, setReplies] = useState([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)

  async function loadReplies() {
    if (repliesLoaded) return
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(display_name)')
      .eq('parent_id', comment.id)
      .eq('is_deleted', false)
      .order('created_at')
    setReplies(data || [])
    setRepliesLoaded(true)
  }

  async function postReply(e) {
    e.preventDefault()
    if (!replyBody.trim() || !user) return
    setSubmitting(true)
    const payload = { author_id: user.id, body: replyBody.trim(), parent_id: comment.id }
    if (type === 'article') payload.article_id = contentId
    else payload.place_id = contentId

    await supabase.from('comments').insert(payload)
    setReplyBody('')
    setReplyOpen(false)
    setRepliesLoaded(false)
    await loadReplies()
    setSubmitting(false)
  }

  const initials = comment.author?.display_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const timeAgo = (ts) => {
    const mins = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Avatar name={comment.author?.display_name || '?'} initials={initials} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8' }}>
            {comment.author?.display_name || 'Anonymous'}
          </span>
          <span style={{ fontSize: '11px', color: '#444' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <div style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>{comment.body}</div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
          <span
            style={{ fontSize: '11px', color: '#555', cursor: 'pointer' }}
            onClick={() => { setReplyOpen(!replyOpen); if (!repliesLoaded) loadReplies() }}
          >Reply</span>
          {comment.like_count > 0 && (
            <span style={{ fontSize: '11px', color: '#555' }}>👍 {comment.like_count}</span>
          )}
        </div>

        {/* Replies */}
        {repliesLoaded && replies.length > 0 && (
          <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {replies.map(r => (
              <div key={r.id} style={{ display: 'flex', gap: '8px' }}>
                <Avatar name={r.author?.display_name || '?'} size={24} />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#ccc' }}>{r.author?.display_name || 'Anonymous'}</span>
                  <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5', marginTop: '2px' }}>{r.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {replyOpen && user && (
          <form onSubmit={postReply} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              style={{
                flex: 1, padding: '7px 12px',
                background: '#111', border: '1px solid #1a1a1a',
                borderRadius: '6px', color: '#e8e8e8', fontSize: '12px'
              }}
            />
            <button type="submit" disabled={submitting || !replyBody.trim()} style={{
              padding: '7px 14px', background: '#C8822A',
              border: 'none', borderRadius: '6px', color: '#fff',
              fontSize: '12px', cursor: 'pointer', opacity: submitting ? 0.5 : 1
            }}>Reply</button>
          </form>
        )}
      </div>
    </div>
  )
}

function Avatar({ name, initials, size = 32 }) {
  const init = initials || name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#1a3a5c', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.35,
      fontWeight: '500', color: '#5b9bd5', flexShrink: 0
    }}>{init}</div>
  )
}

function SectionHead({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: '#555', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
    </div>
  )
}
