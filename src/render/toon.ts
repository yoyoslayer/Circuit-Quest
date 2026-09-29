import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OutlineRenderPass, toonGTAO, GradeShader } from './post';

export const INK = '#2b2d42';
const ramp = new T.DataTexture(new Uint8Array([90,90,90,255,185,185,185,255,255,255,255,255]),3,1,T.RGBAFormat);
ramp.minFilter = ramp.magFilter = T.NearestFilter;
ramp.needsUpdate = true;
export const toonRamp = ramp;
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
function backdrop(top:string,mid:string,bottom:string,glowColor:string){
  const c=document.createElement('canvas');c.width=1024;c.height=640;const g=c.getContext('2d')!;
  const grad=g.createLinearGradient(0,0,0,640);grad.addColorStop(0,top);grad.addColorStop(.55,mid);grad.addColorStop(1,bottom);g.fillStyle=grad;g.fillRect(0,0,1024,640);
  const r=g.createRadialGradient(512,330,0,512,330,520);r.addColorStop(0,glowColor);r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,1024,640);
  g.fillStyle='rgba(255,255,255,.035)';for(let k=0;k<60;k++){g.beginPath();g.arc((k*397)%1024,(k*211)%640,1+(k%3),0,7);g.fill();}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export interface Mood {key:[string,number];fill:number;rim:number;hemi:number;exposure:number;backdrop:[string,string,string,string]}
// One lighting rig (mockups/look/LOOK.md) with small per-level shifts in key colour and exposure.
export const MOODS:Record<string,Mood>={
  playground:{key:['#fff0d8',1.8],fill:.45,rim:.3,hemi:.9,exposure:1.02,backdrop:['#3f4a72','#2a2d4a','#181a2b','rgba(255,200,150,.2)']},
  meeting:{key:['#ffe2b8',1.75],fill:.45,rim:.35,hemi:.85,exposure:1,backdrop:['#4b4169','#2c2b4a','#191a2c','rgba(255,190,140,.22)']},
  lunch:{key:['#fff1d6',1.85],fill:.4,rim:.35,hemi:.9,exposure:1.03,backdrop:['#4a4466','#2b2c48','#191a2c','rgba(255,205,150,.24)']},
};
export function createRenderer(canvas:HTMLCanvasElement) {
  // Automated tests (?manual) and ?lowfx skip the expensive passes; software rendering can't afford them.
  const params=new URLSearchParams(location.search),low=params.has('lowfx')||(params.has('manual')&&!params.has('fullfx')),pixelRatio=Math.min(devicePixelRatio,1.5);
  const renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const effect = new OutlineEffect(renderer,{defaultThickness:.0036,defaultColor:[.13,.135,.2]});
  const scene = new T.Scene();
  const hemi = new T.HemisphereLight('#e4ebff','#9c7f66',.85);const ambient=new T.AmbientLight('#fff4e6',.18);scene.add(hemi,ambient);
  const sun = new T.DirectionalLight('#ffe2b8',1.75); sun.position.set(-11,21,13); sun.castShadow=true;
  sun.shadow.mapSize.setScalar(low?1024:4096);
  Object.assign(sun.shadow.camera,{left:-20.5,right:20.5,top:19,bottom:-19,near:1,far:70});sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0006; sun.shadow.normalBias=.035; sun.shadow.radius=2.5; scene.add(sun,sun.target);
  const fill = new T.DirectionalLight('#9db8ff',.45); fill.position.set(16,9,8);
  const rim = new T.DirectionalLight('#ffd6f0',.35); rim.position.set(6,12,-18); scene.add(fill,rim);
  const camera = new T.PerspectiveCamera(30,1,.1,200);
  // Composer: scene + outlines, ambient occlusion, bloom (only hot emissives), ACES output, grade.
  const target=new T.WebGLRenderTarget(innerWidth*pixelRatio,innerHeight*pixelRatio,{type:T.HalfFloatType,samples:low?0:4});
  const composer=new EffectComposer(renderer,target);composer.setPixelRatio(pixelRatio);
  composer.addPass(new OutlineRenderPass(effect,scene,camera));
  const ao=toonGTAO(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.85;
  ao.updateGtaoMaterial({radius:.55,distanceExponent:1.6,thickness:1.2,scale:1.25,samples:16,distanceFallOff:1,screenSpaceRadius:false});
  ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16});
  const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.35,.5,1.3);
  const grade=new ShaderPass(GradeShader);
  composer.addPass(ao);composer.addPass(bloom);composer.addPass(new OutputPass());composer.addPass(grade);
  // ?lowfx (or a slow machine, see Game.adaptQuality) drops the expensive passes.
  const setQuality=(level:0|1|2)=>{ao.enabled=level>=2;bloom.enabled=level>=1;};
  if(low)setQuality(0);
  const resize = () => { renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); grade.uniforms.resolution.value.set(innerWidth*pixelRatio,innerHeight*pixelRatio); };
  addEventListener('resize',resize); resize();
  const render=()=>composer.render();
  const mood=(id:string)=>{const m=MOODS[id]??MOODS.meeting;sun.color.set(m.key[0]);sun.intensity=m.key[1];fill.intensity=m.fill;rim.intensity=m.rim;hemi.intensity=m.hemi;renderer.toneMappingExposure=m.exposure;scene.background=backdrop(...m.backdrop);};
  mood('meeting');
  return {renderer,effect,scene,camera,sun,hemi,fill,mood,render,composer,setQuality};
}
