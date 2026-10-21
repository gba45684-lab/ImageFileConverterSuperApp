import { defineConfig } from 'vite';

// Keep the normal root path for Vercel and local dev, and use the repository
// subpath only when the GitHub Pages workflow sets GITHUB_PAGES=true.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/ImageFileConverterSuperApp/' : '/',
});
