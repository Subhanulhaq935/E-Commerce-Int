import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { resolveImageUrl } from '../utils/imageUrl'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
  ShoppingBag,
  ShoppingCart,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [reviews, setReviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        setLoading(true)
        const [prodRes, catRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories/').catch(() => ({ data: [] })),
        ])
        setProduct(prodRes.data)
        const foundCat = catRes.data?.find((c) => c.id === prodRes.data.category_id)
        if (foundCat) setCategoryName(foundCat.name)

        const primary = prodRes.data.images?.find((img) => img.is_primary) || prodRes.data.images?.[0]
        if (primary) setSelectedImage(primary.image_url)

        try {
          const revRes = await api.get(`/products/${id}/reviews`)
          setReviews(revRes.data)
        } catch {
          setReviews([])
        }
      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProductAndReviews()
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      setAddingToCart(true)
      setMessage({ type: '', text: '' })
      await addToCart(product.id, quantity)
      setMessage({ type: 'success', text: 'Item added to your cart successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2500)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add item to cart'
      setMessage({ type: 'error', text: msg })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-orange" />
        <span className="text-sm font-semibold text-gray-600">Loading product showcase...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-200/80 p-10 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-charcoal">Product Not Found</h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            The product you're looking for might have been removed or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-bold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500">
          <Link to="/" className="hover:text-primary-orange transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">{categoryName || 'Catalog'}</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-charcoal font-bold truncate max-w-[180px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <Link
          to="/"
          className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-600 hover:text-primary-orange transition bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Link>
      </div>

      {/* Main Product Showcase Box */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        {/* Images Column (7 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="w-full h-80 sm:h-96 lg:h-[420px] bg-gradient-to-b from-gray-50 to-gray-100/60 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200/60 mb-4 relative group">
            {selectedImage && !imageError ? (
              <img
                src={resolveImageUrl(selectedImage)}
                alt={product.name}
                onError={() => setImageError(true)}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <ShoppingBag className="w-24 h-24 mb-2 stroke-[1.5]" />
                <span className="text-xs font-medium text-gray-400">Product Preview</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img.image_url)
                    setImageError(false)
                  }}
                  className={`w-18 h-18 rounded-xl border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all bg-gray-50 ${
                    selectedImage === img.image_url
                      ? 'border-primary-orange ring-4 ring-orange-500/15 scale-105'
                      : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveImageUrl(img.image_url)}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 bg-orange-50 text-primary-orange border border-orange-200/60 rounded-full">
                {categoryName || 'Store Item'}
              </span>
              {product.stock > 0 ? (
                <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings Summary Bar */}
            <div className="flex items-center gap-3 mt-3">
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-xl">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.average_rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-xs font-extrabold ml-1.5 text-amber-900">
                  {product.average_rating ? product.average_rating.toFixed(1) : 'New'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                {product.review_count || 0} Verified {product.review_count === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {/* Price Card */}
            <div className="mt-6 p-5 bg-gray-50/90 border border-gray-200/70 rounded-2xl flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-wider font-bold">
                  Special Store Price
                </span>
                <span className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight mt-0.5 block">
                  Rs. {Number(product.price).toLocaleString()}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Free Delivery
              </span>
            </div>

            {/* Description */}
            <div className="py-5 my-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                Product Overview
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description available for this item.'}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 my-4 text-xs text-gray-700">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-gray-50/80 border border-gray-200/60 rounded-xl text-center sm:text-left">
                <Truck className="w-5 h-5 text-primary-orange flex-shrink-0" />
                <span className="font-semibold">Cash On Delivery</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-gray-50/80 border border-gray-200/60 rounded-xl text-center sm:text-left">
                <ShieldCheck className="w-5 h-5 text-primary-orange flex-shrink-0" />
                <span className="font-semibold">100% Original</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-gray-50/80 border border-gray-200/60 rounded-xl text-center sm:text-left">
                <RotateCcw className="w-5 h-5 text-primary-orange flex-shrink-0" />
                <span className="font-semibold">Verified Reviews</span>
              </div>
            </div>
          </div>

          {/* Action section */}
          <div className="pt-4 border-t border-gray-100 mt-2">
            {message.text && (
              <div
                className={`mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-sm font-semibold shadow-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
                {/* Quantity selector */}
                <div className="flex items-center justify-between border-2 border-gray-200 rounded-2xl bg-gray-50/50 px-2 py-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl text-charcoal hover:bg-white hover:shadow-xs transition font-extrabold text-lg cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-5 text-base font-extrabold text-charcoal">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 rounded-xl text-charcoal hover:bg-white hover:shadow-xs transition font-extrabold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-primary-orange hover:bg-primary-orange-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer text-base"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{addingToCart ? 'Adding to Cart...' : 'Add to Shopping Cart'}</span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 font-bold py-3.5 rounded-2xl cursor-not-allowed"
              >
                Item Currently Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-primary-orange text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Feedback</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal flex items-center gap-2.5">
              <span>Customer Reviews</span>
              <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {reviews.length} Verified
              </span>
            </h2>
          </div>

          {product.average_rating && (
            <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/70 px-4 py-2.5 rounded-2xl">
              <span className="text-2xl font-black text-charcoal">
                {product.average_rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(product.average_rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-medium">Overall Rating</span>
              </div>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-charcoal font-bold text-sm">No reviews yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Be the first verified buyer to review this product after delivery!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const reviewerName = rev.user?.name || 'Verified Buyer'
              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-charcoal text-primary-orange font-extrabold text-xs flex items-center justify-center uppercase">
                          {reviewerName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-charcoal block leading-tight">
                            {reviewerName}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3" /> Verified Purchase
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-500 mb-2.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {rev.comment && (
                      <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
