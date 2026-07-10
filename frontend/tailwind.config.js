/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── LIQUID GLASS NAVY — paleta directa ────────────────────
        'bg':           '#0A1526',     // Deep Navy Canvas
        'bg-tint':      '#0F192B',
        'bg-soft':      '#131F33',

        'ink':          '#FFFFFF',     // Pure White Text
        'ink-2':        '#94A3B8',     // Muted Text
        'ink-3':        '#475569',

        'celeste':      '#3B82F6',     // Sapphire — primary
        'celeste-hov':  '#60A5FA',
        'celeste-soft': '#1E3A8A',     // Darker tint for navy bg

        'rose':         '#F43F5E',
        'rose-soft':    '#881337',
        'amber':        '#F59E0B',
        'amber-soft':   '#78350F',
        'emerald':      '#10B981',
        'emerald-soft': '#064E3B',

        // ── ALIAS LEGACY (compat con código existente) ──────────────
        'pri':         'var(--celeste)',
        'pri-press':   'var(--celeste-hov)',
        'on-pri':      '#FFFFFF',
        'pri-con':     'var(--celeste-soft)',
        'on-pri-con':  'var(--celeste-hov)',

        'sec':         'var(--bg-soft)',
        'on-sec':      '#FFFFFF',
        'sec-con':     'var(--bg)',
        'on-sec-con':  '#FFFFFF',

        'ter':         'var(--celeste)',
        'on-ter':      '#FFFFFF',
        'ter-con':     'var(--celeste-soft)',
        'on-ter-con':  'var(--celeste-hov)',

        'err':         'var(--rose)',
        'on-err':      '#FFFFFF',
        'err-con':     'var(--rose-soft)',
        'on-err-con':  '#FDA4AF',
        'warn':        'var(--amber)',
        'warn-con':    'var(--amber-soft)',
        'on-warn-con': '#FCD34D',
        'ok':          'var(--emerald)',
        'ok-con':      'var(--emerald-soft)',
        'on-ok-con':   '#6EE7B7',

        'surf':        '#0A1526',
        'surf-dim':    '#0F192B',
        'surf-low':    '#131F33',
        'surf-high':   '#1E293B',
        'on-surf':     '#FFFFFF',
        'on-surf-var': '#94A3B8',
        'outline':     '#334155',
        'outline-var': '#1E293B',

        'inv-surf':    '#FFFFFF',
        'inv-on-surf': '#0A1526',
        'inv-pri':     'var(--celeste)',

        // ── DARK ALIASES preservados (algunas páginas todavía los usan) ─
        // Mapean a tokens light para no romper visual mientras migramos.
        'abyss':       '#FFFFFF',
        'abyss2':      '#FAFBFD',
        'electric':    '#60A5FA',
        'navy':        '#0A1526',
        'navy-mid':    '#1E293B',
        'cream':       '#FAFBFD',
      },

      fontFamily: {
        sans:    ['Helvetica Neue', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Helvetica Neue', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif:   ['New York', 'Georgia', 'serif'],
        mono:    ['SF Mono', 'Cascadia Code', 'Consolas', 'Menlo', 'monospace'],
      },

      // ── Squircle radii (Apple HIG) ──────────────────────────────
      borderRadius: {
        'xs':     '8px',
        'sm':     '12px',
        'md':     '16px',
        'lg':     '20px',
        'xl':     '24px',
        '2xl':    '32px',
        '3xl':    '40px',
        'field':  '12px',
        'inner':  '16px',
        'card':   '24px',
        'modal':  '32px',
        'pill':   '9999px',
        'full':   '9999px',
      },

      boxShadow: {
        'whisper':  '0 8px 32px rgba(10, 21, 38, 0.08)',
        'card':     '0 12px 36px -12px rgba(10, 21, 38, 0.10), 0 2px 6px rgba(10, 21, 38, 0.04)',
        'card-lg':  '0 24px 60px -20px rgba(10, 21, 38, 0.18), 0 4px 12px rgba(10, 21, 38, 0.04)',
        'pop':      '0 24px 60px -16px rgba(59, 130, 246, 0.32), 0 6px 16px rgba(10, 21, 38, 0.08)',
        'pri':      '0 12px 32px -8px rgba(59, 130, 246, 0.45)',
        'pri-lg':   '0 20px 48px -12px rgba(59, 130, 246, 0.55)',
        'elev-1':   '0 1px 2px rgba(10, 21, 38, 0.04), 0 1px 3px rgba(10, 21, 38, 0.06)',
        'elev-2':   '0 4px 6px rgba(10, 21, 38, 0.04), 0 2px 4px rgba(10, 21, 38, 0.06)',
        'elev-3':   '0 10px 15px rgba(10, 21, 38, 0.08), 0 4px 6px rgba(10, 21, 38, 0.05)',
        'ring-pri': '0 0 0 4px rgba(59, 130, 246, 0.18)',
      },

      letterSpacing: {
        'tightest': '-0.05em',
        'tighter':  '-0.04em',
        'tightish': '-0.02em',
        // Antes 0.34em — el letterspacing exagerado delataba "look IA".
        // Apple usa labels en caps con tracking moderado.
        'widest':   '0.08em',
      },

      fontSize: {
        'display-l': ['clamp(4rem, 9vw, 8rem)',     { lineHeight: '0.92', letterSpacing: '-0.05em', fontWeight: '800' }],
        'display-m': ['clamp(3rem, 6vw, 5.5rem)',   { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-s': ['clamp(2.25rem, 4vw, 3.5rem)', { lineHeight: '1.0',  letterSpacing: '-0.03em', fontWeight: '800' }],
        'headline-l':['clamp(2.5rem, 5vw, 4rem)',   { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'headline-m':['2rem',                       { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-s':['1.5rem',                     { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-l':   ['1.5rem',  { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '700' }],
        'title-m':   ['1.125rem',{ lineHeight: '1.4',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'title-s':   ['1rem',    { lineHeight: '1.4',  fontWeight: '600' }],
        'body-l':    ['1.125rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'body-m':    ['1rem',    { lineHeight: '1.6',  fontWeight: '400' }],
        'body-s':    ['0.875rem',{ lineHeight: '1.55', fontWeight: '400' }],
        'label-l':   ['0.875rem',{ lineHeight: '1.4',  letterSpacing: '0.05em',  fontWeight: '600' }],
        'label-m':   ['0.75rem', { lineHeight: '1.3',  letterSpacing: '0.1em',   fontWeight: '600' }],
        'label-s':   ['0.6875rem',{ lineHeight: '1.3', letterSpacing: '0.15em',  fontWeight: '600' }],
        'mono':      ['0.6875rem',{ lineHeight: '1.3', letterSpacing: '0.2em',   fontWeight: '500' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },

      transitionTimingFunction: {
        'spring':     'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'standard':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
        'sharp':      'cubic-bezier(0.4, 0, 0.6, 1)',
      },

      backdropBlur: {
        'apple': '20px',
        'glass': '24px',
        'strong':'28px',
      },
      backdropSaturate: {
        'apple': '180%',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
      animation: {
        blob: 'blob 7s infinite',
      }
    },
  },
  plugins: [],
}
