/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── M3 Color Roles ─────────────────────────────────────────
        // Todos mapeados a CSS variables definidas en index.css
        // Cambian automáticamente con [data-theme="dark"] en <html>

        // Primary
        'pri':        'var(--pri)',
        'on-pri':     'var(--on-pri)',
        'pri-con':    'var(--pri-con)',
        'on-pri-con': 'var(--on-pri-con)',

        // Secondary
        'sec':        'var(--sec)',
        'on-sec':     'var(--on-sec)',
        'sec-con':    'var(--sec-con)',
        'on-sec-con': 'var(--on-sec-con)',

        // Tertiary
        'ter':        'var(--ter)',
        'on-ter':     'var(--on-ter)',
        'ter-con':    'var(--ter-con)',
        'on-ter-con': 'var(--on-ter-con)',

        // Error
        'err':        'var(--err)',
        'on-err':     'var(--on-err)',
        'err-con':    'var(--err-con)',
        'on-err-con': 'var(--on-err-con)',

        // Surface scale
        'surf':       'var(--surf)',
        'surf-dim':   'var(--surf-dim)',
        'surf-low':   'var(--surf-low)',
        'surf-high':  'var(--surf-high)',
        'on-surf':    'var(--on-surf)',
        'on-surf-var':'var(--on-surf-var)',

        // Outline
        'outline':    'var(--outline)',
        'outline-var':'var(--outline-var)',

        // Inverse (para hero / footer fijos en dark)
        'inv-surf':    'var(--inv-surf)',
        'inv-on-surf': 'var(--inv-on-surf)',
        'inv-pri':     'var(--inv-pri)',

        // ── Brand estático (hero siempre oscuro) ───────────────────
        'hero-bg':   '#0A1145',
        'hero-text': '#A4C8FF',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      // ── M3 Shape Scale ───────────────────────────────────────────
      borderRadius: {
        'none': '0px',
        'xs':   '4px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '28px',
        'full': '9999px',
      },

      // ── M3 Elevation shadows ─────────────────────────────────────
      boxShadow: {
        'elev-1': '0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15)',
        'elev-2': '0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15)',
        'elev-3': '0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3)',
        'elev-4': '0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.3)',
        'elev-5': '0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px rgba(0,0,0,.3)',
      },

      // ── M3 Typography Scale ──────────────────────────────────────
      fontSize: {
        'display-l': ['clamp(3rem,6vw,5.5rem)',  { lineHeight: '1.05', letterSpacing: '-.03em',  fontWeight: '900' }],
        'display-m': ['clamp(2.25rem,4vw,3.75rem)',{ lineHeight: '1.1',  letterSpacing: '-.02em', fontWeight: '800' }],
        'display-s': ['2.25rem',                  { lineHeight: '1.15', letterSpacing: '-.01em',  fontWeight: '800' }],
        'headline-l':['2rem',                     { lineHeight: '1.25', fontWeight: '700' }],
        'headline-m':['1.75rem',                  { lineHeight: '1.3',  fontWeight: '700' }],
        'headline-s':['1.5rem',                   { lineHeight: '1.35', fontWeight: '600' }],
        'title-l':   ['1.375rem',                 { lineHeight: '1.4',  letterSpacing: '.0125em', fontWeight: '600' }],
        'title-m':   ['1rem',                     { lineHeight: '1.5',  letterSpacing: '.009em',  fontWeight: '600' }],
        'title-s':   ['.875rem',                  { lineHeight: '1.5',  letterSpacing: '.007em',  fontWeight: '600' }],
        'body-l':    ['1rem',                     { lineHeight: '1.65', letterSpacing: '.031em',  fontWeight: '400' }],
        'body-m':    ['.9375rem',                 { lineHeight: '1.6',  letterSpacing: '.016em',  fontWeight: '400' }],
        'body-s':    ['.875rem',                  { lineHeight: '1.6',  letterSpacing: '.025em',  fontWeight: '400' }],
        'label-l':   ['.875rem',                  { lineHeight: '1.4',  letterSpacing: '.006em',  fontWeight: '600' }],
        'label-m':   ['.75rem',                   { lineHeight: '1.3',  letterSpacing: '.031em',  fontWeight: '600' }],
        'label-s':   ['.6875rem',                 { lineHeight: '1.3',  letterSpacing: '.062em',  fontWeight: '600' }],
      },

      animation: {
        'fade-in':  'fadeIn .3s ease-out both',
        'slide-up': 'slideUp .35s ease-out both',
      },

      keyframes: {
        fadeIn:  { from: { opacity: '0' },                          to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
