import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export const INK = '#2b2d42';
// Three bands; the darker two lean violet (patched below) so shadows read illustrated, not grey.
const ramp = new T.DataTexture(new Uint8Array([110,110,110,255,200,200,200,255,255,255,255,255]),3,1,T.RGBAFormat);
ramp.minFilter = ramp.magFilter = T.NearestFilter;
ramp.needsUpdate = true;
T.ShaderChunk.gradientmap_pars_fragment = T.ShaderChunk.gradientmap_pars_fragment.replace(
  'return vec3( texture2D( gradientMap, coord ).r );',
  `float band = texture2D( gradientMap, coord ).r;
		float tint = band < 0.6 ? 0.45 : ( band < 0.9 ? 0.15 : 0.0 );
		return band * mix( vec3( 1.0 ), vec3( 0.98, 0.9, 1.5 ), tint );`);
// A soft warm rim on toon surfaces separates silhouettes from the floor.
T.ShaderChunk.emissivemap_fragment += `
#ifdef USE_GRADIENTMAP
	float toonRim = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
	totalEmissiveRadiance += vec3( 1.0, 0.965, 0.88 ) * toonRim * 0.18 * diffuseColor.rgb;
#endif
`;
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
export interface Mood {sun:[string,number,[number,number,number]];sky:string;ground:string;hemi:number;fill:[string,number];exposure:number;backdrop:[string,string]}
// Per-level lighting (mockups/review/REVIEW.md P0.3): warm key, cool fill, coloured bounce.
export const MOODS:Record<string,Mood>={
  playground:{sun:['#fff0d8',2.4,[-14,18,9]],sky:'#dfe9ff',ground:'#9a8266',hemi:.8,fill:['#9fb4ff',.35],exposure:1,backdrop:['#3a4674','#1a1d2e']},
  meeting:{sun:['#ffe3b3',2.6,[-12,18,9]],sky:'#d6e6ff',ground:'#8c6e55',hemi:.75,fill:['#8fa8ff',.4],exposure:1,backdrop:['#34406b','#1a1d2e']},
  lunch:{sun:['#fff4dc',2.8,[-8,22,8]],sky:'#e8f0ff',ground:'#a58760',hemi:.85,fill:['#a0b8ff',.3],exposure:1.05,backdrop:['#3b4470','#1b1e2f']},
};
export function createRenderer(canvas:HTMLCanvasElement) {
  const renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setClearColor('#1a1d2e');
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const effect = new OutlineEffect(renderer,{defaultThickness:.0042,defaultColor:[.17,.18,.26]});
  const scene = new T.Scene();
  const hemi = new T.HemisphereLight('#dfe9ff','#9a8266',.8);scene.add(hemi);
  const sun = new T.DirectionalLight('#fff1d6',2.4); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-24,right:24,top:20,bottom:-20,near:1,far:80});
  sun.shadow.bias = -.0012; sun.shadow.normalBias=.07; scene.add(sun,sun.target);
  const fill = new T.DirectionalLight('#9fb4ff',.35); fill.position.set(12,8,-10); scene.add(fill);
  const camera = new T.PerspectiveCamera(34,1,.1,150);
  // Gradient backdrop on a camera-fixed plane. (A texture scene.background gets repainted as ink
  // by OutlineEffect's outline pass, so it is an ordinary mesh with outlines switched off.)
  const skyCanvas=document.createElement('canvas');skyCanvas.width=8;skyCanvas.height=256;const skyTexture=new T.CanvasTexture(skyCanvas);skyTexture.colorSpace=T.SRGBColorSpace;
  const skyMaterial=new T.MeshBasicMaterial({map:skyTexture,depthWrite:false,toneMapped:false});skyMaterial.userData.outlineParameters={visible:false};
  const sky=new T.Mesh(new T.PlaneGeometry(1,1),skyMaterial);sky.renderOrder=-100;sky.frustumCulled=false;sky.position.z=-140;camera.add(sky);scene.add(camera);
  const resize = () => { renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();const h=2*140*Math.tan(T.MathUtils.degToRad(camera.fov/2))*1.05;sky.scale.set(h*camera.aspect,h,1); };
  addEventListener('resize',resize); resize();
  const mood=(id:string)=>{const m=MOODS[id]??MOODS.playground;sun.color.set(m.sun[0]);sun.intensity=m.sun[1];sun.position.set(...m.sun[2]);
    hemi.color.set(m.sky);hemi.groundColor.set(m.ground);hemi.intensity=m.hemi;fill.color.set(m.fill[0]);fill.intensity=m.fill[1];renderer.toneMappingExposure=m.exposure;const g=skyCanvas.getContext('2d')!,grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,m.backdrop[0]);grad.addColorStop(1,m.backdrop[1]);g.fillStyle=grad;g.fillRect(0,0,8,256);skyTexture.needsUpdate=true;resize();};
  mood('playground');
  return {renderer,effect,scene,camera,sun,hemi,fill,mood};
}
