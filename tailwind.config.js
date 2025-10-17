/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 扩展蓝色系列以匹配 Linear 风格
        blue: {
          500: '#3498db',
          600: '#2980b9',
          400: '#5dade2',
        },
        // 自定义灰色系列
        gray: {
          50: '#fafafa',   // bg-primary
          100: '#f4f4f5',  // bg-tertiary
          200: '#e4e4e7',  // border
          300: '#d4d4d8',  // border-hover
          400: '#a1a1aa',  // text-tertiary
          500: '#71717a',  // text-secondary
          600: '#52525b',  // text-secondary-dark
          700: '#3f3f46',  // bg-tertiary-dark
          800: '#27272a',  // bg-secondary-dark
          900: '#18181b',  // text-primary
          950: '#0a0a0b',  // bg-primary-dark
        },
        // 状态颜色
        green: {
          500: '#10b981',
          100: '#d1fae5',
        },
        red: {
          500: '#ef4444',
          100: '#fee2e2',
        },
        amber: {
          500: '#f59e0b',
          100: '#fef3c7',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '0.875rem',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
