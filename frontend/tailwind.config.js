// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Asegurarse de que rastrea todos los archivos JSX
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      // Definición de colores personalizados
      colors: {
        'primary-blue': '#007bff', // Azul principal de la iglesia
        'secondary-gold': '#ffcc00', // Dorado/Amarillo de acento
        'dark-text': '#2c3e50', // Texto oscuro (similar a un azul marino oscuro)
      },
      // Definición de fuentes personalizadas
      fontFamily: {
        // Ejemplo de fuente: usar 'sans' como fallback para una fuente de alto impacto.
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        // Para títulos: usar una fuente moderna y legible
        heading: ['Montserrat', 'Inter', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}