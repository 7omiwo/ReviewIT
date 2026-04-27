import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SUGGESTIONS = [
  'Best date-night restaurant in Ikoyi?',
  'Hotels in VI with a pool?',
  'Rooftop bars with live music in Lagos?',
  'Where should I take international clients for dinner?',
  'Most affordable fine dining in Lagos?',
  'Best spot for a birthday celebration?',
]

export default function AskBot() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm the ReviewIT Guide — I know Lagos's restaurants, hotels, bars, and experiences in detail. Ask me anything about where to eat, stay, celebrate, or explore."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function buildContext() {
    // Pull top 50 published places with scores for bot context
    const { data: places } = await supabase
      .from('places')
      .select(`
        name, category:categories(name), neighborhood, city,
        tagline, description, overall_score, price_tier,
        best_for, tags, attributes,
        scores:place_scores(score, parameter:comparison_parameters(name))
      `)
      .eq('is_published', true)
      .order('overall_score', { ascending: false })
      .limit(50)

    return places || []
  }

  async function sendMessage() {
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    try {
      const places = await buildContext()

      const systemPrompt = `You are the ReviewIT Guide — a knowledgeable, warm, and direct assistant for ReviewIT, a platform that reviews restaurants, hotels, bars, and experiences in Lagos, Nigeria (with global expansion planned).

Your knowledge comes exclusively from the ReviewIT database. Here are all the places we have reviewed:

${JSON.stringify(places, null, 2)}

Guidelines:
- Answer questions based ONLY on the places in our database above
- Be specific: name places, give scores, explain why
- If the database has no relevant answer, say honestly: "We haven't reviewed that yet, but here's what we do have that's similar..."
- Keep answers concise but informative — 2 to 4 sentences usually
- Mention overall scores when relevant (out of 10)
- For "best for" recommendations, match the user's context (date night, business, family, etc.)
- Never invent places or details not in the database
- Speak in ReviewIT's voice: knowledgeable, Lagos-native, culturally aware`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages
              .filter(m => m.role !== 'bot' || messages.indexOf(m) > 0)
              .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: question }
          ]
        })
      })

      const data = await response.json()
      const answer = data.content?.find(b => b.type === 'text')?.text || 'Sorry, I could not get an answer right now.'

      setMessages(prev => [...prev, { role: 'bot', text: answer }])

      // Log to bot_inquiries
      await supabase.from('bot_inquiries').insert({
        user_id: user?.id || null,
        question,
        answer,
        was_answered: !answer.toLowerCase().includes("haven't reviewed"),
        city: 'Lagos'
      })

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Something went wrong. Please try again in a moment.'
      }])
    }

    setLoading(false)
  }

  function askSuggestion(text) {
    setInput(text)
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
          Ask the ReviewIT Bot
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Powered by the ReviewIT database. Knows every place we've reviewed in Lagos.
        </p>
      </div>

      {/* Suggestion pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => askSuggestion(s)} style={{
            padding: '6px 12px', border: '1px solid #1a1a1a',
            borderRadius: '20px', background: 'transparent',
            color: '#666', fontSize: '12px', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#333' }}
            onMouseLeave={e => { e.target.style.color = '#666'; e.target.style.borderColor = '#1a1a1a' }}
          >{s}</button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{
        border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden'
      }}>
        {/* Top bar */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #1a1a1a',
          background: '#111', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a8a4a' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8' }}>ReviewIT Guide</div>
            <div style={{ fontSize: '11px', color: '#555' }}>Lagos database · Powered by ReviewIT</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: '16px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#0a0a0a' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                fontSize: '13px', lineHeight: '1.6',
                background: msg.role === 'user' ? '#C8822A' : '#161616',
                color: msg.role === 'user' ? '#fff' : '#ccc',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '12px',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 14px', borderRadius: '12px', borderBottomLeftRadius: '4px',
                background: '#161616', color: '#555', fontSize: '13px', fontStyle: 'italic'
              }}>Searching ReviewIT database...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid #1a1a1a', background: '#111' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about any place or experience in Lagos..."
            style={{
              flex: 1, padding: '9px 14px',
              background: '#0a0a0a', border: '1px solid #1a1a1a',
              borderRadius: '8px', color: '#e8e8e8', fontSize: '13px'
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            padding: '9px 18px', background: '#C8822A',
            border: 'none', borderRadius: '8px', color: '#fff',
            fontSize: '13px', cursor: 'pointer', fontWeight: '500',
            opacity: loading || !input.trim() ? 0.5 : 1
          }}>Send</button>
        </div>
      </div>
    </div>
  )
}
