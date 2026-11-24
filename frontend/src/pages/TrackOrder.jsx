import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

export default function TrackOrder() {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        setError('No tracking token provided.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await api.get(`/orders/track/${token}`)
        setOrder(res.data)
      } catch (err) {
        console.error('Error tracking order:', err)
        setError(
          err.response?.data?.detail ||
            'Unable to locate this order. The tracking link may be incomplete or expired.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-orange" />
        <span className="text-sm font-bold">Retrieving real-time order status...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {error || 'We could not find an order matching this tracking link.'}
          </p>
          <Link
            to="/"
            className="bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white text-sm font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 inline-block transition"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'Order received and confirmed' },
    { key: 'processing', label: 'Processing', icon: Package, desc: 'Package being prepared' },
    { key: 'shipped', label: 'On The Way', icon: Truck, desc: 'Handed over to courier' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Successfully delivered' },
  ]

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered']
  const currentStepIndex = statusOrder.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  const customerName = order.guest_name || order.buyer?.name || 'Customer'
  const customerEmail = order.guest_email || order.buyer?.email
  const customerPhone = order.guest_phone || order.shipping_address?.phone
  const customerAddress = order.guest_address || order.shipping_address?.address_line
  const customerCity = order.guest_city || order.shipping_address?.city
  const customerPostal = order.guest_postal_code || order.shipping_address?.postal_code

  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-extrabold text-slate-600 hover:text-primary-orange bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Catalog
        </Link>
        <span className="text-xs font-bold text-slate-400">
          Order Reference: <strong className="text-slate-900 font-black">#{order.id}</strong>
        </span>
      </div>

      {/* Main Order Header & Live Tracker Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-slate-950 via-charcoal to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-300 bg-white/10 border border-white/15 px-3 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-primary-orange" /> Live Order Tracker
              </span>
              <span className="text-xs text-slate-400 font-semibold">{orderDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Order #{order.id}</h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border shadow-sm ${
                order.status === 'delivered'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : order.status === 'cancelled'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  : order.status === 'shipped'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                  : order.status === 'processing'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
            >
              {order.status === 'pending' ? 'Pending Dispatch' : order.status}
            </span>
          </div>
        </div>

        {/* Visual Progress Timeline */}
        <div className="p-6 sm:p-8">
          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs sm:text-sm font-bold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>
                This order was cancelled. Any reserved stock has been returned to inventory.
              </span>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">
                Delivery Progress
              </h3>
              <div className="relative">
                {/* Connecting progress line */}
                <div className="hidden sm:block absolute top-6 left-12 right-12 h-1 bg-slate-100 rounded-full -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-primary-orange to-amber-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                  {steps.map((st, idx) => {
                    const StepIcon = st.icon
                    const isDone = currentStepIndex >= idx

                    return (
                      <div
                        key={st.key}
                        className="flex flex-col items-center text-center p-2 rounded-2xl transition"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-all shadow-xs ${
                            isDone
                              ? 'bg-primary-orange text-white ring-4 ring-orange-100 shadow-orange-500/25'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs font-black block ${
                            isDone ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5 font-medium">
                          {st.desc}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Items & Shipping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Ordered Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-primary-orange" />
              <span>Ordered Products ({order.items?.length || 0})</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items?.map((it) => (
                <div
                  key={it.id}
                  className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/70 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {it.product_name}
                        </h4>
                        {it.size && (
                          <span className="text-[10px] font-black bg-orange-50 text-primary-orange px-2 py-0.5 rounded-full border border-orange-200">
                            Size: {it.size}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold tabular-nums">
                        Rs. {Number(it.unit_price).toLocaleString()} ×{' '}
                        <strong className="text-slate-900">{it.quantity}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-slate-900 text-sm sm:text-base whitespace-nowrap tabular-nums">
                    Rs. {Number(it.subtotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Pricing Box */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  Rs. {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Delivery Charge</span>
                <span className="font-extrabold uppercase text-[11px] bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Free COD
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm sm:text-base">
                <span className="font-extrabold text-slate-900">
                  Grand Total (Cash on Delivery)
                </span>
                <span className="font-black text-primary-orange text-lg sm:text-xl tabular-nums">
                  Rs. {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Support */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-orange" />
              <span>Delivery Details</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                  Recipient Name
                </span>
                <strong className="text-slate-900 font-extrabold text-sm block mt-0.5">
                  {customerName}
                </strong>
              </div>

              {customerPhone && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Phone Number
                  </span>
                  <span className="text-slate-900 font-bold block mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary-orange" />
                    {customerPhone}
                  </span>
                </div>
              )}

              {customerEmail && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Email
                  </span>
                  <span className="text-slate-900 font-medium block mt-0.5 break-all">
                    {customerEmail}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                  Shipping Address
                </span>
                <p className="text-slate-900 font-medium mt-0.5">
                  {customerAddress || 'Address on file'}
                </p>
                <p className="text-slate-500 font-bold mt-0.5">
                  {customerCity} {customerPostal ? `• ${customerPostal}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-orange" />
              <span>Payment Details</span>
            </h3>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Method</span>
                <span className="font-extrabold text-slate-900">Cash On Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Status</span>
                <span
                  className={`font-extrabold capitalize ${
                    order.payment?.status === 'completed'
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {order.payment?.status || 'Pending Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Support Guarantee */}
          <div className="p-4 bg-orange-50/60 border border-orange-200/60 rounded-2xl text-xs text-slate-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-primary-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Need Help with Your Order?</p>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Our support team is available 24/7. Keep your Order ID (#{order.id}) handy when
                reaching out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
