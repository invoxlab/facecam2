/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        invox: {
          blue: '#3E9FD9',
          dark: '#004261',
          yellow: '#FFDE00',
          orange: '#F4704D',
        },
      },
    },
  },
  plugins: [],
}
