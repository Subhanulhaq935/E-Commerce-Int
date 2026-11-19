import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      if (loggedInUser.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-offwhite px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200/80 p-8 sm:p-10 relative overflow-hidden">
        {/* Top Decorative Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-charcoal via-primary-orange to-amber-500" />

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center space-x-2.5 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center group-hover:bg-primary-orange transition-colors">
              <ShoppingBag className="w-6 h-6 text-primary-orange group-hover:text-white transition-colors" />
            </div>
            <span className="text-2xl font-extrabold text-charcoal tracking-tight">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-charcoal">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to access your cart, orders, and account
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-600 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-orange hover:bg-primary-orange-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
          >
            <LogIn className="w-5 h-5" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-orange font-extrabold hover:underline">
            Create an account
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-orange" />
          <span>Protected by JWT Encrypted Authentication</span>
        </div>
      </div>
    </div>
  )
}
