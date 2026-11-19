import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  Truck,
  Loader2,
  AlertCircle,
  DollarSign,
  Layers,
  Edit3,
  X,
  ShieldCheck,
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'products', 'users'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Data states
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [usersList, setUsersList] = useState([])
  const [orderStatusFilter, setOrderStatusFilter] = useState('')

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
  })
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Edit Product / Stock Modal
  const [editProduct, setEditProduct] = useState({
    open: false,
    id: null,
    name: '',
    price: '',
    stock: '',
  })

  // Upload Image Modal
  const [uploadModal, setUploadModal] = useState({ open: false, productId: null, productName: '' })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // Auth Guard
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchDashboardData()
  }, [user, isAdmin])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [ordRes, prodRes, catRes, usrRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/products/?limit=100'),
        api.get('/categories/'),
        api.get('/admin/users'),
      ])
      setOrders(ordRes.data)
      setProducts(prodRes.data)
      setCategories(catRes.data)
      setUsersList(usrRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const notifySuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 2500)
  }

  const notifyError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 3000)
  }

  // --- Order Status Transitions ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      notifySuccess(`Order #${orderId} moved to ${newStatus}`)
      const res = await api.get('/admin/orders')
      setOrders(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to update order status')
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderId}? Stock will be restored to inventory.`)) return
    try {
      await api.patch(`/admin/orders/${orderId}/cancel`)
      notifySuccess(`Order #${orderId} cancelled and stock restored!`)
      const res = await api.get('/admin/orders')
      setOrders(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to cancel order')
    }
  }

  // --- Product Management ---
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.post('/products/', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: parseInt(newProduct.category_id),
      })
      notifySuccess('Product added successfully!')
      setShowAddProduct(false)
      setNewProduct({ name: '', description: '', price: '', stock: '', category_id: '' })
      const res = await api.get('/products/?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to create product')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/products/${productId}`)
      notifySuccess('Product deleted successfully')
      const res = await api.get('/products/?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to delete product')
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/products/${editProduct.id}`, {
        stock: parseInt(editProduct.stock),
        price: parseFloat(editProduct.price),
      })
      notifySuccess('Product stock & price updated successfully!')
      setEditProduct({ open: false, id: null, name: '', price: '', stock: '' })
      const res = await api.get('/products/?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to update product stock')
    }
  }

  // --- Category Management ---
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await api.post('/categories/', { name: newCategoryName, description: 'Store Category' })
      notifySuccess('Category created successfully!')
      setShowAddCategory(false)
      setNewCategoryName('')
      const res = await api.get('/categories/')
      setCategories(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to create category')
    }
  }

  // --- Cloudinary Image Upload ---
  const handleImageUpload = async (e) => {
    e.preventDefault()
    if (!selectedFiles.length) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append('files', file)
      }
      await api.post(`/products/${uploadModal.productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      notifySuccess('Images uploaded successfully to Cloudinary!')
      setUploadModal({ open: false, productId: null, productName: '' })
      setSelectedFiles([])
      const res = await api.get('/products/?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to upload images')
    } finally {
      setUploadingImage(false)
    }
  }

  // --- User Status Toggle ---
  const handleToggleUserStatus = async (targetUser) => {
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        is_active: !targetUser.is_active,
      })
      notifySuccess(`User status updated!`)
      const res = await api.get('/admin/users')
      setUsersList(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to update user status')
    }
  }

  const filteredOrders = orderStatusFilter
    ? orders.filter((o) => o.status === orderStatusFilter)
    : orders

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <span className="text-sm font-semibold">Loading Store Control Center...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Executive Admin Header Banner */}
      <div className="bg-charcoal text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-orange/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-orange" />
            <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider">
              Single-Vendor Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Manage store inventory, fulfill customer orders, and oversee user accounts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-primary-orange" />
            <span>+ New Category</span>
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-600 text-sm font-semibold shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-extrabold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm font-semibold shadow-2xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="text-2xl font-black text-charcoal mt-1">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <span className="inline-block mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              Delivered & Paid
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
              Total Orders
            </span>
            <div className="text-2xl font-black text-charcoal mt-1">{orders.length}</div>
            <span className="inline-block mt-2 text-[11px] text-primary-orange bg-orange-50 px-2.5 py-0.5 rounded-full font-bold">
              {orders.filter((o) => o.status === 'pending').length} Pending Action
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-primary-orange flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
              Active Products
            </span>
            <div className="text-2xl font-black text-charcoal mt-1">{products.length}</div>
            <span className="inline-block mt-2 text-[11px] text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full font-bold">
              {categories.length} Categories
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gray-100 text-charcoal flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
              Registered Users
            </span>
            <div className="text-2xl font-black text-charcoal mt-1">{usersList.length}</div>
            <span className="inline-block mt-2 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
              {usersList.filter((u) => u.role === 'buyer').length} Active Buyers
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Modern Pill Tabs */}
      <div className="inline-flex bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs mb-6 gap-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-charcoal text-white shadow-sm'
              : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
          }`}
        >
          <Truck className="w-4 h-4 text-primary-orange" />
          <span>Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-charcoal text-white shadow-sm'
              : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
          }`}
        >
          <Package className="w-4 h-4 text-primary-orange" />
          <span>Products ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-charcoal text-white shadow-sm'
              : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 text-primary-orange" />
          <span>Users ({usersList.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Order Filter Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-charcoal">Customer Orders</h3>
              <p className="text-xs text-gray-400">Advance order workflow or restore stock via cancellation</p>
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="text-xs font-bold border border-gray-200 rounded-xl px-3.5 py-2 bg-gray-50 text-charcoal focus:outline-none focus:border-primary-orange cursor-pointer"
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Items</th>
                  <th className="py-3.5 px-5">Total</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5 font-extrabold text-charcoal text-sm">#{ord.id}</td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-charcoal block">
                        {ord.user?.name || 'Customer'}
                      </span>
                      <span className="text-gray-400 text-[11px]">{ord.user?.email}</span>
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="text-gray-600 text-xs font-medium">
                          {it.product?.name} <span className="font-bold text-charcoal">× {it.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-5 font-black text-primary-orange text-sm">
                      Rs. {Number(ord.total_amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : ord.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                              : ord.status === 'cancelled'
                                ? 'bg-red-50 text-red-700 border border-red-200/70'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      {ord.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                        >
                          Move to Process
                        </button>
                      )}
                      {ord.status === 'processing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                        >
                          Ship Order
                        </button>
                      )}
                      {ord.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {['pending', 'processing'].includes(ord.status) && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-charcoal">Product Catalog</h3>
              <p className="text-xs text-gray-400">Manage stock quantities, pricing, and Cloudinary media</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">Image</th>
                  <th className="py-3.5 px-5">Product Name</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Stock</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
                  const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="w-13 h-13 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200/60">
                          {imgUrl ? (
                            <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-extrabold text-charcoal text-sm block">{p.name}</span>
                        <span className="text-gray-400 text-[11px] font-medium">
                          {p.images?.length || 0} uploaded {p.images?.length === 1 ? 'image' : 'images'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold">
                          {categories.find((c) => c.id === p.category_id)?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-extrabold text-charcoal text-sm">
                        Rs. {Number(p.price).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-full text-[11px] ${
                            p.stock > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() =>
                            setEditProduct({
                              open: true,
                              id: p.id,
                              name: p.name,
                              price: p.price,
                              stock: p.stock,
                            })
                          }
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="Update stock & price"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Stock</span>
                        </button>
                        <button
                          onClick={() => setUploadModal({ open: true, productId: p.id, productName: p.name })}
                          className="bg-orange-50 hover:bg-orange-100 text-primary-orange border border-orange-200/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="Upload image to Cloudinary"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Pic</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer inline-flex items-center"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-charcoal">Registered Accounts</h3>
            <p className="text-xs text-gray-400">Manage customer and administrator access permissions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-charcoal text-primary-orange font-extrabold text-xs flex items-center justify-center uppercase flex-shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-extrabold text-charcoal text-sm block">{u.name}</span>
                          <span className="text-gray-400 text-[11px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/70'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 font-medium">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : 'bg-red-50 text-red-600 border border-red-200/70'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                            u.is_active
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PRODUCT */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Add New Product</h3>
                <p className="text-xs text-gray-400">Add a new item to your store catalog</p>
              </div>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
                <select
                  required
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="2500"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product specifications and key highlights..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CATEGORY */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-charcoal">Add New Category</h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Category Title
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Smart Watches"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLOUDINARY IMAGE UPLOAD */}
      {uploadModal.open && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Upload Product Images</h3>
                <p className="text-xs text-gray-500 font-medium">{uploadModal.productName}</p>
              </div>
              <button
                onClick={() => {
                  setUploadModal({ open: false, productId: null, productName: '' })
                  setSelectedFiles([])
                }}
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImageUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-6 text-center">
                <Upload className="w-9 h-9 text-primary-orange mx-auto mb-2.5" />
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-2.5 font-medium">
                  JPG, PNG, or WEBP (Hosted permanently on Cloudinary CDN)
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModal({ open: false, productId: null, productName: '' })
                    setSelectedFiles([])
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || !selectedFiles.length}
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT STOCK & PRICE */}
      {editProduct.open && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Update Stock & Price</h3>
                <p className="text-xs text-gray-500 font-medium">{editProduct.name}</p>
              </div>
              <button
                onClick={() =>
                  setEditProduct({ open: false, id: null, name: '', price: '', stock: '' })
                }
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Stock Units Available
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Unit Price (PKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditProduct({ open: false, id: null, name: '', price: '', stock: '' })
                  }
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
