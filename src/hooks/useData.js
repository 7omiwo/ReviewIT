import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Fetch all published articles with author info
export function useArticles(categorySlug = null) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('articles')
        .select(`*, author:profiles(display_name, avatar_url), category:categories(name, slug)`)
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        if (cat) query = query.eq('category_id', cat.id)
      }

      const { data, error } = await query
      if (error) setError(error.message)
      else setArticles(data || [])
      setLoading(false)
    }
    fetch()
  }, [categorySlug])

  return { articles, loading, error }
}

// Fetch a single place with its scores and parameters
export function usePlace(slug) {
  const [place, setPlace] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    async function fetch() {
      setLoading(true)
      const { data: placeData, error: placeErr } = await supabase
        .from('places')
        .select(`*, category:categories(name, slug), reviewer:profiles(display_name)`)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (placeErr) { setError(placeErr.message); setLoading(false); return }
      setPlace(placeData)

      const { data: scoreData } = await supabase
        .from('place_scores')
        .select(`*, parameter:comparison_parameters(name, slug, sort_order)`)
        .eq('place_id', placeData.id)
        .order('parameter(sort_order)')

      setScores(scoreData || [])
      setLoading(false)
    }
    fetch()
  }, [slug])

  return { place, scores, loading, error }
}

// Fetch all published places, optionally filtered by category
export function usePlaces(categorySlug = null) {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('places')
        .select(`*, category:categories(name, slug)`)
        .eq('is_published', true)
        .order('overall_score', { ascending: false })

      if (categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        if (cat) query = query.eq('category_id', cat.id)
      }

      const { data } = await query
      setPlaces(data || [])
      setLoading(false)
    }
    fetch()
  }, [categorySlug])

  return { places, loading }
}

// Fetch comments for an article or place
export function useComments(type, id) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const field = type === 'article' ? 'article_id' : 'place_id'

  useEffect(() => {
    if (!id) return
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('comments')
        .select(`*, author:profiles(display_name, avatar_url)`)
        .eq(field, id)
        .eq('is_deleted', false)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
      setComments(data || [])
      setLoading(false)
    }
    fetch()

    // Real-time subscription — new comments appear instantly
    const channel = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `${field}=eq.${id}`
      }, () => fetch())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id, field])

  return { comments, loading }
}

// Fetch categories
export function useCategories() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data || []))
  }, [])
  return categories
}
