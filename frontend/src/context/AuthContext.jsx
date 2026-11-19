import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // App load hone par current logged-in user fetch karna
  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me')
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        } catch {
          logout()
        }
      }
      setLoading(false)
    }
    fetchMe()
  }, [token])

  const login = async (email, password) => {
    // FastAPI OAuth2 form-data format
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const accessToken = res.data.access_token
    localStorage.setItem('token', accessToken)
    setToken(accessToken)

    // User details fetch karna
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setUser(meRes.data)
    localStorage.setItem('user', JSON.stringify(meRes.data))
    return meRes.data
  }

  const register = async (name, email, password, phoneNumber) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      phone_number: phoneNumber || null,
    })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
