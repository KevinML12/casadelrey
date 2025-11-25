// frontend/src/components/Forms/DonationForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '',
    message: '',
    payment_method: 'Ebi Pay',
  });
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.amount) <= 0) {
      setStatus('error');
      setMessage('El monto debe ser mayor a 0');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/donations/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 1500);

      } else {
        setStatus('error');
        setMessage(data.error || 'Ocurrió un error al procesar tu donación. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus('error');
      setMessage('Error de conexión con el servidor. Por favor, revisa tu conexión.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-xl border border-gray-200/50 dark:border-gray-800/50 w-full max-w-2xl mx-auto transition-colors shadow-sm hover:shadow-md"
    >
      <div className="text-center mb-10">
        <h3 className="text-4xl sm:text-5xl font-display font-bold text-dark-text dark:text-white mb-3 transition-colors">
          Haz una Donación
        </h3>
        <p className="text-lg text-dark-text/60 dark:text-gray-400 font-normal">
          Tu generosidad nos ayuda a continuar la misión. Cada aporte cuenta.
        </p>
      </div>

      {/* Mensaje de Estado */}
      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg flex items-start gap-3 transition-colors"
        >
          <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300 font-normal">{message}</p>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-3 transition-colors"
        >
          <ExclamationCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 font-normal">{message}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input: Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-dark-text dark:text-white mb-2 transition-colors">
            Nombre Completo <span className="text-gray-400">(Opcional)</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
          />
        </div>

        {/* Input: Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-dark-text dark:text-white mb-2 transition-colors">
            Correo Electrónico <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@ejemplo.com"
            required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
          />
        </div>

        {/* Input: Monto */}
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold text-dark-text dark:text-white mb-2 transition-colors">
            Monto (CLP) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            min="1"
            step="1"
            value={formData.amount}
            onChange={handleChange}
            placeholder="10.000"
            required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
          />
        </div>

        {/* Select: Método de Pago */}
        <div>
          <label htmlFor="payment_method" className="block text-sm font-semibold text-dark-text dark:text-white mb-2 transition-colors">
            Método de Pago
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all cursor-pointer"
          >
            <option value="Ebi Pay">Ebi Pay</option>
            <option value="PayPal">PayPal</option>
            <option value="Transferencia">Transferencia Bancaria</option>
          </select>
        </div>

        {/* Textarea: Mensaje */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-dark-text dark:text-white mb-2 transition-colors">
            Mensaje <span className="text-gray-400">(Opcional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tu mensaje para la iglesia..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Botón de Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full py-3 px-6 rounded-lg font-semibold uppercase tracking-widest text-sm transition-all transform ${
            status === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-accent-blue text-white hover:bg-blue-700 hover:shadow-lg hover:scale-[1.01]'
          }`}
        >
          {status === 'loading' ? 'Procesando...' : 'Donar Ahora'}
        </button>
      </form>

      <p className="text-xs text-dark-text/50 dark:text-gray-500 text-center mt-6 font-normal">
        Al hacer clic en "Donar Ahora", serás redirigido a nuestra pasarela de pago segura.
      </p>
    </motion.div>
  );
};

export default DonationForm;
