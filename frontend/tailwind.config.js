module.exports = {
  darkMode: "class", // or 'media', doesn't matter for this bit
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [require("@tailwindcss/typography")],
};
