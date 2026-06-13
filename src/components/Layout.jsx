import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut, DollarSign } from 'lucide-react'

export default function Layout({ onLogout }) {
  const navigate = useNavigate()

  const navStyle = (isActive) => ({
    display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
    borderRadius:10,textDecoration:'none',fontSize:14,fontWeight:500,
    color: isActive ? 'white' : '#94a3b8',
    background: isActive ? '#6366f1' : 'transparent',
    transition:'all 0.2s'
  })

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0f172a',fontFamily:'system-ui'}}>
      {/* Sidebar */}
      <aside style={{width:220,background:'#1e293b',padding:'1.5rem 1rem',display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 8px',marginBottom:'2rem'}}>
          <div style={{width:36,height:36,background:'#6366f1',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <DollarSign size={18} color="white" />
          </div>
          <div>
            <p style={{color:'white',fontWeight:700,fontSize:14,margin:0}}>ControlPréstamos</p>
            <p style={{color:'#6366f1',fontSize:11,margin:0}}>Nicaragua</p>
          </div>
        </div>

        <NavLink to="/" end style={({isActive}) => navStyle(isActive)}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/prestamos" style={({isActive}) => navStyle(isActive)}>
          <FileText size={18} /> Préstamos
        </NavLink>

        <div style={{marginTop:'auto'}}>
          <button onClick={onLogout} style={{
            display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
            borderRadius:10,border:'none',background:'transparent',
            color:'#94a3b8',fontSize:14,cursor:'pointer',width:'100%'
          }}>
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,padding:'2rem',overflowY:'auto'}}>
        <Outlet />
      </main>
    </div>
  )
}
