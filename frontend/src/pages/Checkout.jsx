import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart, resolveItemStock } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
  MapPin,
  Plus,
  CheckCircle,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  X,
  Phone,
  User,
  Mail,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

const extractErrorMessage = (
  err,
  fallback = 'Something went wrong. Please check your details and try again.'
) => {
  const detail = err?.response?.data?.detail
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === 'string') return d
        if (d.msg) {
          const field = d.loc && d.loc.length > 1 ? `${d.loc[d.loc.length - 1]}: ` : ''
          return `${field}${d.msg}`
        }
        return JSON.stringify(d)
      })
      .join(', ')
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail)
  }
  return fallback
}

export default function Checkout() {
  const { cart, clearCartState } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Registered user state
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [loading, setLoading] = useState(Boolean(user))
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)

  // Guest Customer delivery details state
  const [guestForm, setGuestForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_address: '',
    guest_city: '',
    guest_postal_code: '',
  })

  // New Address modal state for registered users
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    postal_code: '',
    country: 'Pakistan',
    is_default: true,
  })
  const [savingAddress, setSavingAddress] = useState(false)

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses/')
      const list = Array.isArray(res.data) ? res.data : []
      setAddresses(list)
      const defaultAddr = list.find((a) => a.is_default) || list[0]
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id)
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAddresses()
    } else {
      setLoading(false)
    }
  }, [user])

  const openAddModal = () => {
    setNewAddress({
      full_name: user?.name || '',
      phone: '',
      address_line: '',
      city: '',
      postal_code: '',
      country: 'Pakistan',
      is_default: addresses.length === 0,
    })
    setError('')
    setShowAddAddress(true)
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setError('')
    try {
      const res = await api.post('/addresses/', newAddress)
      await fetchAddresses()
      if (res.data?.id) {
        setSelectedAddressId(res.data.id)
      }
      setShowAddAddress(false)
    } catch (err) {
      console.error('Save address error:', err)
      const msg = extractErrorMessage(
        err,
        'Failed to save address. Please verify all required fields.'
      )
      setError(msg)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingAddress(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setPlacingOrder(true)
    setError('')

    const items = cart?.items || []
    if (items.length === 0) {
      setError('Your shopping cart is empty.')
      setPlacingOrder(false)
      return
    }

    // Stock Pre-Validation Check
    for (const it of items) {
      const stock = resolveItemStock(it)
      if (it.quantity > stock) {
        setError(
          `Cannot place order: '${it.product_name || 'Item'}'${it.size ? ` (Size: ${it.size})` : ''} exceeds available stock. Only ${stock} items are currently available in stock.`
        )
        setPlacingOrder(false)
        return
      }
    }

    try {
      if (user) {
        // --- 1. Registered Buyer Flow ---
        if (!selectedAddressId) {
          setError('Please select or add a delivery address.')
          setTimeout(() => setError(''), 4000)
          setPlacingOrder(false)
          return
        }

        const res = await api.post('/orders/', {
          shipping_address_id: selectedAddressId,
          payment_method: 'cod',
        })
        clearCartState()
        setOrderSuccess(res.data)
      } else {
        // --- 2. Guest Customer Flow ---
        const name = guestForm.guest_name.trim()
        const email = guestForm.guest_email.trim()
        const phone = guestForm.guest_phone.trim()
        const address = guestForm.guest_address.trim()
        const city = guestForm.guest_city.trim()
        const postalCode = guestForm.guest_postal_code.trim()

        if (!name || !email || !phone || !address || !city) {
          setError(
            'Please fill in all required delivery fields (Name, Email, Phone, Address, City).'
          )
          setPlacingOrder(false)
          return
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
          setError('Please enter a valid email address for order confirmation.')
          setPlacingOrder(false)
          return
        }

        const checkoutItems = items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          size: it.size || null,
        }))

        const payload = {
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_address: address,
          guest_city: city,
          guest_postal_code: postalCode || null,
          items: checkoutItems,
        }

        const res = await api.post('/orders/guest', payload)
        clearCartState()
        setOrderSuccess(res.data)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      const msg = extractErrorMessage(
        err,
        'Unable to place your order. Please check your details and try again.'
      )
      setError(msg)
      setTimeout(() => setError(''), 5000)
    } finally {
      setPlacingOrder(false)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)

  // Order Confirmation Screen
  if (orderSuccess) {
    const isGuestOrder = !user && Boolean(!orderSuccess.buyer_id)
    const trackingUrl =
      isGuestOrder && orderSuccess.tracking_token
        ? `/track-order/${orderSuccess.tracking_token}`
        : '/my-orders'
    const confirmEmail = orderSuccess.guest_email || user?.email

    return (
      <div className="max-w-xl mx-auto px-4 py-14 sm:py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary-orange to-amber-500" />

          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle className="w-11 h-11" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3.5 py-1 rounded-full">
            Order Confirmed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Thank You for Your Order!
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Your order <strong className="text-slate-900">#{orderSuccess.id}</strong> has been
            placed successfully.
          </p>

          {confirmEmail && (
            <div className="mt-5 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 text-left flex items-start gap-3">
              <Mail className="w-4.5 h-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Confirmation Email Sent</p>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  We have sent your complete order summary and real-time tracking link to{' '}
                  <strong className="underline">{confirmEmail}</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-5 my-6 text-left text-sm space-y-3 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Order Reference</span>
              <span className="font-black text-slate-900">#{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Total Payable</span>
              <span className="font-black text-primary-orange text-base tabular-nums">
                Rs. {Number(orderSuccess.total_amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Payment Method</span>
              <span className="font-extrabold text-slate-900">Cash On Delivery (COD)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="text-amber-800 bg-amber-100/80 border border-amber-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[11px]">
                Pending Dispatch
              </span>
            </div>
            {orderSuccess.guest_name && (
              <div className="pt-2.5 border-t border-slate-200/70 text-xs text-slate-500">
                <span>Deliver To: </span>
                <strong className="text-slate-900">{orderSuccess.guest_name}</strong> (
                {orderSuccess.guest_city})
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isGuestOrder ? (
              <Link
                to={trackingUrl}
                className="flex-1 bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold py-3.5 rounded-xl transition text-sm text-center shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Track Your Order Now</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/my-orders"
                className="flex-1 bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold py-3.5 rounded-xl transition text-sm text-center shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
              >
                <span>View in My Orders</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3.5 rounded-xl transition text-sm text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <span className="text-sm font-bold">Preparing secure checkout...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-10">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-slate-500 text-sm mb-6">
            Add products to your cart before proceeding to checkout.
          </p>
          <Link
            to="/"
            className="bg-primary-orange hover:bg-primary-orange-hover text-white font-extrabold px-7 py-3 rounded-xl shadow-md inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar & 3-Step Visual Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/cart"
            className="inline-flex items-center text-xs font-extrabold text-slate-500 hover:text-primary-orange mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Cart
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Secure Checkout
            </h1>
            {!user && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-full">
                Guest Checkout
              </span>
            )}
          </div>
        </div>

        {/* Visual Step Pill */}
        <div className="hidden md:flex items-center gap-2.5 bg-white border border-slate-200/80 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-2xs">
          <span className="text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Cart
          </span>
          <span className="text-slate-300">──</span>
          <span className="text-primary-orange flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary-orange text-white flex items-center justify-center text-[10px] shadow-xs">
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

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-600 text-sm font-bold shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address / Guest Info & Payment (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* OPTION A: REGISTERED USER (Saved Address Cards) */}
          {user ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-primary-orange flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Select or add your delivery destination
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-orange-50 hover:bg-orange-100 text-primary-orange border border-orange-200/70 text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-900 font-extrabold text-sm">No saved delivery address</p>
                  <p className="text-slate-500 text-xs mt-1 mb-4">
                    Please add your shipping address to place your order.
                  </p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    + Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id
                    return (
                      <label
                        key={addr.id}
                        className={`border-2 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-primary-orange bg-orange-50/30 shadow-sm ring-2 ring-orange-500/15'
                            : 'border-slate-200/80 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              {addr.full_name}
                            </span>
                            <input
                              type="radio"
                              name="selected_address"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="accent-primary-orange w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <p className="text-slate-500 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary-orange" />
                            <span>{addr.phone}</span>
                          </p>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {addr.address_line}
                          </p>
                          <p className="text-slate-500 text-xs font-bold mt-1.5">
                            {addr.city}, {addr.postal_code} • {addr.country || 'Pakistan'}
                          </p>
                        </div>

                        {addr.is_default && (
                          <div className="mt-3 pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] font-extrabold text-primary-orange uppercase tracking-wider">
                              ★ Default Address
                            </span>
                          </div>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* OPTION B: GUEST CHECKOUT FORM */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-primary-orange flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      Guest Delivery Information
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      No account required • Order confirmation and live tracking will be emailed to
                      you
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="text-xs font-extrabold text-primary-orange hover:underline hidden sm:inline"
                >
                  Already have an account? Sign In →
                </Link>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={guestForm.guest_name}
                        onChange={(e) => setGuestForm({ ...guestForm, guest_name: e.target.value })}
                        placeholder="e.g. Muhammad Ali"
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={guestForm.guest_email}
                        onChange={(e) =>
                          setGuestForm({ ...guestForm, guest_email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      Order receipt & tracking link will be sent here
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={guestForm.guest_phone}
                      onChange={(e) => setGuestForm({ ...guestForm, guest_phone: e.target.value })}
                      placeholder="e.g. 0300 1234567"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Courier rider will call this number prior to doorstep delivery
                  </p>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Complete Street Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <textarea
                      rows={2}
                      required
                      value={guestForm.guest_address}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, guest_address: e.target.value })
                      }
                      placeholder="House / Apartment #, Street #, Sector / Area, Landmark"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestForm.guest_city}
                      onChange={(e) => setGuestForm({ ...guestForm, guest_city: e.target.value })}
                      placeholder="e.g. Lahore, Karachi, Islamabad"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Postal Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={guestForm.guest_postal_code}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, guest_postal_code: e.target.value })
                      }
                      placeholder="e.g. 54000"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-primary-orange flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Payment Method</h2>
                <p className="text-xs text-slate-400 font-medium">
                  Pay safely in cash when your order arrives at your doorstep
                </p>
              </div>
            </div>

            <div className="border-2 border-primary-orange bg-orange-50/25 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-orange to-orange-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md shadow-orange-500/20 flex-shrink-0">
                  COD
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Cash On Delivery (COD)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pay cash directly to the courier rider upon delivery
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full flex-shrink-0">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Button (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Order Items ({items.length})</h2>
              <Sparkles className="w-4 h-4 text-primary-orange" />
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 border-b border-slate-100 pb-4 mb-4">
              {items.map((it) => (
                <div
                  key={it.id || `${it.product_id}-${it.size || 'nosize'}`}
                  className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-extrabold text-slate-900 block truncate">
                      {it.product?.name || it.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 font-bold">Qty: {it.quantity}</span>
                      {it.size && (
                        <span className="inline-block bg-orange-50 text-primary-orange font-extrabold text-[10px] px-1.5 py-0.5 rounded border border-orange-200/70">
                          Size: {it.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-slate-900 whitespace-nowrap tabular-nums">
                    Rs. {(Number(it.unit_price) * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-sm text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span className="font-medium">Delivery Charge</span>
                <span className="font-extrabold uppercase text-xs bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Free COD
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-4 border-b border-slate-100 mb-6">
              <span className="font-extrabold text-slate-900 text-base">Total Payable</span>
              <span className="font-black text-primary-orange text-2xl tabular-nums">
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full bg-gradient-to-r from-primary-orange to-orange-600 hover:from-primary-orange-hover hover:to-orange-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm sm:text-base active:scale-[0.99]"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Place Order (Cash On Delivery)</span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Secure Checkout Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>Fast nationwide delivery across Pakistan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Address (For Registered Users) */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-charcoal/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary-orange flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add Delivery Address</h3>
                  <p className="text-xs text-slate-400 font-medium">Save address to your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.full_name}
                  onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                  placeholder="e.g. Subhan Ul Haq"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="e.g. 0300 1234567"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Street Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  placeholder="House #, Street #, Sector / Area"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="Lahore"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    placeholder="54000"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 font-bold pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  className="accent-primary-orange rounded w-4 h-4 cursor-pointer"
                />
                <span>Set as default delivery address</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
