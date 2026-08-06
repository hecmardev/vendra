import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// Tokens semánticos de shadcn/ui mapeados a variables CSS.
// El branding por dealer se logra sobreescribiendo estas variables en el
// layout root según el dealer_id resuelto (ver app/globals.css y app/layout.tsx).
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './views/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1280px' }
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        cta: {
          DEFAULT: 'hsl(var(--cta))',
          foreground: 'hsl(var(--cta-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}

export default config
