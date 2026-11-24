import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, resolveItemStock } from '../context/CartContext'
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
  CheckCircle2,
} from 'lucide-react'

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdateQty = (item, newQty) => {
    const itemStock = resolveItemStock(item)
    if (newQty > itemStock) {
      setErrorMsg(`Only ${itemStock} items are currently available in stock.`)
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }
    setErrorMsg('')
    updateQuantity(item.id, newQty).catch((err) => {
      setErrorMsg(err.message || `Only ${itemStock} items are currently available in stock.`)
      setTimeout(() => setErrorMsg(''), 4000)
    })
  }

  const handleIncreaseQty = (item) => {
    const itemStock = resolveItemStock(item)
    if (item.quantity >= itemStock) {
      setErrorMsg(`Only ${itemStock} items are currently available in stock.`)
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }
    handleUpdateQty(item, item.quantity + 1)
  }

  const handleRemove = (itemId) => {
    removeFromCart(itemId)
  }

  if (loading && !cart) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <span className="text-sm font-bold">Loading your shopping cart...</span>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 text-primary-orange flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            You haven't added any items to your cart yet. Discover our curated collection and start
            shopping!
          </p>
          <Link
            to="/"
            className="bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 inline-flex items-center gap-2 transition"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & 3-Step Visual Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-orange">
            Order Items
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart ({items.length} {items.length === 1 ? 'Item' : 'Items'})
          </h1>
        </div>

        {/* Visual Step Pill */}
        <div className="hidden md:flex items-center gap-2.5 bg-white border border-slate-200/80 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-2xs">
          <span className="text-primary-orange flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary-orange text-white flex items-center justify-center text-[10px] shadow-xs">
              1
            </span>
            Cart
          </span>
          <span className="text-slate-300">──</span>
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
              2
            </span>
            Checkout
          </span>
          <span className="text-slate-300">──</span>
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
              3
            </span>
            Complete
          </span>
        </div>
      </div>

      {/* Free Delivery Qualification Banner */}
      <div className="mb-6 p-3.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Your order qualifies for <strong>FREE Cash on Delivery</strong> across Pakistan!
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
          Zero Delivery Fee
        </span>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs sm:text-sm font-bold shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const primaryImg =
              item.product?.images?.find((img) => img.is_primary) || item.product?.images?.[0]
            const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null
            const itemStock = resolveItemStock(item)

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Link
                    to={`/products/${item.product_id}`}
                    state={{ product: item.product }}
                    className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200/70 flex-shrink-0 group"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      state={{ product: item.product }}
                      className="font-extrabold text-base text-slate-900 hover:text-primary-orange transition line-clamp-1"
                    >
                      {item.product?.name || item.product_name}
                    </Link>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                        Rs. {Number(item.unit_price).toLocaleString()}
                        <span className="text-xs font-medium text-slate-400"> / unit</span>
                      </span>
                      {item.original_price &&
                        Number(item.original_price) > Number(item.unit_price) && (
                          <span className="text-xs text-slate-400 line-through font-bold tabular-nums">
                            Rs. {Number(item.original_price).toLocaleString()}
                          </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {item.size && (
                        <span className="inline-block text-[11px] font-extrabold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-lg">
                          Size: {item.size}
                        </span>
                      )}
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.quantity > itemStock
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : itemStock <= 3
                              ? 'text-amber-800 bg-amber-50 border border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                        }`}
                      >
                        {itemStock <= 0 ? 'Out of stock' : `${itemStock} in stock`}
                      </span>
                    </div>

                    {item.quantity > itemStock && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold mt-2">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Only {itemStock} items available.</span>
                        </div>
                        {itemStock > 0 && (
                          <button
                            onClick={() => handleUpdateQty(item, itemStock)}
                            className="underline font-black hover:text-rose-900 cursor-pointer"
                          >
                            Set to {itemStock}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity & Delete Controls */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border-2 border-slate-200 rounded-xl bg-slate-50 p-0.5 shadow-2xs">
                    <button
                      onClick={() => handleUpdateQty(item, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg text-slate-800 hover:bg-white hover:shadow-xs transition-all font-black cursor-pointer active:scale-90 select-none flex items-center justify-center text-base"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-3.5 text-sm font-black text-slate-900 min-w-[28px] text-center select-none tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncreaseQty(item)}
                      disabled={item.quantity >= itemStock}
                      className="w-8 h-8 rounded-lg text-slate-800 hover:bg-white hover:shadow-xs transition-all font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 select-none flex items-center justify-center text-base"
                      title={
                        item.quantity >= itemStock
                          ? `Only ${itemStock} items are currently available in stock.`
                          : 'Increase quantity'
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[105px]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Total
                    </span>
                    <span className="font-black text-slate-900 text-base tabular-nums">
                      Rs. {(Number(item.unit_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition cursor-pointer active:scale-90"
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
              className="inline-flex items-center text-xs sm:text-sm font-extrabold text-slate-700 hover:text-primary-orange transition bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Sticky Order Summary (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 sticky top-24">
            <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center justify-between">
              <span>Order Summary</span>
              <Sparkles className="w-4 h-4 text-primary-orange" />
            </h2>

            <div className="space-y-3.5 text-sm text-slate-600 border-b border-slate-100 pb-5">
              <div className="flex justify-between items-center">
                <span className="font-medium">Items Subtotal</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Delivery Charges</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                  FREE (Cash on Delivery)
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-5">
              <span className="text-base font-extrabold text-slate-900">Total Payable</span>
              <span className="text-primary-orange text-2xl font-black tabular-nums">
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>

            {items.some((it) => it.quantity > resolveItemStock(it)) && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Some items exceed available stock. Please adjust quantities to proceed.</span>
              </div>
            )}

            <button
              onClick={() => {
                const hasExceeded = items.some((it) => it.quantity > resolveItemStock(it))
                if (hasExceeded) {
                  setErrorMsg('Some items in your cart exceed available stock. Please adjust quantities to proceed.')
                  setTimeout(() => setErrorMsg(''), 4500)
                  return
                }
                navigate('/checkout')
              }}
              disabled={items.some((it) => it.quantity > resolveItemStock(it))}
              className="w-full bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-base active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>Free Cash on Delivery across Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% secure checkout with verified stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
