import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
  ShoppingBag,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Package,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Truck,
  CheckCircle2,
  Compass,
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="bg-charcoal/95 text-white sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-xl shadow-lg shadow-slate-950/10">
      {/* Executive Announcement & Trust Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800/70 text-[11px] text-slate-300 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold truncate">
            <span className="inline-flex items-center gap-1.5 bg-primary-orange/15 text-primary-orange border border-primary-orange/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0">
              <Sparkles className="w-3 h-3" /> Official Store
            </span>
            <span className="truncate text-slate-200">
              Free Cash on Delivery across Pakistan • 100% Genuine Products
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-slate-400 text-[11px] font-semibold flex-shrink-0">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-primary-orange" /> Nationwide Express Dispatch
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Checkout
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 24/7 Support
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center space-x-3 group flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-orange via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 group-hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-white/15">
            <ShoppingBag className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white flex items-center">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
            <span className="text-[9px] text-slate-400 font-extrabold tracking-[0.18em] uppercase mt-1">
              Premium Marketplace
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
          <Link
            to="/"
            className={`text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
              isActive('/')
                ? 'bg-white/10 text-primary-orange shadow-inner ring-1 ring-white/10'
                : 'text-slate-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-primary-orange" />
            <span>Catalog</span>
          </Link>

          {/* Cart Button (All Users: Buyers, Guests, Admins) */}
          <Link
            to="/cart"
            className={`relative px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold ${
              isActive('/cart')
                ? 'bg-primary-orange/15 text-primary-orange ring-1 ring-primary-orange/30'
                : 'text-slate-200 hover:text-white hover:bg-white/5 border border-slate-800/80'
            }`}
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-4.5 h-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-primary-orange text-white text-[10px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center ring-2 ring-charcoal shadow-md">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden lg:inline">Cart</span>
          </Link>

          {/* Auth State */}
          {user ? (
            <div className="flex items-center space-x-2.5 lg:space-x-3 pl-3 ml-1 border-l border-slate-800">
              <Link
                to="/my-orders"
                className={`text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive('/my-orders')
                    ? 'bg-white/10 text-primary-orange shadow-inner ring-1 ring-white/10'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Package className="w-4 h-4 text-primary-orange" />
                <span>My Orders</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm ${
                    isActive('/admin')
                      ? 'bg-primary-orange text-white shadow-lg shadow-orange-500/25'
                      : 'bg-slate-800/90 hover:bg-slate-800 text-primary-orange border border-primary-orange/30'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 pl-1.5 pr-3.5 py-1.5 rounded-full shadow-inner">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-orange to-amber-600 text-white text-xs font-black flex items-center justify-center uppercase shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-100 max-w-[100px] truncate leading-none">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    {isAdmin ? 'Admin' : 'Verified'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2.5 rounded-xl border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 pl-3 ml-1 border-l border-slate-800">
              <Link
                to="/login"
                className={`text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all ${
                  isActive('/login')
                    ? 'bg-white/10 text-white'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/cart"
            onClick={closeMenu}
            className="relative p-2.5 text-slate-200 hover:text-primary-orange bg-slate-800/70 border border-slate-700/70 rounded-xl"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary-orange text-white text-[10px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-charcoal">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-slate-200 hover:text-white rounded-xl bg-slate-800/70 border border-slate-700/70 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/98 border-t border-slate-800/90 px-4 py-5 shadow-2xl space-y-4 animate-fadeIn">
          {user ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-orange to-amber-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-md">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white block">{user.name}</span>
                  <span className="text-[11px] text-emerald-400 font-bold capitalize flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {user.role} Account
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-extrabold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/login"
                onClick={closeMenu}
                className="text-center py-3 px-4 rounded-xl text-xs font-extrabold bg-slate-900 text-white border border-slate-800 hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="text-center py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-primary-orange to-orange-600 text-white shadow-lg shadow-orange-500/25"
              >
                Register
              </Link>
            </div>
          )}

          <div className="space-y-1.5">
            <Link
              to="/"
              onClick={closeMenu}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive('/')
                  ? 'bg-primary-orange/15 text-primary-orange border border-primary-orange/30'
                  : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-primary-orange" />
                <span>Browse Catalog</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/cart"
              onClick={closeMenu}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
                isActive('/cart')
                  ? 'bg-primary-orange/15 text-primary-orange border border-primary-orange/30'
                  : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-primary-orange" />
                <span>Shopping Cart</span>
                {cartCount > 0 && (
                  <span className="bg-primary-orange text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {cartCount}
                  </span>
                )}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            {user && (
              <Link
                to="/my-orders"
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
                  isActive('/my-orders')
                    ? 'bg-primary-orange/15 text-primary-orange border border-primary-orange/30'
                    : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-primary-orange" />
                  <span>My Orders</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
                  isActive('/admin')
                    ? 'bg-primary-orange text-white'
                    : 'bg-slate-900 text-primary-orange border border-primary-orange/30'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
