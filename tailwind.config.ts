import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Primary ───────────────────────────────────────
        primary:           "#9B4D4D",
        "primary-hover":   "#8A4343",
        "primary-active":  "#7A3A3A",
        "primary-surface": "#F5EAEA",

        // ─── Brand & Dark ──────────────────────────────────
        "brand-dark":      "#4A6670",
        "text-primary":    "#2C3E50",
        "text-heading":    "#1A1A2E",
        "text-secondary":  "#546E7A",
        "text-placeholder":"#7F8C8D",
        "text-disabled":   "#A3B1B2",

        // ─── Accent / AI ───────────────────────────────────
        accent:            "#C49A6C",
        "accent-bg":       "rgba(196, 154, 108, 0.15)",
        "accent-surface":  "#FDF6EC",
        "accent-warm":     "#D4C5A0",
        "accent-green":    "#7A8B6F",

        // ─── Surface & Background ──────────────────────────
        bg:                "#FAFAF7",
        surface:           "#FFFFFF",
        elevated:          "#F7F5F0",
        border:            "#E8E4DE",
        "border-light":    "#F0ECE6",

        // ─── Semantic ──────────────────────────────────────
        success:           "#7A8B6F",
        "success-surface": "#EDF2E8",
        warning:           "#C49A6C",
        "warning-surface": "#FDF6EC",
        error:             "#B85C5C",
        "error-surface":   "#F8EDED",
        info:              "#4A6670",
        "info-surface":    "#EBF0F2",

        // ─── Content Block Category Colors ─────────────────
        "block-self_intro": "#9B4D4D",
        "block-background": "#B8A9C9",
        "block-offer":      "#A8BF9A",
        "block-need":       "#C9A882",
        "block-custom":     "#9BB5C4",

        // ─── Tag Base Colors ───────────────────────────────
        "tag-belong": "#B8A9C9",
        "tag-offer":  "#A8BF9A",
        "tag-need":   "#C9A882",
        "tag-follow": "#9BB5C4",

        // ─── Tag Text Colors ───────────────────────────────
        "tag-belong-text": "#4A3F5C",
        "tag-offer-text":  "#3D5A2F",
        "tag-need-text":   "#6B5234",
        "tag-follow-text": "#3A5A6B",
      },
      fontFamily: {
        serif: ["'Noto Serif SC'", "'Source Han Serif SC'", "STSong", "SimSun", "serif"],
        sans:  ["'PingFang SC'", "-apple-system", "'Helvetica Neue'", "'Microsoft YaHei'", "sans-serif"],
        mono:  ["'SF Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "display":  ["24px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "600" }],
        "h1":       ["20px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "600" }],
        "h2":       ["17px", { lineHeight: "1.45", fontWeight: "600" }],
        "h3":       ["15px", { lineHeight: "1.45", fontWeight: "600" }],
        "body-lg":  ["16px", { lineHeight: "1.7" }],
        "body":     ["14px", { lineHeight: "1.6" }],
        "body-sm":  ["13px", { lineHeight: "1.55" }],
        "caption":  ["12px", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "500" }],
        "nano":     ["10px", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
      },
      borderRadius: {
        sm:  "4px",
        md:  "6px",
        lg:  "8px",
      },
      boxShadow: {
        xs:  "0 1px 2px rgba(44,62,80,0.04)",
        sm:  "0 1px 3px rgba(44,62,80,0.06)",
        md:  "0 2px 6px rgba(44,62,80,0.06), 0 4px 12px rgba(44,62,80,0.04)",
        lg:  "0 4px 12px rgba(44,62,80,0.08), 0 8px 24px rgba(44,62,80,0.06)",
        xl:  "0 8px 20px rgba(44,62,80,0.1), 0 16px 40px rgba(44,62,80,0.08)",
      },
      spacing: {
        xs:  "4px",
        sm:  "8px",
        md:  "12px",
        lg:  "16px",
        xl:  "24px",
        "2xl":"32px",
        "3xl":"48px",
        "4xl":"64px",
      },
      zIndex: {
        sticky:   "10",
        "card-hover": "20",
        dropdown: "100",
        modal:    "200",
        toast:    "300",
      },
      transitionTimingFunction: {
        damped: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "tag-pop-in": {
          from: { opacity: "0", transform: "scale(0.8)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translate(-50%, -50%) scale(0.95)" },
          to:   { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "slide-up-damped": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        "overlay-fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(-50%) translateY(-8px)" },
          to:   { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
        "placeholder-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "parsing-glow": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "field-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":      { transform: "translateX(-4px)" },
          "40%":      { transform: "translateX(4px)" },
          "60%":      { transform: "translateX(-2px)" },
          "80%":      { transform: "translateX(2px)" },
        },
        "skeleton-shimmer": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "dot-jump": {
          "0%, 60%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "30%":           { opacity: "1", transform: "scale(1)" },
        },
        "delta-pulse": {
          "0%, 100%": { borderColor: "#C49A6C" },
          "50%":      { borderColor: "rgba(196,154,108,0.4)" },
        },
        "review-fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pub-check-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "tag-confirm": {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "tag-pop-in":      "tag-pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        "modal-in":        "modal-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "slide-up-damped": "slide-up-damped 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "overlay-fade-in": "overlay-fade-in 0.2s ease-out",
        "toast-in":        "toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        "placeholder-pulse": "placeholder-pulse 3s ease-in-out infinite",
        "parsing-glow":    "parsing-glow 1.5s ease-in-out infinite",
        "field-shake":     "field-shake 0.4s ease-out",
        "skeleton-shimmer":"skeleton-shimmer 1.8s ease-in-out infinite",
        "dot-jump":        "dot-jump 1.4s ease-in-out infinite",
        "delta-pulse":     "delta-pulse 2s ease-in-out infinite",
        "review-fade-in":  "review-fade-in 0.4s ease-out",
        "pub-check-in":    "pub-check-in 0.5s ease-out forwards",
        "tag-confirm":     "tag-confirm 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        spin:              "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
