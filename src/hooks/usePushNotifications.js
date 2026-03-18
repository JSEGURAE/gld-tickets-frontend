import { useEffect } from 'react'
import client from '../api/client'
import useAuthStore from '../store/authStore'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user || !['TECHNICIAN', 'ADMIN'].includes(user.role)) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const { data } = await client.get('/push/vapid-public-key')
        const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
        }

        await client.post('/push/subscribe', {
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
            auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
          },
        })
      } catch (err) {
        console.warn('Push setup failed:', err.message)
      }
    }

    subscribe()
  }, [user])
}
