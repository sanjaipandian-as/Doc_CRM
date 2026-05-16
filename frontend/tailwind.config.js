/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // This makes sure 'bg-green-800' uses your specific #005500 brand color
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          700: '#006600',
          800: '#005500', // YOUR BRAND COLOR
          900: '#004400',
        }
      },
    },
  },
  plugins: [],
}