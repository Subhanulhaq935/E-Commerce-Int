import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { resolveImageUrl } from '../utils/imageUrl'
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
  Mail,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
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
            'Unable to find this order. The tracking link may be invalid or expired.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-orange" />
        <span className="text-sm font-semibold">Retrieving real-time order status...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 sm:p-10">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal mb-2">Order Not Found</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {error || 'We could not locate an order matching this tracking link.'}
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold px-7 py-3 rounded-xl shadow-md inline-block transition"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    )
  }

  // Visual status timeline steps
  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'We received your order' },
    { key: 'processing', label: 'Processing', icon: Package, desc: 'Being prepared & packed' },
    { key: 'shipped', label: 'On The Way', icon: Truck, desc: 'Handed over to courier' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Successfully received' },
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
          className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-primary-orange transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Store
        </Link>
        <span className="text-xs font-bold text-gray-400">
          Order ID: <strong className="text-charcoal font-black">#{order.id}</strong>
        </span>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary-orange bg-orange-50 px-2.5 py-0.5 rounded-full">
                Secure Order Tracker
              </span>
              <span className="text-xs text-gray-400 font-medium">{orderDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
              Order #{order.id}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-full border ${
                order.status === 'delivered'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : order.status === 'cancelled'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : order.status === 'shipped'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : order.status === 'processing'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {order.status === 'pending' ? 'Pending Dispatch' : order.status}
            </span>
          </div>
        </div>

        {/* Visual Progress Timeline */}
        {isCancelled ? (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs sm:text-sm font-bold">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>This order was cancelled. Any reserved stock has been returned to inventory.</span>
          </div>
        ) : (
          <div className="mt-8">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-6">
              Delivery Progress
            </h3>
            <div className="relative">
              {/* Connecting progress line */}
              <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
                <div
                  className="h-full bg-primary-orange transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                {steps.map((st, idx) => {
                  const StepIcon = st.icon
                  const isDone = currentStepIndex >= idx
                  const isCurrent = currentStepIndex === idx

                  return (
                    <div
                      key={st.key}
                      className="flex flex-col items-center text-center p-2 rounded-2xl transition"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5 transition-all shadow-sm ${
                          isDone
                            ? 'bg-primary-orange text-white ring-4 ring-orange-100 shadow-orange-500/25'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-extrabold block ${
                          isDone ? 'text-charcoal' : 'text-gray-400'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[11px] text-gray-400 hidden sm:block mt-0.5">
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

      {/* Two Column Layout: Items & Shipping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Ordered Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
            <h3 className="text-base font-extrabold text-charcoal mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary-orange" />
              <span>Ordered Products ({order.items?.length || 0})</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {order.items?.map((it) => (
                <div key={it.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200/70 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-charcoal text-sm truncate">
                          {it.product_name}
                        </h4>
                        {it.size && (
                          <span className="text-[10px] font-extrabold bg-orange-50 text-primary-orange px-2 py-0.5 rounded-full border border-orange-200">
                            Size: {it.size}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Rs. {Number(it.unit_price).toLocaleString()} × <strong className="text-charcoal">{it.quantity}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="font-extrabold text-charcoal text-sm sm:text-base whitespace-nowrap">
                    Rs. {Number(it.subtotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Pricing Box */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-charcoal">
                  Rs. {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Delivery Charge</span>
                <span className="font-extrabold uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                  Free COD
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-sm sm:text-base">
                <span className="font-extrabold text-charcoal">Grand Total (Cash on Delivery)</span>
                <span className="font-black text-primary-orange text-lg sm:text-xl">
                  Rs. {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Support */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-sm font-extrabold text-charcoal mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-orange" />
              <span>Delivery Details</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-gray-600">
              <div>
                <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider">
                  Recipient Name
                </span>
                <strong className="text-charcoal font-bold text-sm block mt-0.5">
                  {customerName}
                </strong>
              </div>

              {customerPhone && (
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider">
                    Phone Number
                  </span>
                  <span className="text-charcoal font-bold block mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {customerPhone}
                  </span>
                </div>
              )}

              {customerEmail && (
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider">
                    Email
                  </span>
                  <span className="text-charcoal font-medium block mt-0.5 break-all">
                    {customerEmail}
                  </span>
                </div>
              )}

              <div>
                <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider">
                  Shipping Address
                </span>
                <p className="text-charcoal font-medium mt-0.5">
                  {customerAddress || 'Address on file'}
                </p>
                <p className="text-gray-500 font-semibold mt-0.5">
                  {customerCity} {customerPostal ? `• ${customerPostal}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-sm font-extrabold text-charcoal mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-orange" />
              <span>Payment Details</span>
            </h3>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-extrabold text-charcoal">Cash On Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span
                  className={`font-bold capitalize ${
                    order.payment?.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {order.payment?.status || 'Pending Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Support Guarantee */}
          <div className="p-4 bg-orange-50/60 border border-orange-200/60 rounded-2xl text-xs text-charcoal flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Need Help with Your Order?</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Our support team is available 24/7. Keep your Order ID (#{order.id}) handy when reaching out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
