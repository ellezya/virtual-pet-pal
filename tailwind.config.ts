import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        bunny: {
          happy: "hsl(var(--bunny-happy))",
          neutral: "hsl(var(--bunny-neutral))",
          sad: "hsl(var(--bunny-sad))",
          pink: "hsl(var(--bunny-pink))",
        },
        fish: {
          orange: "hsl(var(--fish-orange))",
          yellow: "hsl(var(--fish-yellow))",
          tail: "hsl(var(--fish-tail))",
        },
        tank: {
          water: "hsl(var(--tank-water))",
          deep: "hsl(var(--tank-deep))",
          sand: "hsl(var(--tank-sand))",
        },
        habitat: {
          sky: "hsl(var(--habitat-sky))",
          grass: "hsl(var(--habitat-grass))",
          ground: "hsl(var(--habitat-ground))",
        },
        park: {
          sky: "hsl(var(--park-sky))",
          grass: "hsl(var(--park-grass))",
          path: "hsl(var(--park-path))",
        },
        room: {
          wall: "hsl(var(--room-wall))",
          floor: "hsl(var(--room-floor))",
        },
        status: {
          good: "hsl(var(--status-good))",
          medium: "hsl(var(--status-medium))",
          low: "hsl(var(--status-low))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        strong: "var(--shadow-strong)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        hop: {
          "0%, 100%": { transform: "translateY(0) scaleY(1)" },
          "15%": { transform: "translateY(-12px) scaleY(1.05)" },
          "30%": { transform: "translateY(-24px) scaleY(1.1)" },
          "50%": { transform: "translateY(-30px) scaleY(1.08)" },
          "70%": { transform: "translateY(-18px) scaleY(1.05)" },
          "85%": { transform: "translateY(-6px) scaleY(0.95)" },
        },
        "hop-small": {
          "0%, 100%": { transform: "translateY(0) scaleY(1)" },
          "50%": { transform: "translateY(-10px) scaleY(1.05)" },
        },
        squish: {
          "0%, 100%": { transform: "scaleX(1) scaleY(1)" },
          "50%": { transform: "scaleX(1.08) scaleY(0.92)" },
        },
        "ear-wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(3deg)" },
          "75%": { transform: "rotate(-3deg)" },
        },
        sniff: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "20%": { transform: "translateY(2px) rotate(-3deg)" },
          "40%": { transform: "translateY(0) rotate(0deg)" },
          "60%": { transform: "translateY(2px) rotate(3deg)" },
          "80%": { transform: "translateY(0) rotate(0deg)" },
        },
        "ear-scratch": {
          "0%, 100%": { transform: "rotate(0deg) translateX(0)" },
          "25%": { transform: "rotate(-8deg) translateX(-2px)" },
          "50%": { transform: "rotate(0deg) translateX(0)" },
          "75%": { transform: "rotate(-8deg) translateX(-2px)" },
        },
        nibble: {
          "0%, 100%": { transform: "translateY(0) scaleY(1)" },
          "25%": { transform: "translateY(4px) scaleY(0.95)" },
          "50%": { transform: "translateY(2px) scaleY(1)" },
          "75%": { transform: "translateY(4px) scaleY(0.95)" },
        },
        "look-around": {
          "0%, 100%": { transform: "scaleX(1)" },
          "30%": { transform: "scaleX(-1)" },
          "60%": { transform: "scaleX(1)" },
        },
        swim: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-4px) rotate(2deg)" },
          "75%": { transform: "translateY(4px) rotate(-2deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "object-hover": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        hop: "hop 0.6s ease-in-out",
        "hop-small": "hop-small 0.4s ease-in-out",
        squish: "squish 0.3s ease-out",
        "ear-wiggle": "ear-wiggle 0.4s ease-in-out",
        sniff: "sniff 1.2s ease-in-out",
        "ear-scratch": "ear-scratch 0.8s ease-in-out",
        nibble: "nibble 0.6s ease-in-out infinite",
        "look-around": "look-around 2s ease-in-out",
        swim: "swim 2s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out infinite",
        "bounce-slow": "bounce-slow 1.5s ease-in-out infinite",
        "object-hover": "object-hover 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
