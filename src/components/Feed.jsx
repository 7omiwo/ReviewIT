import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useArticles, useCategories } from '../hooks/useData'

export default function Feed() {
  const [activeCategory, setActiveCategory] = useState(null)
  const { articles, loading } = useArticles(activeCategory)
  const categories = useCategories()

  const featured = articles.find(a => a.is_editors_pick || a.is_featured)
  const rest = articles.filter(a => a.id !== featured?.id)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <FilterBtn label="All" active={!activeCategory} onClick={() => setActiveCategory(null)} />
        {categories.map(c => (
          <FilterBtn key={c.id} label={c.name} active={activeCategory === c.slug} onClick={() => setActiveCategory(c.slug)} />
        ))}
      </div>

      {loading ? (
        <LoadingGrid />
      ) : articles.length === 0 ? (
        <EmptyState message="No articles published yet. Check back soon." />
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <Link to={`/articles/${featured.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                borderLeft: '3px solid #C8822A', paddingLeft: '20px',
                marginBottom: '36px', cursor: 'pointer'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', color: '#C8822A', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {featured.is_editors_pick ? "Editor's Pick" : "Featured"}
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '26px', fontWeight: '500', color: '#fff',
                  lineHeight: '1.3', marginBottom: '10px'
                }}>{featured.title}</div>
                {featured.subtitle && (
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>{featured.subtitle}</div>
                )}
                <div style={{ fontSize: '12px', color: '#555', display: 'flex', gap: '12px' }}>
                  {featured.author?.display_name && <span>By {featured.author.display_name}</span>}
                  {featured.category?.name && <span>{featured.category.name}</span>}
                  {featured.read_time_mins && <span>{featured.read_time_mins} min read</span>}
                </div>
              </div>
            </Link>
          )}

          {/* Section header */}
          <SectionHead label="Latest" />

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {rest.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ArticleCard({ article }) {
  const isVideo = article.content_type === 'video'
  return (
    <Link to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#111', border: '1px solid #1a1a1a',
        borderRadius: '12px', overflow: 'hidden',
        transition: 'border-color .2s', cursor: 'pointer'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
      >
        <div style={{
          height: '160px', background: '#161616',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', borderBottom: '1px solid #1a1a1a'
        }}>
          {article.cover_image_url ? (
            <img src={article.cover_image_url} alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '32px' }}>
              {isVideo ? '▶' : article.category?.slug === 'restaurant' ? '🍽' : article.category?.slug === 'hotel' ? '🏨' : '📝'}
            </span>
          )}
          <div style={{ position: 'absolute', bottom: '8px', left: '10px', display: 'flex', gap: '6px' }}>
            <span style={{ background: '#0a0a0a', color: '#C8822A', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
              {article.category?.name || article.content_type}
            </span>
            {isVideo && article.video_duration && (
              <span style={{ background: '#0a0a0a', color: '#666', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                {article.video_duration}
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#e8e8e8', lineHeight: '1.4', marginBottom: '8px' }}>
            {article.title}
          </div>
          <div style={{ fontSize: '12px', color: '#555', display: 'flex', gap: '10px' }}>
            {article.author?.display_name && <span>{article.author.display_name}</span>}
            {article.read_time_mins && <span>{article.read_time_mins} min</span>}
            {article.view_count > 0 && <span>{article.view_count.toLocaleString()} views</span>}
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
      transition: 'all .15s'
    }}>{label}</button>
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

function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: '240px', background: '#111', borderRadius: '12px', border: '1px solid #1a1a1a' }} />
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
      <div style={{ fontSize: '14px' }}>{message}</div>
    </div>
  )
}
