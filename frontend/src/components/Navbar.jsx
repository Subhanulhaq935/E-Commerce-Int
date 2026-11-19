import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, ShoppingCart, LogOut, LayoutDashboard, Package } from 'lucide-react'

export default function Navbar({ cartCount = 0 }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-charcoal text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <ShoppingBag className="w-7 h-7 text-primary-orange" />
          <span className="text-xl font-bold tracking-tight">
            E-Shop<span className="text-primary-orange">.pk</span>
          </span>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium hover:text-primary-orange transition-colors">
            Shop
          </Link>

          {/* Cart Icon (Buyers / Guests) */}
          {!isAdmin && (
            <Link
              to="/cart"
              className="relative p-2 text-gray-200 hover:text-primary-orange transition-colors"
              title="Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary-orange text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center space-x-3">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="bg-gray-700 hover:bg-gray-600 text-primary-orange px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to="/my-orders"
                  className="text-sm font-medium hover:text-primary-orange transition flex items-center gap-1"
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </Link>
              )}

              <span className="text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full border border-gray-600">
                {user.name.split(' ')[0]}
              </span>

              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-200 hover:text-primary-orange px-3 py-1.5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-medium px-4 py-1.5 rounded-lg shadow transition duration-200"
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
