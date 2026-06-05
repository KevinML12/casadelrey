/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── Casa del Rey Brand System ──────────────────────────────
        // CSS vars en index.css — auto switch en [data-theme="dark"]

        // Marca: Navy primario
        'pri':         'var(--pri)',
        'pri-press':   'var(--pri-press)',
        'on-pri':      'var(--on-pri)',
        'pri-con':     'var(--pri-con)',
        'on-pri-con':  'var(--on-pri-con)',

        // Acento celeste
        'sec':         'var(--sec)',
        'on-sec':      'var(--on-sec)',
        'sec-con':     'var(--sec-con)',
        'on-sec-con':  'var(--on-sec-con)',

        // Violeta opcional (eventos juveniles)
        'ter':         'var(--ter)',
        'on-ter':      'var(--on-ter)',
        'ter-con':     'var(--ter-con)',
        'on-ter-con':  'var(--on-ter-con)',

        // Estados
        'err':         'var(--err)',
        'on-err':      'var(--on-err)',
        'err-con':     'var(--err-con)',
        'on-err-con':  'var(--on-err-con)',
        'warn':        'var(--warn)',
        'warn-con':    'var(--warn-con)',
        'on-warn-con': 'var(--on-warn-con)',
        'ok':          'var(--ok)',
        'ok-con':      'var(--ok-con)',
        'on-ok-con':   'var(--on-ok-con)',

        // Superficies
        'surf':        'var(--surf)',
        'surf-dim':    'var(--surf-dim)',
        'surf-low':    'var(--surf-low)',
        'surf-high':   'var(--surf-high)',
        'on-surf':     'var(--on-surf)',
        'on-surf-var': 'var(--on-surf-var)',

        // Outline
        'outline':     'var(--outline)',
        'outline-var': 'var(--outline-var)',

        // Inverse (hero/footer siempre dark)
        'inv-surf':    'var(--inv-surf)',
        'inv-on-surf': 'var(--inv-on-surf)',
        'inv-pri':     'var(--inv-pri)',

        // Brand estático (independiente de tema)
        'navy':       '#0D1B4B',
        'navy-deep':  '#060D24',
        'navy-press': '#091237',
        'celeste':    '#4AD0CE',
        'turquoise':  '#4AD0CE',
        'violet':     '#7C3AED',
        'cream':      '#FAFAF8',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif:   ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      // ── Radios ──────────────────────────────────────────────────
      borderRadius: {
        'none': '0px',
        'xs':   '4px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '24px',
        '2xl':  '28px',
        '3xl':  '32px',
        'pill': '9999px',
        'full': '9999px',
      },

      // ── Sombras Apple-style sutiles ─────────────────────────────
      boxShadow: {
        'elev-1': '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        'elev-2': '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)',
        'elev-3': '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
        'elev-4': '0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)',
        'elev-5': '0 25px 50px rgba(0,0,0,0.15)',
        'ring-pri':    '0 0 0 3px rgba(13, 27, 75, 0.20)',
        'ring-sec':    '0 0 0 3px rgba(74, 208, 206, 0.30)',
        'ring-err':    '0 0 0 3px rgba(220, 38, 38, 0.20)',
      },

      // ── Escala tipográfica ──────────────────────────────────────
      fontSize: {
        // Display — solo hero principal con LUZ PARA LAS NACIONES
        'display-l': ['clamp(4rem, 9vw, 8rem)',    { lineHeight: '0.95', letterSpacing: '-0.05em', fontWeight: '900' }],
        'display-m': ['clamp(3rem, 6vw, 5.5rem)',  { lineHeight: '1.0',  letterSpacing: '-0.04em', fontWeight: '900' }],
        'display-s': ['clamp(2.25rem, 4vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],

        // Headlines — Apple-style peso 700 max
        'headline-l': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-m': ['2rem',                     { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-s': ['1.5rem',                   { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],

        // Titles
        'title-l':   ['1.5rem',    { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'title-m':   ['1.125rem',  { lineHeight: '1.4',  fontWeight: '600' }],
        'title-s':   ['1rem',      { lineHeight: '1.4',  fontWeight: '600' }],

        // Body
        'body-l':    ['1.125rem',  { lineHeight: '1.6',  fontWeight: '400' }],
        'body-m':    ['1rem',      { lineHeight: '1.6',  fontWeight: '400' }],
        'body-s':    ['0.875rem',  { lineHeight: '1.55', fontWeight: '400' }],

        // Labels — uppercase con tracking
        'label-l':   ['0.875rem',  { lineHeight: '1.4',  letterSpacing: '0.05em',  fontWeight: '600' }],
        'label-m':   ['0.75rem',   { lineHeight: '1.3',  letterSpacing: '0.1em',   fontWeight: '600' }],
        'label-s':   ['0.6875rem', { lineHeight: '1.3',  letterSpacing: '0.15em',  fontWeight: '600' }],

        // Mono editorial
        'mono':      ['0.6875rem', { lineHeight: '1.3',  letterSpacing: '0.2em',   fontWeight: '500', fontFamily: 'JetBrains Mono, SF Mono, monospace' }],
      },

      // ── Spacing extra (escala 4px) ──────────────────────────────
      spacing: {
        '18':  '4.5rem',   // 72
        '22':  '5.5rem',   // 88
        '30':  '7.5rem',   // 120
        '34':  '8.5rem',   // 136
      },

      // ── Animation ───────────────────────────────────────────────
      animation: {
        'fade-in':   'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1) both',
        'slide-up':  'slideUp 300ms cubic-bezier(0, 0, 0.2, 1) both',
        'shake':     'shake 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
        'hero-1':    'heroReveal 600ms cubic-bezier(0, 0, 0.2, 1) 100ms both',
        'hero-2':    'heroReveal 600ms cubic-bezier(0, 0, 0.2, 1) 220ms both',
        'hero-3':    'heroReveal 600ms cubic-bezier(0, 0, 0.2, 1) 340ms both',
        'hero-4':    'heroReveal 400ms cubic-bezier(0, 0, 0.2, 1) 460ms both',
        'hero-5':    'heroReveal 400ms cubic-bezier(0, 0, 0.2, 1) 580ms both',
      },

      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-4px)' },
          '40%':      { transform: 'translateX(4px)' },
          '60%':      { transform: 'translateX(-3px)' },
          '80%':      { transform: 'translateX(3px)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to:   { backgroundPosition: '200% center' },
        },
        heroReveal: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ── Transition timing functions ─────────────────────────────
      transitionTimingFunction: {
        'standard':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sharp':      'cubic-bezier(0.4, 0, 0.6, 1)',
      },

      // ── Backdrop blur Apple ─────────────────────────────────────
      backdropBlur: {
        'apple': '20px',
      },
      backdropSaturate: {
        'apple': '180%',
      },
    },
  },
  plugins: [],
}
