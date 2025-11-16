// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#007bff',
        'secondary-gold': '#ffcc00',
        'dark-text': '#2c3e50',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], 
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}