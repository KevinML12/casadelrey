import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { AuthProvider } from './context/AuthContext'
import router from './router.jsx'
import './index.css'

// Inicializar Stripe con tu clave pública desde variables de entorno
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Elements>
  </React.StrictMode>,
)
