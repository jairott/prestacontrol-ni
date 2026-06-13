import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut, DollarSign } from 'lucide-react'

export default function Layout({ onLogout }) {
  const navigate = useNavigate()

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#0f172a',fontFamily:'system-ui'}}>
      
      {/* Header top */}
      <header style={{background:'#1e293b',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #334155'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'#6366f1',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <DollarSign size={16} color="white" />
          </div>
          <div>
            <p style={{color:'white',fontWeight:700,fontSize:14,margin:0,lineHeight:1}}>ControlPréstamos</p>
            <p style={{color:'#6366f1',fontSize:11,margin:0}}>Nicaragua</p>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display:'flex',alignItems:'center',gap:6,color:'#94a3b8',background:'none',
          border:'none',cursor:'pointer',fontSize:13,padding:'6px 10px',
          borderRadius:8,background:'#0f172a'
        }}>
          <LogOut size={15}/> Salir
        </button>
      </header>

      {/* Main content */}
      <main style={{flex:1,padding:'1.25rem',overflowY:'auto',paddingBottom:'80px'}}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={{
        position:'fixed',bottom:0,left:0,right:0,
        background:'#1e293b',borderTop:'1px solid #334155',
        display:'flex',zIndex:100
      }}>
        <NavLink to="/" end style={({isActive}) => ({
          flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          padding:'10px 0',textDecoration:'none',gap:4,
          color: isActive ? '#6366f1' : '#64748b',
          borderTop: isActive ? '2px solid #6366f1' : '2px solid transparent'
        })}>
          <LayoutDashboard size={20}/>
          <span style={{fontSize:11,fontWeight:500}}>Dashboard</span>
        </NavLink>
        <NavLink to="/prestamos" style={({isActive}) => ({
          flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          padding:'10px 0',textDecoration:'none',gap:4,
          color: isActive ? '#6366f1' : '#64748b',
          borderTop: isActive ? '2px solid #6366f1' : '2px solid transparent'
        })}>
          <FileText size={20}/>
          <span style={{fontSize:11,fontWeight:500}}>Préstamos</span>
        </NavLink>
      </nav>
    </div>
  )
}
