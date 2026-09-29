import {defineConfig} from 'vite';
// Rapier ships its WebAssembly inlined (~3.5 MB); keep it and three.js in their own
// long-cached chunks so game code changes don't re-download them.
// mockups/ holds design explorations; editing them must not reload running game pages.
export default defineConfig({server:{watch:{ignored:['**/mockups/**','**/artifacts/**','**/test-results/**']}},build:{chunkSizeWarningLimit:4500,rollupOptions:{output:{manualChunks:{rapier:['@dimforge/rapier3d-compat'],three:['three']}}}}});
