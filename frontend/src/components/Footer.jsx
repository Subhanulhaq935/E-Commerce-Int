import { Link } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, Truck, Award, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-gray-300 border-t border-gray-800 mt-auto">
      {/* Trust Feature Strip */}
      <div className="border-b border-gray-800/80 bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-orange/15 border border-primary-orange/30 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-primary-orange" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Cash on Delivery</h4>
              <p className="text-xs text-gray-400">Pay conveniently at your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-orange/15 border border-primary-orange/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-orange" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Authentic Products</h4>
              <p className="text-xs text-gray-400">Quality checked before every dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-orange/15 border border-primary-orange/30 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-primary-orange" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Verified Buyer Reviews</h4>
              <p className="text-xs text-gray-400">Real feedback from delivered orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-primary-orange flex items-center justify-center shadow-md shadow-orange-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-tight">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
            <p className="text-xs text-gray-400">
              Your trusted destination for premium everyday essentials.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-400">
          <Link to="/" className="hover:text-primary-orange transition-colors">
            Catalog
          </Link>
          <Link to="/cart" className="hover:text-primary-orange transition-colors">
            Shopping Cart
          </Link>
          <Link to="/my-orders" className="hover:text-primary-orange transition-colors">
            Order Tracking
          </Link>
          <Link to="/login" className="hover:text-primary-orange transition-colors">
            Account
          </Link>
        </div>

        <div className="text-center md:text-right">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} <span className="font-bold text-white">E-Shop.pk</span>. All rights reserved.
          </p>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-center md:justify-end gap-1">
            <span>Built with FastAPI & React</span>
            <Heart className="w-3 h-3 text-primary-orange fill-primary-orange" />
          </p>
        </div>
      </div>
    </footer>
  )
}
