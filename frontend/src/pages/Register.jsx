import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, User, Mail, Lock, Phone, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password, phoneNumber)
      // Auto-login after successful registration
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check inputs.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center bg-offwhite px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200/80 p-8 sm:p-10 relative overflow-hidden">
        {/* Top Decorative Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-charcoal via-primary-orange to-amber-500" />

        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center justify-center space-x-2.5 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center group-hover:bg-primary-orange transition-colors">
              <ShoppingBag className="w-6 h-6 text-primary-orange group-hover:text-white transition-colors" />
            </div>
            <span className="text-2xl font-extrabold text-charcoal tracking-tight">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-charcoal">Create an Account</h2>
          <p className="text-gray-500 text-sm mt-1">
            Join E-Shop.pk for fast checkout and order tracking
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Ali"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 text-sm transition-all"
              />
            </div>
          </div>

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
              Phone Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+923001234567"
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
            <UserPlus className="w-5 h-5" />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-orange font-extrabold hover:underline">
            Sign In
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-orange" />
          <span>Instant Buyer Account Activation</span>
        </div>
      </div>
    </div>
  )
}
