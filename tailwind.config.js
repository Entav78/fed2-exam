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
      colors: {
        // Core semantic tokens (match themes.css RGB vars)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',

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
        danger: 'rgb(var(--danger)  / <alpha-value>)',

        // Header bar (use header-* variables everywhere in themes.css)
        header: 'rgb(var(--header-bg) / <alpha-value>)',
        'on-header': 'rgb(var(--header-fg) / <alpha-value>)',

        // ---- Temporary aliases (to avoid breaking while you migrate) ----
        // You can remove these later.
        text: 'rgb(var(--fg) / <alpha-value>)',
        'text-muted': 'rgb(var(--muted) / <alpha-value>)',
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--card) / <alpha-value>)',

        // Old names that appeared in code; map them to the new tokens
        'border-light': 'rgb(var(--border) / <alpha-value>)', // alias -> use `border` then `/opacity`
        'border-dark': 'rgb(var(--border) / <alpha-value>)',
        cardOld: 'rgb(var(--card) / <alpha-value>)',
        darkCard: 'rgb(var(--input) / <alpha-value>)',
        primary: 'rgb(var(--brand) / <alpha-value>)',
        'primary-hover': 'rgb(var(--brand) / <alpha-value>)',
        secondary: 'rgb(var(--accent) / <alpha-value>)',
        'secondary-hover': 'rgb(var(--accent) / <alpha-value>)',
        reveal: 'rgb(var(--brand) / <alpha-value>)',
        'reveal-hover': 'rgb(var(--brand) / <alpha-value>)',
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
