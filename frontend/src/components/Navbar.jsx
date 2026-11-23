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
  User,
  ShieldCheck,
  ChevronRight,
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
    <header className="bg-charcoal text-white shadow-md sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-md">
      {/* Subtle Top Highlight Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-charcoal to-slate-950 border-b border-slate-800/80 text-[11px] text-slate-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 text-primary-orange flex-shrink-0 animate-pulse" />
            <span className="truncate">Free Cash on Delivery across Pakistan • 100% Genuine Products</span>
          </span>
          <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Checkout
            </span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none text-white">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
              Official Store
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <Link
            to="/"
            className={`text-sm font-bold px-3.5 py-2 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-white/10 text-primary-orange shadow-inner'
                : 'text-slate-200 hover:text-primary-orange hover:bg-white/5'
            }`}
          >
            Catalog
          </Link>

          {/* Cart Icon (Buyers / Guests) */}
          {!isAdmin && (
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl transition-all ${
                isActive('/cart')
                  ? 'bg-white/10 text-primary-orange'
                  : 'text-slate-200 hover:text-primary-orange hover:bg-white/5'
              }`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-orange text-white text-[11px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center ring-2 ring-charcoal shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center space-x-2 lg:space-x-3 pl-3 border-l border-slate-700/80">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                    isActive('/admin')
                      ? 'bg-primary-orange text-white shadow-orange-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-primary-orange border border-primary-orange/30'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <Link
                  to="/my-orders"
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    isActive('/my-orders')
                      ? 'bg-white/10 text-primary-orange shadow-inner'
                      : 'text-slate-200 hover:text-primary-orange hover:bg-white/5'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>
              )}

              {/* User Pill */}
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/90 pl-1.5 pr-3 py-1 rounded-full">
                <div className="w-6 h-6 rounded-full bg-primary-orange text-white text-xs font-black flex items-center justify-center uppercase shadow-2xs">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-200 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-700/80">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-200 hover:text-primary-orange px-3.5 py-2 rounded-xl hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center gap-2">
          {!isAdmin && (
            <Link
              to="/cart"
              onClick={closeMenu}
              className="relative p-2 text-slate-200 hover:text-primary-orange rounded-xl"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-orange text-white text-[10px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center ring-2 ring-charcoal">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/98 border-t border-slate-800 px-4 py-5 shadow-2xl space-y-3 animate-fadeIn">
          {user ? (
            <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-2xl border border-slate-700 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-orange text-white font-extrabold text-sm flex items-center justify-center uppercase">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{user.name}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{user.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg bg-red-500/10 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 text-white border border-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="text-center py-2.5 px-4 rounded-xl text-xs font-extrabold bg-primary-orange text-white shadow-md shadow-orange-500/20"
              >
                Register
              </Link>
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/"
              onClick={closeMenu}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                isActive('/') ? 'bg-primary-orange/15 text-primary-orange' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Browse Catalog</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            {!isAdmin && (
              <Link
                to="/cart"
                onClick={closeMenu}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/cart') ? 'bg-primary-orange/15 text-primary-orange' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>Shopping Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-primary-orange text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {cartCount}
                    </span>
                  )}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            {user && !isAdmin && (
              <Link
                to="/my-orders"
                onClick={closeMenu}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/my-orders') ? 'bg-primary-orange/15 text-primary-orange' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>My Orders</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive('/admin') ? 'bg-primary-orange text-white' : 'bg-slate-800 text-primary-orange'
                }`}
              >
                <span>Admin Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
