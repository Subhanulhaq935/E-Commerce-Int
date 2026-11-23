import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * ScrollToTop ensures pages start from scroll position (0, 0) on navigation.
 * - Always resets scroll to 0 for all product detail pages (/products/:id).
 * - For general routes: resets scroll on PUSH / REPLACE (link clicks), while preserving
 *   natural browser scroll restoration on POP (browser Back / Forward to catalog).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    const isProductPage = pathname.startsWith('/products/')

    if (isProductPage || navigationType !== 'POP') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [pathname, navigationType])

  return null
}
