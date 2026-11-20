import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext()

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
  const addToCart = (productOrId, quantity = 1) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId
    const productObj = typeof productOrId === 'object' ? productOrId : null

    // 1. INSTANT (0ms) memory & local state update
    let updatedCartObj = null

    setCart((prevCart) => {
      const existingItems = prevCart?.items ? [...prevCart.items] : []
      const existingIndex = existingItems.findIndex((it) => it.product_id === productId)

      if (existingIndex > -1) {
        const existing = existingItems[existingIndex]
        const newQty = existing.quantity + quantity
        const subtotal = Number(existing.unit_price) * newQty
        existingItems[existingIndex] = { ...existing, quantity: newQty, subtotal }
      } else if (productObj) {
        const unitPrice = Number(productObj.price)
        const primaryImg =
          productObj.images?.find((i) => i.is_primary)?.image_url ||
          productObj.images?.[0]?.image_url
        existingItems.push({
          id: Date.now(),
          product_id: productObj.id,
          product_name: productObj.name,
          unit_price: unitPrice,
          quantity: quantity,
          subtotal: unitPrice * quantity,
          image_url: primaryImg,
        })
      }

      const newTotal = existingItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )

      updatedCartObj = {
        ...prevCart,
        items: existingItems,
        total: newTotal,
      }

      if (!user) {
        saveGuestCart(updatedCartObj)
      }

      return updatedCartObj
    })

    // If guest, local storage update is all we need
    if (!user) {
      return Promise.resolve(updatedCartObj)
    }

    // 2. Background sync silently with backend for registered user
    return api
      .post('/cart/items', {
        product_id: productId,
        quantity,
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
