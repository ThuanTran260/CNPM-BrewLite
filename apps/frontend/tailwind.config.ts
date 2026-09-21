import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f2f0eb',          // Nền kem ấm đặc trưng Starbucks
        ceramic: '#edebe9',         // Nền viền/separator
        house: '#1E3932',           // Xanh thẫm House Green (Header, Hero, Footer)
        primary: {
          DEFAULT: '#006241',       // Xanh Starbucks Classic
          accent: '#00754A',        // Xanh CTA chính
          hover: '#005a39',         // Hover state
          light: '#d4e9e2',         // Mint nhạt
        },
        gold: {
          DEFAULT: '#cba258',       // Vàng Loyalty / Rewards
          light: '#faf6ee',         // Nền vàng nhạt
        },
        ink: {
          DEFAULT: 'rgba(0, 0, 0, 0.87)', // Chữ chính
          muted: 'rgba(0, 0, 0, 0.58)',   // Chữ phụ
        },
      },
      fontFamily: {
        sans: ['Inter', 'Nunito Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      borderRadius: {
        'pill': '50px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'float': '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
