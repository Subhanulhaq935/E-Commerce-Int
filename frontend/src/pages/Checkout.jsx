import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'
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
} from 'lucide-react'

export default function Checkout() {
  const { cart, clearCartState } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)

  // New Address form modal state
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    title: 'Home',
    street_address: '',
    city: '',
    postal_code: '',
    country: 'Pakistan',
    is_default: true,
  })
  const [savingAddress, setSavingAddress] = useState(false)

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses/')
      setAddresses(res.data)
      const defaultAddr = res.data.find((a) => a.is_default) || res.data[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchAddresses()
  }, [user])

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setError('')
    try {
      const res = await api.post('/addresses/', newAddress)
      await fetchAddresses()
      setSelectedAddressId(res.data.id)
      setShowAddAddress(false)
      setNewAddress({
        title: 'Home',
        street_address: '',
        city: '',
        postal_code: '',
        country: 'Pakistan',
        is_default: true,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address.')
      return
    }

    setPlacingOrder(true)
    setError('')
    try {
      const res = await api.post('/orders/', {
        shipping_address_id: selectedAddressId,
        payment_method: 'cod',
      })
      clearCartState()
      setOrderSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-charcoal">Order Placed Successfully!</h2>
          <p className="text-gray-500 text-sm mt-2">
            Thank you for shopping with us! Your order #<strong>{orderSuccess.id}</strong> has been received.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 my-6 text-left text-sm space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-bold text-charcoal">#{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-bold text-primary-orange">Rs. {Number(orderSuccess.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className="font-semibold text-charcoal">Cash On Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery Status:</span>
              <span className="text-amber-600 font-semibold uppercase text-xs">Pending Dispatch</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              to="/my-orders"
              className="flex-1 bg-charcoal hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition text-sm text-center"
            >
              Track Order
            </Link>
            <Link
              to="/"
              className="flex-1 bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold py-3 rounded-xl transition text-sm text-center"
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
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
        <span>Loading checkout details...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-charcoal mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add items before proceeding to checkout.</p>
        <Link to="/" className="bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold px-6 py-2.5 rounded-xl shadow inline-block">
          Return to Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/cart" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-orange mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Cart
      </Link>

      <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Address Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-orange" />
                <span>Delivery Address</span>
              </h2>
              <button
                onClick={() => setShowAddAddress(true)}
                className="text-primary-orange text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-3">No saved addresses found.</p>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Add Your Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-primary-orange bg-orange-50/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-charcoal text-sm">{addr.title}</span>
                        <input
                          type="radio"
                          name="selected_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-primary-orange"
                        />
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{addr.street_address}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {addr.city}, {addr.postal_code || 'N/A'}
                      </p>
                    </div>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold text-primary-orange uppercase tracking-wider mt-3">
                        Default Address
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-orange" />
              <span>Payment Method</span>
            </h2>
            <div className="border-2 border-primary-orange bg-orange-50/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-primary-orange rounded-lg flex items-center justify-center font-bold text-xs">
                  COD
                </div>
                <div>
                  <h4 className="font-bold text-charcoal text-sm">Cash On Delivery</h4>
                  <p className="text-xs text-gray-500">Pay cash directly to the courier when product arrives</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary & Place Order */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-charcoal mb-4">Items Summary ({items.length})</h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border-b border-gray-100 pb-4 mb-4">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-700 line-clamp-1 max-w-[180px]">
                    {it.product?.name} <span className="text-gray-400 font-semibold">x{it.quantity}</span>
                  </span>
                  <span className="font-bold text-charcoal">
                    Rs. {(Number(it.unit_price) * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm text-gray-600 border-b border-gray-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="text-green-600 font-semibold">FREE</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-charcoal py-4">
              <span>Total Payable</span>
              <span className="text-primary-orange text-xl">Rs. {subtotal.toLocaleString()}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || addresses.length === 0}
              className="w-full bg-primary-orange hover:bg-primary-orange-hover text-white font-bold py-3.5 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Confirm Order (COD)</span>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-primary-orange" />
              <span>Safe & Verified Order Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-4">Add New Delivery Address</h3>
            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address Label</label>
                <input
                  type="text"
                  required
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                  placeholder="e.g. Home, Office"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                <textarea
                  required
                  rows={2}
                  value={newAddress.street_address}
                  onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                  placeholder="House #, Street #, Sector/Area"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="Lahore / Karachi"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    placeholder="54000"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl"
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
