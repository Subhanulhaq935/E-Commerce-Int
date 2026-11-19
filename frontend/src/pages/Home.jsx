import { useState, useEffect } from 'react'
import api from '../api/client'
import { ShoppingBag, Star, Package, Loader2, Search } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/?limit=100'),
          api.get('/categories/'),
        ])
        setProducts(prodRes.data)
        setCategories(catRes.data)
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
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-charcoal text-white rounded-2xl p-8 mb-8 shadow-md flex flex-col md:flex-row items-center justify-between">
        <div>
          <span className="text-primary-orange font-semibold text-sm uppercase tracking-wider">Summer Collection 2026</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Discover Quality Products</h1>
          <p className="text-gray-300 mt-2 text-sm md:text-base max-w-xl">
            Original brands, cash on delivery, and instant verified reviews.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary-orange text-sm shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-primary-orange text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === String(cat.id)
                  ? 'bg-primary-orange text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-orange mr-2" />
          <span>Loading products from store...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No products found</h3>
          <p className="text-gray-500 text-sm mt-1">Try another search or select a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0]
            const imgUrl = primaryImg ? `https://e-commerce-int.onrender.com${primaryImg.image_url}` : null

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
              >
                {/* Product Image */}
                <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                  )}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-wider bg-red-600 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-charcoal text-base line-clamp-1 group-hover:text-primary-orange transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2 mt-1">
                      {p.description || 'No description provided.'}
                    </p>

                    {/* Ratings */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold ml-1 text-gray-700">
                          {p.average_rating ? p.average_rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        ({p.review_count || 0})
                      </span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Price</span>
                      <span className="text-lg font-bold text-charcoal">
                        Rs. {Number(p.price).toLocaleString()}
                      </span>
                    </div>
                    <button
                      disabled={p.stock <= 0}
                      className="bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {p.stock > 0 ? 'Buy Now' : 'Sold Out'}
                    </button>
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
