export const formatApiError = (err, fallback = 'An error occurred. Please try again.') => {
  const detail = err?.response?.data?.detail
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === 'string') return d
        if (d.msg) {
          return d.msg.replace(/^Value error,\s*/i, '')
        }
        return JSON.stringify(d)
      })
      .join('. ')
  }
  if (typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }
  return fallback
}
