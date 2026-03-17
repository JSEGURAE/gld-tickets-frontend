import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach token from localStorage on every request
client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('dev-tickets-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

// Handle 401 globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dev-tickets-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
