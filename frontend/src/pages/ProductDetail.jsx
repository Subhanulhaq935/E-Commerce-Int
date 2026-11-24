import { useState, useEffect, useLayoutEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  getCachedProduct,
  setCachedProduct,
  getCachedCategories,
  getCachedReviews,
  setCachedReviews,
} from '../utils/catalogCache'
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
  Tag,
  MessageSquarePlus,
  Award,
} from 'lucide-react'

// Helper to determine default size: Small (S) if in stock, else first available size
const getDefaultSize = (prod) => {
  if (!prod?.has_sizes || !prod?.sizes || prod.sizes.length === 0) return null

  // 1. Look for 'S' that is available and in stock (> 0)
  const sSize = prod.sizes.find((s) => s.size === 'S' && s.is_available && s.stock > 0)
  if (sSize) return 'S'

  // 2. Otherwise find the first size that is available and in stock (> 0)
  const firstInStock = prod.sizes.find((s) => s.is_available && s.stock > 0)
  if (firstInStock) return firstInStock.size

  // 3. Fallback to 'S' (if present) or first size even if 0 stock
  const fallbackS = prod.sizes.find((s) => s.size === 'S')
  return fallbackS ? fallbackS.size : prod.sizes[0]?.size || null
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { cart, addToCart } = useCart()

  // Instant preloaded data from navigation state or in-memory catalog cache
  const initialProduct = location.state?.product || getCachedProduct(id)
  const initialCategories = getCachedCategories() || []
  const initialCatName =
    initialCategories.find((c) => c.id === initialProduct?.category_id)?.name || ''
  const initialReviews = getCachedReviews(id)

  const [product, setProduct] = useState(initialProduct || null)
  const [categoryName, setCategoryName] = useState(initialCatName)
  const [reviews, setReviews] = useState(initialReviews || [])
  const [loadingReviews, setLoadingReviews] = useState(!initialReviews)
  const [selectedImage, setSelectedImage] = useState(() => {
    const primary =
      initialProduct?.images?.find((img) => img.is_primary) || initialProduct?.images?.[0]
    return primary ? primary.image_url : null
  })
  const [imageError, setImageError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(() => getDefaultSize(initialProduct))

  const selectedSizeObj =
    product?.has_sizes && product?.sizes && selectedSize
      ? product.sizes.find((s) => s.size === selectedSize)
      : null

  const isCurrentSizeOutOfStock =
    Boolean(product?.has_sizes) &&
    (!selectedSizeObj || !selectedSizeObj.is_available || selectedSizeObj.stock <= 0)

  const maxAvailableStock = product?.has_sizes
    ? selectedSizeObj?.stock || 0
    : product?.stock || 0
  // If product is already available in cache or navigation state, do NOT show loading (0ms instant display!)
  const [loading, setLoading] = useState(!initialProduct)
  const [addedSuccess, setAddedSuccess] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Always ensure product detail page opens from the very top (scroll position 0) immediately
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [id])

  // Review submission state (supports both authenticated buyers & guest visitors)
  const [guestName, setGuestName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' })

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewMessage({ type: '', text: '' })

    if (!user && (!guestName || !guestName.trim())) {
      setReviewMessage({ type: 'error', text: 'Please enter your name to submit a review.' })
      return
    }

    if (!reviewComment || !reviewComment.trim()) {
      setReviewMessage({ type: 'error', text: 'Please share your feedback in the review comment.' })
      return
    }

    setSubmittingReview(true)
    try {
      const payload = {
        rating: reviewRating,
        comment: reviewComment.trim(),
      }
      if (!user) {
        payload.guest_name = guestName.trim()
      }

      const res = await api.post(`/products/${id}/reviews`, payload)
      setReviews((prev) => {
        const nextRev = [res.data, ...prev]
        setCachedReviews(id, nextRev)
        return nextRev
      })
      setReviewMessage({
        type: 'success',
        text: 'Thank you! Your review has been submitted successfully.',
      })
      setReviewComment('')
      if (!user) setGuestName('')
      setReviewRating(5)

      // Refresh product stats (average_rating & review_count)
      api
        .get(`/products/${id}`)
        .then((pRes) => {
          setProduct((prev) => ({
            ...prev,
            average_rating: pRes.data.average_rating,
            review_count: pRes.data.review_count,
          }))
          setCachedProduct(id, pRes.data)
        })
        .catch(() => {})

      setTimeout(() => setReviewMessage({ type: '', text: '' }), 5000)
    } catch (err) {
      setReviewMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Unable to submit your review. Please try again.',
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  // Ensure default size (Small S or first available) is selected when product loads
  useEffect(() => {
    if (product?.has_sizes && product.sizes?.length > 0) {
      setSelectedSize((prev) => {
        if (prev && product.sizes.some((s) => s.size === prev && s.is_available && s.stock > 0)) {
          return prev
        }
        return getDefaultSize(product)
      })
    }
  }, [product?.id, product?.sizes])

  useEffect(() => {
    let isMounted = true

    const cached = getCachedReviews(id)
    if (cached) {
      setReviews(cached)
      setLoadingReviews(false)
    } else {
      setReviews([])
      setLoadingReviews(true)
    }

    // 1. Immediately fetch reviews in parallel
    api
      .get(`/products/${id}/reviews`)
      .then((revRes) => {
        if (!isMounted) return
        setReviews(revRes.data)
        setCachedReviews(id, revRes.data)
        setLoadingReviews(false)
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err)
        if (!isMounted) return
        setLoadingReviews(false)
      })

    // 2. Concurrently fetch product details
    const fetchProduct = async () => {
      try {
        if (!initialProduct) {
          setLoading(true)
        }
        const [prodRes, catRes] = await Promise.all([
          api.get(`/products/${id}`),
          initialCategories.length > 0
            ? Promise.resolve({ data: initialCategories })
            : api.get('/categories/').catch(() => ({ data: [] })),
        ])
        if (!isMounted) return
        setProduct(prodRes.data)
        setCachedProduct(id, prodRes.data)

        const foundCat = catRes.data?.find((c) => c.id === prodRes.data.category_id)
        if (foundCat) setCategoryName(foundCat.name)

        const primary =
          prodRes.data.images?.find((img) => img.is_primary) || prodRes.data.images?.[0]
        if (primary && !selectedImage) setSelectedImage(primary.image_url)
      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProduct()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleAddToCart = () => {
    if (product.has_sizes) {
      if (!selectedSize) {
        setMessage({
          type: 'error',
          text: 'Please select an available size before adding to cart.',
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3500)
        return
      }

      const currentSizeObj = product.sizes?.find((s) => s.size === selectedSize)
      if (!currentSizeObj || !currentSizeObj.is_available || currentSizeObj.stock <= 0) {
        setMessage({
          type: 'error',
          text: `Size '${selectedSize}' is currently out of stock. Please select another size.`,
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3500)
        return
      }

      if (quantity > currentSizeObj.stock) {
        setMessage({
          type: 'error',
          text: `Only ${currentSizeObj.stock} items are currently available in stock.`,
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3500)
        return
      }
    } else {
      if (product.stock <= 0) {
        setMessage({
          type: 'error',
          text: `${product.name} is currently out of stock.`,
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3500)
        return
      }

      if (quantity > product.stock) {
        setMessage({
          type: 'error',
          text: `Only ${product.stock} items are currently available in stock.`,
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3500)
        return
      }
    }

    // Check quantity already in cart
    const currentInCart =
      cart?.items?.find(
        (it) => String(it.product_id) === String(product.id) && (it.size || null) === (selectedSize || null)
      )?.quantity || 0

    if (currentInCart + quantity > maxAvailableStock) {
      const remainingCanAdd = Math.max(0, maxAvailableStock - currentInCart)
      setMessage({
        type: 'error',
        text:
          remainingCanAdd > 0
            ? `Only ${maxAvailableStock} items are currently available in stock (${currentInCart} already in cart).`
            : `You already have all ${maxAvailableStock} available items in your cart.`,
      })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
      return
    }

    // 0ms INSTANT REACTION!
    setAddedSuccess(true)
    setMessage({
      type: 'success',
      text: `Added to cart (${selectedSize ? `Size: ${selectedSize}` : `${quantity} item`}) successfully!`,
    })
    setTimeout(() => setAddedSuccess(false), 2000)
    setTimeout(() => setMessage({ type: '', text: '' }), 2500)

    addToCart(product, quantity, selectedSize).catch((err) => {
      setAddedSuccess(false)
      const msg = err.response?.data?.detail || err.message || 'Unable to add item to cart. Please try again.'
      setMessage({ type: 'error', text: msg })
      setTimeout(() => setMessage({ type: '', text: '' }), 3500)
    })
  }

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-orange" />
        <span className="text-sm font-bold text-slate-600">Loading product details...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            The product you're looking for might have been removed or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Catalog
          </Link>
        </div>
      </div>
    )
  }

  const activeNormalPrice =
    selectedSizeObj && selectedSizeObj.price !== null && selectedSizeObj.price !== undefined
      ? Number(selectedSizeObj.price)
      : Number(product.price || 0)

  const activeSalePrice =
    selectedSizeObj && selectedSizeObj.price !== null && selectedSizeObj.price !== undefined
      ? selectedSizeObj.sale_price !== null && selectedSizeObj.sale_price !== undefined
        ? Number(selectedSizeObj.sale_price)
        : null
      : product.sale_price !== null && product.sale_price !== undefined
      ? Number(product.sale_price)
      : null

  const isSaleActive =
    activeSalePrice !== null &&
    activeSalePrice > 0 &&
    activeSalePrice < activeNormalPrice

  const discountPercentage = isSaleActive
    ? Math.round(((activeNormalPrice - activeSalePrice) / activeNormalPrice) * 100)
    : 0

  const savingsAmount = isSaleActive ? activeNormalPrice - activeSalePrice : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 overflow-x-auto py-1">
          <Link to="/" className="hover:text-primary-orange transition-colors">
            Catalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-500 whitespace-nowrap">{categoryName || 'General'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-900 font-extrabold truncate max-w-[160px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <Link
          to="/"
          className="inline-flex items-center text-xs font-extrabold text-slate-700 hover:text-primary-orange transition bg-white px-4 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Catalog
        </Link>
      </div>

      {/* Main Product Flagship Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10">
        {/* Left Column: Product Gallery (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="w-full h-80 sm:h-96 lg:h-[460px] bg-gradient-to-b from-slate-50 to-slate-100/90 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-200/70 mb-4 relative group shadow-inner">
            {/* Floating Discount Badge inside Image Stage */}
            {isSaleActive && (
              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-600/20 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>SAVE {discountPercentage}%</span>
              </div>
            )}

            {selectedImage && !imageError ? (
              <img
                src={resolveImageUrl(selectedImage)}
                alt={product.name}
                onError={() => setImageError(true)}
                className="w-full h-full object-contain p-4 sm:p-6 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300">
                <ShoppingBag className="w-20 h-20 mb-2 stroke-[1.5]" />
                <span className="text-xs font-bold text-slate-400">No Image Available</span>
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img.image_url)
                    setImageError(false)
                  }}
                  className={`w-20 h-20 rounded-2xl border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all bg-slate-50 ${
                    selectedImage === img.image_url
                      ? 'border-primary-orange ring-4 ring-orange-500/15 scale-105 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
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

        {/* Right Column: Product Intelligence & Buy Box (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            {/* Top Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 bg-orange-50 text-primary-orange border border-orange-200/70 rounded-full">
                {categoryName || 'Store Item'}
              </span>
              {product.stock > 0 ? (
                <span className="text-[11px] font-extrabold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-[11px] font-extrabold px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
                  Out of Stock
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-400 ml-auto">
                SKU #{product.id}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary Bar */}
            <div className="flex items-center gap-3 mt-3.5">
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl shadow-2xs">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.average_rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="text-xs font-black ml-1.5 text-amber-950">
                  {product.average_rating ? product.average_rating.toFixed(1) : 'New'}
                </span>
              </div>
              <a
                href="#reviews-section"
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-primary-orange transition underline-offset-4 hover:underline"
              >
                {product.review_count || 0} Verified {product.review_count === 1 ? 'Review' : 'Reviews'}
              </a>
            </div>

            {/* Luxury Price & Savings Card */}
            <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div>
                {isSaleActive ? (
                  <>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                        Original Price:
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-400 line-through tabular-nums">
                        Rs. {activeNormalPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-black text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200/70">
                        -{discountPercentage}% OFF
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-black text-primary-orange tracking-tight tabular-nums">
                        Rs. {activeSalePrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg">
                        Save Rs. {savingsAmount.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">
                      {selectedSize ? `Price for Size ${selectedSize}` : 'Official Store Price'}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-0.5 block tabular-nums">
                      Rs. {activeNormalPrice.toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200/70 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  Free Delivery (COD)
                </span>
              </div>
            </div>

            {/* Optional Size Variant Selector */}
            {product.has_sizes && product.sizes && product.sizes.length > 0 && (
              <div className="mt-5 p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>Select Size</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {selectedSize ? (
                    <span className="text-xs font-bold text-primary-orange">
                      Selected: <strong className="text-slate-900 underline">{selectedSize}</strong>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-800 font-bold bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      Please select a size
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s) => {
                    const isSelected = selectedSize === s.size
                    const isOutOfStock = s.stock <= 0 || !s.is_available
                    const sizeEffectivePrice = s.sale_price || s.price
                    return (
                      <button
                        key={s.id || s.size}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedSize(s.size)
                          setQuantity((q) => Math.min(Math.max(1, q), s.stock))
                          setMessage({ type: '', text: '' })
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-2.5 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'bg-charcoal text-white border-charcoal shadow-md shadow-charcoal/20 ring-2 ring-primary-orange scale-[1.03]'
                              : 'bg-white text-slate-700 border-slate-200/90 hover:border-primary-orange hover:text-primary-orange hover:bg-orange-50/30'
                        }`}
                      >
                        <span className="font-black text-sm">{s.size}</span>
                        {sizeEffectivePrice && (
                          <span
                            className={`text-[11px] font-extrabold tabular-nums ${
                              isSelected ? 'text-orange-300' : 'text-primary-orange'
                            }`}
                          >
                            Rs. {Number(sizeEffectivePrice).toLocaleString()}
                          </span>
                        )}
                        {isOutOfStock ? (
                          <span className="text-[10px] text-rose-500 font-bold">(Out of Stock)</span>
                        ) : (
                          <span
                            className={`text-[10px] ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            ({s.stock} in stock)
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Product Overview / Description */}
            <div className="py-5 my-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Product Overview
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {product.description ||
                  'Premium quality verified item crafted to the highest standards, backed by authentic customer reviews and free Cash on Delivery across Pakistan.'}
              </p>
            </div>

            {/* 3-Pillar Store Guarantee Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-3 text-xs text-slate-700">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center sm:text-left">
                <Truck className="w-5 h-5 text-primary-orange flex-shrink-0" />
                <span className="font-extrabold">Cash on Delivery</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center sm:text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-extrabold">100% Authentic</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center sm:text-left">
                <RotateCcw className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="font-extrabold">Quality Checked</span>
              </div>
            </div>
          </div>

          {/* Add to Cart & Quantity Action Bar */}
          <div className="pt-5 border-t border-slate-100 mt-2">
            {message.text && (
              <div
                className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between gap-2.5 text-xs sm:text-sm font-bold shadow-xs animate-fadeIn ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
                {message.type === 'success' && (
                  <Link
                    to="/cart"
                    className="text-xs font-black text-emerald-900 underline whitespace-nowrap"
                  >
                    View Cart →
                  </Link>
                )}
              </div>
            )}

            {maxAvailableStock > 0 && !isCurrentSizeOutOfStock ? (
              <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
                {/* Tactile Quantity Stepper with strict stock bounds */}
                <div className="flex items-center justify-between border-2 border-slate-200 rounded-2xl bg-slate-50 px-2 py-1 shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl text-slate-800 hover:bg-white hover:shadow-xs transition font-black text-lg cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-5 text-base font-black text-slate-900 tabular-nums select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (quantity >= maxAvailableStock) {
                        setMessage({
                          type: 'error',
                          text: `Only ${maxAvailableStock} items are currently available in stock.`,
                        })
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                        return
                      }
                      setQuantity((q) => Math.min(maxAvailableStock, q + 1))
                    }}
                    disabled={quantity >= maxAvailableStock || maxAvailableStock <= 0}
                    className="w-10 h-10 rounded-xl text-slate-800 hover:bg-white hover:shadow-xs transition font-black text-lg cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none"
                    aria-label="Increase quantity"
                    title={
                      quantity >= maxAvailableStock
                        ? `Only ${maxAvailableStock} items are currently available in stock.`
                        : 'Increase quantity'
                    }
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Cart CTA */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 font-extrabold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer text-base shadow-lg active:scale-98 ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-[1.01]'
                      : 'bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-white animate-bounce" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-extrabold py-4 px-6 rounded-2xl cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>
                  {product.stock <= 0
                    ? 'Item Currently Out of Stock'
                    : `Size '${selectedSize || ''}' is Out of Stock`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews & Feedback Section */}
      <div
        id="reviews-section"
        className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 lg:p-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-primary-orange text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>Customer Reviews</span>
              <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200/70">
                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </h2>
          </div>

          {product.average_rating && (
            <div className="flex items-center gap-3.5 bg-amber-50/90 border border-amber-200/80 px-5 py-3 rounded-2xl shadow-2xs">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {product.average_rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(product.average_rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Overall Store Rating
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Write a Review Form (5 cols on lg) */}
          <div className="lg:col-span-5 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquarePlus className="w-4.5 h-4.5 text-primary-orange" />
              <h3 className="text-base font-black text-slate-900">Write a Customer Review</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 font-medium leading-relaxed">
              Share your authentic experience with this product to help fellow shoppers make
              informed decisions.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {user ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-2.5 rounded-xl w-full">
                  <span className="text-slate-400">Reviewing as:</span>
                  <span className="text-slate-900 font-black truncate">{user.name}</span>
                  <span className="ml-auto text-[10px] text-primary-orange bg-orange-50 px-2 py-0.5 rounded-full font-extrabold border border-orange-200/60">
                    Verified Account
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-extrabold text-slate-700">
                    {reviewRating === 5
                      ? '5 - Excellent'
                      : reviewRating === 4
                      ? '4 - Very Good'
                      : reviewRating === 3
                      ? '3 - Average'
                      : reviewRating === 2
                      ? '2 - Below Average'
                      : '1 - Unsatisfactory'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Review Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience regarding product quality, fit, and delivery..."
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition resize-none"
                />
              </div>

              {reviewMessage.text && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    reviewMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {reviewMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  )}
                  <span>{reviewMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 px-6 bg-charcoal hover:bg-primary-orange text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Customer Reviews List (7 cols on lg) */}
          <div className="lg:col-span-7">
            {loadingReviews && reviews.length === 0 ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 animate-pulse"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-28" />
                          <div className="h-2.5 bg-slate-100 rounded w-20" />
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
                <Award className="w-11 h-11 text-slate-300 mx-auto mb-2.5" />
                <p className="text-slate-900 font-extrabold text-base">No reviews yet</p>
                <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                  Be the first customer to share your experience with this product!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const reviewerName =
                    rev.user_name || rev.user?.name || rev.guest_name || 'Customer'
                  return (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-charcoal to-slate-800 text-primary-orange font-black text-sm flex items-center justify-center uppercase shadow-xs flex-shrink-0">
                            {reviewerName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">
                                {reviewerName}
                              </span>
                              {rev.is_verified_purchase && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {rev.comment && (
                        <p className="text-slate-600 text-sm leading-relaxed pl-13">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
