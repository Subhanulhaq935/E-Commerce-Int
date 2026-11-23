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
      <div className="relative bg-gradient-to-br from-slate-950 via-charcoal to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-12 mb-8 md:mb-10 shadow-2xl overflow-hidden border border-slate-800">
        {/* Decorative Radial Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-orange animate-spin-slow" />
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-orange-300">
                Curated Collection 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Elevate Your Everyday <span className="text-primary-orange bg-clip-text text-transparent bg-gradient-to-r from-primary-orange to-amber-400">Lifestyle.</span>
            </h1>
            <p className="text-slate-300 mt-3 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              Shop verified lifestyle essentials with confidence. Enjoy free Cash on Delivery across Pakistan and authentic reviews from verified buyers.
            </p>

            {/* Hero Trust Pills */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <div className="flex items-center gap-1.5 bg-slate-850/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-200 font-bold backdrop-blur-sm shadow-xs">
                <Truck className="w-4 h-4 text-primary-orange" />
                <span>Free Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-850/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-200 font-bold backdrop-blur-sm shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Authentic Quality</span>
              </div>
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-w-[210px] text-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center mb-3 shadow-md shadow-orange-500/30">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black text-white">{products.length}+</span>
            <span className="text-xs text-slate-400 font-semibold mt-0.5">Verified Products</span>
            <span className="mt-3 text-[11px] font-extrabold text-primary-orange bg-primary-orange/15 border border-primary-orange/30 px-3 py-1 rounded-full">
              In Stock & Ready to Ship
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, category, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 text-sm font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal cursor-pointer p-0.5 rounded-md hover:bg-slate-100"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === String(cat.id)
                    ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === String(cat.id) ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
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
            We couldn't find any products matching your search or selected category. Try different keywords or clear your filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('')
              setSearchQuery('')
            }}
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            Clear Filters
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
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Product Image Container */}
                <Link
                  to={`/products/${p.id}`}
                  state={{ product: p }}
                  className="h-56 bg-gradient-to-b from-slate-50 to-slate-100/80 relative overflow-hidden flex items-center justify-center block"
                >
                  {/* Floating Category & Stock Badges */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      {catName && (
                        <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                          {catName}
                        </span>
                      )}
                      {p.has_sizes && (
                        <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          Sizes S-L
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) && (
                        <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                          -{Math.round(((Number(p.price) - Number(p.sale_price)) / Number(p.price)) * 100)}%
                        </span>
                      )}
                      {p.stock > 0 && p.stock <= 5 && (
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                          Only {p.stock} left
                        </span>
                      )}
                    </div>
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
                    className="w-full h-full items-center justify-center bg-slate-50"
                  >
                    <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
                  </div>

                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-xs font-black uppercase tracking-wider bg-red-600 px-4 py-1.5 rounded-full shadow-xl">
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
                      <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-950">
                          {p.average_rating ? p.average_rating.toFixed(1) : 'New'}
                        </span>
                        <span className="text-[11px] text-amber-800/80 font-medium">
                          ({p.review_count || 0})
                        </span>
                      </div>

                      {p.stock > 0 ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-500">Sold Out</span>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-primary-orange transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {p.description || 'Premium quality product available with nationwide Cash on Delivery.'}
                    </p>
                  </div>

                  {/* Price & Action CTA */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      {p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) ? (
                        <>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/50">
                              Sale
                            </span>
                            <span className="text-xs text-slate-400 line-through font-bold">
                              Rs. {Number(p.price).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-lg font-black text-primary-orange block leading-tight">
                            Rs. {Number(p.sale_price).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Price
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            Rs. {Number(p.price).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className={`text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                        p.stock > 0
                          ? 'bg-primary-orange hover:bg-primary-orange-hover text-white shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span>{p.stock > 0 ? 'View Details' : 'Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
