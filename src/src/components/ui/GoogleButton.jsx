import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.6 6.5 29 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.2z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.6-11.3-8.4l-6.6 5.1C9.8 39.1 16.4 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5c3.5-3.2 5.5-8 5.5-13.7 0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  )
}

export default function GoogleButton({ label = 'Masuk dengan Google' }) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 bg-white text-gray-800 font-medium text-sm py-2.5 rounded-xl transition-all duration-200 hover:bg-gray-100 disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? 'Mengalihkan ke Google...' : label}
    </button>
  )
}
