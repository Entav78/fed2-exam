/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: [
        'Nunito',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'Liberation Sans',
        'Apple Color Emoji',
        'Segoe UI Emoji',
      ],
      heading: ['Nunito', 'inherit'],
    },
    extend: {
      /* map class names → CSS vars (RGB triplets) */
      colors: {
        // new concise tokens
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',

        header: 'rgb(var(--header) / <alpha-value>)',
        'on-header': 'rgb(var(--header-fg) / <alpha-value>)',

        card: 'rgb(var(--card) / <alpha-value>)',
        'card-fg': 'rgb(var(--card-fg) / <alpha-value>)',

        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',

        brand: 'rgb(var(--brand) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand) / <alpha-value>)',

        accent: 'rgb(var(--accent) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',

        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',

        /* aliases so your existing classes keep working */
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--card) / <alpha-value>)',
        text: 'rgb(var(--fg) / <alpha-value>)',
        'text-muted': 'rgb(var(--muted) / <alpha-value>)',

        'border-light': 'rgb(var(--border) / <alpha-value>)',
        'border-dark': 'rgb(var(--border) / <alpha-value>)',
        'form-bg': 'rgb(var(--card) / <alpha-value>)',
        'form-bg-dark': 'rgb(var(--input) / <alpha-value>)',
        'input-light': 'rgb(var(--input) / <alpha-value>)',
        'input-dark': 'rgb(var(--input) / <alpha-value>)',

        header: 'rgb(var(--brand) / <alpha-value>)',
        'header-hover': 'rgb(var(--brand) / <alpha-value>)',
        secondary: 'rgb(var(--accent) / <alpha-value>)',
        'secondary-hover': 'rgb(var(--accent) / <alpha-value>)',
        primary: 'rgb(var(--brand) / <alpha-value>)',
        'primary-hover': 'rgb(var(--brand) / <alpha-value>)',
        reveal: 'rgb(var(--brand) / <alpha-value>)',
        'reveal-hover': 'rgb(var(--brand) / <alpha-value>)',
        cardOld: 'rgb(var(--card) / <alpha-value>)',
        darkCard: 'rgb(var(--input) / <alpha-value>)',
        'text-base': 'rgb(var(--fg) / <alpha-value>)',
        'text-base-dark': 'rgb(var(--fg) / <alpha-value>)',
        'text-button-light': '#ffffff',
      },
    },
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1rem', md: '1.5rem', lg: '2rem' },
      screens: { '2xl': '72rem' },
    },
  },
  plugins: [],
};
