import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://e-commerce-int.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 (clear stale session without hijacking public browsing)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Sirf protected pages par login par bhejein, public pages (Home, Products, Checkout, Register) par browsing block na karein
      const protectedPaths = ['/admin', '/my-orders']
      const currentPath = window.location.pathname
      if (protectedPaths.some((p) => currentPath.startsWith(p))) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
