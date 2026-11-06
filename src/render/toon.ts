import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OutlineRenderPass, toonGTAO, GradeShader } from './post';

export const INK = '#2b2d42';
// Soft-cel ramp: three readable bands whose edges are blended over a few texels, so forms read
// rounded instead of posterised (?hardcel restores the original 3-step ramp).
const hard=new URLSearchParams(location.search).has('hardcel');
const bands=hard?[90,185,255]:[92,96,120,168,196,226,246,255];
const ramp = new T.DataTexture(new Uint8Array(bands.flatMap(v=>[v,v,v,255])),bands.length,1,T.RGBAFormat);
ramp.minFilter = ramp.magFilter = hard?T.NearestFilter:T.LinearFilter;
ramp.needsUpdate = true;
export const toonRamp = ramp;
export interface ToonOptions {emissive?:string;ei?:number;map?:T.Texture;opacity?:number}
const materials = new Map<string,T.MeshToonMaterial>();
// A thin cool rim on edges that face up and away from the camera (sky bounce): separates props from
// pale floors and walls without adding light. ?norim turns it off for comparison.
const noRim=new URLSearchParams(location.search).has('norim');
export const rimUniforms={rimColor:{value:new T.Color('#b9cdff')},rimStrength:{value:.22}};
/** Injects the rim into a toon shader (chain it before other edits on '#include <opaque_fragment>'). */
export function rimShader(s:T.WebGLProgramParametersWithUniforms){
  Object.assign(s.uniforms,rimUniforms);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 rimColor; uniform float rimStrength;').replace('#include <opaque_fragment>',`
    { vec3 N=normalize(normal), V=normalize(vViewPosition);
      float edge=smoothstep(.62,.92,1.-max(dot(N,V),0.));
      float up=smoothstep(-.2,.6,N.y);
      outgoingLight+=rimColor*edge*up*rimStrength*diffuseColor.rgb; }
    #include <opaque_fragment>`);
}
// See-through (AGENTS rule 8, DR-12): whatever stands between the camera and Pip, close to him on
// screen, dithers away in an oval around him, so shelves, racks, cabinets, pillars and props never
// hide him. It works per fragment, so merged decor and instanced props need no registration.
// Game.updateCamera fills these each frame. They are shared by reference into every material's
// uniforms (UniformsUtils.clone copies plain objects by reference), and shadow materials don't get
// them, so shadows stay whole. A material opts out with defines.SEE_OFF (Pip himself).
/** x,y: oval centre in drawing-buffer pixels; z: radius in px (0 = off); w: cut everything nearer than this view depth (m). */
export const seeThrough={x:0,y:0,z:0,w:0};
/** x,y: tan of the half field of view horizontally and vertically; z,w: drawing-buffer size. */
export const seeProj={x:1,y:1,z:1,w:1};
/** Row 2 of the camera's world matrix (world y = dot(xyz, view position) + w). */
export const seeY={x:0,y:1,z:0,w:0};
/** Camera near and far. */
export const seeClip={x:.1,y:200};
{
  const decl='uniform vec4 seeThrough; uniform vec4 seeProj; uniform vec4 seeY; uniform vec2 seeClip;\n';
  const test=`
#ifndef SEE_OFF
  if(seeThrough.z>0.){
    vec2 seeD=gl_FragCoord.xy-seeThrough.xy;seeD.y*=.55;float seeR=length(seeD)/seeThrough.z;
    if(seeR<1.){
      float seeZ=gl_FragCoord.z*2.-1.,seeV=2.*seeClip.x*seeClip.y/(seeClip.y+seeClip.x-seeZ*(seeClip.y-seeClip.x));
      vec2 seeN=gl_FragCoord.xy/seeProj.zw*2.-1.;vec3 seeP=vec3(seeN.x*seeV*seeProj.x,seeN.y*seeV*seeProj.y,-seeV);
      float seeWorldY=dot(seeY.xyz,seeP)+seeY.w;
      // Only things nearer than Pip and off the floor (rugs, decals and cables lying flat stay).
      if(seeV<seeThrough.w&&seeWorldY>.14){
        const float seeB[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
        ivec2 seeQ=ivec2(mod(floor(gl_FragCoord.xy),4.));
        if(seeR<.72||seeB[seeQ.x+seeQ.y*4]/16.>(seeR-.72)/.28)discard;
      }
    }
  }
#endif
`;
  T.ShaderChunk.clipping_planes_pars_fragment=decl+T.ShaderChunk.clipping_planes_pars_fragment;
  T.ShaderChunk.clipping_planes_fragment=test+T.ShaderChunk.clipping_planes_fragment;
  const shared={seeThrough:{value:seeThrough},seeProj:{value:seeProj},seeY:{value:seeY},seeClip:{value:seeClip}};
  // Every built-in material that draws the scene (and OutlineEffect, which merges UniformsLib.fog).
  Object.assign(T.UniformsLib.fog,shared);
  for(const [name,lib] of Object.entries(T.ShaderLib))if(!['depth','distanceRGBA','shadow'].includes(name))Object.assign(lib.uniforms,shared);
}
// Dark room (R5-141): every lit/unlit scene material darkens fragments whose world x,z lie inside
// `darkBox` by `darkAmount` (0 = off, 1 = full dark), with a 0.4 m soft edge at the box sides. It
// replaces a flat lid plane that props poked through. World position comes from the depth, like the
// see-through above; createRenderer().render fills the camera matrices each frame.
/** x,y: min/max world x; z,w: min/max world z. */
export const darkBox={x:0,y:0,z:0,w:0};
/** amount: 0 (off) to 1 (dark); tint: what light is left at full dark (linear, a dim blue-violet). */
export const darkness={amount:0,tint:new T.Color(.34,.36,.58)};
// Plain objects and typed arrays, not Vector/Matrix: UniformsUtils.clone copies those per material,
// these stay shared by reference (see the see-through note above).
const darkCam=new Float32Array(16),darkProjInv=new Float32Array(16),darkRes={x:1,y:1},darkAmount={x:0,y:0,z:0,w:0};
{
  const decl='uniform vec4 darkBox; uniform vec4 darkAmount; uniform mat4 darkCam; uniform mat4 darkProjInv; uniform vec2 darkRes;\n';
  const apply=`
  if(darkAmount.x>0.){
    vec4 darkP=darkProjInv*vec4(gl_FragCoord.xy/darkRes*2.-1.,gl_FragCoord.z*2.-1.,1.);darkP/=darkP.w;vec3 darkW=(darkCam*darkP).xyz;
    float darkIn=smoothstep(darkBox.x-.2,darkBox.x+.2,darkW.x)*(1.-smoothstep(darkBox.y-.2,darkBox.y+.2,darkW.x))*smoothstep(darkBox.z-.2,darkBox.z+.2,darkW.z)*(1.-smoothstep(darkBox.w-.2,darkBox.w+.2,darkW.z));
    gl_FragColor.rgb*=mix(vec3(1.),darkAmount.yzw,darkIn*darkAmount.x);
  }
`;
  T.ShaderChunk.clipping_planes_pars_fragment=decl+T.ShaderChunk.clipping_planes_pars_fragment;
  T.ShaderChunk.dithering_fragment=apply+T.ShaderChunk.dithering_fragment;
  const shared={darkBox:{value:darkBox},darkAmount:{value:darkAmount},darkCam:{value:darkCam},darkProjInv:{value:darkProjInv},darkRes:{value:darkRes}};
  Object.assign(T.UniformsLib.fog,shared);
  for(const [name,lib] of Object.entries(T.ShaderLib))if(!['depth','distanceRGBA','shadow'].includes(name))Object.assign(lib.uniforms,shared);
}
/** Gives every mesh under `root` its own material copy that the see-through never cuts (Pip, the plug in hand). */
export function seeOff(root:T.Object3D){root.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material)||o.material.defines?.SEE_OFF!==undefined)return;const m=o.material.clone();m.defines={...(m.defines??{}),SEE_OFF:''};o.material=m;});}
/** Toon material with the rim. A subclass so that clone() (fading occluders, seeOff, vertex-coloured
 *  blobs) keeps the rim: Material.copy() drops onBeforeCompile, the constructor puts it back (R5-372).
 *  userData.noRim keeps a material (big flat wall faces, DR-56) rimless, and survives clone(). */
