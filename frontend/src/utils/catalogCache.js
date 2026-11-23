let cachedProducts = null
let cachedCategories = null
const cachedProductDetails = {}
const cachedProductReviews = {}

export const getCachedProducts = () => cachedProducts
export const setCachedProducts = (data) => {
  cachedProducts = data
}

export const getCachedCategories = () => cachedCategories
export const setCachedCategories = (data) => {
  cachedCategories = data
}

export const getCachedProduct = (id) => {
  if (cachedProductDetails[id]) return cachedProductDetails[id]
  if (cachedProducts) {
    return cachedProducts.find((p) => String(p.id) === String(id)) || null
  }
  return null
}

export const setCachedProduct = (id, data) => {
  cachedProductDetails[id] = data
}

export const getCachedReviews = (productId) => {
  return cachedProductReviews[String(productId)] || null
}

export const setCachedReviews = (productId, reviews) => {
  cachedProductReviews[String(productId)] = reviews
}
