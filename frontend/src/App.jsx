import { ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-offwhite text-charcoal">
      {/* Navbar (#1F2937) */}
      <header className="bg-charcoal text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-7 h-7 text-primary-orange" />
            <span className="text-xl font-bold tracking-tight">
              E-Shop<span className="text-primary-orange">.pk</span>
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#" className="hover:text-primary-orange transition-colors">Products</a>
            <a href="#" className="hover:text-primary-orange transition-colors">Categories</a>
            <button className="bg-primary-orange hover:bg-primary-orange-hover text-white font-medium px-4 py-2 rounded-lg shadow transition duration-200">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content (Off-white #F9FAFB background) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-orange-50 text-primary-orange rounded-full mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal mb-4">
            Theme & Colors Ready!
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-base md:text-lg">
            Charcoal Navbar/Footer, Vibrant Orange Buttons/Accents, aur Off-white Background bilkul theek set ho gaye hain.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-primary-orange hover:bg-primary-orange-hover text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Primary CTA Button
            </button>
          </div>
        </div>
      </main>

      {/* Footer (#1F2937) */}
      <footer className="bg-charcoal text-gray-300 py-6 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © 2026 E-Shop. Single-Vendor E-Commerce Platform.
        </div>
      </footer>
    </div>
  )
}

export default App
