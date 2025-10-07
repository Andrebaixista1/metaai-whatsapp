import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  
  console.log('Navbar renderizando, usuário:', user) // Debug

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">
          📱 WhatsApp Dispatcher
        </Link>
        
        <div className="d-flex align-items-center">
          <span className="navbar-text me-3">
            👤 Olá, {user?.name}
          </span>
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={handleLogout}
          >
            🚪 Sair
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar