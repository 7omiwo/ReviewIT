import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PageShell, PageHeader } from './AdminDashboard'

export default function AdminScores() {
  const [places, setPlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [params, setParams] = useState([])
  const [scores, setScores] = useState({}) // { param_id: score }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('places')
      .select('id, name, category_id, category:categories(name, slug), neighborhood, city')
      .eq('is_published', true)
      .order('name')
      .then(({ data }) => setPlaces(data || []))
  }, [])

  async function selectPlace(place) {
    setSelectedPlace(place)
    setLoading(true)
    setSaved(false)

    // Load parameters for this category
    const { data: paramData } = await supabase
      .from('comparison_parameters')
      .select('*')
      .eq('category_id', place.category_id)
      .order('sort_order')

    // Load existing scores
    const { data: scoreData } = await supabase
      .from('place_scores')
      .select('parameter_id, score, notes')
      .eq('place_id', place.id)

    const scoreMap = {}
    scoreData?.forEach(s => { scoreMap[s.parameter_id] = { score: s.score, notes: s.notes || '' } })

    setParams(paramData || [])
    setScores(scoreMap)
    setLoading(false)
  }

  function setScore(paramId, val) {
    setScores(s => ({ ...s, [paramId]: { ...s[paramId], score: val } }))
  }
  function setNotes(paramId, val) {
    setScores(s => ({ ...s, [paramId]: { ...s[paramId], notes: val } }))
  }

  async function saveScores() {
    if (!selectedPlace) return
    setSaving(true)

    for (const [paramId, data] of Object.entries(scores)) {
      if (data.score === '' || data.score === undefined) continue
      const score = parseFloat(data.score)
      if (isNaN(score) || score < 0 || score > 10) continue

      await supabase.from('place_scores').upsert({
        place_id: selectedPlace.id,
        parameter_id: paramId,
        score,
        notes: data.notes || null
      }, { onConflict: 'place_id,parameter_id' })
    }

    // Recalculate overall score as weighted average
    const { data: allScores } = await supabase
      .from('place_scores')
      .select('score, parameter:comparison_parameters(weight)')
      .eq('place_id', selectedPlace.id)

    if (allScores?.length > 0) {
      let totalWeight = 0, weightedSum = 0
      allScores.forEach(s => {
        const w = s.parameter?.weight || 1
        weightedSum += s.score * w
        totalWeight += w
      })
      const overall = totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(1)) : null
      await supabase.from('places').update({ overall_score: overall }).eq('id', selectedPlace.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <PageShell>
      <PageHeader title="Place Scores" subtitle="Enter parameter scores that power the comparison tool" />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Place selector */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '.8px', color: '#444', textTransform: 'uppercase', marginBottom: '10px' }}>
            Select a Place
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
            {places.map(p => (
              <button key={p.id} onClick={() => selectPlace(p)} style={{
                padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                background: selectedPlace?.id === p.id ? '#161616' : '#0f0f0f',
                border: `1px solid ${selectedPlace?.id === p.id ? '#C8822A' : '#141414'}`,
                borderRadius: '8px', transition: 'all .15s',
                borderLeft: selectedPlace?.id === p.id ? '2px solid #C8822A' : '2px solid transparent'
              }}>
                <div style={{ fontSize: '13px', color: '#e8e8e8', marginBottom: '2px' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>{p.category?.name} · {p.city}</div>
              </button>
            ))}
            {places.length === 0 && (
              <div style={{ fontSize: '13px', color: '#444', padding: '12px' }}>
                No published places yet. Publish a place first.
              </div>
            )}
          </div>
        </div>

        {/* Score editor */}
        <div>
          {!selectedPlace ? (
            <div style={{ padding: '40px', border: '1px dashed #1a1a1a', borderRadius: '12px', textAlign: 'center', color: '#333', fontSize: '13px' }}>
              Select a place to enter its scores
            </div>
          ) : loading ? (
            <div style={{ color: '#444', fontSize: '13px', padding: '20px' }}>Loading scores...</div>
          ) : params.length === 0 ? (
            <div style={{ padding: '32px', border: '1px dashed #1a1a1a', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#444', marginBottom: '8px' }}>
                No parameters defined for <strong style={{ color: '#888' }}>{selectedPlace.category?.name}</strong> yet.
              </div>
              <div style={{ fontSize: '12px', color: '#333' }}>
                Add parameters in Supabase → comparison_parameters, or ask to build a parameter manager.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{selectedPlace.name}</div>
                  <div style={{ fontSize: '11px', color: '#444' }}>{selectedPlace.category?.name} · {selectedPlace.city}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {saved && <span style={{ fontSize: '12px', color: '#2a8a4a' }}>✓ Saved & score updated</span>}
                  <button onClick={saveScores} disabled={saving} style={{
                    padding: '8px 20px', background: '#C8822A', border: 'none',
                    borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer',
                    fontWeight: '500', opacity: saving ? 0.6 : 1
                  }}>{saving ? 'Saving...' : 'Save Scores'}</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {params.map(param => {
                  const current = scores[param.id] || {}
                  const score = current.score ?? ''
                  const scoreNum = parseFloat(score)
                  const barWidth = !isNaN(scoreNum) ? scoreNum * 10 : 0

                  return (
                    <div key={param.id} style={{ padding: '14px 16px', background: '#0f0f0f', border: '1px solid #141414', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8' }}>{param.name}</div>
                          {param.weight !== 1 && <div style={{ fontSize: '10px', color: '#444' }}>Weight: ×{param.weight}</div>}
                        </div>
                        <input
                          type="number" min="0" max="10" step="0.1"
                          value={score}
                          onChange={e => setScore(param.id, e.target.value)}
                          placeholder="0–10"
                          style={{
                            width: '70px', padding: '7px 10px', textAlign: 'center',
                            background: '#161616', border: '1px solid #1a1a1a',
                            borderRadius: '6px', color: '#e8e8e8', fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </div>
                      {/* Score bar */}
                      <div style={{ height: '4px', background: '#161616', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: '#C8822A', borderRadius: '2px', transition: 'width .2s' }} />
                      </div>
                      <input
                        type="text"
                        value={current.notes || ''}
                        onChange={e => setNotes(param.id, e.target.value)}
                        placeholder="Optional reviewer note (e.g. 'Service was particularly attentive on our visit')"
                        style={{
                          width: '100%', padding: '7px 10px',
                          background: '#161616', border: '1px solid #141414',
                          borderRadius: '6px', color: '#888', fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#0a0f0a', border: '1px solid #141e14', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#3a6a3a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                  Overall score (auto-calculated on save)
                </div>
                <div style={{ fontSize: '24px', fontWeight: '500', color: '#2a8a4a', fontFamily: "'Playfair Display', serif" }}>
                  {Object.values(scores).filter(s => s.score !== '' && !isNaN(parseFloat(s.score))).length > 0
                    ? (() => {
                        let tw = 0, ws = 0
                        params.forEach(p => {
                          const s = scores[p.id]
                          if (s?.score !== '' && !isNaN(parseFloat(s?.score))) {
                            const w = p.weight || 1
                            ws += parseFloat(s.score) * w
                            tw += w
                          }
                        })
                        return tw > 0 ? (ws / tw).toFixed(1) : '—'
                      })()
                    : '—'}
                  <span style={{ fontSize: '13px', color: '#3a6a3a', fontFamily: 'inherit' }}> / 10</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
