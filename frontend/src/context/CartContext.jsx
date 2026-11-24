import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'
import { getCachedProduct } from '../utils/catalogCache'

const CartContext = createContext()

export const resolveItemStock = (item, productObj = null) => {
  if (typeof item?.available_stock === 'number' && item.available_stock >= 0) {
    return item.available_stock
  }
  const prod = productObj || item?.product || getCachedProduct(item?.product_id)
  if (!prod) return typeof item?.stock === 'number' ? item.stock : 9999
  if (prod.has_sizes && item?.size && Array.isArray(prod.sizes)) {
    const szObj = prod.sizes.find(
      (s) => String(s.size).trim().toLowerCase() === String(item.size).trim().toLowerCase()
    )
    return szObj ? szObj.stock : 0
  }
  return typeof prod.stock === 'number' ? prod.stock : 9999
}

const GUEST_CART_KEY = 'guest_cart'

const getGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return { items: [], total: 0 }
    const parsed = JSON.parse(raw)
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      total: Number(parsed.total) || 0,
    }
  } catch {
    return { items: [], total: 0 }
  }
}

const saveGuestCart = (cartObj) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartObj))
  } catch (err) {
    console.error('Failed to save guest cart to localStorage:', err)
  }
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState(() => (user ? null : getGuestCart()))
  const [loading, setLoading] = useState(false)
  const updateTimers = useRef(new Map())

  const fetchCart = async () => {
    if (user?.role === 'admin') {
      setCart(null)
      return
    }

    if (!user) {
      // Guest: load from localStorage
      setCart(getGuestCart())
      return
    }

    // Registered Buyer: load from backend
    try {
      setLoading(true)
      const res = await api.get('/cart/')
      setCart(res.data)
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [user])

  // 100% Optimistic Instant Add to Cart (0ms for both Guests and Registered Buyers)
  const addToCart = (productOrId, quantity = 1, size = null) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId
    const productObj = typeof productOrId === 'object' ? productOrId : getCachedProduct(productId)
    const cleanSize = size ? String(size).trim() : null

    // Determine available stock
    let maxStock = 9999
    if (productObj) {
      if (productObj.has_sizes && cleanSize && productObj.sizes) {
        const szObj = productObj.sizes.find(
          (s) => String(s.size).trim().toLowerCase() === cleanSize.toLowerCase()
        )
        maxStock = szObj ? szObj.stock : 0
      } else {
        maxStock = typeof productObj.stock === 'number' ? productObj.stock : 9999
      }
    }

    if (maxStock <= 0) {
      const err = new Error(
        `'${productObj?.name || 'Product'}'${cleanSize ? ` (Size: ${cleanSize})` : ''} is currently out of stock.`
      )
      return Promise.reject(err)
    }

    // Check existing item in cart
    const currentCartItems = cart?.items || (!user ? getGuestCart().items : [])
    const existingIndex = currentCartItems.findIndex(
      (it) => String(it.product_id) === String(productId) && (it.size || null) === (cleanSize || null)
    )
    const existing = existingIndex > -1 ? currentCartItems[existingIndex] : null
    const currentQty = existing ? existing.quantity : 0
    const targetQty = currentQty + quantity

    if (targetQty > maxStock) {
      const remaining = Math.max(0, maxStock - currentQty)
      const msg =
        remaining > 0
          ? `Only ${maxStock} items are currently available in stock (${currentQty} already in cart).`
          : `Only ${maxStock} items are currently available in stock.`
      return Promise.reject(new Error(msg))
    }

    // Helper to calculate prices
    let unitPrice = Number(productObj?.price || 0)
    let originalPrice = null
    const hasBaseSale =
      productObj?.sale_price !== null &&
      productObj?.sale_price !== undefined &&
      Number(productObj.sale_price) > 0 &&
      Number(productObj.sale_price) < Number(productObj.price)

    if (hasBaseSale) {
      unitPrice = Number(productObj.sale_price)
      originalPrice = Number(productObj.price)
    }

    if (cleanSize && productObj?.has_sizes && productObj?.sizes) {
      const szObj = productObj.sizes.find(
        (s) => String(s.size).trim().toLowerCase() === cleanSize.toLowerCase()
      )
      if (szObj && szObj.price !== null && szObj.price !== undefined && Number(szObj.price) > 0) {
        const szHasSale =
          szObj.sale_price !== null &&
          szObj.sale_price !== undefined &&
          Number(szObj.sale_price) > 0 &&
          Number(szObj.sale_price) < Number(szObj.price)

        unitPrice = szHasSale ? Number(szObj.sale_price) : Number(szObj.price)
        originalPrice = szHasSale ? Number(szObj.price) : null
      }
    }

    const primaryImg =
      productObj?.images?.find((i) => i.is_primary)?.image_url ||
      productObj?.images?.[0]?.image_url

    // --- GUEST WORKFLOW ---
    if (!user) {
      const guestCart = getGuestCart()
      const existingItems = Array.isArray(guestCart.items) ? [...guestCart.items] : []
      const exIdx = existingItems.findIndex(
        (it) => String(it.product_id) === String(productId) && (it.size || null) === (cleanSize || null)
      )

      if (exIdx > -1) {
        const ex = existingItems[exIdx]
        const newQty = ex.quantity + quantity
        existingItems[exIdx] = {
          ...ex,
          quantity: newQty,
          subtotal: Number(ex.unit_price) * newQty,
          available_stock: maxStock,
          stock: maxStock,
        }
      } else {
        existingItems.push({
          id: Date.now(),
          product_id: Number(productId),
          product_name: productObj?.name || 'Product',
          unit_price: unitPrice,
          original_price: originalPrice,
          size: cleanSize,
          quantity: quantity,
          subtotal: unitPrice * quantity,
          image_url: primaryImg,
          available_stock: maxStock,
          stock: maxStock,
        })
      }

      const newTotal = existingItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      const updatedGuestCart = {
        ...guestCart,
        items: existingItems,
        total: newTotal,
      }

      saveGuestCart(updatedGuestCart)
      setCart(updatedGuestCart)
      return Promise.resolve(updatedGuestCart)
    }

    // --- REGISTERED BUYER WORKFLOW ---
    setCart((prevCart) => {
      const prev = prevCart || { items: [], total: 0 }
      const existingItems = prev.items ? [...prev.items] : []
      const exIndex = existingItems.findIndex(
        (it) => String(it.product_id) === String(productId) && (it.size || null) === (cleanSize || null)
      )

      if (exIndex > -1) {
        const ex = existingItems[exIndex]
        const newQty = ex.quantity + quantity
        existingItems[exIndex] = {
          ...ex,
          quantity: newQty,
          subtotal: Number(ex.unit_price) * newQty,
          available_stock: maxStock,
          stock: maxStock,
        }
      } else {
        existingItems.push({
          id: Date.now(),
          product_id: Number(productId),
          product_name: productObj?.name || 'Product',
          unit_price: unitPrice,
          original_price: originalPrice,
          size: cleanSize,
          quantity: quantity,
          subtotal: unitPrice * quantity,
          image_url: primaryImg,
          available_stock: maxStock,
          stock: maxStock,
        })
      }

      const newTotal = existingItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      return {
        ...prev,
        items: existingItems,
        total: newTotal,
      }
    })

    return api
      .post('/cart/items', {
        product_id: Number(productId),
        quantity,
        size: cleanSize || null,
      })
      .then((res) => {
        if (res.data) {
          setCart(res.data)
        }
        return res.data
      })
      .catch((err) => {
        fetchCart()
        throw err
      })
  }

  // Instant debounced quantity update (0ms UI reaction on every click)
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      if (updateTimers.current.has(itemId)) {
        clearTimeout(updateTimers.current.get(itemId))
        updateTimers.current.delete(itemId)
      }
      return removeFromCart(itemId)
    }

    const currentItem = (cart?.items || []).find((it) => it.id === itemId || it.product_id === itemId)
    if (currentItem) {
      const maxStock = resolveItemStock(currentItem)
      if (quantity > maxStock) {
        return Promise.reject(new Error(`Only ${maxStock} items are currently available in stock.`))
      }
    }

    // 1. INSTANT (0ms) screen update
    let updatedCartObj = null

    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.map((it) => {
        if (it.id === itemId || it.product_id === itemId) {
          const subtotal = Number(it.unit_price) * quantity
          return { ...it, quantity, subtotal }
        }
        return it
      })
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      updatedCartObj = {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
      if (!user) {
        saveGuestCart(updatedCartObj)
      }
      return updatedCartObj
    })

    // If guest, immediate resolution
    if (!user) {
      return Promise.resolve(updatedCartObj)
    }

    // 2. Debounce the network request by 350ms for registered users
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId))
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        updateTimers.current.delete(itemId)
        try {
          const res = await api.patch(`/cart/items/${itemId}`, { quantity })
          if (res.data) {
            setCart(res.data)
          }
          resolve(res.data)
        } catch (err) {
          const fresh = await api.get('/cart/').catch(() => null)
          if (fresh?.data) {
            setCart(fresh.data)
          }
          resolve(null)
        }
      }, 350)

      updateTimers.current.set(itemId, timer)
    })
  }

  // Optimistic Instant Remove
  const removeFromCart = async (itemId) => {
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId))
      updateTimers.current.delete(itemId)
    }

    // 1. Instant local removal (0ms UI feedback)
    let updatedCartObj = null

    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.filter((it) => it.id !== itemId && it.product_id !== itemId)
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      updatedCartObj = {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
      if (!user) {
        saveGuestCart(updatedCartObj)
      }
      return updatedCartObj
    })

    if (!user) {
      return Promise.resolve(updatedCartObj)
    }

    // 2. Background sync with backend for registered user
    try {
      const res = await api.delete(`/cart/items/${itemId}`)
      if (res.data) {
        setCart(res.data)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        return // Already deleted on server
      }
      console.error('Error removing item from server:', err)
      const fresh = await api.get('/cart/').catch(() => null)
      if (fresh?.data) setCart(fresh.data)
    }
  }

  const clearCartState = () => {
    if (!user) {
      try {
        localStorage.removeItem(GUEST_CART_KEY)
      } catch {}
      setCart({ items: [], total: 0 })
    } else {
      setCart(null)
    }
  }

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
