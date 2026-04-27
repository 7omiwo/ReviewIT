import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCategories } from '../../hooks/useData'
import { PageShell, PageHeader } from './AdminDashboard'

export default function AdminArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const categories = useCategories()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('*, author:profiles(display_name), category:categories(name)')
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublish(article) {
    const updates = { is_published: !article.is_published }
    if (!article.is_published) updates.published_at = new Date().toISOString()
    await supabase.from('articles').update(updates).eq('id', article.id)
    load()
  }

  async function deleteArticle(id) {
    if (!confirm('Delete this article permanently?')) return
    await supabase.from('articles').delete().eq('id', id)
    load()
  }

  const filtered = articles.filter(a =>
    filter === 'all' ? true :
    filter === 'published' ? a.is_published :
    filter === 'video' ? a.content_type === 'video' :
    !a.is_published
  )

  if (editing !== null) {
    return (
      <ArticleForm
        article={editing === 'new' ? null : editing}
        categories={categories}
        onSave={() => { setEditing(null); load() }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <PageHeader title="Articles & Videos" subtitle="All editorial content" />
        <button onClick={() => setEditing('new')} style={{
          padding: '9px 18px', background: '#C8822A', border: 'none',
          borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
        }}>+ New Article</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['all', 'published', 'draft', 'video'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            background: filter === f ? '#fff' : 'transparent',
            color: filter === f ? '#0a0a0a' : '#555',
            border: filter === f ? '1px solid #fff' : '1px solid #1a1a1a',
            textTransform: 'capitalize'
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: '13px' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed #1a1a1a', borderRadius: '12px', color: '#444', fontSize: '13px' }}>
          No articles found. <button onClick={() => setEditing('new')} style={{ background: 'none', border: 'none', color: '#C8822A', cursor: 'pointer', fontSize: '13px' }}>Write the first one →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(article => (
            <ArticleRow
              key={article.id}
              article={article}
              onEdit={() => setEditing(article)}
              onToggle={() => togglePublish(article)}
              onDelete={() => deleteArticle(article.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function ArticleRow({ article, onEdit, onToggle, onDelete }) {
  const typeIcon = article.content_type === 'video' ? '▶' : article.content_type === 'list' ? '≡' : '¶'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', background: '#0f0f0f',
      border: '1px solid #141414', borderRadius: '10px'
    }}>
      <div style={{ fontSize: '14px', color: '#444', width: '20px', textAlign: 'center', flexShrink: 0 }}>{typeIcon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#e8e8e8', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.title}
        </div>
        <div style={{ fontSize: '11px', color: '#444', display: 'flex', gap: '8px' }}>
          {article.author?.display_name && <span>{article.author.display_name}</span>}
          {article.category?.name && <><span>·</span><span>{article.category.name}</span></>}
          {article.read_time_mins && <><span>·</span><span>{article.read_time_mins} min</span></>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {article.is_editors_pick && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#1a0e04', color: '#C8822A', borderRadius: '20px', border: '1px solid #2a1a0a' }}>Editor's Pick</span>}
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '20px',
          background: article.is_published ? '#0a1a0a' : '#141414',
          color: article.is_published ? '#2a8a4a' : '#444',
          border: `1px solid ${article.is_published ? '#1a3a1a' : '#1a1a1a'}`
        }}>{article.is_published ? 'Live' : 'Draft'}</span>
        <Btn onClick={onEdit}>Edit</Btn>
        <Btn onClick={onToggle} accent={!article.is_published}>{article.is_published ? 'Unpublish' : 'Publish'}</Btn>
        <Btn onClick={onDelete} danger>Del</Btn>
      </div>
    </div>
  )
}

function ArticleForm({ article, categories, onSave, onCancel }) {
  const isNew = !article
  const [form, setForm] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    subtitle: article?.subtitle || '',
    body: article?.body || '',
    cover_image_url: article?.cover_image_url || '',
    content_type: article?.content_type || 'article',
    video_url: article?.video_url || '',
    video_duration: article?.video_duration || '',
    category_id: article?.category_id || '',
    read_time_mins: article?.read_time_mins || '',
    is_published: article?.is_published || false,
    is_featured: article?.is_featured || false,
    is_editors_pick: article?.is_editors_pick || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { user } = { user: null } // will be injected via useAuth in full impl

  function autoSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function set(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'title' && (isNew || !f.slug || f.slug === autoSlug(f.title))) {
        next.slug = autoSlug(val)
      }
      return next
    })
  }

  async function save() {
    if (!form.title || !form.slug) { setError('Title and slug are required.'); return }
    setSaving(true); setError(null)

    const payload = {
      ...form,
      read_time_mins: form.read_time_mins ? parseInt(form.read_time_mins) : null,
      category_id: form.category_id || null,
      published_at: form.is_published && !article?.published_at ? new Date().toISOString() : article?.published_at,
    }

    const { error: err } = isNew
      ? await supabase.from('articles').insert(payload)
      : await supabase.from('articles').update(payload).eq('id', article.id)

    if (err) setError(err.message)
    else onSave()
    setSaving(false)
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <PageHeader title={isNew ? 'New Article' : 'Edit Article'} />
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer' }}>← Cancel</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Title *" value={form.title} onChange={v => set('title', v)} span />
        <Field label="Slug *" value={form.slug} onChange={v => set('slug', v)} hint="auto-generated from title" />
        <div>
          <FieldLabel>Content Type</FieldLabel>
          <select value={form.content_type} onChange={e => set('content_type', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px' }}>
            <option value="article">Article</option>
            <option value="review">Review</option>
            <option value="video">Video</option>
            <option value="list">List / Ranking</option>
          </select>
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: form.category_id ? '#e8e8e8' : '#555', fontSize: '13px' }}>
            <option value="">Select...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <Field label="Subtitle" value={form.subtitle} onChange={v => set('subtitle', v)} span />
        <Field label="Cover Image URL" value={form.cover_image_url} onChange={v => set('cover_image_url', v)} span />

        {form.content_type === 'video' && (
          <>
            <Field label="Video URL (YouTube embed or direct)" value={form.video_url} onChange={v => set('video_url', v)} span />
            <Field label="Duration (e.g. 12:40)" value={form.video_duration} onChange={v => set('video_duration', v)} />
          </>
        )}

        <Field label="Read time (minutes)" value={form.read_time_mins} onChange={v => set('read_time_mins', v)} type="number" />

        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>Body (Markdown)</FieldLabel>
          <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={12}
            placeholder="Write the article here. Markdown is supported."
            style={{ width: '100%', padding: '12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.6', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', margin: '20px 0', padding: '16px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '10px' }}>
        <Toggle label="Published" value={form.is_published} onChange={v => set('is_published', v)} />
        <Toggle label="Featured" value={form.is_featured} onChange={v => set('is_featured', v)} />
        <Toggle label="Editor's Pick" value={form.is_editors_pick} onChange={v => set('is_editors_pick', v)} />
      </div>

      {error && <div style={{ fontSize: '12px', color: '#e24b4b', padding: '10px 14px', background: '#1a0a0a', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={save} disabled={saving} style={{ padding: '10px 24px', background: '#C8822A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : isNew ? 'Publish Article' : 'Save Changes'}
        </button>
        <button onClick={onCancel} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#666', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </PageShell>
  )
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.6px', color: '#444', textTransform: 'uppercase', marginBottom: '6px' }}>{children}</div>
}
function Field({ label, value, onChange, type = 'text', hint, span }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={hint || ''}
        style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', boxSizing: 'border-box' }} />
    </div>
  )
}
function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: value ? '#C8822A' : '#1a1a1a', border: '1px solid #2a2a2a', position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
    </label>
  )
}
function Btn({ onClick, children, accent, danger }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px', background: accent ? '#C8822A' : 'transparent', color: accent ? '#fff' : danger ? '#5a2a2a' : '#555', border: accent ? 'none' : danger ? '1px solid #2a1a1a' : '1px solid #1a1a1a' }}>{children}</button>
  )
}
