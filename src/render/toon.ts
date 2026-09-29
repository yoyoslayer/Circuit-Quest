import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const ramp = new T.DataTexture(new Uint8Array([90,90,90,255,185,185,185,255,255,255,255,255]),3,1,T.RGBAFormat);
ramp.minFilter = ramp.magFilter = T.NearestFilter;
ramp.needsUpdate = true;
const materials = new Map<string,T.MeshToonMaterial>();
export function toon(color:string):T.MeshToonMaterial {
  let material = materials.get(color);
  if (!material) { material = new T.MeshToonMaterial({color,gradientMap:ramp}); materials.set(color,material); }
  return material;
}
export function createRenderer(canvas:HTMLCanvasElement) {
  const renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  const effect = new OutlineEffect(renderer,{defaultThickness:.0034,defaultColor:[.17,.18,.26]});
  const scene = new T.Scene(); scene.background = new T.Color('#202333');
  scene.add(new T.HemisphereLight('#fff5e6','#859ab0',2.0));
  const sun = new T.DirectionalLight('#fff1d6',2.5); sun.position.set(-10,20,12); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:65});
  sun.shadow.normalBias=.04; scene.add(sun);
  const camera = new T.PerspectiveCamera(42,1,.1,150);
  const resize = () => { renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize',resize); resize();
  return {renderer,effect,scene,camera};
}
