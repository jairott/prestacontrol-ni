import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import AdminApp from './pages/AdminApp'
import CobradorApp from './pages/CobradorApp'

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else { setRole(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single()
    setRole(data?.rol || 'cobrador')
    setLoading(false)
  }

  if (loading) return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="spinner"></div> Cargando...
    </div>
  )

  if (!session) return <Login />
  if (role === 'admin') return <AdminApp session={session} />
  return <CobradorApp session={session} />
}
