import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ShoppingBag, ShoppingCart, LogOut, LayoutDashboard, Package, Sparkles } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-charcoal text-white shadow-lg sticky top-0 z-50 border-b border-gray-700/70 backdrop-blur-md">
      {/* Subtle Top Highlight Bar */}
      <div className="bg-gradient-to-r from-charcoal via-gray-800 to-charcoal border-b border-gray-700/60 text-[11px] text-gray-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary-orange" />
            <span>Free Cash on Delivery across Pakistan • 100% Verified Products</span>
          </span>
          <span className="hidden sm:inline text-gray-400">24/7 Customer Support</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary-orange/15 border border-primary-orange/30 flex items-center justify-center group-hover:bg-primary-orange group-hover:border-primary-orange transition-all duration-200 shadow-sm">
            <ShoppingBag className="w-5 h-5 text-primary-orange group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight leading-none">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">
              Official Store
            </span>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            to="/"
            className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-white/10 text-primary-orange'
                : 'text-gray-200 hover:text-primary-orange hover:bg-white/5'
            }`}
          >
            Shop
          </Link>

          {/* Cart Icon (Buyers / Guests) */}
          {!isAdmin && (
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl transition-all ${
                isActive('/cart')
                  ? 'bg-white/10 text-primary-orange'
                  : 'text-gray-200 hover:text-primary-orange hover:bg-white/5'
              }`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-orange text-white text-[11px] font-extrabold min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-charcoal shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 border-l border-gray-700">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isActive('/admin')
                      ? 'bg-primary-orange text-white shadow-orange-500/20'
                      : 'bg-gray-700/80 hover:bg-gray-700 text-primary-orange border border-primary-orange/30'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <Link
                  to="/my-orders"
                  className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    isActive('/my-orders')
                      ? 'bg-white/10 text-primary-orange'
                      : 'text-gray-200 hover:text-primary-orange hover:bg-white/5'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">My Orders</span>
                </Link>
              )}

              {/* User Pill */}
              <div className="flex items-center gap-2 bg-gray-800/90 border border-gray-700 pl-1.5 pr-3 py-1 rounded-full">
                <div className="w-6 h-6 rounded-full bg-primary-orange/20 border border-primary-orange/40 text-primary-orange text-xs font-bold flex items-center justify-center uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-gray-200 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pl-2 border-l border-gray-700">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-200 hover:text-primary-orange px-3.5 py-2 rounded-xl hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
