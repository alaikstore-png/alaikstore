import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppButton from './components/ui/WhatsAppButton'
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute'
import { captureAffiliateCode } from './lib/affiliate'

import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DashboardUser from './pages/DashboardUser'
import DashboardAdmin from './pages/DashboardAdmin'
import TransactionHistory from './pages/TransactionHistory'
import OrderStatus from './pages/OrderStatus'
import Promo from './pages/Promo'
import Help from './pages/Help'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import ToolsHub from './pages/tools/ToolsHub'
import WinrateCalculator from './pages/tools/WinrateCalculator'
import ZodiacCalculator from './pages/tools/ZodiacCalculator'
import MagicWheel from './pages/tools/MagicWheel'

// Watches every route change so a shared affiliate link (?aff=KODE) works no
// matter which page it points to, not just the homepage.
function AffiliateCapture() {
  const location = useLocation()
  useEffect(() => {
    captureAffiliateCode(location.search)
  }, [location.search])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <AffiliateCapture />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produk/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lupa-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardUser /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><DashboardAdmin /></AdminRoute>} />
          <Route path="/riwayat-transaksi" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
          <Route path="/cek-pesanan" element={<OrderStatus />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/bantuan" element={<Help />} />
          <Route path="/tentang-kami" element={<About />} />
          <Route path="/hubungi-kami" element={<Contact />} />
          <Route path="/tools" element={<ToolsHub />} />
          <Route path="/tools/kalkulator-winrate" element={<WinrateCalculator />} />
          <Route path="/tools/kalkulator-zodiak" element={<ZodiacCalculator />} />
          <Route path="/tools/magic-wheel" element={<MagicWheel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
