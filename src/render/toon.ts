import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export const INK = '#2b2d42';
const ramp = new T.DataTexture(new Uint8Array([90,90,90,255,185,185,185,255,255,255,255,255]),3,1,T.RGBAFormat);
ramp.minFilter = ramp.magFilter = T.NearestFilter;
ramp.needsUpdate = true;
export interface ToonOptions {emissive?:string;ei?:number;map?:T.Texture;opacity?:number}
const materials = new Map<string,T.MeshToonMaterial>();
// Materials are shared by colour/options so props batch into instanced meshes.
export function toon(color:string,opts:ToonOptions={}):T.MeshToonMaterial {
  const key = `${color}|${opts.emissive??''}|${opts.ei??''}|${opts.map?.uuid??''}|${opts.opacity??1}`;
  let material = materials.get(key);
  if (!material) {
    material = new T.MeshToonMaterial({color,gradientMap:ramp,map:opts.map??null});
    if (opts.emissive) { material.emissive = new T.Color(opts.emissive); material.emissiveIntensity = opts.ei??1; }
    if (opts.opacity!==undefined&&opts.opacity<1) { material.transparent = true; material.opacity = opts.opacity; material.depthWrite = false; }
    materials.set(key,material);
  }
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
  const scene = new T.Scene(); scene.background = new T.Color('#1d1f2b');
  // Lighting matches reference/render_kit: warm hemisphere, soft ambient, one shadowing sun.
  scene.add(new T.HemisphereLight('#fff5e6','#b89470',1.0),new T.AmbientLight('#ffffff',.25));
  const sun = new T.DirectionalLight('#fff1d6',1.6); sun.position.set(-10,20,12); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:65});
  sun.shadow.bias = -.0008; sun.shadow.normalBias=.04; scene.add(sun);
  const camera = new T.PerspectiveCamera(40,1,.1,150);
  const resize = () => { renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize',resize); resize();
  return {renderer,effect,scene,camera};
}
