/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: 'var(--brand-primary)', // #22c55e (Verde H2D/Bambu)
                    secondary: 'var(--brand-secondary)', // #ffffff
                    accent: 'var(--brand-accent)', // #f59e0b (Naranja Alerta)
                    dark: 'var(--bg-dark)',
                    panel: 'var(--bg-panel)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'], // Tipografía moderna
            }
        },
    },
    plugins: [],
};