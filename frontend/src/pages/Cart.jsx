import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-primary-orange mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-charcoal mb-2">Your Cart is Waiting</h2>
        <p className="text-gray-500 text-sm mb-6">Please sign in to view and manage your shopping cart.</p>
        <Link
          to="/login"
          className="bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold px-6 py-2.5 rounded-xl shadow inline-block"
        >
          Sign In Now
        </Link>
      </div>
    )
  }

  if (loading && !cart) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
        <span>Loading cart...</span>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-charcoal mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 text-sm mb-6">Looks like you haven't added any products yet.</p>
        <Link
          to="/"
          className="bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold px-6 py-2.5 rounded-xl shadow inline-block"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal mb-8">Shopping Cart ({items.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primaryImg = item.product?.images?.find((img) => img.is_primary) || item.product?.images?.[0]
            const imgUrl = primaryImg ? `https://e-commerce-int.onrender.com${primaryImg.image_url}` : null

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 flex-shrink-0">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-bold text-charcoal hover:text-primary-orange transition line-clamp-1"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      Rs. {Number(item.unit_price).toLocaleString()}
                    </p>
                    <span className="text-xs text-gray-400">Stock: {item.product?.stock} available</span>
                  </div>
                </div>

                {/* Quantity & Delete */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold text-charcoal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product?.stock}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition font-bold disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-bold text-charcoal w-24 text-right">
                    Rs. {(Number(item.unit_price) * item.quantity).toLocaleString()}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 p-2 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}

          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-orange mt-4 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-charcoal mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm text-gray-600 border-b border-gray-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free (COD)</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-charcoal py-4">
              <span>Total</span>
              <span className="text-primary-orange text-xl">Rs. {subtotal.toLocaleString()}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-primary-orange" />
              <span>Safe & Secure Cash On Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
