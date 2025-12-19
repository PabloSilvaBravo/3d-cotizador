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
                    primary: 'var(--color-brand-primary)',
                    secondary: 'var(--color-brand-secondary)',
                    accent: 'var(--color-brand-accent)',
                    dark: 'var(--color-brand-dark)',
                    light: 'var(--color-brand-light)',
                }
            },
            fontFamily: {
                sans: ['Montserrat', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            },
        },
    },
    plugins: [],
}