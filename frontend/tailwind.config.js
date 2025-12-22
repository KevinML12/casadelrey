/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LIGHT MODE - Adaptado al Logo (Azul Marino y Blanco)
        'primary': '#1A237E', 	  // Azul Marino Profundo (Acento de la Iglesia)
        'primary-dark': '#0F172A', 	// Tono más oscuro (casi negro)
        'primary-light': '#5C6BC0', 	// Tono más claro para hover
        'accent': '#1A237E',      // Usaremos primary como acento general
        
        // Light Mode Backgrounds
        'bg-light': '#FAFAFA', 	  // Blanco/Gris muy claro (Soft UI)
        'bg-light-alt': '#F4F5F7', 	// Gris más suave para bloques
        'bg-secondary': '#E5E7EB', 	// Gris claro
        'card-bg': '#FFFFFF', 	  // Tarjeta blanca
        
        // Light Mode Text
        'text-primary': '#0066FF', 	// Texto principal es el color del logo
        'text-secondary': '#5E6A7C', 	// Texto secundario gris
        'text-muted': '#9CA3AF', 	  // Texto tenue
        'text-light': '#F1F5F9', 	  // Texto claro (para dark mode)
        
        // Light Mode Borders
        'border-light': '#E2E8F0', 	// Borde suave
        'border-medium': '#CBD5E1', 	// Borde medio
        
        // DARK MODE - (Mantener el esquema oscuro de Slate/Slate-900 para contraste)
        'dark-bg': '#0F172A', 	    // Fondo oscuro primario
        'dark-bg-secondary': '#1E293B', // Fondo secundario
        'dark-card-bg': '#1E293B', 	// Tarjeta oscura
        'dark-text-primary': '#F1F5F9', // Texto claro
        'dark-text-secondary': '#CBD5E1', // Texto secundario claro
        'dark-border': '#475569', 	// Borde en dark mode
        
        // Estados
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#DC2626',
        'info': '#06B6D4',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        // Neumorphism + Soft UI (Apple/Shopify style)
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        'none': 'none',
      },
      borderRadius: {
        'card': '12px',
        'button': '10px',
        'input': '10px',
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
    },
  },
  plugins: [],
}

