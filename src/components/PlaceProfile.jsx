import { useParams, Link } from 'react-router-dom'
import { usePlace } from '../hooks/useData'
import Comments from './Comments'

const PRICE_LABELS = { 1: '₦', 2: '₦₦', 3: '₦₦₦', 4: '₦₦₦₦', 5: '₦₦₦₦₦' }

export default function PlaceProfile() {
  const { slug } = useParams()
  const { place, scores, loading, error } = usePlace(slug)

  if (loading) return <Loading />
  if (error || !place) return <NotFound />

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '12px', color: '#444', marginBottom: '20px', display: 'flex', gap: '6px' }}>
        <Link to="/places" style={{ color: '#666', textDecoration: 'none' }}>Places</Link>
        <span>/</span>
        <span style={{ color: '#C8822A' }}>{place.category?.name}</span>
      </div>

      {/* Cover image */}
      {place.cover_image_url && (
        <div style={{ height: '240px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #1a1a1a' }}>
          <img src={place.cover_image_url} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Tag>{place.category?.name}</Tag>
          <Tag>{place.neighborhood}, {place.city}</Tag>
          {place.price_tier && <Tag>{PRICE_LABELS[place.price_tier]}</Tag>}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '500', color: '#fff', lineHeight: '1.2', marginBottom: '8px' }}>
          {place.name}
        </h1>
        {place.tagline && (
          <p style={{ fontSize: '15px', color: '#888', lineHeight: '1.5' }}>{place.tagline}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
          {place.overall_score && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '500', color: '#C8822A' }}>
                {place.overall_score.toFixed(1)}
              </span>
              <span style={{ fontSize: '13px', color: '#555' }}>/10</span>
            </div>
          )}
          {place.reviewer && (
            <span style={{ fontSize: '12px', color: '#444' }}>
              Reviewed by {place.reviewer.display_name}
              {place.reviewed_at && ` · ${new Date(place.reviewed_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {place.description && (
        <div style={{ fontSize: '15px', color: '#aaa', lineHeight: '1.7', marginBottom: '28px', borderLeft: '2px solid #1a1a1a', paddingLeft: '16px' }}>
          {place.description}
        </div>
      )}

      {/* Scores */}
      {scores.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <SectionHead label="Scores" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scores.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '120px', fontSize: '12px', color: '#666', flexShrink: 0 }}>{s.parameter?.name}</div>
                <div style={{ flex: 1, height: '4px', background: '#161616', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.score * 10}%`, background: '#C8822A', borderRadius: '2px' }} />
                </div>
                <div style={{ width: '36px', fontSize: '13px', fontWeight: '500', color: '#e8e8e8', textAlign: 'right' }}>
                  {s.score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {place.best_for?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.8px', color: '#555', textTransform: 'uppercase', marginBottom: '10px' }}>Best For</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {place.best_for.map(b => <Tag key={b}>{b}</Tag>)}
          </div>
        </div>
      )}

      {/* Contact */}
      {(place.phone || place.website || place.google_maps_url) && (
        <div style={{ marginBottom: '28px', padding: '16px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {place.website && <a href={place.website} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#C8822A', textDecoration: 'none' }}>Website ↗</a>}
            {place.google_maps_url && <a href={place.google_maps_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#C8822A', textDecoration: 'none' }}>Google Maps ↗</a>}
            {place.instagram && <a href={`https://instagram.com/${place.instagram}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#C8822A', textDecoration: 'none' }}>@{place.instagram}</a>}
            {place.address && <span style={{ fontSize: '13px', color: '#555' }}>{place.address}</span>}
          </div>
        </div>
      )}

      {/* Compare CTA */}
      <div style={{ marginBottom: '32px' }}>
        <Link to={`/compare`} style={{
          display: 'inline-block', padding: '9px 18px',
          border: '1px solid #1a1a1a', borderRadius: '8px',
          color: '#888', fontSize: '13px', textDecoration: 'none'
        }}>Compare {place.name} with another place →</Link>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '28px' }} />

      {/* Comments */}
      <Comments type="place" id={place.id} />
    </div>
  )
}

function Tag({ children }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      background: '#161616', border: '1px solid #1a1a1a',
      fontSize: '11px', color: '#666'
    }}>{children}</span>
  )
}

function SectionHead({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: '#555', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
    </div>
  )
}

function Loading() {
  return <div style={{ padding: '60px', textAlign: 'center', color: '#444', fontSize: '14px' }}>Loading...</div>
}

function NotFound() {
  return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: '#444', marginBottom: '12px' }}>Place not found.</div>
      <Link to="/places" style={{ color: '#C8822A', fontSize: '13px' }}>← Back to Places</Link>
    </div>
  )
}
