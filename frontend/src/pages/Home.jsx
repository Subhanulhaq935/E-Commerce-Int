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
  CheckCircle2,
  ArrowUpDown,
  Award,
} from 'lucide-react'

export default function Home() {
  const initialProducts = getCachedProducts() || []
  const initialCategories = getCachedCategories() || []

  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
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

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory = selectedCategory ? p.category_id === Number(selectedCategory) : true
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      const priceA =
        a.sale_price && Number(a.sale_price) > 0 && Number(a.sale_price) < Number(a.price)
          ? Number(a.sale_price)
          : Number(a.price)
      const priceB =
        b.sale_price && Number(b.sale_price) > 0 && Number(b.sale_price) < Number(b.price)
          ? Number(b.sale_price)
          : Number(b.price)
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      if (sortBy === 'rating') return (b.average_rating || 0) - (a.average_rating || 0)
      return 0
    })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Flagship Editorial Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-950 via-charcoal to-slate-900 text-white rounded-3xl p-6 sm:p-10 lg:p-12 mb-8 sm:mb-10 shadow-2xl shadow-slate-950/15 overflow-hidden border border-slate-800/90 bg-grid-pattern">
        {/* Ambient Decorative Glows */}
        <div className="absolute -top-28 -right-28 w-96 h-96 bg-primary-orange/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary-orange" />
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-orange-300">
                Curated Collection 2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.12]">
              Elevate Your Everyday{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-orange via-orange-400 to-amber-300">
                Lifestyle.
              </span>
            </h1>

            <p className="text-slate-300 mt-4 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-medium">
              Shop verified lifestyle essentials with confidence. Enjoy free Cash on Delivery across
              Pakistan, fast doorstep dispatch, and authentic reviews from verified buyers.
            </p>

            {/* Hero Trust & Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-6">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-100 font-bold backdrop-blur-md shadow-sm">
                <Truck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                <span>Free Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-100 font-bold backdrop-blur-md shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Authentic Quality</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-100 font-bold backdrop-blur-md shadow-sm">
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Verified Buyer Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Highlight Bento Card */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-1 ring-white/20">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Storefront
              </span>
            </div>

            <div className="my-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {products.length}+
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary-orange">
                  Verified Items
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Quality-checked inventory ready for immediate nationwide dispatch.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/90 grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Shipping
                </span>
                <span className="text-xs font-extrabold text-white mt-0.5 block">
                  Free COD
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Dispatch
                </span>
                <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block">
                  24–48 Hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Command Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-7 space-y-4">
        <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name, category, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-primary-orange focus:ring-3 focus:ring-primary-orange/15 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary-orange" />
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1.5 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary-orange" /> Categories:
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === ''
                ? 'bg-charcoal text-white shadow-md shadow-slate-900/15'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <span>All Products</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                selectedCategory === ''
                  ? 'bg-primary-orange text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {products.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length
            const isSelected = selectedCategory === String(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary-orange text-white shadow-md shadow-orange-500/25'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
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
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Showing <span className="font-extrabold text-slate-900">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
            {selectedCategory && (
              <>
                {' '}
                in{' '}
                <span className="font-extrabold text-primary-orange">
                  {categories.find((c) => String(c.id) === selectedCategory)?.name}
                </span>
              </>
            )}
            {searchQuery && (
              <>
                {' '}
                matching <span className="font-extrabold text-slate-900">"{searchQuery}"</span>
              </>
            )}
          </p>
          {(selectedCategory || searchQuery || sortBy !== 'featured') && (
            <button
              onClick={() => {
                setSelectedCategory('')
                setSearchQuery('')
                setSortBy('featured')
              }}
              className="text-xs font-extrabold text-primary-orange hover:text-primary-orange-hover hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
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
              className="bg-white rounded-3xl border border-slate-200/70 shadow-xs overflow-hidden animate-pulse"
            >
              <div className="h-60 bg-slate-200/70" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-200 rounded-md w-16" />
                  <div className="h-4 bg-slate-100 rounded-md w-16" />
                </div>
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-3 bg-slate-100 rounded-md w-2/3" />
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded-md w-24" />
                  <div className="h-9 bg-slate-200 rounded-xl w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 max-w-lg mx-auto my-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 text-primary-orange flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No matching products found</h3>
          <p className="text-slate-500 text-sm mt-1.5 mb-6 leading-relaxed">
            We couldn't find any products matching your search or selected category. Try different
            keywords or clear your active filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('')
              setSearchQuery('')
              setSortBy('featured')
            }}
            className="bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/25 transition cursor-pointer"
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
            const hasDiscount =
              p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price)
            const discountPct = hasDiscount
              ? Math.round(((Number(p.price) - Number(p.sale_price)) / Number(p.price)) * 100)
              : 0

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-2xl hover:border-slate-300/90 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Product Image Stage */}
                <Link
                  to={`/products/${p.id}`}
                  state={{ product: p }}
                  className="h-60 bg-gradient-to-b from-slate-50 to-slate-100/90 relative overflow-hidden flex items-center justify-center block"
                >
                  {/* Floating Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-start justify-between gap-2 pointer-events-none">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {catName && (
                        <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                          {catName}
                        </span>
                      )}
                      {p.has_sizes && (
                        <span className="bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/80 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                          Sizes S•M•L
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {hasDiscount && (
                        <span className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md shadow-rose-600/20">
                          -{discountPct}% OFF
                        </span>
                      )}
                      {p.stock > 0 && p.stock <= 5 && (
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
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
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                  )}
                  <div
                    style={{ display: imgUrl ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center bg-slate-50"
                  >
                    <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Sold Out Overlay */}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-xs font-black uppercase tracking-wider bg-rose-600 px-4 py-1.5 rounded-full shadow-xl">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                {/* Product Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Rating & Stock Status Row */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="inline-flex items-center gap-1 bg-amber-50/90 border border-amber-200/70 px-2.5 py-0.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-950">
                          {p.average_rating ? p.average_rating.toFixed(1) : 'New'}
                        </span>
                        <span className="text-[11px] text-amber-800/80 font-semibold">
                          ({p.review_count || 0})
                        </span>
                      </div>

                      {p.stock > 0 ? (
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-primary-orange transition-colors"
                    >
                      {p.name}
                    </Link>

                    <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">
                      {p.description ||
                        'Premium quality verified item available with free nationwide Cash on Delivery.'}
                    </p>
                  </div>

                  {/* Price & Action CTA */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-end justify-between gap-2">
                    <div>
                      {hasDiscount ? (
                        <>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                              Sale
                            </span>
                            <span className="text-xs text-slate-400 line-through font-bold tabular-nums">
                              Rs. {Number(p.price).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-lg font-black text-primary-orange block leading-none tabular-nums">
                            Rs. {Number(p.sale_price).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Price
                          </span>
                          <span className="text-lg font-black text-slate-900 block leading-none tabular-nums">
                            Rs. {Number(p.price).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      state={{ product: p }}
                      className={`text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        p.stock > 0
                          ? 'bg-charcoal hover:bg-primary-orange text-white shadow-sm hover:shadow-md hover:shadow-orange-500/25'
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
