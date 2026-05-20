/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.astro",
    "./src/layouts/**/*.astro",
    "./src/pages/**/*.astro",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        serif: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
