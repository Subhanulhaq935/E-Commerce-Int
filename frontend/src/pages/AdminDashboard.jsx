import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resolveImageUrl } from '../utils/imageUrl'
import { setCachedProducts } from '../utils/catalogCache'
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
  Search,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'products', 'out_of_stock', 'users'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Data states
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [usersList, setUsersList] = useState([])
  const [orderStatusFilter, setOrderStatusFilter] = useState('')

  // Product Search & Filter
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('')

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    stock: '',
    category_id: '',
    has_sizes: false,
    sizes: [
      { size: 'S', stock: '', price: '', sale_price: '', is_available: true },
      { size: 'M', stock: '', price: '', sale_price: '', is_available: true },
      { size: 'L', stock: '', price: '', sale_price: '', is_available: true },
    ],
  })
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Edit Product / Stock Modal
  const [editProduct, setEditProduct] = useState({
    open: false,
    id: null,
    name: '',
    price: '',
    sale_price: '',
    stock: '',
    has_sizes: false,
    sizes: [
      { size: 'S', stock: '', price: '', sale_price: '', is_available: false },
      { size: 'M', stock: '', price: '', sale_price: '', is_available: false },
      { size: 'L', stock: '', price: '', sale_price: '', is_available: false },
    ],
  })

  // Upload & Manage Images Modal
  const [uploadModal, setUploadModal] = useState({ open: false, productId: null, productName: '' })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)

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
        api.get('/admin/products?limit=100'),
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
  const handleToggleProductActive = async (targetProduct) => {
    try {
      const newStatus = !targetProduct.is_active
      await api.put(`/products/${targetProduct.id}`, { is_active: newStatus })
      setCachedProducts(null)
      notifySuccess(`Product "${targetProduct.name}" is now ${newStatus ? 'Active (Visible in store)' : 'Inactive (Hidden from buyers)'}!`)
      const res = await api.get('/admin/products?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to update product status')
    }
  }

  const openEditProductModal = (p) => {
    const sSize = p.sizes?.find((s) => s.size === 'S')
    const mSize = p.sizes?.find((s) => s.size === 'M')
    const lSize = p.sizes?.find((s) => s.size === 'L')

    setEditProduct({
      open: true,
      id: p.id,
      name: p.name,
      price: p.price,
      sale_price: p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : '',
      stock: p.stock,
      has_sizes: Boolean(p.has_sizes),
      sizes: [
        {
          size: 'S',
          stock: sSize ? sSize.stock : 0,
          price: sSize?.price !== null && sSize?.price !== undefined ? sSize.price : '',
          sale_price: sSize?.sale_price !== null && sSize?.sale_price !== undefined ? sSize.sale_price : '',
          is_available: Boolean(sSize ? sSize.is_available : false),
        },
        {
          size: 'M',
          stock: mSize ? mSize.stock : 0,
          price: mSize?.price !== null && mSize?.price !== undefined ? mSize.price : '',
          sale_price: mSize?.sale_price !== null && mSize?.sale_price !== undefined ? mSize.sale_price : '',
          is_available: Boolean(mSize ? mSize.is_available : false),
        },
        {
          size: 'L',
          stock: lSize ? lSize.stock : 0,
          price: lSize?.price !== null && lSize?.price !== undefined ? lSize.price : '',
          sale_price: lSize?.sale_price !== null && lSize?.sale_price !== undefined ? lSize.sale_price : '',
          is_available: Boolean(lSize ? lSize.is_available : false),
        },
      ],
    })
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      const priceNum = parseFloat(newProduct.price)
      const salePriceNum = newProduct.sale_price ? parseFloat(newProduct.sale_price) : null

      if (salePriceNum !== null && (isNaN(salePriceNum) || salePriceNum <= 0)) {
        notifyError('Sale price must be a valid positive number.')
        return
      }

      if (salePriceNum !== null && salePriceNum >= priceNum) {
        notifyError('Sale price must be strictly lower than normal price.')
        return
      }

      const payload = {
        name: newProduct.name.trim(),
        description: newProduct.description,
        price: priceNum,
        sale_price: salePriceNum,
        category_id: parseInt(newProduct.category_id),
        has_sizes: Boolean(newProduct.has_sizes),
      }

      if (newProduct.has_sizes) {
        const sizesPayload = newProduct.sizes
          .filter((s) => s.is_available)
          .map((s) => ({
            size: s.size,
            stock: parseInt(s.stock) || 0,
            price: s.price ? parseFloat(s.price) : null,
            sale_price: s.sale_price ? parseFloat(s.sale_price) : null,
            is_available: true,
          }))

        if (sizesPayload.length === 0) {
          notifyError('Please enable at least one size variant (Small, Medium, or Large).')
          return
        }

        for (const s of sizesPayload) {
          if (s.price !== null && s.sale_price !== null && s.sale_price >= s.price) {
            notifyError(`Size '${s.size}' sale price must be less than its normal price.`)
            return
          }
        }

        payload.sizes = sizesPayload
        payload.stock = sizesPayload.reduce((sum, s) => sum + s.stock, 0)
      } else {
        payload.stock = parseInt(newProduct.stock) || 0
      }

      await api.post('/products/', payload)
      setCachedProducts(null)
      notifySuccess('Product added successfully!')
      setShowAddProduct(false)
      setNewProduct({
        name: '',
        description: '',
        price: '',
        sale_price: '',
        stock: '',
        category_id: '',
        has_sizes: false,
        sizes: [
          { size: 'S', stock: '', price: '', sale_price: '', is_available: true },
          { size: 'M', stock: '', price: '', sale_price: '', is_available: true },
          { size: 'L', stock: '', price: '', sale_price: '', is_available: true },
        ],
      })
      const res = await api.get('/admin/products?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to create product')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/products/${productId}`)
      setCachedProducts(null)
      notifySuccess('Product deleted successfully')
      const res = await api.get('/admin/products?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to delete product')
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      const priceNum = parseFloat(editProduct.price)
      const salePriceNum = editProduct.sale_price ? parseFloat(editProduct.sale_price) : null

      if (salePriceNum !== null && (isNaN(salePriceNum) || salePriceNum <= 0)) {
        notifyError('Sale price must be a valid positive number.')
        return
      }

      if (salePriceNum !== null && salePriceNum >= priceNum) {
        notifyError('Sale price must be strictly lower than normal price.')
        return
      }

      const payload = {
        price: priceNum,
        sale_price: salePriceNum,
        has_sizes: Boolean(editProduct.has_sizes),
      }

      if (editProduct.has_sizes) {
        const sizesPayload = editProduct.sizes
          .filter((s) => s.is_available)
          .map((s) => ({
            size: s.size,
            stock: parseInt(s.stock) || 0,
            price: s.price ? parseFloat(s.price) : null,
            sale_price: s.sale_price ? parseFloat(s.sale_price) : null,
            is_available: true,
          }))

        if (sizesPayload.length === 0) {
          notifyError('Please enable at least one size variant (Small, Medium, or Large).')
          return
        }

        for (const s of sizesPayload) {
          if (s.price !== null && s.sale_price !== null && s.sale_price >= s.price) {
            notifyError(`Size '${s.size}' sale price must be less than its normal price.`)
            return
          }
        }

        payload.sizes = sizesPayload
        payload.stock = sizesPayload.reduce((sum, s) => sum + s.stock, 0)
      } else {
        payload.stock = parseInt(editProduct.stock) || 0
      }

      await api.put(`/products/${editProduct.id}`, payload)
      setCachedProducts(null)
      notifySuccess('Product stock & price updated successfully!')
      setEditProduct({
        open: false,
        id: null,
        name: '',
        price: '',
        sale_price: '',
        stock: '',
        has_sizes: false,
        sizes: [
          { size: 'S', stock: '', price: '', sale_price: '', is_available: false },
          { size: 'M', stock: '', price: '', sale_price: '', is_available: false },
          { size: 'L', stock: '', price: '', sale_price: '', is_available: false },
        ],
      })
      const res = await api.get('/admin/products?limit=100')
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

  // --- Delete Product Picture ---
  const handleDeleteProductImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this picture?')) return
    setDeletingImageId(imageId)
    try {
      await api.delete(`/product-images/${imageId}`)
      setCachedProducts(null)
      notifySuccess('Picture deleted successfully!')
      const res = await api.get('/admin/products?limit=100')
      setProducts(res.data)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Failed to delete picture')
    } finally {
      setDeletingImageId(null)
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
      setCachedProducts(null)
      notifySuccess('Images uploaded successfully!')
      setSelectedFiles([])
      const res = await api.get('/admin/products?limit=100')
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

  // --- Computed / Filtered Lists ---
  const filteredOrders = orderStatusFilter
    ? orders.filter((o) => o.status === orderStatusFilter)
    : orders

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  // Out of Stock Products (Stock === 0) - Auto detected
  const outOfStockProducts = products.filter((p) => Number(p.stock) === 0)

  // Products Filtered by Search & Category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = productCategoryFilter
      ? String(p.category_id) === String(productCategoryFilter)
      : true
    return matchesSearch && matchesCategory
  })

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              {orders.filter((o) => o.status === 'pending').length} Pending
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

        {/* Out of Stock Alert Card */}
        <div
          onClick={() => setActiveTab('out_of_stock')}
          className={`p-5 rounded-2xl border shadow-xs flex items-start justify-between cursor-pointer transition-all hover:scale-[1.02] ${
            outOfStockProducts.length > 0
              ? 'bg-red-50/70 border-red-200/80 hover:border-red-300 ring-2 ring-red-500/10'
              : 'bg-white border-gray-200/80'
          }`}
        >
          <div>
            <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
              Zero Stock Alert
            </span>
            <div className={`text-2xl font-black mt-1 ${outOfStockProducts.length > 0 ? 'text-red-600' : 'text-charcoal'}`}>
              {outOfStockProducts.length}
            </div>
            <span
              className={`inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                outOfStockProducts.length > 0
                  ? 'text-red-700 bg-red-100/90'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {outOfStockProducts.length > 0 ? 'Requires Restock' : 'All In Stock'}
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              outOfStockProducts.length > 0
                ? 'bg-red-100 text-red-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
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
      <div className="inline-flex bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs mb-6 gap-1 flex-wrap">
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

        {/* Dedicated Out of Stock Tab */}
        <button
          onClick={() => setActiveTab('out_of_stock')}
          className={`py-2.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'out_of_stock'
              ? 'bg-red-600 text-white shadow-sm'
              : outOfStockProducts.length > 0
              ? 'text-red-600 bg-red-50 hover:bg-red-100/70 border border-red-200/60'
              : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${activeTab === 'out_of_stock' ? 'text-white' : 'text-red-500'}`} />
          <span>Out of Stock</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'out_of_stock'
                ? 'bg-white text-red-600'
                : outOfStockProducts.length > 0
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {outOfStockProducts.length}
          </span>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-charcoal block">
                          {ord.guest_name || ord.buyer?.name || ord.user?.name || 'Customer'}
                        </span>
                        {Boolean(ord.guest_name || ord.tracking_token) && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                            Guest
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[11px] block">
                        {ord.guest_email || ord.buyer?.email || ord.user?.email || 'No email provided'}
                      </span>
                      {(ord.guest_city || ord.shipping_address?.city) && (
                        <span className="text-[10px] text-gray-500 font-medium block">
                          📍 {ord.guest_city || ord.shipping_address?.city}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 space-y-1">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="text-gray-600 text-xs font-medium">
                          {it.product?.name || `Product #${it.product_id}`}{' '}
                          {it.size && (
                            <span className="bg-orange-50 text-primary-orange border border-orange-200 text-[10px] font-bold px-1.5 py-0.5 rounded mx-1">
                              Size: {it.size}
                            </span>
                          )}
                          × <strong className="text-charcoal">{it.quantity}</strong>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-5 font-extrabold text-charcoal text-sm">
                      Rs. {Number(ord.total_amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : ord.status === 'cancelled'
                            ? 'bg-red-50 text-red-600 border border-red-200/70'
                            : ord.status === 'shipped'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/70'
                            : ord.status === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/70'
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

      {/* TAB 2: PRODUCTS (WITH SEARCH & CATEGORY FILTER) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Header & Search Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-charcoal">Product Catalog</h3>
              <p className="text-xs text-gray-400">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/70 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 transition"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold border border-gray-200 rounded-xl px-3.5 py-2 bg-gray-50/70 text-charcoal focus:outline-none focus:border-primary-orange cursor-pointer"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {(productSearch || productCategoryFilter) && (
                <button
                  onClick={() => {
                    setProductSearch('')
                    setProductCategoryFilter('')
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-primary-orange flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Zero Stock Quick Banner inside Products tab */}
          {outOfStockProducts.length > 0 && !productSearch && !productCategoryFilter && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>
                  <strong>{outOfStockProducts.length} product(s)</strong> have reached zero stock!
                </span>
              </div>
              <button
                onClick={() => setActiveTab('out_of_stock')}
                className="font-extrabold underline text-red-800 hover:text-red-900 cursor-pointer"
              >
                View Out of Stock →
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-charcoal font-bold text-sm">No products found</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">
                  No products matched your search "{productSearch}".
                </p>
                <button
                  onClick={() => {
                    setProductSearch('')
                    setProductCategoryFilter('')
                  }}
                  className="bg-primary-orange text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-5">Image</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Price</th>
                    <th className="py-3.5 px-5">Stock</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
                    const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          !p.is_active ? 'bg-gray-50/40 opacity-80 hover:opacity-100' : ''
                        }`}
                      >
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
                        <td className="py-3.5 px-5">
                          {p.sale_price ? (
                            <div>
                              <span className="font-extrabold text-charcoal text-sm block">
                                Rs. {Number(p.sale_price).toLocaleString()}
                              </span>
                              <span className="text-gray-400 text-xs line-through block">
                                Rs. {Number(p.price).toLocaleString()}
                              </span>
                              <span className="inline-block bg-orange-100 text-primary-orange text-[10px] font-black px-1.5 py-0.2 rounded mt-0.5">
                                Sale
                              </span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-charcoal text-sm">
                              Rs. {Number(p.price).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-full text-[11px] ${
                                p.stock > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-600 border border-red-200/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              {p.stock} units
                            </span>
                            {p.has_sizes && p.sizes && p.sizes.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {p.sizes.map((sz) => (
                                  <span
                                    key={sz.size}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      sz.stock > 0
                                        ? 'bg-gray-50 border-gray-200 text-charcoal'
                                        : 'bg-red-50 border-red-200 text-red-500'
                                    }`}
                                  >
                                    {sz.size}: {sz.stock}
                                    {sz.price && (
                                      <span className="text-primary-orange ml-1 font-extrabold">
                                        (Rs. {Number(sz.sale_price || sz.price).toLocaleString()})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          {p.is_active ? (
                            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active (Live)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 border border-gray-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive (Hidden)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                          {/* Toggle Active/Inactive Button */}
                          <button
                            onClick={() => handleToggleProductActive(p)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer border ${
                              p.is_active
                                ? 'bg-gray-100 hover:bg-amber-50 hover:text-amber-800 text-gray-700 border-gray-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={
                              p.is_active
                                ? 'Deactivate (Hide from buyer store)'
                                : 'Activate (Show in buyer store)'
                            }
                          >
                            {p.is_active ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Update stock & price"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Stock</span>
                          </button>
                          <button
                            onClick={() =>
                              setUploadModal({
                                open: true,
                                productId: p.id,
                                productName: p.name,
                              })
                            }
                            className="bg-orange-50 hover:bg-orange-100 text-primary-orange border border-orange-200/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Manage product photos (View, Delete & Upload)"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Photos ({p.images?.length || 0})</span>
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
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEDICATED ZERO STOCK SECTION (AUTO-ADDS WHEN STOCK === 0) */}
      {activeTab === 'out_of_stock' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/30">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-extrabold text-base text-charcoal">
                  Zero-Stock Inventory Alert
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Products whose stock hits 0 are automatically listed here for urgent restocking.
              </p>
            </div>
            <span className="text-xs font-extrabold text-red-600 bg-red-100/80 px-3 py-1 rounded-full self-start sm:self-auto">
              {outOfStockProducts.length} Items Out of Stock
            </span>
          </div>

          <div className="overflow-x-auto">
            {outOfStockProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h4 className="text-lg font-extrabold text-charcoal">All Inventory Healthy!</h4>
                <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                  Every product currently has available stock. When any item sells out to 0, it will appear here automatically.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50/40 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-5">Image</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Current Price</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outOfStockProducts.map((p) => {
                    const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
                    const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null

                    return (
                      <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
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
                            Product ID #{p.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold">
                            {categories.find((c) => c.id === p.category_id)?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-charcoal text-sm">
                          {p.sale_price ? (
                            <div>
                              <span className="block">Rs. {Number(p.sale_price).toLocaleString()}</span>
                              <span className="text-gray-400 text-xs line-through block">
                                Rs. {Number(p.price).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span>Rs. {Number(p.price).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 font-extrabold px-3 py-1 rounded-full text-[11px] bg-red-100 text-red-700 border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            0 units (Out of Stock)
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>⚡ Restock Now</span>
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
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

            <form onSubmit={handleCreateProduct} className="space-y-4 overflow-y-auto pr-1 flex-1">
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

              {/* Pricing Section: Normal Price & Sale Price */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/70">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Normal Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Original product price</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Sale Price (PKR) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newProduct.sale_price}
                    onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                    placeholder="e.g. 4000"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                  {newProduct.price && newProduct.sale_price && Number(newProduct.sale_price) < Number(newProduct.price) ? (
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                      Save {Math.round(((Number(newProduct.price) - Number(newProduct.sale_price)) / Number(newProduct.price)) * 100)}% off
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 mt-1 block">Discounted selling price</span>
                  )}
                </div>
              </div>

              {/* Size Variants Toggle Section */}
              <div className="bg-orange-50/40 p-3.5 rounded-2xl border border-orange-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-extrabold text-charcoal flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProduct.has_sizes}
                        onChange={(e) => setNewProduct({ ...newProduct, has_sizes: e.target.checked })}
                        className="rounded text-primary-orange focus:ring-primary-orange w-4 h-4 cursor-pointer"
                      />
                      <span>Enable Size Variants (Small, Medium, Large)</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Check for clothing (T-shirts, hoodies). Uncheck for electronics, watches, etc.
                    </p>
                  </div>
                </div>

                {newProduct.has_sizes ? (
                  <div className="space-y-3 pt-2 border-t border-orange-200/60">
                    <div>
                      <span className="text-[11px] font-extrabold text-charcoal block">
                        Available Sizes, Stock & Individual Prices:
                      </span>
                      <p className="text-[10px] text-gray-500">
                        Leave Size Price blank to use Base Price (Rs. {newProduct.price || '0'}).
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {['S', 'M', 'L'].map((szCode) => {
                        const sizeLabel = szCode === 'S' ? 'Small (S)' : szCode === 'M' ? 'Medium (M)' : 'Large (L)'
                        const szObj = newProduct.sizes.find((s) => s.size === szCode) || {
                          stock: '',
                          price: '',
                          sale_price: '',
                          is_available: true,
                        }

                        return (
                          <div
                            key={szCode}
                            className={`p-3 rounded-2xl border transition ${
                              szObj.is_available
                                ? 'bg-white border-primary-orange/40 shadow-2xs'
                                : 'bg-gray-100/60 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-charcoal cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={szObj.is_available}
                                  onChange={(e) => {
                                    const updatedSizes = newProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, is_available: e.target.checked } : s
                                    )
                                    setNewProduct({ ...newProduct, sizes: updatedSizes })
                                  }}
                                  className="rounded text-primary-orange focus:ring-primary-orange w-4 h-4 cursor-pointer"
                                />
                                <span className="font-extrabold text-sm">{sizeLabel}</span>
                              </label>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {szObj.is_available ? 'Available' : 'Disabled'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Stock Units <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!szObj.is_available}
                                  value={szObj.stock}
                                  onChange={(e) => {
                                    const updatedSizes = newProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, stock: e.target.value } : s
                                    )
                                    setNewProduct({ ...newProduct, sizes: updatedSizes })
                                  }}
                                  placeholder="e.g. 10"
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Normal Price
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  disabled={!szObj.is_available}
                                  value={szObj.price || ''}
                                  onChange={(e) => {
                                    const updatedSizes = newProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, price: e.target.value } : s
                                    )
                                    setNewProduct({ ...newProduct, sizes: updatedSizes })
                                  }}
                                  placeholder={newProduct.price ? `Rs. ${newProduct.price}` : 'Base price'}
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Sale Price
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  disabled={!szObj.is_available}
                                  value={szObj.sale_price || ''}
                                  onChange={(e) => {
                                    const updatedSizes = newProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, sale_price: e.target.value } : s
                                    )
                                    setNewProduct({ ...newProduct, sizes: updatedSizes })
                                  }}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-[11px] text-gray-500 text-right font-medium">
                      Total Size Stock:{' '}
                      <strong className="text-charcoal font-bold">
                        {newProduct.sizes
                          .filter((s) => s.is_available)
                          .reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0)}{' '}
                        units
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Stock Quantity (Single inventory)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required={!newProduct.has_sizes}
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="e.g. 20"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                    />
                  </div>
                )}
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

              <div className="flex justify-end gap-2.5 pt-2 flex-shrink-0">
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

      {/* MODAL 3: MANAGE & UPLOAD PRODUCT IMAGES */}
      {uploadModal.open && (() => {
        const activeProduct = products.find((p) => p.id === uploadModal.productId)
        const currentImages = activeProduct?.images || []

        return (
          <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-charcoal">Manage Product Photos</h3>
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

              {/* Scrollable Content */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-4">
                {/* Section 1: Current Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">
                      Existing Photos ({currentImages.length})
                    </span>
                    <span className="text-[11px] text-gray-400">Click trash icon to delete</span>
                  </div>

                  {currentImages.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400">
                      No photos uploaded for this product yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentImages.map((img) => {
                        const imgUrl = resolveImageUrl(img.image_url)
                        const isDeleting = deletingImageId === img.id

                        return (
                          <div
                            key={img.id}
                            className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center shadow-2xs group"
                          >
                            <img
                              src={imgUrl}
                              alt="Product"
                              className="w-full h-full object-cover"
                            />

                            {/* Primary Badge */}
                            {img.is_primary && (
                              <span className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                Primary
                              </span>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteProductImage(img.id)}
                              className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600/95 hover:bg-red-700 text-white shadow-md transition transform hover:scale-105 cursor-pointer disabled:opacity-50"
                              title="Delete this photo"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Upload New Photos */}
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-2">
                    Upload New Photos
                  </span>
                  <form onSubmit={handleImageUpload} className="space-y-3">
                    <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-5 text-center">
                      <Upload className="w-8 h-8 text-primary-orange mx-auto mb-2" />
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">
                        JPG, PNG, or WEBP (Direct Cloudinary CDN upload)
                      </p>
                      {selectedFiles.length > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-2">
                          ✓ {selectedFiles.length} new {selectedFiles.length === 1 ? 'file' : 'files'} selected
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadModal({ open: false, productId: null, productName: '' })
                          setSelectedFiles([])
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Done / Close
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingImage || !selectedFiles.length}
                        className="px-5 py-2 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Selected</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL 4: EDIT STOCK & PRICE */}
      {editProduct.open && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Update Stock & Pricing</h3>
                <p className="text-xs text-gray-500 font-medium">{editProduct.name}</p>
              </div>
              <button
                onClick={() =>
                  setEditProduct({ open: false, id: null, name: '', price: '', sale_price: '', stock: '', has_sizes: false, sizes: [] })
                }
                className="text-gray-400 hover:text-charcoal p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Pricing Section: Normal Price & Sale Price */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/70">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Normal Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Original product price</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Sale Price (PKR) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={editProduct.sale_price}
                    onChange={(e) => setEditProduct({ ...editProduct, sale_price: e.target.value })}
                    placeholder="No sale"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                  />
                  {editProduct.price && editProduct.sale_price && Number(editProduct.sale_price) < Number(editProduct.price) ? (
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                      Save {Math.round(((Number(editProduct.price) - Number(editProduct.sale_price)) / Number(editProduct.price)) * 100)}% off
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 mt-1 block">Leave blank for normal price</span>
                  )}
                </div>
              </div>

              {/* Size Variants Toggle Section */}
              <div className="bg-orange-50/40 p-3.5 rounded-2xl border border-orange-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-extrabold text-charcoal flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editProduct.has_sizes}
                        onChange={(e) => setEditProduct({ ...editProduct, has_sizes: e.target.checked })}
                        className="rounded text-primary-orange focus:ring-primary-orange w-4 h-4 cursor-pointer"
                      />
                      <span>Enable Size Variants (Small, Medium, Large)</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Toggle whether this product has size options (S, M, L)
                    </p>
                  </div>
                </div>

                {editProduct.has_sizes ? (
                  <div className="space-y-3 pt-2 border-t border-orange-200/60">
                    <div>
                      <span className="text-[11px] font-extrabold text-charcoal block">
                        Available Sizes, Stock & Individual Prices:
                      </span>
                      <p className="text-[10px] text-gray-500">
                        Leave Size Price blank to use Base Price (Rs. {editProduct.price || '0'}).
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {['S', 'M', 'L'].map((szCode) => {
                        const sizeLabel = szCode === 'S' ? 'Small (S)' : szCode === 'M' ? 'Medium (M)' : 'Large (L)'
                        const szObj = editProduct.sizes?.find((s) => s.size === szCode) || {
                          stock: 0,
                          price: '',
                          sale_price: '',
                          is_available: false,
                        }

                        return (
                          <div
                            key={szCode}
                            className={`p-3 rounded-2xl border transition ${
                              szObj.is_available
                                ? 'bg-white border-primary-orange/40 shadow-2xs'
                                : 'bg-gray-100/60 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-charcoal cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={szObj.is_available}
                                  onChange={(e) => {
                                    const updatedSizes = editProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, is_available: e.target.checked } : s
                                    )
                                    setEditProduct({ ...editProduct, sizes: updatedSizes })
                                  }}
                                  className="rounded text-primary-orange focus:ring-primary-orange w-4 h-4 cursor-pointer"
                                />
                                <span className="font-extrabold text-sm">{sizeLabel}</span>
                              </label>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {szObj.is_available ? 'Available' : 'Disabled'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Stock Units <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!szObj.is_available}
                                  value={szObj.stock}
                                  onChange={(e) => {
                                    const updatedSizes = editProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, stock: e.target.value } : s
                                    )
                                    setEditProduct({ ...editProduct, sizes: updatedSizes })
                                  }}
                                  placeholder="Stock"
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Normal Price
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  disabled={!szObj.is_available}
                                  value={szObj.price || ''}
                                  onChange={(e) => {
                                    const updatedSizes = editProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, price: e.target.value } : s
                                    )
                                    setEditProduct({ ...editProduct, sizes: updatedSizes })
                                  }}
                                  placeholder={editProduct.price ? `Rs. ${editProduct.price}` : 'Base price'}
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                  Sale Price
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  disabled={!szObj.is_available}
                                  value={szObj.sale_price || ''}
                                  onChange={(e) => {
                                    const updatedSizes = editProduct.sizes.map((s) =>
                                      s.size === szCode ? { ...s, sale_price: e.target.value } : s
                                    )
                                    setEditProduct({ ...editProduct, sizes: updatedSizes })
                                  }}
                                  placeholder="Optional"
                                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary-orange bg-white disabled:bg-gray-100 font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-[11px] text-gray-500 text-right font-medium">
                      Total Calculated Stock:{' '}
                      <strong className="text-charcoal font-bold">
                        {editProduct.sizes
                          ?.filter((s) => s.is_available)
                          ?.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0)}{' '}
                        units
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Stock Units Available
                    </label>
                    <input
                      type="number"
                      min="0"
                      required={!editProduct.has_sizes}
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setEditProduct({ open: false, id: null, name: '', price: '', sale_price: '', stock: '', has_sizes: false, sizes: [] })
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
