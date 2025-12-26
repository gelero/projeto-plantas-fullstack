/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'botanico': '#2D5A27',
        'salvia': '#84A98C',
        'terracota': '#E07A5F',
        'creme': '#F8F9FA',
      },
    },
  },
  plugins: [],
}