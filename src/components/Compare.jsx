import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCategories } from '../hooks/useData'

export default function Compare() {
  const categories = useCategories()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [places, setPlaces] = useState([])
  const [placeA, setPlaceA] = useState(null)
  const [placeB, setPlaceB] = useState(null)
  const [scoresA, setScoresA] = useState([])
  const [scoresB, setScoresB] = useState([])
  const [params, setParams] = useState([])
  const [loading, setLoading] = useState(false)

  // Load places when category changes
  useEffect(() => {
    if (!selectedCategory) return
    supabase
      .from('places')
      .select('id, name, slug, overall_score, neighborhood, city')
      .eq('category_id', selectedCategory)
      .eq('is_published', true)
      .order('overall_score', { ascending: false })
      .then(({ data }) => setPlaces(data || []))

    supabase
      .from('comparison_parameters')
      .select('*')
      .eq('category_id', selectedCategory)
      .order('sort_order')
      .then(({ data }) => setParams(data || []))
  }, [selectedCategory])

  // Load scores when places change
  useEffect(() => {
    if (placeA) loadScores(placeA, setScoresA)
  }, [placeA])

  useEffect(() => {
    if (placeB) loadScores(placeB, setScoresB)
  }, [placeB])

  async function loadScores(placeId, setter) {
    const { data } = await supabase
      .from('place_scores')
      .select('parameter_id, score')
      .eq('place_id', placeId)
    setter(data || [])
  }

  function getScore(scores, paramId) {
    return scores.find(s => s.parameter_id === paramId)?.score ?? null
  }

  function placeInfo(id) {
    return places.find(p => p.id === id)
  }

  const canCompare = placeA && placeB && placeA !== placeB

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
          Compare Places
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Select a category, then pick two places to compare side by side.
        </p>
      </div>

      {/* Step 1: Category */}
      <div style={{ marginBottom: '24px' }}>
        <Label>Category</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => { setSelectedCategory(c.id); setPlaceA(null); setPlaceB(null) }}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                background: selectedCategory === c.id ? '#fff' : 'transparent',
                color: selectedCategory === c.id ? '#0a0a0a' : '#666',
                border: selectedCategory === c.id ? '1px solid #fff' : '1px solid #1a1a1a'
              }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Pick places */}
      {selectedCategory && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '32px' }}>
          <div>
            <Label>First place</Label>
            <Select value={placeA || ''} onChange={e => setPlaceA(e.target.value)} places={places} exclude={placeB} />
          </div>
          <div style={{ fontSize: '12px', color: '#444', paddingBottom: '12px', textAlign: 'center' }}>VS</div>
          <div>
            <Label>Second place</Label>
            <Select value={placeB || ''} onChange={e => setPlaceB(e.target.value)} places={places} exclude={placeA} />
          </div>
        </div>
      )}

      {/* Comparison table */}
      {canCompare && params.length > 0 && (
        <div>
          {/* Place names header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', marginBottom: '8px', padding: '0 4px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{placeInfo(placeA)?.name}</div>
              <div style={{ fontSize: '11px', color: '#555' }}>{placeInfo(placeA)?.neighborhood}, {placeInfo(placeA)?.city}</div>
            </div>
            <div />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{placeInfo(placeB)?.name}</div>
              <div style={{ fontSize: '11px', color: '#555' }}>{placeInfo(placeB)?.neighborhood}, {placeInfo(placeB)?.city}</div>
            </div>
          </div>

          {/* Parameter rows */}
          {params.map(param => {
            const sA = getScore(scoresA, param.id)
            const sB = getScore(scoresB, param.id)
            const aWins = sA !== null && sB !== null && sA > sB
            const bWins = sA !== null && sB !== null && sB > sA

            return (
              <div key={param.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 1fr',
                alignItems: 'center', padding: '14px 4px',
                borderBottom: '1px solid #111'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sA !== null ? (
                    <>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: aWins ? '#C8822A' : '#888' }}>
                        {sA.toFixed(1)}
                      </span>
                      <div style={{ height: '4px', width: `${sA * 7}px`, background: aWins ? '#C8822A' : '#2a2a2a', borderRadius: '2px' }} />
                    </>
                  ) : <span style={{ fontSize: '12px', color: '#333' }}>—</span>}
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', letterSpacing: '.8px', color: '#555', textTransform: 'uppercase' }}>
                  {param.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  {sB !== null ? (
                    <>
                      <div style={{ height: '4px', width: `${sB * 7}px`, background: bWins ? '#2a8a4a' : '#2a2a2a', borderRadius: '2px' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: bWins ? '#2a8a4a' : '#888' }}>
                        {sB.toFixed(1)}
                      </span>
                    </>
                  ) : <span style={{ fontSize: '12px', color: '#333' }}>—</span>}
                </div>
              </div>
            )
          })}

          {/* Overall scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', padding: '16px 4px', borderTop: '1px solid #1a1a1a', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '500', color: '#C8822A' }}>
                {placeInfo(placeA)?.overall_score?.toFixed(1) ?? '—'}
              </span>
              <span style={{ fontSize: '11px', color: '#555' }}>overall</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', letterSpacing: '.8px', color: '#555', textTransform: 'uppercase', paddingTop: '10px' }}>Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#555' }}>overall</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '500', color: '#888' }}>
                {placeInfo(placeB)?.overall_score?.toFixed(1) ?? '—'}
              </span>
            </div>
          </div>

          {params.every(p => getScore(scoresA, p.id) === null && getScore(scoresB, p.id) === null) && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#444', fontSize: '13px' }}>
              No parameter scores have been entered for these places yet. Your editorial team can add them from the Admin panel.
            </div>
          )}
        </div>
      )}

      {canCompare && params.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#444', fontSize: '14px', border: '1px solid #1a1a1a', borderRadius: '12px' }}>
          No comparison parameters defined for this category yet. Add them in the Admin panel under Comparison Parameters.
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.8px', color: '#555', textTransform: 'uppercase', marginBottom: '8px' }}>{children}</div>
}

function Select({ value, onChange, places, exclude }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', padding: '9px 12px',
      background: '#111', border: '1px solid #1a1a1a',
      borderRadius: '8px', color: value ? '#e8e8e8' : '#555', fontSize: '13px'
    }}>
      <option value="">Select a place...</option>
      {places.filter(p => p.id !== exclude).map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )
}
