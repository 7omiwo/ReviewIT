import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlaces, useCategories } from '../hooks/useData.jsx'

const PRICE_LABELS = { 1: '₦', 2: '₦₦', 3: '₦₦₦', 4: '₦₦₦₦', 5: '₦₦₦₦₦' }

export default function Places() {
  const [activeCategory, setActiveCategory] = useState(null)
  const { places, loading } = usePlaces(activeCategory)
  const categories = useCategories()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
          Places
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Every venue reviewed by the ReviewIT team.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <FilterBtn label="All" active={!activeCategory} onClick={() => setActiveCategory(null)} />
        {categories.map(c => (
          <FilterBtn key={c.id} label={`${c.icon} ${c.name}`} active={activeCategory === c.slug} onClick={() => setActiveCategory(c.slug)} />
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: '200px', background: '#111', borderRadius: '12px', border: '1px solid #1a1a1a' }} />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏙</div>
          <div style={{ fontSize: '14px' }}>No places published yet in this category.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {places.map(place => <PlaceCard key={place.id} place={place} />)}
        </div>
      )}
    </div>
  )
}

function PlaceCard({ place }) {
  const catIcon = place.category?.slug === 'restaurant' ? '🍽' :
    place.category?.slug === 'hotel' ? '🏨' :
    place.category?.slug === 'bar-nightlife' ? '🥂' :
    place.category?.slug === 'wellness' ? '🌿' : '📍'

  return (
    <Link to={`/places/${place.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px',
        overflow: 'hidden', transition: 'border-color .2s', cursor: 'pointer'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
      >
        <div style={{
          height: '130px', background: '#161616',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', borderBottom: '1px solid #1a1a1a'
        }}>
          {place.cover_image_url ? (
            <img src={place.cover_image_url} alt={place.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '36px' }}>{catIcon}</span>
          )}
          {place.overall_score && (
            <div style={{
              position: 'absolute', top: '8px', right: '10px',
              background: '#0a0a0a', border: '1px solid #1a1a1a',
              borderRadius: '6px', padding: '3px 8px',
              fontSize: '13px', fontWeight: '500', color: '#C8822A'
            }}>{place.overall_score.toFixed(1)}</div>
          )}
          {place.is_featured && (
            <div style={{
              position: 'absolute', top: '8px', left: '10px',
              background: '#C8822A', borderRadius: '4px',
              padding: '2px 7px', fontSize: '10px', color: '#fff', fontWeight: '600'
            }}>Featured</div>
          )}
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: '500', color: '#e8e8e8', marginBottom: '4px' }}>{place.name}</div>
          {place.tagline && (
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', lineHeight: '1.4' }}>{place.tagline}</div>
          )}
          <div style={{ fontSize: '12px', color: '#444', display: 'flex', gap: '10px' }}>
            <span>{place.neighborhood}, {place.city}</span>
            {place.price_tier && <span>{PRICE_LABELS[place.price_tier]}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

function FilterBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
      background: active ? '#fff' : 'transparent',
      color: active ? '#0a0a0a' : '#666',
      border: active ? '1px solid #fff' : '1px solid #1a1a1a',
    }}>{label}</button>
  )
}
