import React from 'react';
import { useForm } from 'react-hook-form';
import { usePost } from '../../hooks/useApiCall'; // Asumimos este hook existe
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card'; // Asumimos este componente existe
import Input from '../../components/ui/Input'; // Asumimos este componente existe

// URL ajustada al backend /api/v1
const PETITION_URL = '/contact/petition';

export default function PrayerPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const mutation = usePost({
    url: PETITION_URL,
    onSuccess: () => {
      toast.success('Petición enviada con éxito. Estaremos orando por ti.');
      reset();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al procesar la petición.';
      toast.error(message);
    }
  });

  const onSubmit = (data) => {
    // El payload debe coincidir con el modelo Petition de Go: { name, email, phone, subject, message }
    const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.petition // Usar 'message' en lugar de 'petition' para el backend Go
    };

    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-bg-light py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card title="Oración Confidencial" className="shadow-lg border-t-4 border-primary">
          <p className="text-center text-text-secondary mb-8">
            "Clama a mí, y yo te responderé..." (Jeremías 33:3). Sus peticiones son privadas y serán llevadas ante Dios.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Tu Nombre"
                type="text"
                {...register("name", { required: "El nombre es obligatorio" })}
                error={errors.name}
              />
              <Input
                label="Correo Electrónico (Opcional)"
                type="email"
                {...register("email")}
                error={errors.email}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Teléfono (Opcional)"
                type="tel"
                {...register("phone")}
                error={errors.phone}
              />
              <Input
                label="Asunto de la Petición"
                type="text"
                {...register("subject", { required: "El asunto es obligatorio" })}
                error={errors.subject}
              />
            </div>

            <div>
              <label htmlFor="petition" className="block text-sm font-semibold text-text-primary mb-2">
                Tu Petición (Mensaje)
              </label>
              <textarea
                id="petition"
                rows="5"
                {...register("petition", { required: "La petición es obligatoria" })}
                className={`w-full p-3 border rounded-input focus:border-primary focus:ring-1 focus:ring-primary transition duration-200 resize-none
                  ${errors.petition ? 'border-error' : 'border-border-light bg-bg-light-alt'}`}
                placeholder="Escribe aquí tu petición de oración..."
              ></textarea>
              {errors.petition && <p className="mt-1 text-sm text-error">{errors.petition.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className={`w-full btn-primary py-3 transition duration-base ${mutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {mutation.isPending ? 'Enviando Petición...' : 'Enviar Petición de Oración'}
            </button>

          </form>
        </Card>
      </div>
    </div>
  );
}
