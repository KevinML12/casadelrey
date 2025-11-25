// frontend/src/components/Forms/PrayerForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const PrayerForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    is_prayer: true, // Por defecto, es una petición de oración
  });
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      // UTILIZAR LA VARIABLE DE ENTORNO EN LUGAR DE LA URL HARDCODEADA
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/contact/petition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(formData.is_prayer 
          ? '¡Petición de oración enviada! Estaremos orando por ti.'
          : '¡Gracias por contactarnos! Responderemos pronto.'
        );
        setFormData({ name: '', email: '', phone: '', message: '', is_prayer: true }); // Reset form
      } else {
        setStatus('error');
        setMessage(data.error || 'Ocurrió un error al enviar tu petición. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus('error');
      setMessage('Error de conexión con el servidor. Por favor, revisa tu conexión.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-xl border border-gray-200/50 dark:border-gray-800/50 w-full max-w-2xl mx-auto shadow-sm hover:shadow-md transition-all">
      <h3 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-4 text-center tracking-tight">
        {formData.is_prayer ? 'Petición de Oración' : 'Formulario de Contacto'}
      </h3>
      <p className="text-center text-dark-text/70 dark:text-gray-400 mb-8 font-normal">
        Queremos saber de ti. Llénalo y nos pondremos en contacto o estaremos orando.
      </p>

      {/* Mensaje de Estado */}
      {status !== 'idle' && status !== 'loading' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 rounded-lg font-medium text-center flex items-center justify-center gap-2 ${
            status === 'success' 
              ? 'bg-green-50/50 text-green-700 border border-green-200/50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50' 
              : 'bg-red-50/50 text-red-700 border border-red-200/50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
          }`}
        >
          {status === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm">{message}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input: Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-dark-text dark:text-white mb-2">
            Nombre Completo <span className="text-accent-blue">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-200/50 dark:border-gray-800/50 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all font-normal text-sm"
            placeholder="Tu nombre"
          />
        </div>

        {/* Input: Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-dark-text dark:text-white mb-2">
            Correo Electrónico <span className="text-accent-blue">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-200/50 dark:border-gray-800/50 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all font-normal text-sm"
            placeholder="tu@email.com"
          />
        </div>

        {/* Input: Teléfono (Opcional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-dark-text dark:text-white mb-2">
            Teléfono <span className="text-dark-text/50 dark:text-gray-500">(Opcional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200/50 dark:border-gray-800/50 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all font-normal text-sm"
            placeholder="+56 9 XXXX XXXX"
          />
        </div>

        {/* Textarea: Mensaje */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-dark-text dark:text-white mb-2">
            Tu Mensaje / Petición <span className="text-accent-blue">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-200/50 dark:border-gray-800/50 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all font-normal text-sm resize-none"
            placeholder="Cuéntanos tu petición o mensaje..."
          ></textarea>
        </div>
        
        {/* Checkbox: Tipo de Petición */}
        <div className="flex items-start gap-3 py-2">
          <input
            id="is_prayer"
            name="is_prayer"
            type="checkbox"
            checked={formData.is_prayer}
            onChange={handleChange}
            className="w-5 h-5 text-accent-blue border border-gray-200/50 dark:border-gray-800/50 rounded focus:ring-2 focus:ring-accent-blue mt-0.5 cursor-pointer"
          />
          <label htmlFor="is_prayer" className="text-sm font-normal text-dark-text/70 dark:text-gray-400 cursor-pointer">
            Marcar si es una <span className="font-semibold text-dark-text dark:text-white">Petición de Oración</span> (Dejar sin marcar para Contacto General).
          </label>
        </div>

        {/* Botón de Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs uppercase tracking-widest text-center transition-all duration-300 ${
            status === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-accent-blue text-white hover:bg-blue-700 hover:shadow-md'
          }`}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar Petición'}
        </button>
      </form>
    </div>
  );
};

export default PrayerForm;
