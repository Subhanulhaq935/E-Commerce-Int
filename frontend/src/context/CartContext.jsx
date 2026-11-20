import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const updateTimers = useRef(new Map())

  const fetchCart = async () => {
    if (!user || user.role === 'admin') {
      setCart(null)
      return
    }
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

  // 100% Optimistic Instant Add to Cart (0ms - No Loading, Immediate Badge & State Update)
  const addToCart = (productOrId, quantity = 1) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId
    const productObj = typeof productOrId === 'object' ? productOrId : null

    // 1. INSTANT (0ms) memory update: updates cart count & items immediately!
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

      return {
        ...prevCart,
        items: existingItems,
        total: newTotal,
      }
    })

    // 2. Background sync silently with backend
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

  // Lightning-fast debounced quantity update (0ms UI reaction on every click + single debounced network call)
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      if (updateTimers.current.has(itemId)) {
        clearTimeout(updateTimers.current.get(itemId))
        updateTimers.current.delete(itemId)
      }
      return removeFromCart(itemId)
    }

    // 1. INSTANT (0ms) screen update on EVERY single click!
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.map((it) => {
        if (it.id === itemId) {
          const subtotal = Number(it.unit_price) * quantity
          return { ...it, quantity, subtotal }
        }
        return it
      })
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
    })

    // 2. Debounce the network request by 350ms so rapid clicks are unified
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
          // If rejected (e.g. stock exceeded or 404), fetch fresh server state
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

  // Optimistic Instant Remove (Never resurrects deleted items)
  const removeFromCart = async (itemId) => {
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId))
      updateTimers.current.delete(itemId)
    }

    // 1. Instant local removal (0ms UI feedback)
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.filter((it) => it.id !== itemId)
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
    })

    // 2. Background sync with backend
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
    setCart(null)
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
