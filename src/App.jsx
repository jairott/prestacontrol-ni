import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prestamos from './pages/Prestamos'
import NuevoPrestamo from './pages/NuevoPrestamo'
import DetallePrestamo from './pages/DetallePrestamo'
import Layout from './components/Layout'
import { supabase, supabaseConfigured } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = () => {
    supabase.auth.signOut()
  }

  if (!supabaseConfigured) {
    return (
      <div style={{ padding: '2rem', color: 'white', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.2rem' }}>Faltan las variables de entorno de Supabase</h1>
        <p style={{ color: '#94a3b8' }}>
          Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en
          Vercel → Settings → Environment Variables (para el ambiente Production) y vuelve a
          desplegar.
        </p>
      </div>
    )
  }

  if (session === undefined) return null
  if (!session) return <Login onLogin={() => {}} />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={logout} />}>
          <Route index element={<Dashboard />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="prestamos/nuevo" element={<NuevoPrestamo />} />
          <Route path="prestamos/:id" element={<DetallePrestamo />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
