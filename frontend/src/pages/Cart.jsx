import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdateQty = (itemId, newQty) => {
    updateQuantity(itemId, newQty)
  }

  const handleRemove = (itemId) => {
    removeFromCart(itemId)
  }

  if (loading && !cart) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <span className="text-sm font-semibold">Loading your shopping cart...</span>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-10">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Looks like you haven't added any items yet. Explore our latest collection!
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-bold px-7 py-3 rounded-xl shadow-md shadow-orange-500/20 inline-flex items-center gap-2 transition"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Step Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-orange">
            Order Bag
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
            Shopping Cart ({items.length} {items.length === 1 ? 'Item' : 'Items'})
          </h1>
        </div>

        {/* Visual Step Pill */}
        <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200/80 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xs">
          <span className="text-primary-orange flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary-orange text-white flex items-center justify-center text-[10px]">
              1
            </span>
            Cart
          </span>
          <span className="text-gray-300">──</span>
          <span className="text-gray-400 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">
              2
            </span>
            Checkout
          </span>
          <span className="text-gray-300">──</span>
          <span className="text-gray-400 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">
              3
            </span>
            Complete
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-600 text-xs sm:text-sm font-semibold shadow-2xs animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primaryImg =
              item.product?.images?.find((img) => img.is_primary) || item.product?.images?.[0]
            const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Link
                    to={`/products/${item.product_id}`}
                    state={{ product: item.product }}
                    className="w-22 h-22 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200/60 flex-shrink-0 group"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      state={{ product: item.product }}
                      className="font-bold text-base text-charcoal hover:text-primary-orange transition line-clamp-1"
                    >
                      {item.product?.name || item.product_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-charcoal">
                        Rs. {Number(item.unit_price).toLocaleString()}
                        <span className="text-xs font-normal text-gray-400"> / unit</span>
                      </span>
                      {item.original_price && Number(item.original_price) > Number(item.unit_price) && (
                        <span className="text-xs text-gray-400 line-through font-semibold">
                          Rs. {Number(item.original_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.size && (
                        <span className="inline-block text-[11px] font-extrabold text-charcoal bg-gray-100 border border-gray-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                          Size: {item.size}
                        </span>
                      )}
                      {(item.product?.stock !== undefined || item.stock !== undefined) && (
                        <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {item.product?.stock ?? item.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity & Delete Controls */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50/60 p-0.5 shadow-2xs">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg text-charcoal hover:bg-white hover:shadow-xs transition-all font-extrabold cursor-pointer active:scale-90 select-none flex items-center justify-center text-base"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-3.5 text-sm font-black text-charcoal min-w-[28px] text-center select-none tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      disabled={
                        (item.product?.stock && item.quantity >= item.product.stock) ||
                        (item.stock && item.quantity >= item.stock)
                      }
                      className="w-8 h-8 rounded-lg text-charcoal hover:bg-white hover:shadow-xs transition-all font-extrabold disabled:opacity-30 cursor-pointer active:scale-90 select-none flex items-center justify-center text-base"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Total
                    </span>
                    <span className="font-extrabold text-charcoal text-base tabular-nums">
                      Rs. {(Number(item.unit_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer active:scale-90"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-primary-orange transition bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Sticky Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-7 sticky top-24">
            <h2 className="text-lg font-extrabold text-charcoal mb-5 flex items-center justify-between">
              <span>Order Summary</span>
              <Sparkles className="w-4 h-4 text-primary-orange" />
            </h2>

            <div className="space-y-3.5 text-sm text-gray-600 border-b border-gray-100 pb-5">
              <div className="flex justify-between items-center">
                <span>Items Subtotal</span>
                <span className="font-bold text-charcoal tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Charges</span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                  FREE (COD)
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-5">
              <span className="text-base font-extrabold text-charcoal">Total Payable</span>
              <span className="text-primary-orange text-2xl font-black tabular-nums">
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-orange hover:bg-primary-orange-hover text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-base active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>Fast nationwide Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>100% secure checkout with stock lock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
