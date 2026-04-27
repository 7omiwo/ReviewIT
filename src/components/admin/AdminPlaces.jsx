import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCategories } from '../../hooks/useData'
import { PageShell, PageHeader, SectionHead } from './AdminDashboard'

export default function AdminPlaces() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | place object
  const [filter, setFilter] = useState('all') // 'all' | 'published' | 'draft'
  const categories = useCategories()

  async function loadPlaces() {
    setLoading(true)
    const { data } = await supabase
      .from('places')
      .select('*, category:categories(name, slug)')
      .order('created_at', { ascending: false })
    setPlaces(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPlaces() }, [])

  async function togglePublish(place) {
    await supabase.from('places').update({ is_published: !place.is_published }).eq('id', place.id)
    loadPlaces()
  }

  async function toggleFeatured(place) {
    await supabase.from('places').update({ is_featured: !place.is_featured }).eq('id', place.id)
    loadPlaces()
  }

  async function deletePlace(id) {
    if (!confirm('Delete this place? This cannot be undone.')) return
    await supabase.from('places').delete().eq('id', id)
    loadPlaces()
  }

  const filtered = places.filter(p =>
    filter === 'all' ? true : filter === 'published' ? p.is_published : !p.is_published
  )

  if (editing !== null) {
    return (
      <PlaceForm
        place={editing === 'new' ? null : editing}
        categories={categories}
        onSave={() => { setEditing(null); loadPlaces() }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <PageHeader title="Places" subtitle="All venues reviewed by the team" />
        <button onClick={() => setEditing('new')} style={{
          padding: '9px 18px', background: '#C8822A', border: 'none',
          borderRadius: '8px', color: '#fff', fontSize: '13px',
          cursor: 'pointer', fontWeight: '500', flexShrink: 0
        }}>+ Add Place</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['all', 'published', 'draft'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            background: filter === f ? '#fff' : 'transparent',
            color: filter === f ? '#0a0a0a' : '#555',
            border: filter === f ? '1px solid #fff' : '1px solid #1a1a1a',
            textTransform: 'capitalize'
          }}>{f} {f === 'all' ? `(${places.length})` : f === 'published' ? `(${places.filter(p => p.is_published).length})` : `(${places.filter(p => !p.is_published).length})`}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: '13px' }}>Loading places...</div>
      ) : filtered.length === 0 ? (
        <EmptyState label="No places yet." action="Add your first place" onClick={() => setEditing('new')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(place => (
            <PlaceRow
              key={place.id}
              place={place}
              onEdit={() => setEditing(place)}
              onTogglePublish={() => togglePublish(place)}
              onToggleFeatured={() => toggleFeatured(place)}
              onDelete={() => deletePlace(place.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function PlaceRow({ place, onEdit, onTogglePublish, onToggleFeatured, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', background: '#0f0f0f',
      border: '1px solid #141414', borderRadius: '10px'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#e8e8e8', marginBottom: '2px' }}>{place.name}</div>
        <div style={{ fontSize: '11px', color: '#444', display: 'flex', gap: '8px' }}>
          <span>{place.category?.name}</span>
          <span>·</span>
          <span>{place.neighborhood || place.city}</span>
          {place.overall_score && <><span>·</span><span style={{ color: '#C8822A' }}>{place.overall_score.toFixed(1)}</span></>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
        {place.is_featured && (
          <span style={{ fontSize: '10px', padding: '2px 8px', background: '#1a0e04', color: '#C8822A', borderRadius: '20px', border: '1px solid #2a1a0a' }}>Featured</span>
        )}
        <StatusBadge published={place.is_published} />
        <Btn onClick={onEdit}>Edit</Btn>
        <Btn onClick={onToggleFeatured}>{place.is_featured ? 'Unfeature' : 'Feature'}</Btn>
        <Btn onClick={onTogglePublish} accent={!place.is_published}>
          {place.is_published ? 'Unpublish' : 'Publish'}
        </Btn>
        <Btn onClick={onDelete} danger>Del</Btn>
      </div>
    </div>
  )
}

function PlaceForm({ place, categories, onSave, onCancel }) {
  const isNew = !place
  const [form, setForm] = useState({
    name: place?.name || '',
    slug: place?.slug || '',
    tagline: place?.tagline || '',
    description: place?.description || '',
    category_id: place?.category_id || '',
    neighborhood: place?.neighborhood || '',
    city: place?.city || 'Lagos',
    country: place?.country || 'Nigeria',
    address: place?.address || '',
    phone: place?.phone || '',
    website: place?.website || '',
    instagram: place?.instagram || '',
    google_maps_url: place?.google_maps_url || '',
    overall_score: place?.overall_score || '',
    price_tier: place?.price_tier || '',
    best_for: place?.best_for?.join(', ') || '',
    cover_image_url: place?.cover_image_url || '',
    is_published: place?.is_published || false,
    is_featured: place?.is_featured || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function set(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'name' && (isNew || !f.slug || f.slug === autoSlug(f.name))) {
        next.slug = autoSlug(val)
      }
      return next
    })
  }

  async function save() {
    if (!form.name || !form.slug || !form.city) {
      setError('Name, slug, and city are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      overall_score: form.overall_score ? parseFloat(form.overall_score) : null,
      price_tier: form.price_tier ? parseInt(form.price_tier) : null,
      best_for: form.best_for ? form.best_for.split(',').map(s => s.trim()).filter(Boolean) : [],
      category_id: form.category_id || null,
    }

    const { error: err } = isNew
      ? await supabase.from('places').insert(payload)
      : await supabase.from('places').update(payload).eq('id', place.id)

    if (err) setError(err.message)
    else onSave()
    setSaving(false)
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <PageHeader title={isNew ? 'Add New Place' : `Edit: ${place.name}`} />
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer' }}>← Cancel</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Place Name *" value={form.name} onChange={v => set('name', v)} />
        <Field label="Slug (URL) *" value={form.slug} onChange={v => set('slug', v)} hint="e.g. nok-kitchen-alara" />
        <Field label="Tagline" value={form.tagline} onChange={v => set('tagline', v)} span />
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>Description</FieldLabel>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
            style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        <div>
          <FieldLabel>Category</FieldLabel>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: form.category_id ? '#e8e8e8' : '#555', fontSize: '13px' }}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <Field label="Overall Score (0–10)" value={form.overall_score} onChange={v => set('overall_score', v)} type="number" hint="e.g. 8.5" />

        <Field label="Neighbourhood" value={form.neighborhood} onChange={v => set('neighborhood', v)} hint="e.g. Ikoyi" />
        <Field label="City *" value={form.city} onChange={v => set('city', v)} />
        <Field label="Country" value={form.country} onChange={v => set('country', v)} />
        <div>
          <FieldLabel>Price Tier</FieldLabel>
          <select value={form.price_tier} onChange={e => set('price_tier', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: form.price_tier ? '#e8e8e8' : '#555', fontSize: '13px' }}>
            <option value="">Select...</option>
            <option value="1">₦ — Budget</option>
            <option value="2">₦₦ — Mid-range</option>
            <option value="3">₦₦₦ — Upscale</option>
            <option value="4">₦₦₦₦ — Fine dining</option>
            <option value="5">₦₦₦₦₦ — Ultra luxury</option>
          </select>
        </div>

        <Field label="Best For (comma separated)" value={form.best_for} onChange={v => set('best_for', v)} hint="e.g. Date Night, Business Dinner" span />
        <Field label="Cover Image URL" value={form.cover_image_url} onChange={v => set('cover_image_url', v)} span />
        <Field label="Website" value={form.website} onChange={v => set('website', v)} hint="https://..." />
        <Field label="Instagram handle" value={form.instagram} onChange={v => set('instagram', v)} hint="without @" />
        <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
        <Field label="Google Maps URL" value={form.google_maps_url} onChange={v => set('google_maps_url', v)} />
        <Field label="Address" value={form.address} onChange={v => set('address', v)} span />
      </div>

      {/* Publish controls */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0', padding: '16px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '10px' }}>
        <Toggle label="Published" value={form.is_published} onChange={v => set('is_published', v)} />
        <Toggle label="Featured" value={form.is_featured} onChange={v => set('is_featured', v)} />
      </div>

      {error && <div style={{ fontSize: '12px', color: '#e24b4b', padding: '10px 14px', background: '#1a0a0a', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={save} disabled={saving} style={{
          padding: '10px 24px', background: '#C8822A', border: 'none',
          borderRadius: '8px', color: '#fff', fontSize: '14px',
          cursor: 'pointer', fontWeight: '500', opacity: saving ? 0.6 : 1
        }}>{saving ? 'Saving...' : isNew ? 'Add Place' : 'Save Changes'}</button>
        <button onClick={onCancel} style={{
          padding: '10px 20px', background: 'transparent', border: '1px solid #1a1a1a',
          borderRadius: '8px', color: '#666', fontSize: '14px', cursor: 'pointer'
        }}>Cancel</button>
      </div>
    </PageShell>
  )
}

// Shared form primitives
function FieldLabel({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.6px', color: '#444', textTransform: 'uppercase', marginBottom: '6px' }}>{children}</div>
}

function Field({ label, value, onChange, type = 'text', hint, span }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={hint || ''}
        style={{ width: '100%', padding: '9px 12px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', boxSizing: 'border-box' }} />
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)} style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: value ? '#C8822A' : '#1a1a1a',
        border: '1px solid #2a2a2a', position: 'relative',
        transition: 'background .2s', cursor: 'pointer', flexShrink: 0
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: value ? '18px' : '2px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', transition: 'left .2s'
        }} />
      </div>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
    </label>
  )
}

function StatusBadge({ published }) {
  return (
    <span style={{
      fontSize: '10px', padding: '3px 8px', borderRadius: '20px',
      background: published ? '#0a1a0a' : '#141414',
      color: published ? '#2a8a4a' : '#444',
      border: `1px solid ${published ? '#1a3a1a' : '#1a1a1a'}`
    }}>{published ? 'Live' : 'Draft'}</span>
  )
}

function Btn({ onClick, children, accent, danger }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '6px',
      background: accent ? '#C8822A' : danger ? 'transparent' : 'transparent',
      color: accent ? '#fff' : danger ? '#5a2a2a' : '#555',
      border: accent ? 'none' : danger ? '1px solid #2a1a1a' : '1px solid #1a1a1a'
    }}>{children}</button>
  )
}

function EmptyState({ label, action, onClick }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed #1a1a1a', borderRadius: '12px' }}>
      <div style={{ fontSize: '13px', color: '#444', marginBottom: '12px' }}>{label}</div>
      <button onClick={onClick} style={{ padding: '8px 18px', background: '#C8822A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>{action}</button>
    </div>
  )
}
