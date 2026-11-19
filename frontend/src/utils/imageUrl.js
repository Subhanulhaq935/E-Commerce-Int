export const resolveImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://e-commerce-int.onrender.com${url.startsWith('/') ? '' : '/'}${url}`
}
