// frontend/src/components/Forms/DonationForm.jsx
import React, { useState } from 'react';

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
      // UTILIZAR LA VARIABLE DE ENTORNO EN LUGAR DE LA URL HARDCODEADA
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
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
        
        // --- LÓGICA CLAVE DE REDIRECCIÓN ---
        setTimeout(() => {
          // En un caso real, esto redirigiría a Ebi Pay
          console.log("Redirigiendo a:", data.redirect_url);
          window.location.href = data.redirect_url; // Simulamos la redirección
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
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-yellow-400 w-full max-w-2xl mx-auto">
      <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Haz una Donación
      </h3>
      <p className="text-center text-gray-600 mb-8">
        Tu generosidad nos ayuda a continuar la misión. Cada aporte cuenta.
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre Completo (Opcional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Input: Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo Electrónico <span className="text-red-500">*</span>
          </label>
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

        {/* Input: Monto */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
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
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="10000"
          />
        </div>

        {/* Select: Método de Pago */}
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
            Método de Pago
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Ebi Pay">Ebi Pay</option>
            <option value="PayPal">PayPal</option>
            <option value="Transferencia">Transferencia Bancaria</option>
          </select>
        </div>

        {/* Textarea: Mensaje (Opcional) */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Mensaje (Opcional)
          </label>
          <textarea
            id="message"
            name="message"
            rows="3"
            value={formData.message}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mensaje para la iglesia..."
          ></textarea>
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
          {status === 'loading' ? 'Procesando...' : 'Donar Ahora'}
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        Al hacer clic en "Donar Ahora", serás redirigido a nuestra pasarela de pago segura.
      </p>
    </div>
  );
};

export default DonationForm;
