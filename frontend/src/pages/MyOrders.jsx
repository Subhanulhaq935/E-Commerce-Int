import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Star,
  ShoppingBag,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react'

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

export default function MyOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [productsMap, setProductsMap] = useState({})
  const [loading, setLoading] = useState(true)

  // Review Modal state
  const [reviewModal, setReviewModal] = useState({
    open: false,
    productId: null,
    productName: '',
    productImage: null,
  })
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders/my-orders'),
        api.get('/products/?limit=100').catch(() => ({ data: [] })),
      ])
      setOrders(ordersRes.data)
      const pMap = {}
      productsRes.data?.forEach((p) => {
        pMap[p.id] = p
      })
      setProductsMap(pMap)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [user])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    setReviewMessage({ type: '', text: '' })
    try {
      await api.post(`/products/${reviewModal.productId}/reviews`, {
        rating,
        comment: comment || null,
      })
      setReviewMessage({ type: 'success', text: 'Thank you! Your verified review has been posted.' })
      setTimeout(() => {
        setReviewModal({ open: false, productId: null, productName: '', productImage: null })
        setComment('')
        setRating(5)
        setReviewMessage({ type: '', text: '' })
      }, 2000)
    } catch (err) {
      setReviewMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit review',
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        )
      case 'processing':
        return (
          <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-200/80">
            <Package className="w-3.5 h-3.5" /> Processing
          </span>
        )
      case 'shipped':
        return (
          <span className="bg-purple-50 text-purple-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-200/80">
            <Truck className="w-3.5 h-3.5" /> Shipped
          </span>
        )
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200/80">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-red-200/80">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <span className="text-sm font-semibold">Loading your order history...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-orange">
            Purchase History
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
            My Orders ({orders.length})
          </h1>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-charcoal hover:text-primary-orange bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs transition self-start sm:self-auto"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 p-10 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-primary-orange flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-charcoal">No Orders Yet</h3>
          <p className="text-gray-500 text-sm mt-1.5 mb-6">
            You haven't placed any orders so far. Start exploring our catalog!
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-bold px-7 py-3 rounded-xl shadow-md shadow-orange-500/20 inline-block transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => {
            const currentStepIdx = ORDER_STEPS.findIndex((s) => s.key === ord.status)

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gray-50/90 px-6 py-4 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                        Order ID
                      </span>
                      <span className="font-extrabold text-charcoal text-sm">#{ord.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                        Placed On
                      </span>
                      <span className="font-bold text-gray-700 text-xs">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                        Total Amount
                      </span>
                      <span className="font-black text-primary-orange text-sm">
                        Rs. {Number(ord.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">{getStatusBadge(ord.status)}</div>
                </div>

                {/* Visual 4-Step Progress Tracker (for non-cancelled orders) */}
                {ord.status !== 'cancelled' && currentStepIdx >= 0 && (
                  <div className="px-6 py-4 bg-white border-b border-gray-100">
                    <div className="grid grid-cols-4 gap-2">
                      {ORDER_STEPS.map((step, idx) => {
                        const StepIcon = step.icon
                        const isDone = idx <= currentStepIdx
                        const isCurrent = idx === currentStepIdx
                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-all ${
                                isCurrent
                                  ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25 scale-105'
                                  : isDone
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-[11px] font-bold ${
                                isCurrent
                                  ? 'text-primary-orange'
                                  : isDone
                                    ? 'text-charcoal'
                                    : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="p-6 divide-y divide-gray-100">
                  {ord.items?.map((item) => {
                    const pInfo = productsMap[item.product_id] || item.product
                    const primaryImg =
                      item.image_url ||
                      pInfo?.images?.find((img) => img.is_primary)?.image_url ||
                      pInfo?.images?.[0]?.image_url
                    const imgUrl = primaryImg ? resolveImageUrl(primaryImg) : null
                    const productName = item.product_name || pInfo?.name || `Product #${item.product_id}`

                    return (
                      <div
                        key={item.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Link
                            to={`/products/${item.product_id}`}
                            state={{ product: pInfo }}
                            className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200/60 flex-shrink-0 group hover:border-primary-orange/50 transition"
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={productName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <ShoppingBag className="w-7 h-7 text-gray-300" />
                            )}
                          </Link>
                          <div>
                            <Link
                              to={`/products/${item.product_id}`}
                              state={{ product: pInfo }}
                              className="font-extrabold text-charcoal hover:text-primary-orange transition text-sm sm:text-base line-clamp-1"
                            >
                              {productName}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium flex-wrap">
                              <span className="font-bold text-charcoal">Qty: {item.quantity}</span>
                              {item.size && (
                                <>
                                  <span>•</span>
                                  <span className="bg-orange-50 text-primary-orange border border-orange-200 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                                    Size: {item.size}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>Rs. {Number(item.unit_price).toLocaleString()} each</span>
                              {pInfo?.category_id && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-400">ID #{item.product_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Verified Review Button (Delivered orders only) */}
                        {ord.status === 'delivered' && (
                          <button
                            onClick={() =>
                              setReviewModal({
                                open: true,
                                productId: item.product_id,
                                productName: productName,
                                productImage: imgUrl,
                              })
                            }
                            className="text-xs font-extrabold px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs self-end sm:self-auto"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Write Verified Review</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Rate & Review Product</h3>
                <p className="text-xs text-gray-400">Share your verified purchase experience</p>
              </div>
              <button
                onClick={() =>
                  setReviewModal({ open: false, productId: null, productName: '', productImage: null })
                }
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Highlight Card inside Modal */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {reviewModal.productImage ? (
                  <img
                    src={reviewModal.productImage}
                    alt={reviewModal.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-orange block">
                  Reviewing Item
                </span>
                <span className="text-sm font-extrabold text-charcoal block truncate">
                  {reviewModal.productName}
                </span>
              </div>
            </div>

            {reviewMessage.text && (
              <div
                className={`mb-4 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold ${
                  reviewMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {reviewMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{reviewMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Tap a star to rate
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Your Experience (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on product quality, packaging, and delivery..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setReviewModal({ open: false, productId: null, productName: '', productImage: null })
                  }
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
