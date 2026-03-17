/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'neon-blue': '0 0 30px rgba(59, 130, 246, 0.5)',
        'neon-emerald': '0 0 30px rgba(16, 185, 129, 0.5)',
        'neon-rose': '0 0 30px rgba(244, 63, 94, 0.5)',
      }
    },
  },
  plugins: [],
}