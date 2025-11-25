# Componentes Base de Formulario - Guía de Uso

## Componentes Creados

### 1. Input.jsx

Componente de input con soporte completo para react-hook-form y manejo de errores.

#### Props:

- **id** (string): ID del input
- **label** (string): Etiqueta que se muestra sobre el input
- **type** (string): Tipo de input (text, email, password, etc.) - default: 'text'
- **error** (object): Objeto de error de react-hook-form
- **className** (string): Clases CSS adicionales
- **...props**: Props adicionales (name, register, onChange, etc.)

#### Estilos:

**Base:**
```css
w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors
```

**Sin error:**
```css
border-gray-300 focus:ring-blue-500 focus:border-transparent
```

**Con error:**
```css
border-red-500 focus:ring-red-500 focus:border-red-500
```

#### Ejemplo de uso con react-hook-form:

```jsx
import { useForm } from 'react-hook-form';
import Input from './components/ui/Input';
import Button from './components/ui/Button';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    console.log(data);
    // Lógica de envío
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Input básico */}
      <Input
        id="name"
        label="Nombre Completo"
        type="text"
        {...register('name', { 
          required: 'El nombre es obligatorio',
          minLength: { value: 3, message: 'Mínimo 3 caracteres' }
        })}
        error={errors.name}
      />

      {/* Input de email con validación */}
      <Input
        id="email"
        label="Correo Electrónico"
        type="email"
        {...register('email', { 
          required: 'El email es obligatorio',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Email inválido'
          }
        })}
        error={errors.email}
        placeholder="ejemplo@correo.com"
      />

      {/* Input de contraseña */}
      <Input
        id="password"
        label="Contraseña"
        type="password"
        {...register('password', { 
          required: 'La contraseña es obligatoria',
          minLength: { value: 8, message: 'Mínimo 8 caracteres' }
        })}
        error={errors.password}
      />

      {/* Input de teléfono */}
      <Input
        id="phone"
        label="Teléfono"
        type="tel"
        {...register('phone')}
        error={errors.phone}
        placeholder="+1 (555) 123-4567"
      />

      {/* Botón de envío */}
      <Button 
        type="submit" 
        variant="primary"
        isLoading={isSubmitting}
      >
        Enviar Formulario
      </Button>
    </form>
  );
};

export default MyForm;
```

---

### 2. Button.jsx

Componente de botón con variantes, estado de carga y deshabilitado.

#### Props:

- **variant** (string): 'primary' o 'secondary' - default: 'primary'
- **className** (string): Clases CSS adicionales
- **isLoading** (boolean): Muestra spinner y deshabilita el botón - default: false
- **disabled** (boolean): Deshabilita el botón - default: false
- **children** (ReactNode): Contenido del botón
- **...props**: Props adicionales (onClick, type, etc.)

#### Estilos:

**Base:**
```css
py-3 px-6 rounded-lg shadow-md transition-colors w-full flex justify-center items-center font-bold
```

**Variant 'primary':**
```css
bg-blue-600 text-white hover:bg-blue-700
```

**Variant 'secondary':**
```css
bg-gray-200 text-gray-800 hover:bg-gray-300
```

**Disabled/Loading:**
```css
opacity-50 cursor-not-allowed
```

#### Ejemplo de uso:

```jsx
import Button from './components/ui/Button';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await someAsyncOperation();
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Botón primario normal */}
      <Button 
        variant="primary"
        onClick={handleClick}
      >
        Guardar Cambios
      </Button>

      {/* Botón secundario */}
      <Button 
        variant="secondary"
        onClick={() => console.log('Cancelar')}
      >
        Cancelar
      </Button>

      {/* Botón con loading */}
      <Button 
        variant="primary"
        isLoading={loading}
        onClick={handleClick}
      >
        Procesar Pago
      </Button>

      {/* Botón deshabilitado */}
      <Button 
        variant="primary"
        disabled={true}
      >
        No Disponible
      </Button>

      {/* Botón con ancho personalizado */}
      <Button 
        variant="primary"
        className="max-w-xs mx-auto"
      >
        Botón Centrado
      </Button>

      {/* Botón de submit en formulario */}
      <form onSubmit={handleSubmit}>
        <Button 
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          Enviar
        </Button>
      </form>
    </div>
  );
};
```

