import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prestamos from './pages/Prestamos'
import NuevoPrestamo from './pages/NuevoPrestamo'
import DetallePrestamo from './pages/DetallePrestamo'
import Layout from './components/Layout'

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('authed') === 'true')

  const login = () => {
    sessionStorage.setItem('authed', 'true')
    setAuthed(true)
  }

  const logout = () => {
    sessionStorage.removeItem('authed')
    setAuthed(false)
  }

  if (!authed) return <Login onLogin={login} />

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
