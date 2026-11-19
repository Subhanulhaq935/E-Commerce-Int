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
  XCircle,
  Truck,
  Clock,
  Loader2,
  AlertCircle,
  DollarSign,
  Layers,
  ArrowRight,
  Edit3,
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
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
        <span>Loading Admin Panel...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-primary-orange uppercase tracking-wider">
            Single-Vendor Management
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">Admin Dashboard</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-white hover:bg-gray-50 text-charcoal border border-gray-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-primary-orange" />
            + Category
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Product
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold uppercase">Total Revenue</span>
          <div className="text-xl md:text-2xl font-black text-charcoal mt-1">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-green-600 font-medium">Delivered & Paid</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold uppercase">Total Orders</span>
          <div className="text-xl md:text-2xl font-black text-charcoal mt-1">{orders.length}</div>
          <span className="text-[11px] text-primary-orange font-medium">
            {orders.filter((o) => o.status === 'pending').length} Pending
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold uppercase">Active Products</span>
          <div className="text-xl md:text-2xl font-black text-charcoal mt-1">{products.length}</div>
          <span className="text-[11px] text-gray-500 font-medium">{categories.length} Categories</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold uppercase">Registered Users</span>
          <div className="text-xl md:text-2xl font-black text-charcoal mt-1">{usersList.length}</div>
          <span className="text-[11px] text-blue-600 font-medium">
            {usersList.filter((u) => u.role === 'buyer').length} Buyers
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-gray-500 hover:text-charcoal'
          }`}
        >
          <Truck className="w-4 h-4" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-gray-500 hover:text-charcoal'
          }`}
        >
          <Package className="w-4 h-4" />
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-primary-orange text-primary-orange'
              : 'border-transparent text-gray-500 hover:text-charcoal'
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({usersList.length})
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Order Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-charcoal">Customer Orders</h3>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="text-xs border rounded-xl px-3 py-1.5 bg-white text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 font-bold text-charcoal">#{ord.id}</td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-charcoal block">{ord.user?.name || 'Customer'}</span>
                      <span className="text-gray-400 text-[11px]">{ord.user?.email}</span>
                    </td>
                    <td className="py-4 px-4">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="text-gray-600 text-[11px]">
                          {it.product?.name} × {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-4 font-bold text-primary-orange">
                      Rs. {Number(ord.total_amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ord.status === 'delivered' ? 'bg-green-50 text-green-700' :
                        ord.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        ord.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-1">
                      {ord.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Process
                        </button>
                      )}
                      {ord.status === 'processing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Ship
                        </button>
                      )}
                      {ord.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}
                      {['pending', 'processing'].includes(ord.status) && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
                  const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-charcoal block">{p.name}</span>
                        <span className="text-gray-400 text-[11px]">{p.images?.length || 0} images</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[11px] font-medium">
                          {categories.find((c) => c.id === p.category_id)?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-charcoal">
                        Rs. {Number(p.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
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
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          title="Update stock & price"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Stock
                        </button>
                        <button
                          onClick={() => setUploadModal({ open: true, productId: p.id, productName: p.name })}
                          className="bg-orange-50 hover:bg-orange-100 text-primary-orange px-2.5 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          title="Upload image to Cloudinary"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Pic
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal block">{u.name}</span>
                      <span className="text-gray-400 text-[11px]">{u.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            u.is_active
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-4">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Wireless Mouse"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select
                  required
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="2500"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product specifications and details..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-4">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Footwear"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-1">Upload Product Images</h3>
            <p className="text-xs text-gray-500 mb-4">{uploadModal.productName}</p>

            <form onSubmit={handleImageUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100"
                />
                <p className="text-[11px] text-gray-400 mt-2">JPG, PNG, or WEBP (Direct to Cloudinary CDN)</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModal({ open: false, productId: null, productName: '' })
                    setSelectedFiles([])
                  }}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || !selectedFiles.length}
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-charcoal mb-1">Update Stock & Price</h3>
            <p className="text-xs text-gray-500 mb-4">{editProduct.name}</p>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Units Available</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProduct({ open: false, id: null, name: '', price: '', stock: '' })}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-semibold rounded-xl"
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
