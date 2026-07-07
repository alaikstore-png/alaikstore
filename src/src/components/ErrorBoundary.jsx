import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Alaikstore crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-base-950 text-white">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="font-display text-xl font-bold mb-2">Terjadi Kesalahan</h1>
            <p className="text-white/50 text-sm mb-6">Halaman mengalami error tak terduga. Coba muat ulang halaman.</p>
            <button onClick={() => window.location.reload()} className="btn-neon">Muat Ulang</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
