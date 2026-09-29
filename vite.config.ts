import {defineConfig} from 'vite';
// Rapier ships its WebAssembly inlined (~3.5 MB); keep it and three.js in their own
// long-cached chunks so game code changes don't re-download them.
// mockups/ holds design explorations; editing them must not reload running game pages.
export default defineConfig({optimizeDeps:{include:['three','three/addons/effects/OutlineEffect.js','three/addons/postprocessing/EffectComposer.js','three/addons/postprocessing/Pass.js','three/addons/postprocessing/GTAOPass.js','three/addons/postprocessing/UnrealBloomPass.js','three/addons/postprocessing/ShaderPass.js','three/addons/postprocessing/OutputPass.js','three/addons/loaders/GLTFLoader.js','three/addons/utils/BufferGeometryUtils.js','three/addons/geometries/RoundedBoxGeometry.js']},server:{watch:{ignored:['**/mockups/**','**/artifacts/**','**/test-results/**']}},build:{chunkSizeWarningLimit:4500,rollupOptions:{output:{manualChunks:{rapier:['@dimforge/rapier3d-compat'],three:['three']}}}}});