function rimCompile(this:T.Material,s:T.WebGLProgramParametersWithUniforms){if(!this.userData.noRim)rimShader(s);}
function rimKey(this:T.Material){return this.userData.noRim?'toon':'toonRim';}
export class ToonMaterial extends T.MeshToonMaterial{
  constructor(params?:T.MeshToonMaterialParameters){
    super(params);
    if(!noRim){this.onBeforeCompile=rimCompile;this.customProgramCacheKey=rimKey;}
  }
}
/** Every cached toon() material: shared by colour, so nothing may recolour one in place. */
export const sharedToons=new WeakSet<T.Material>();
// Materials are shared by colour/options so props batch into instanced meshes.
export function toon(color:string,opts:ToonOptions={}):T.MeshToonMaterial {
  const key = `${color}|${opts.emissive??''}|${opts.ei??''}|${opts.map?.uuid??''}|${opts.opacity??1}`;
  let material = materials.get(key);
  if (!material) {
    material = new ToonMaterial({color,gradientMap:ramp,map:opts.map??null});
    if (opts.emissive) { material.emissive = new T.Color(opts.emissive); material.emissiveIntensity = opts.ei??1; }
    if (opts.opacity!==undefined&&opts.opacity<1) { material.transparent = true; material.opacity = opts.opacity; material.depthWrite = false; }
    materials.set(key,material);sharedToons.add(material);
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
  // Warm key vs cool sky fill gives form; the ground bounce keeps undersides from going muddy.
  playground:{key:['#ffe9c8',2.15],fill:.5,rim:.45,hemi:.7,exposure:1.02,backdrop:['#3f4a72','#2a2d4a','#181a2b','rgba(255,200,150,.2)']},
  meeting:{key:['#ffdcaa',2.1],fill:.5,rim:.5,hemi:.68,exposure:1,backdrop:['#4b4169','#2c2b4a','#191a2c','rgba(255,190,140,.22)']},
  lobby:{key:['#ffeccc',2.15],fill:.5,rim:.45,hemi:.72,exposure:1.02,backdrop:['#4a4466','#2b2c48','#191a2c','rgba(255,205,150,.24)']},
  observatory:{key:['#fff0dc',2.1],fill:.55,rim:.55,hemi:.7,exposure:1.02,backdrop:['#2d3570','#1d2250','#0e1233','rgba(180,165,255,.22)']},
  qfn:{key:['#fff2e4',2.15],fill:.5,rim:.5,hemi:.72,exposure:1.02,backdrop:['#4a4878','#2e2c52','#1a1930','rgba(190,175,255,.2)']},
  arcade:{key:['#fff0e6',2.1],fill:.55,rim:.55,hemi:.72,exposure:1.03,backdrop:['#4a2a55','#2e1c3a','#1a1024','rgba(255,126,182,.22)']},
  'arcade-rush':{key:['#fff0e6',2.1],fill:.55,rim:.55,hemi:.72,exposure:1.03,backdrop:['#4a2a55','#2e1c3a','#1a1024','rgba(255,126,182,.22)']},
  garage:{key:['#fff0d8',1.85],fill:.52,rim:.5,hemi:.8,exposure:.97,backdrop:['#2f5a58','#233d44','#15232a','rgba(255,214,120,.18)']},
  spectrum:{key:['#fff6e8',2.2],fill:.55,rim:.5,hemi:.65,exposure:1.03,backdrop:['#4a4f7a','#2e3356','#1a1d33','rgba(255,220,240,.22)']},
  lunch:{key:['#ffeccc',2.2],fill:.45,rim:.5,hemi:.72,exposure:1.02,backdrop:['#4a4466','#2b2c48','#191a2c','rgba(255,205,150,.24)']},
};
export function createRenderer(canvas:HTMLCanvasElement) {
  // Automated tests (?manual) and ?lowfx skip the expensive passes; software rendering can't afford them.
  const params=new URLSearchParams(location.search),low=params.has('lowfx')||(params.has('manual')&&!params.has('fullfx'));
  // Re-read on every resize (render-5): browser zoom or a move to another monitor changes it mid-session.
  let pixelRatio=Math.min(devicePixelRatio,1.5);
  const renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  // Ink outline (R5-375, DR-56): linear [.035,.037,.072] shows as about #34364c (luma ≤ 70), 2–3 px.
  // Thin ink (review 6): .0035 is about 2 px at 1080p. The old .0055 hull read as a dark glow round
  // every model and threw fins off box corners that slid about with the camera. ?ink= overrides it for tuning.
  const effect = new OutlineEffect(renderer,{defaultThickness:Number(params.get('ink')??.0035),defaultColor:[.035,.037,.072]});
  const scene = new T.Scene();
  const hemi = new T.HemisphereLight('#dbe6ff','#b08a6a',.7);const ambient=new T.AmbientLight('#fff4e6',.12);scene.add(hemi,ambient);
  const sun = new T.DirectionalLight('#ffe2b8',1.75); sun.position.set(-11,21,13); sun.castShadow=true;
  sun.shadow.mapSize.setScalar(low?1024:4096);
  Object.assign(sun.shadow.camera,{left:-20.5,right:20.5,top:19,bottom:-19,near:1,far:70});sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0006; sun.shadow.normalBias=.035; sun.shadow.radius=4; sun.shadow.blurSamples=12; scene.add(sun,sun.target);
  const fill = new T.DirectionalLight('#9db8ff',.45); fill.position.set(16,9,8);
  const rim = new T.DirectionalLight('#ffd6f0',.35); rim.position.set(6,12,-18); scene.add(fill,rim);
  const camera = new T.PerspectiveCamera(30,1,.1,200);
  // Composer: scene + outlines, ambient occlusion, bloom (only hot emissives), ACES output, grade.
  // The depth texture lets the AO blend tell where something the AO pass skipped (Pip) stands in front (render-2).
  const target=new T.WebGLRenderTarget(innerWidth*pixelRatio,innerHeight*pixelRatio,{type:T.HalfFloatType,samples:low?0:4,depthTexture:new T.DepthTexture(innerWidth*pixelRatio,innerHeight*pixelRatio)});
  const composer=new EffectComposer(renderer,target);composer.setPixelRatio(pixelRatio);
  composer.addPass(new OutlineRenderPass(effect,scene,camera));
  const ao=toonGTAO(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.85;
  ao.updateGtaoMaterial({radius:.55,distanceExponent:1.6,thickness:1.2,scale:1.25,samples:16,distanceFallOff:1,screenSpaceRadius:false});
  ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16});
  const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.35,.5,1.3);
  const grade=new ShaderPass(GradeShader);
  composer.addPass(ao);composer.addPass(bloom);composer.addPass(new OutputPass());composer.addPass(grade);
  // ?lowfx (or a slow machine, see Game.adaptQuality) drops the expensive passes.
  // Quality 2: everything; 1: no AO; 0: no AO or bloom and a lower pixel ratio.
  let quality:0|1|2=2;
  const setQuality=(level:0|1|2)=>{quality=level;ao.enabled=level>=2;bloom.enabled=level>=1;resize();};
  const getQuality=()=>quality;
  const resize = () => {
    pixelRatio=Math.min(devicePixelRatio,1.5);const pr=quality===0?Math.min(pixelRatio,1):pixelRatio;
    if(renderer.getPixelRatio()!==pr){renderer.setPixelRatio(pr);composer.setPixelRatio(pr);}
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); grade.uniforms.resolution.value.set(innerWidth*pr,innerHeight*pr); };
  addEventListener('resize',resize); resize();
  // A monitor move at the same window size changes the ratio without a resize event: watch it too.
  const watchRatio=()=>globalThis.matchMedia?.(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change',()=>{resize();watchRatio();},{once:true});watchRatio();
  if(low)setQuality(0);
  const render=()=>{
    darkAmount.x=Math.max(0,Math.min(1,darkness.amount));darkAmount.y=darkness.tint.r;darkAmount.z=darkness.tint.g;darkAmount.w=darkness.tint.b;
    if(darkAmount.x>0){camera.updateMatrixWorld();darkCam.set(camera.matrixWorld.elements);darkProjInv.set(camera.projectionMatrixInverse.elements);const b=renderer.getDrawingBufferSize(new T.Vector2());darkRes.x=b.x;darkRes.y=b.y;}
    composer.render();
  };
  const mood=(id:string)=>{const m=MOODS[id]??MOODS.meeting;sun.color.set(m.key[0]);sun.intensity=m.key[1];fill.intensity=m.fill;rim.intensity=m.rim;hemi.intensity=m.hemi;renderer.toneMappingExposure=m.exposure;scene.background=backdrop(...m.backdrop);};
  mood('meeting');
  return {renderer,effect,scene,camera,sun,hemi,fill,mood,render,composer,setQuality,getQuality,low};
}
