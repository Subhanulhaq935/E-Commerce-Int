import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatApiError } from '../utils/formatError'
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  Eye,
  EyeOff,
  Truck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      const msg = formatApiError(err, 'Invalid email or password. Please try again.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Brand Showcase Panel (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-charcoal to-slate-900 text-white p-9 flex-col justify-between relative overflow-hidden bg-grid-pattern">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-orange/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block leading-none">
                  E-Shop<span className="text-primary-orange">.pk</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mt-1 block">
                  Official Store
                </span>
              </div>
            </Link>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3 text-primary-orange" /> Member Access
              </span>
              <h3 className="text-2xl font-black leading-snug tracking-tight">
                Your Gateway to Effortless Shopping.
              </h3>
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                Sign in to manage your saved delivery addresses, track active orders in real time,
                and share verified product reviews.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold">
              <Truck className="w-4 h-4 text-primary-orange flex-shrink-0" />
              <span>Free Cash on Delivery Nationwide</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Instant Email & Live Order Tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>100% Verified Quality Guarantee</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-center relative">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                E-Shop<span className="text-primary-orange">.pk</span>
              </span>
            </Link>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              Sign in to access your orders, saved addresses, and reviews
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs sm:text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-3 focus:ring-primary-orange/15 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-3 focus:ring-primary-orange/15 text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-orange font-extrabold hover:underline">
              Create an account
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected by secure encrypted authentication</span>
          </div>
        </div>
      </div>
    </div>
  )
}
