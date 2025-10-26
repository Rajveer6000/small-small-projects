# react-vite-tailwind-starter

Minimal starter for React + Vite + Tailwind CSS.

## Features
- React 18 + Vite
- Tailwind CSS with PostCSS
- Fast dev server and HMR
- Production build ready

## Prerequisites
- Node.js 16+
- npm / yarn / pnpm

## Quick start
1. Clone or create project:
    - git clone ... or create with `npm create vite@latest my-app -- --template react`
2. Install dependencies:
    - npm: `npm install`
    - pnpm: `pnpm install`
    - yarn: `yarn`
3. Run dev server:
    - npm: `npm run dev`
4. Build for production:
    - npm: `npm run build`
5. Preview production build:
    - npm: `npm run preview`

## NPM scripts
- dev: `vite`
- build: `vite build`
- preview: `vite preview`
- format: e.g. `prettier --write .` (if configured)

Example package.json scripts:
```
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "format": "prettier --write ."
}
```

## Tailwind setup (typical)
1. Install: `npm install -D tailwindcss postcss autoprefixer`
2. Init: `npx tailwindcss init -p`
3. tailwind.config.js: add content globs:
    ```
    module.exports = {
      content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
      theme: { extend: {} },
      plugins: [],
    }
    ```
4. In src/index.css:
    ```
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

## Project structure (suggested)
- src/
  - main.jsx
  - App.jsx
  - index.css
  - components/
- public/
- vite.config.js
- tailwind.config.js
- package.json
- README.md

## Environment
- Use `.env` or `.env.local` for runtime variables.
- Prefix client variables with VITE_ for Vite to expose them.

## Deployment
- Works with Vercel, Netlify, Surge, GitHub Pages (use build output in `dist/`).

## Contributing
- Open issues or PRs. Keep changes small and focused.

## License
- Add a license (e.g., MIT) in LICENSE file.

Notes: adjust to your preferred package manager, linters, and CI.