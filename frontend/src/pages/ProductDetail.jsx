import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
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
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        setLoading(true)
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/product/${id}`),
        ])
        setProduct(prodRes.data)
        setReviews(revRes.data)
        const primary = prodRes.data.images?.find((img) => img.is_primary) || prodRes.data.images?.[0]
        if (primary) setSelectedImage(primary.image_url)
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
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add item to cart'
      setMessage({ type: 'error', text: msg })
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
        <span>Loading product details...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Product Not Found</h2>
        <Link to="/" className="text-primary-orange font-medium mt-4 inline-block hover:underline">
          Return to Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-orange mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Products
      </Link>

      {/* Product Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images Column */}
        <div>
          <div className="w-full h-80 md:h-96 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 mb-4">
            {selectedImage ? (
              <img
                src={`https://e-commerce-int.onrender.com${selectedImage}`}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <ShoppingBag className="w-20 h-20 text-gray-300" />
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 cursor-pointer ${
                    selectedImage === img.image_url
                      ? 'border-primary-orange ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={`https://e-commerce-int.onrender.com${img.image_url}`}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-orange-50 text-primary-orange rounded-full">
                {product.category?.name || 'Store Item'}
              </span>
              {product.stock > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-600 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">{product.name}</h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-500">
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
                <span className="text-sm font-bold ml-1.5 text-gray-700">
                  {product.average_rating ? product.average_rating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                ({product.review_count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-5 mb-4">
              <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">Special Price</span>
              <span className="text-3xl font-black text-charcoal">
                Rs. {Number(product.price).toLocaleString()}
              </span>
            </div>

            {/* Description */}
            <div className="border-t border-b border-gray-100 py-4 my-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description available for this item.'}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 my-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                <Truck className="w-4 h-4 text-primary-orange" />
                <span>Cash On Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-primary-orange" />
                <span>100% Original</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                <RotateCcw className="w-4 h-4 text-primary-orange" />
                <span>Verified Buyer Reviews</span>
              </div>
            </div>
          </div>

          {/* Action section */}
          <div>
            {message.text && (
              <div
                className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Quantity selector */}
                <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-gray-600 hover:bg-gray-100 transition font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-charcoal">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2.5 text-gray-600 hover:bg-gray-100 transition font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full sm:flex-1 bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 font-semibold py-3 rounded-xl cursor-not-allowed"
              >
                Item Currently Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
          <span>Customer Reviews</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {reviews.length} Verified
          </span>
        </h2>

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No reviews yet. Be the first verified buyer to review this item!</p>
        ) : (
          <div className="space-y-4 divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-4 first:pt-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-charcoal">
                      {rev.user?.name || 'Verified Buyer'}
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified Purchase
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-amber-500 mb-2">
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
