import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Dados mockados de usuÃ¡rios
  const mockUsers = [
    { 
      id: 1, 
      username: 'admin', 
      password: 'admin123', // Em produÃ§Ã£o, isso seria hash
      name: 'Administrador',
      email: 'admin@whatsapp-dispatcher.com'
    },
    { 
      id: 2, 
      username: 'user', 
      password: 'user123', 
      name: 'UsuÃ¡rio Teste',
      email: 'user@whatsapp-dispatcher.com'
    }
  ]

  useEffect(() => {
    // Verificar se existe usuÃ¡rio salvo no localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar credenciais mockadas
      const foundUser = mockUsers.find(
        u => u.username === username && u.password === password
      )
      
      if (foundUser) {
        const userWithoutPassword = {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          email: foundUser.email
        }
        
        setUser(userWithoutPassword)
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        return { success: true }
      } else {
        return { success: false, error: 'Credenciais invÃ¡lidas' }
      }
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
