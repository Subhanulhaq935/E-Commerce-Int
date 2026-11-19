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
} from 'lucide-react'

export default function MyOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Review Modal state
  const [reviewModal, setReviewModal] = useState({ open: false, productId: null, productName: '' })
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/orders/my-orders')
      setOrders(res.data)
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
        setReviewModal({ open: false, productId: null, productName: '' })
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
          <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        )
      case 'processing':
        return (
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-blue-200">
            <Package className="w-3.5 h-3.5" /> Processing
          </span>
        )
      case 'shipped':
        return (
          <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-purple-200">
            <Truck className="w-3.5 h-3.5" /> Shipped
          </span>
        )
      case 'delivered':
        return (
          <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
        <span>Loading your orders...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 max-w-md mx-auto shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No Orders Yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">You haven't placed any orders so far.</p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold px-6 py-2.5 rounded-xl shadow inline-block"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Order ID</span>
                    <span className="font-bold text-charcoal text-sm">#{ord.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Date Placed</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Total Amount</span>
                    <span className="font-bold text-primary-orange text-sm">
                      Rs. {Number(ord.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(ord.status)}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 divide-y divide-gray-100">
                {ord.items?.map((item) => {
                  const primaryImg = item.product?.images?.find((img) => img.is_primary) || item.product?.images?.[0]
                  const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 flex-shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/products/${item.product_id}`}
                            className="font-bold text-charcoal hover:text-primary-orange transition text-sm line-clamp-1"
                          >
                            {item.product?.name}
                          </Link>
                          <span className="text-xs text-gray-500">
                            Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Verified Review Button (Delivered orders only) */}
                      {ord.status === 'delivered' && (
                        <button
                          onClick={() => setReviewModal({ open: true, productId: item.product_id, productName: item.product?.name })}
                          className="text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Write Review
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-1">Leave a Review</h3>
            <p className="text-xs text-gray-500 mb-4">{reviewModal.productName}</p>

            {reviewMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs ${
                  reviewMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {reviewMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{reviewMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Your Feedback (Optional)</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the product quality and packaging?"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, productId: null, productName: '' })}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
