import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  getCachedProducts,
  setCachedProducts,
  getCachedCategories,
  setCachedCategories,
} from '../utils/catalogCache'
import {
  ShoppingBag,
  Star,
  Package,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  X,
  SlidersHorizontal,
} from 'lucide-react'

export default function Home() {
  const initialProducts = getCachedProducts() || []
  const initialCategories = getCachedCategories() || []

  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  // If products are already in cache, do not show loading spinner (0ms instant display!)
  const [loading, setLoading] = useState(initialProducts.length === 0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/?limit=100'),
          api.get('/categories/').catch(() => ({ data: [] })),
        ])
        setProducts(prodRes.data)
        setCategories(catRes.data)
        setCachedProducts(prodRes.data)
        setCachedCategories(catRes.data)
      } catch (err) {
        console.error('Error fetching catalog:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === Number(selectedCategory) : true
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Modern Hero Banner */}
      <div className="relative bg-charcoal text-white rounded-3xl p-8 md:p-12 mb-10 shadow-xl overflow-hidden border border-gray-800">
        {/* Decorative Radial Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                New Season Collection 2026
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Elevate Your Everyday <span className="text-primary-orange">Lifestyle.</span>
            </h1>
            <p className="text-gray-300 mt-3 text-sm md:text-base leading-relaxed max-w-xl">
              Shop curated, 100% original products with zero hassle. Enjoy instant Cash on Delivery and verified customer reviews on every item.
            </p>

            {/* Hero Trust Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex items-center gap-1.5 bg-gray-800/90 border border-gray-700 px-3 py-1.5 rounded-xl text-xs text-gray-200 font-medium">
                <Truck className="w-4 h-4 text-primary-orange" />
                <span>Free Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-800/90 border border-gray-700 px-3 py-1.5 rounded-xl text-xs text-gray-200 font-medium">
                <ShieldCheck className="w-4 h-4 text-primary-orange" />
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-w-[210px] text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-orange/20 border border-primary-orange/40 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-primary-orange" />
            </div>
            <span className="text-3xl font-black text-white">{products.length}+</span>
            <span className="text-xs text-gray-400 font-medium mt-0.5">Curated Products</span>
            <span className="mt-3 text-[11px] font-bold text-primary-orange bg-primary-orange/15 px-3 py-1 rounded-full">
              Ready to Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/15 text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25'
                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-charcoal'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === String(cat.id)
                  ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-charcoal'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {!loading && (
        <div className="flex items-center justify-between mb-5 px-1">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Showing <span className="font-bold text-charcoal">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
            {selectedCategory && (
              <>
                {' '}in{' '}
                <span className="font-bold text-primary-orange">
                  {categories.find((c) => String(c.id) === selectedCategory)?.name}
                </span>
              </>
            )}
          </p>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('')
                setSearchQuery('')
              }}
              className="text-xs font-bold text-primary-orange hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse"
            >
              <div className="h-52 bg-gray-200/70" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="pt-4 flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-24" />
                  <div className="h-8 bg-gray-200 rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 max-w-lg mx-auto my-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-primary-orange flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-charcoal">No matching products found</h3>
          <p className="text-gray-500 text-sm mt-1.5 mb-6">
            We couldn't find anything matching your current search or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('')
              setSearchQuery('')
            }}
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
            const imgUrl = primaryImg ? resolveImageUrl(primaryImg.image_url) : null
            const catName = categories.find((c) => c.id === p.category_id)?.name

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Product Image Container */}
                <Link
                  to={`/products/${p.id}`}
                  state={{ product: p }}
                  className="h-52 bg-gradient-to-b from-gray-50 to-gray-100/70 relative overflow-hidden flex items-center justify-center block"
                >
                  {/* Floating Category & Stock Badges */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                    {catName ? (
                      <span className="bg-charcoal/85 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {catName}
                      </span>
                    ) : <span />}

                    {p.stock > 0 && p.stock <= 5 && (
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                        Only {p.stock} left
                      </span>
                    )}
                  </div>

                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={p.name}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex'
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div
                    style={{ display: imgUrl ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center bg-gray-50"
                  >
                    <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform" />
                  </div>

                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-xs font-extrabold uppercase tracking-wider bg-red-600 px-3.5 py-1.5 rounded-full shadow-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                {/* Product Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Rating & Stock Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-extrabold text-amber-900">
                          {p.average_rating ? p.average_rating.toFixed(1) : 'New'}
                        </span>
                        <span className="text-[11px] text-amber-700/80">
                          ({p.review_count || 0})
                        </span>
                      </div>

                      {p.stock > 0 ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-red-500">Sold Out</span>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className="font-bold text-charcoal text-base line-clamp-1 group-hover:text-primary-orange transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-gray-500 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {p.description || 'Premium quality product available with Cash on Delivery.'}
                    </p>
                  </div>

                  {/* Price & Action CTA */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Price
                      </span>
                      <span className="text-lg font-extrabold text-charcoal">
                        Rs. {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className={`text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                        p.stock > 0
                          ? 'bg-primary-orange hover:bg-primary-orange-hover text-white shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span>{p.stock > 0 ? 'View Details' : 'Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
