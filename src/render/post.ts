// Post-processing (from mockups/look/post.js): toon scene + OutlineEffect rendered into an
// EffectComposer, then ambient occlusion, bloom for deliberately hot emissives, and a grade.
import * as T from 'three';
import type {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';

/** OutlineEffect draws to whatever render target is bound, so this pass binds the composer's
 *  read buffer and lets it draw there, like RenderPass does for a plain render. */
export class OutlineRenderPass extends Pass {
  constructor(private effect:OutlineEffect,private scene:T.Scene,private camera:T.Camera){super();this.needsSwap=false;}
  render(renderer:T.WebGLRenderer,_write:T.WebGLRenderTarget,read:T.WebGLRenderTarget){
    const autoClear=renderer.autoClear;renderer.autoClear=true;this.effect.autoClear=true;
    renderer.setRenderTarget(this.renderToScreen?null:read);this.effect.render(this.scene,this.camera);renderer.autoClear=autoClear;
  }
}
/** GTAO that ignores sprites, glow cards, light shafts and see-through glass; they would
 *  otherwise write depth into the AO buffer and cast dark halos. (Wraps the runtime's private
 *  _overrideVisibility, which the bundled type definitions don't declare.) */
export function toonGTAO(scene:T.Scene,camera:T.Camera,width:number,height:number){
  const pass=new GTAOPass(scene,camera,width,height),inner=pass as unknown as {_overrideVisibility:()=>void;_visibilityCache:T.Object3D[]};
  const base=inner._overrideVisibility.bind(pass);
  inner._overrideVisibility=()=>{base();scene.traverse(o=>{if(!o.visible)return;const m=(o as T.Mesh).material as T.Material|undefined;
    if((o as T.Sprite).isSprite||o.userData.noAO||(m&&!Array.isArray(m)&&((m.transparent&&m.opacity<.99)||m.blending===T.AdditiveBlending))){o.visible=false;inner._visibilityCache.push(o);}});};
  return pass;
}
/** Display-space grade: warm/cool split tone, saturation, contrast, vignette, fine grain. */
export const GradeShader={
  uniforms:{tDiffuse:{value:null},saturation:{value:1.12},contrast:{value:1.06},shadowTint:{value:new T.Color('#3b4a8a')},highlightTint:{value:new T.Color('#ffd9a8')},
    splitAmount:{value:.07},vignette:{value:.32},vignetteSoft:{value:.55},grain:{value:.018},resolution:{value:new T.Vector2(1,1)}},
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`
    uniform sampler2D tDiffuse; uniform float saturation,contrast,splitAmount,vignette,vignetteSoft,grain;
    uniform vec3 shadowTint,highlightTint; uniform vec2 resolution; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec4 c=texture2D(tDiffuse,vUv); vec3 col=c.rgb;
      float l=dot(col,vec3(.2126,.7152,.0722));
      col=mix(vec3(l),col,saturation);
      col=(col-.5)*contrast+.5;
      col+=(shadowTint-.5)*splitAmount*(1.-smoothstep(.0,.55,l))+(highlightTint-.5)*splitAmount*smoothstep(.45,1.,l);
      vec2 q=vUv-.5; q.x*=resolution.x/resolution.y*.8;
      float v=smoothstep(.95,.95-vignetteSoft,length(q)*1.25); col*=mix(1.-vignette,1.,v);
      col+=(hash(vUv*resolution+fract(l*7.))-.5)*grain;
      gl_FragColor=vec4(clamp(col,0.,1.),c.a);
    }`,
};
