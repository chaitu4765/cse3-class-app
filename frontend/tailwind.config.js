/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F4F0E4',
          muted: '#2C5282',
          dark: '#537D96',
          accent: '#EC8F8D',
        },
        slate: {
          850: '#1e293b',
          950: '#0f172a',
        },
        primary: {
          DEFAULT: '#2C5282',
          glow: 'rgba(44, 82, 130, 0.1)',
        },
        secondary: {
          DEFAULT: '#537D96',
        },
        accent: {
          DEFAULT: '#EC8F8D',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #99B5D9 0%, #4C77AC 100%)',
        'mesh-gradient': "radial-gradient(at 0% 0%, var(--mesh-1) 0, transparent 50%), radial-gradient(at 50% 0%, var(--mesh-2) 0, transparent 50%), radial-gradient(at 100% 0%, var(--mesh-3) 0, transparent 50%)",
      },
    },
  },
  plugins: [],
}
