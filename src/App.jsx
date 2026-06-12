import { useState } from 'react'
import Login from './pages/Login'
import AdminApp from './pages/AdminApp'
import CobradorApp from './pages/CobradorApp'

export default function App() {
  const [role, setRole] = useState(null)

  if (!role) return <Login onLogin={setRole} />
  if (role === 'admin') return <AdminApp session={{ user: { id: 'admin' } }} onLogout={() => setRole(null)} />
  return <CobradorApp session={{ user: { id: 'cobrador' } }} onLogout={() => setRole(null)} />
}
