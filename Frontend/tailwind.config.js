/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        accent: "#ec4899",
        "bg-base": "#0f0f13",
        "bg-surface": "#18181f",
        "bg-card": "#1e1e28",
        "text-primary": "#f1f1f5",
        "text-muted": "#8b8ba0",
        "score-vector": "#818cf8",
        "score-bm25": "#f472b6",
        "score-hybrid": "#34d399"
      }
    }
  }
};
