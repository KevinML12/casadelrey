import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePost } from '../../hooks/useApiCall'; // Asumimos este hook existe
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

// URL ajustada al backend /api/v1 y al handler de simulación
const DONATE_URL = '/donations/simulate';

// Montos y propósitos sugeridos
const suggestedAmounts = [10.00, 25.00, 50.00, 100.00];
const purposes = ['Diezmo', 'Ofrenda', 'Misiones', 'Proyectos Especiales'];


export default function DonatePage () {
  // Inicializamos el formulario con un monto sugerido
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
        amount: 10.00,
        donation_purpose: 'Ofrenda',
        name: '',
        email: ''
    }
  });
  const [paymentMethod, setPaymentMethod] = useState('Stripe Card'); // Estado para seleccionar método
  const currentAmount = watch('amount');

  const mutation = usePost({
    url: DONATE_URL,
    onSuccess: (data) => {
        // En un escenario real, aquí se usaría data.clientSecret para montar el elemento Stripe o redirigir a PayPal
        toast.success(`Donación de $${data.data.Amount} registrada como ${paymentMethod}. Gracias por tu generosidad.`);
        reset();
    },
    onError: (error) => {
        const message = error.response?.data?.message || 'Error al procesar la donación.';
        toast.error(message);
    }
  });

  const handleAmountSelect = (amount) => {
    setValue('amount', amount, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    if (data.amount <= 0) {
        toast.error("El monto debe ser mayor a cero.");
        return;
    }

    const payload = {
        name: data.name,
        email: data.email,
        amount: data.amount,
        donation_purpose: data.donation_purpose,
        currency: 'USD', // Hardcodeado a USD para MVP
        payment_method: paymentMethod // Enviamos el método seleccionado al backend
    };

    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-bg-light py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card title="Tu Donación Transforma Vidas" className="shadow-lg border-t-4 border-accent">
          <p className="text-center text-text-secondary mb-8">
            Selecciona el monto y método de pago. El 100% se destina a la misión de la iglesia.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Monto de la Donación */}
            <div>
              <label className="block text-lg font-semibold text-text-primary mb-3">
                Monto Sugerido ($USD) *
              </label>
              <div className="flex flex-wrap gap-3 mb-4">
                {suggestedAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className={`py-2 px-4 rounded-button font-medium transition duration-fast
                      ${currentAmount === amt
                        ? 'bg-primary text-text-light shadow-md'
                        : 'bg-bg-light-alt text-text-primary hover:bg-bg-secondary'
                      }`}
                  >
                    ${amt.toFixed(2)}
                  </button>
                ))}
              </div>
              <Input
                label="Monto Personalizado"
                type="number"
                step="0.01"
                min="1"
                {...register("amount", { valueAsNumber: true, required: "El monto es obligatorio" })}
                error={errors.amount}
                className="text-xl"
              />
            </div>

            {/* Propósito y Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="donation_purpose" className="block text-sm font-semibold text-text-primary mb-2">
                        Propósito
                    </label>
                    <select
                        id="donation_purpose"
                        {...register("donation_purpose")}
                        className="w-full p-3 border border-border-light bg-bg-light-alt rounded-input focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                    >
                        {purposes.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                <Input label="Tu Nombre *" type="text" {...register("name", { required: "El nombre es obligatorio" })} error={errors.name} />
                <Input label="Correo Electrónico" type="email" {...register("email")} error={errors.email} />
            </div>

            {/* Opciones de Pago */}
            <div className="space-y-3 pt-4">
                <label className="block text-lg font-semibold text-text-primary">
                    Selecciona tu Método de Pago
                </label>
                <div className="flex flex-wrap gap-4">
                    {['Stripe Card', 'PayPal'].map(method => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex items-center space-x-2 p-3 border-2 rounded-input font-medium transition duration-fast ${
                                paymentMethod === method
                                ? 'border-primary bg-bg-light shadow-md'
                                : 'border-border-light bg-bg-light-alt hover:border-primary-light'
                            }`}
                        >
                            <span>{method}</span>
                        </button>
                    ))}
                </div>
                <p className="text-sm text-text-secondary pt-2">
                    Nota: En el MVP, el monto se registra en el historial. La pasarela de pago real se completará en la Fase 2.
                </p>
            </div>


            {/* Botón Final */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`w-full btn-primary py-4 text-lg transition duration-base ${mutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {mutation.isPending ? 'Registrando Donación...' : 'Donar y Registrar'}
            </button>

          </form>
        </Card>
      </div>
    </div>
  );
}
