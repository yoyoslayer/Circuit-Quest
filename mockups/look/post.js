// Portable renderer + post stack for Circuit Crew (three r186, WebGLRenderer).
// Drop-in replacement for src/render/toon.ts#createRenderer: same toon/OutlineEffect look,
// but rendered through an EffectComposer so we can add AO, bloom and a grade.
import * as THREE from 'three';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/** OutlineEffect can't be a composer pass by itself: it draws straight to whatever render
 *  target is bound. This pass binds the composer's read buffer and lets it draw there
 *  (scene + inverted-hull outlines), exactly like RenderPass does for a plain render. */
export class OutlineRenderPass extends Pass {
  constructor(effect, scene, camera) { super(); this.effect = effect; this.scene = scene; this.camera = camera; this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer) {
    const autoClear = renderer.autoClear; renderer.autoClear = true; this.effect.autoClear = true;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.effect.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}

/** GTAO that ignores sprites, glow cards, light shafts and see-through glass
 *  (they would otherwise write depth into the AO g-buffer and cast dark halos). */
export class ToonGTAOPass extends GTAOPass {
  _overrideVisibility() {
    super._overrideVisibility();
    const cache = this._visibilityCache;
    this.scene.traverse(o => {
      if (!o.visible) return;
      const m = o.material;
      if (o.isSprite || o.userData.noAO || (m && !Array.isArray(m) && m.transparent && m.opacity < .99) || (m && m.blending === THREE.AdditiveBlending)) { o.visible = false; cache.push(o); }
    });
  }
}

/** Display-space grade: warm/cool split tone, saturation, contrast, vignette, fine grain. */
export const GradeShader = {
  uniforms: {
    tDiffuse: {value: null},
    saturation: {value: 1.12}, contrast: {value: 1.06},
    shadowTint: {value: new THREE.Color('#3b4a8a')}, highlightTint: {value: new THREE.Color('#ffd9a8')},
    splitAmount: {value: .07}, vignette: {value: .32}, vignetteSoft: {value: .55}, grain: {value: .018},
    resolution: {value: new THREE.Vector2(1, 1)},
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float saturation,contrast,splitAmount,vignette,vignetteSoft,grain;
    uniform vec3 shadowTint,highlightTint; uniform vec2 resolution; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec4 c=texture2D(tDiffuse,vUv); vec3 col=c.rgb;
      float l=dot(col,vec3(.2126,.7152,.0722));
      col=mix(vec3(l),col,saturation);
      col=(col-.5)*contrast+.5;
      col+= (shadowTint-.5)*splitAmount*(1.-smoothstep(.0,.55,l)) + (highlightTint-.5)*splitAmount*smoothstep(.45,1.,l);
      vec2 q=vUv-.5; q.x*=resolution.x/resolution.y*.8;
      float v=smoothstep(.95,.95-vignetteSoft,length(q)*1.25); col*=mix(1.-vignette,1.,v);
      col+= (hash(vUv*resolution+fract(l*7.))-.5)*grain;
      gl_FragColor=vec4(clamp(col,0.,1.),c.a);
    }`,
};

export function createLookRenderer({canvas, width = innerWidth, height = innerHeight, pixelRatio = Math.min(devicePixelRatio, 1.5), post = true} = {}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft was removed in r18x
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const effect = new OutlineEffect(renderer, {defaultThickness: .0036, defaultColor: [.13, .135, .2], defaultAlpha: 1});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width / height, .1, 200);

  if (!post) { // plain path = what the game does today (OutlineEffect straight to the canvas)
    const render = () => { renderer.setRenderTarget(null); effect.render(scene, camera); };
    const resize = (nw, nh) => { renderer.setSize(nw, nh, false); camera.aspect = nw / nh; camera.updateProjectionMatrix(); };
    return {renderer, effect, scene, camera, composer: null, passes: {ao: {}, bloom: {}, grade: {}}, render, resize};
  }
  const w = Math.round(width * pixelRatio), h = Math.round(height * pixelRatio);
  const target = new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, samples: 4});
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(pixelRatio); composer.setSize(width, height);
  const passes = {};
  passes.scene = new OutlineRenderPass(effect, scene, camera); composer.addPass(passes.scene);
  passes.ao = new ToonGTAOPass(scene, camera, w, h);
  passes.ao.blendIntensity = .85;
  passes.ao.updateGtaoMaterial({radius: .55, distanceExponent: 1.6, thickness: 1.2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false});
  passes.ao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16});
  composer.addPass(passes.ao);
  passes.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), .35, .5, 1.3); composer.addPass(passes.bloom);
  passes.output = new OutputPass(); composer.addPass(passes.output);
  passes.grade = new ShaderPass(GradeShader); passes.grade.uniforms.resolution.value.set(w, h); composer.addPass(passes.grade);

  const render = () => { if (post) composer.render(); else { renderer.setRenderTarget(null); effect.render(scene, camera); } };
  const resize = (nw, nh) => { renderer.setSize(nw, nh, false); composer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix(); passes.grade.uniforms.resolution.value.set(nw * pixelRatio, nh * pixelRatio); };
  return {renderer, effect, scene, camera, composer, passes, render, resize};
}
