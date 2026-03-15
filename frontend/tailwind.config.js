/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Tokens semánticos ─────────────────────────────────────
        // Se definen como CSS variables en index.css
        // Cambian automáticamente con la clase `dark` en <html>
        // NO necesitas prefijo dark: en los componentes
        'bg':     'var(--bg)',
        'bg-2':   'var(--bg-2)',
        'card':   'var(--card)',
        'card-2': 'var(--card-2)',
        'ink':    'var(--ink)',
        'ink-2':  'var(--ink-2)',
        'ink-3':  'var(--ink-3)',
        'line':   'var(--line)',

        // ── Colores estáticos de marca ────────────────────────────
        // Siempre el mismo valor, en light y dark
        'navy':   '#0D1B3E',
        'navy-d': '#070E20',
        'navy-l': '#1E3A6E',

        'blue':   '#2563EB',
        'blue-d': '#1D4ED8',
        'blue-l': '#60A5FA',

        'gold':   '#F59E0B',
        'gold-d': '#D97706',
        'gold-l': '#FCD34D',

        // ── Estados ───────────────────────────────────────────────
        'ok':   '#10B981',
        'warn': '#F59E0B',
        'err':  '#EF4444',
        'info': '#06B6D4',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      boxShadow: {
        xs:   '0 1px 2px rgba(0,0,0,0.04)',
        sm:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
        lg:   '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
        xl:   '0 20px 25px rgba(0,0,0,0.07), 0 10px 10px rgba(0,0,0,0.04)',
        // Light mode: borde suave + sombra difusa
        card: '0 0 0 1px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 0 0 1px rgba(37,99,235,0.2), 0 4px 20px rgba(0,0,0,0.10)',
        // Dark mode: sombra más profunda para elevar sin borde visible
        'card-dark': '0 0 0 1px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.30)',
        'blue-glow': '0 0 0 3px rgba(37,99,235,0.25)',
        'gold-glow': '0 4px 20px rgba(245,158,11,0.28)',
      },

      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '28px',
      },

      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #070E20 0%, #0D1B3E 55%, #1E3A6E 100%)',
        'blue-gradient': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      },

      animation: {
        'fade-in':  'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'float':    'float 6s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
