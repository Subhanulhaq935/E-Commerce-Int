import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  Award,
  Heart,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-slate-300 border-t border-slate-800/90 mt-16 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-primary-orange/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Value Proposition Bento Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-primary-orange/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                Free Cash on Delivery
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Pay conveniently in cash at your doorstep anywhere in Pakistan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                100% Verified Quality
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Every item is thoroughly inspected for quality prior to dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                Verified Customer Reviews
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Transparent ratings and real reviews from verified buyers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Storefront Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand Identity (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight block leading-none">
                  E-Shop<span className="text-primary-orange">.pk</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mt-1 block">
                  Official Flagship Store
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Your trusted destination for curated lifestyle, fashion, and everyday essentials with
              real-time order tracking and free nationwide Cash on Delivery.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Original
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-primary-orange" /> Instant Confirmation
              </span>
            </div>
          </div>

          {/* Column 2: Quick Navigation (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Storefront
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-400">
              <li>
                <Link to="/" className="hover:text-primary-orange transition-colors">
                  Catalog
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary-orange transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-primary-orange transition-colors">
                  Secure Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Account (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Customer Account
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-400">
              <li>
                <Link to="/my-orders" className="hover:text-primary-orange transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-orange transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-orange transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Delivery & Payment Assurance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Delivery & Payment
            </h4>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <MapPin className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>Nationwide Delivery (Pakistan)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Fast Dispatch within 24–48 Hours</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">Payment Mode</span>
                <span className="bg-primary-orange/15 text-primary-orange border border-primary-orange/30 px-2.5 py-0.5 rounded-lg text-[11px] font-black">
                  COD Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} <span className="font-extrabold text-white">E-Shop.pk</span>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-primary-orange fill-primary-orange inline" />
            <span>FastAPI & React</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
