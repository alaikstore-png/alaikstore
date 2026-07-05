import { useState, useEffect, useCallback } from 'react'
import { isPushSupported, getPushPermission, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '../lib/push'

/**
 * Exposes push notification state + actions for any component that wants to
 * offer an "Aktifkan Notifikasi" toggle (Dashboard User, a banner, etc).
 * Usage: const { supported, permission, subscribed, busy, error, enable, disable } = usePushNotifications(user?.id)
 */
export function usePushNotifications(userId) {
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supported = isPushSupported()
  const permission = getPushPermission()

  useEffect(() => {
    if (!supported) return
    isSubscribedToPush().then(setSubscribed)
  }, [supported])

  const enable = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      await subscribeToPush(userId)
      setSubscribed(true)
    } catch (err) {
      setError(err.message || 'Gagal mengaktifkan notifikasi.')
    } finally {
      setBusy(false)
    }
  }, [userId])

  const disable = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } catch (err) {
      setError(err.message || 'Gagal menonaktifkan notifikasi.')
    } finally {
      setBusy(false)
    }
  }, [])

  return { supported, permission, subscribed, busy, error, enable, disable }
}