---

## Ejemplo Completo: Formulario de Contacto

```jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ContactForm = () => {
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error al enviar');

      toast.success('¡Mensaje enviado correctamente!');
      reset();
    } catch (error) {
      toast.error('Error al enviar el mensaje');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Formulario de Contacto
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Nombre Completo"
          type="text"
          {...register('name', { 
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' }
          })}
          error={errors.name}
          placeholder="Juan Pérez"
        />

        <Input
          id="email"
          label="Correo Electrónico"
          type="email"
          {...register('email', { 
            required: 'El email es obligatorio',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          })}
          error={errors.email}
          placeholder="juan@ejemplo.com"
        />

        <Input
          id="phone"
          label="Teléfono (opcional)"
          type="tel"
          {...register('phone')}
          error={errors.phone}
          placeholder="+1 (555) 123-4567"
        />

        <div className="w-full">
          <label 
            htmlFor="message" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Mensaje
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...register('message', { 
              required: 'El mensaje es obligatorio',
              minLength: { value: 10, message: 'Mínimo 10 caracteres' }
            })}
            placeholder="Escribe tu mensaje aquí..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Enviar Mensaje
          </Button>

          <Button 
            type="button"
            variant="secondary"
            onClick={() => reset()}
            disabled={isSubmitting}
          >
            Limpiar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
```

---

## Características Implementadas

### Input.jsx ✅
- ✅ Label sobre el input
- ✅ Soporte completo para react-hook-form (register, name, etc.)
- ✅ Manejo de errores con estilos visuales (border-red-500)
- ✅ Mensaje de error debajo del input
- ✅ Estilos base con Tailwind
- ✅ Focus states (ring azul normal, ring rojo en error)
- ✅ Forward ref para compatibilidad total con react-hook-form

### Button.jsx ✅
- ✅ Variants: 'primary' y 'secondary'
- ✅ Estado isLoading con spinner animado
- ✅ Estado disabled con estilos (opacity-50, cursor-not-allowed)
- ✅ Spinner simple con Tailwind (animate-spin)
- ✅ Estilos base con Tailwind
- ✅ Width completo (w-full)
- ✅ Flex centrado para contenido
- ✅ Forward ref para compatibilidad

---

## Validaciones Comunes con react-hook-form

```javascript
// Obligatorio
{ required: 'Este campo es obligatorio' }

// Email
{ 
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Email inválido'
  }
}

// Longitud mínima
{ minLength: { value: 3, message: 'Mínimo 3 caracteres' } }

// Longitud máxima
{ maxLength: { value: 50, message: 'Máximo 50 caracteres' } }

// Número mínimo
{ min: { value: 18, message: 'Debes ser mayor de 18 años' } }

// Patrón personalizado
{ 
  pattern: {
    value: /^[0-9]{10}$/,
    message: 'Teléfono debe tener 10 dígitos'
  }
}

// Validación personalizada
{
  validate: (value) => 
    value.includes('@') || 'Debe incluir un @'
}
```

---

## Integración con el Proyecto

Estos componentes están diseñados para:
- ✅ Trabajar con react-hook-form
- ✅ Funcionar con react-hot-toast para notificaciones
- ✅ Seguir los estilos de Tailwind CSS del proyecto
- ✅ Ser reutilizables en todo el proyecto
- ✅ Tener estados visuales claros (error, loading, disabled)

**Ubicación:** 
- `src/components/ui/Input.jsx`
- `src/components/ui/Button.jsx`

**Listos para usar en cualquier formulario del proyecto!** 🚀
