const STORAGE_PREFIX = 'luxury_store_'

export const DEFAULT_SEED_CATEGORIES = [
  { id: 1, name: 'Electronics', description: 'Electronic gadgets' },
  { id: 2, name: 'Clothing', description: 'Men and women wear' },
  { id: 3, name: 'Shoes', description: 'Footwear' },
  { id: 4, name: 'Mobile Phones', description: 'Smartphones and tablets' },
  { id: 5, name: 'Accessories', description: 'Mobile and tech accessories' },
  { id: 7, name: 'Sports', description: 'Store Category' },
  { id: 8, name: 'SmartWatches', description: 'Store Category' },
]

export const DEFAULT_SEED_PRODUCTS = [
  {
    id: 3,
    category_id: 3,
    name: 'Nike Shoes',
    description: 'Running sports shoes',
    price: '8000.00',
    sale_price: null,
    has_sizes: false,
    stock: 5,
    is_active: true,
    images: [
      {
        id: 9,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795091202/ecommerce/products/3/qigrflgfrckw0w3twn3b.jpg',
        is_primary: true,
      },
      {
        id: 10,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795092666/ecommerce/products/3/mpf6th9aulw762tnt1zf.jpg',
        is_primary: false,
      },
    ],
    sizes: [],
    average_rating: 4.0,
    review_count: 2,
  },
  {
    id: 4,
    category_id: 4,
    name: 'S24',
    description: 'S24 80% battery health',
    price: '170000.00',
    sale_price: null,
    has_sizes: false,
    stock: 96,
    is_active: true,
    images: [
      {
        id: 11,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795096398/ecommerce/products/4/bsob0mij7oedwij71i5g.jpg',
        is_primary: true,
      },
    ],
    sizes: [],
    average_rating: null,
    review_count: 0,
  },
  {
    id: 5,
    category_id: 7,
    name: 'Bat',
    description: 'Very good cricket bat',
    price: '1500.00',
    sale_price: null,
    has_sizes: false,
    stock: 9,
    is_active: true,
    images: [
      {
        id: 12,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795154884/ecommerce/products/5/txmn0yioolqprqbishw0.jpg',
        is_primary: true,
      },
      {
        id: 13,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795154896/ecommerce/products/5/mgodaslrslholrsmf5eb.jpg',
        is_primary: false,
      },
      {
        id: 14,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795154908/ecommerce/products/5/iczoudvtpavxh9scdjuz.jpg',
        is_primary: false,
      },
    ],
    sizes: [],
    average_rating: null,
    review_count: 0,
  },
  {
    id: 6,
    category_id: 7,
    name: 'Helmet',
    description: 'A very high built quality helmet\n',
    price: '15000.00',
    sale_price: null,
    has_sizes: false,
    stock: 8,
    is_active: true,
    images: [],
    sizes: [],
    average_rating: null,
    review_count: 0,
  },
  {
    id: 9,
    category_id: 8,
    name: 'Rolex',
    description: 'Very good',
    price: '10000.00',
    sale_price: null,
    has_sizes: true,
    stock: 132,
    is_active: true,
    images: [
      {
        id: 15,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795420666/ecommerce/products/9/r0y7csop3lvomli0ietv.jpg',
        is_primary: true,
      },
      {
        id: 16,
        image_url:
          'https://res.cloudinary.com/v5m0qvyc/image/upload/v1795420708/ecommerce/products/9/mv3sfvpsyx7zhdyxzzll.jpg',
        is_primary: false,
      },
    ],
    sizes: [
      {
        id: 17,
        product_id: 9,
        size: 'S',
        stock: 12,
        price: '5000.00',
        sale_price: null,
        is_available: true,
      },
      {
        id: 18,
        product_id: 9,
        size: 'M',
        stock: 20,
        price: '8000.00',
        sale_price: null,
        is_available: true,
      },
      {
        id: 19,
        product_id: 9,
        size: 'L',
        stock: 100,
        price: '10000.00',
        sale_price: '9500.00',
        is_available: true,
      },
    ],
    average_rating: 3.5,
    review_count: 2,
  },
]

let memoryProducts = null
let memoryCategories = null
const memoryProductDetails = {}
const memoryProductReviews = {}

const safeGet = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

const safeSet = (key, value) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    // quota exceeded or private mode, silently ignore
  }
}

export const getCachedProducts = () => {
  if (memoryProducts && memoryProducts.length > 0) {
    return memoryProducts
  }
  const stored = safeGet('products')
  if (stored && Array.isArray(stored) && stored.length > 0) {
    memoryProducts = stored
    return stored
  }
  // Return instant seed fallback so brand new visitors never see a blank screen or delay!
  return DEFAULT_SEED_PRODUCTS
}

export const setCachedProducts = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    memoryProducts = data
    safeSet('products', data)
  }
}

export const getCachedCategories = () => {
  if (memoryCategories && memoryCategories.length > 0) {
    return memoryCategories
  }
  const stored = safeGet('categories')
  if (stored && Array.isArray(stored) && stored.length > 0) {
    memoryCategories = stored
    return stored
  }
  return DEFAULT_SEED_CATEGORIES
}

export const setCachedCategories = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    memoryCategories = data
    safeSet('categories', data)
  }
}

export const getCachedProduct = (id) => {
  if (memoryProductDetails[id]) return memoryProductDetails[id]
  const stored = safeGet(`prod_${id}`)
  if (stored) {
    memoryProductDetails[id] = stored
    return stored
  }
  const products = getCachedProducts()
  if (products) {
    const found = products.find((p) => String(p.id) === String(id))
    if (found) {
      memoryProductDetails[id] = found
      return found
    }
  }
  return null
}

export const setCachedProduct = (id, data) => {
  if (data) {
    memoryProductDetails[id] = data
    safeSet(`prod_${id}`, data)
  }
}

export const getCachedReviews = (productId) => {
  if (memoryProductReviews[String(productId)]) {
    return memoryProductReviews[String(productId)]
  }
  const stored = safeGet(`reviews_${productId}`)
  if (stored) {
    memoryProductReviews[String(productId)] = stored
    return stored
  }
  return null
}

export const setCachedReviews = (productId, reviews) => {
  if (Array.isArray(reviews)) {
    memoryProductReviews[String(productId)] = reviews
    safeSet(`reviews_${productId}`, reviews)
  }
}
