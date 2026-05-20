/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Outfit-Bold"],
        body: ["Inter-Regular"],
        "body-medium": ["Inter-Medium"],
        "body-semibold": ["Inter-SemiBold"],
      },
      colors: {
        primary: {
          DEFAULT: "hsl(221, 100%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
          muted: "hsl(221, 100%, 96%)",
        },
        secondary: {
          DEFAULT: "hsl(210, 40%, 96%)",
          foreground: "hsl(222, 47%, 11%)",
        },
        accent: {
          DEFAULT: "hsl(262, 83%, 58%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        background: "hsl(210, 40%, 98%)",
        card: "hsl(0, 0%, 100%)",
        border: "hsl(214, 32%, 91%)",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
  darkMode: 'class', // ERR-001 예방: NativeWind 다크모드 지원
}
