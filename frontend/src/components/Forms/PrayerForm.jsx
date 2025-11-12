// frontend/src/components/Forms/PrayerForm.jsx
import React, { useState } from 'react';

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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
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
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-yellow-400 w-full max-w-2xl mx-auto">
      <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        {formData.is_prayer ? 'Petición de Oración' : 'Formulario de Contacto'}
      </h3>
      <p className="text-center text-gray-600 mb-8">
        Queremos saber de ti. Llénalo y nos pondremos en contacto o estaremos orando.
      </p>

      {/* Mensaje de Estado */}
      {status !== 'idle' && status !== 'loading' && (
        <div className={`p-4 mb-4 rounded-lg font-medium text-center ${
          status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input: Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Input: Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Input: Teléfono (Opcional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono (Opcional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Textarea: Mensaje */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Tu Mensaje / Petición <span className="text-red-500">*</span></label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        {/* Checkbox: Tipo de Petición */}
        <div className="flex items-center">
          <input
            id="is_prayer"
            name="is_prayer"
            type="checkbox"
            checked={formData.is_prayer}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_prayer" className="ml-2 block text-sm text-gray-900">
            Marcar si es una <strong>Petición de Oración</strong> (Dejar sin marcar para Contacto General).
          </label>
        </div>

        {/* Botón de Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-gray-900 transition duration-300 transform ${
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-300 hover:scale-[1.01]'
          }`}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar Petición'}
        </button>
      </form>
    </div>
  );
};

export default PrayerForm;
