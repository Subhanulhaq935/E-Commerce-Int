import { Link } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, Truck, Award, Heart, CheckCircle2, ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-slate-300 border-t border-slate-800 mt-auto">
      {/* Trust Feature Strip */}
      <div className="border-b border-slate-800/90 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-primary-orange/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Free Cash on Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Pay safely at your doorstep across Pakistan</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-primary-orange/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">100% Verified Quality</h4>
              <p className="text-xs text-slate-400 mt-0.5">Carefully inspected before every dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-primary-orange/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Verified Customer Reviews</h4>
              <p className="text-xs text-slate-400 mt-0.5">Authentic feedback from real buyers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Your trusted online store for verified lifestyle, fashion, and electronics with fast doorstep delivery across Pakistan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-300">
          <Link to="/" className="hover:text-primary-orange transition-colors">
            Catalog
          </Link>
          <Link to="/cart" className="hover:text-primary-orange transition-colors">
            Shopping Cart
          </Link>
          <Link to="/my-orders" className="hover:text-primary-orange transition-colors">
            Track Order
          </Link>
          <Link to="/login" className="hover:text-primary-orange transition-colors">
            My Account
          </Link>
        </div>

        <div className="text-center md:text-right">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} <span className="font-extrabold text-white">E-Shop.pk</span>. All rights reserved.
          </p>
          <div className="flex items-center justify-center md:justify-end gap-1.5 text-[11px] text-slate-400 mt-1.5 font-medium">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-primary-orange fill-primary-orange inline" />
            <span>FastAPI & React</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
