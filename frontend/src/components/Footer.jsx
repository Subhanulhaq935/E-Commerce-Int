export default function Footer() {
  return (
    <footer className="bg-charcoal text-gray-300 py-8 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} <span className="font-semibold text-white">E-Shop.pk</span> — Premium Single-Vendor Store. All rights reserved.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Powered by FastAPI & React (Vite + Tailwind CSS)
        </p>
      </div>
    </footer>
  )
}
