// A doorway with depth, without cutting the wall: "interior mapping". The doorway is one flat plane;
// its shader casts the view ray into an imaginary corridor behind it and shades whichever face the ray
// hits (floor, walls, ceiling, and the destination room at the far end), so the opening shows real
// parallax from any camera angle. `open` (0..1) brightens the corridor and lights its floor strip.
import * as T from 'three';

export interface PortalOptions {color:string;width:number;height:number;depth?:number;view?:T.Texture;locked?:boolean}

const vertex=/* glsl */`
uniform vec3 uCam;
varying vec3 vPos;varying vec3 vDir;
void main(){
  vPos=position;
  vDir=position-uCam;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;
const fragment=/* glsl */`
uniform vec3 uColor;uniform vec2 uSize;uniform float uDepth;uniform float uOpen;uniform float uLocked;uniform float uTime;
uniform sampler2D uView;uniform float uHasView;
varying vec3 vPos;varying vec3 vDir;
void main(){
  vec3 d=normalize(vDir);
  if(d.z>-1e-4)d.z=-1e-4;
  vec2 half_=uSize*.5;
  float tx=((d.x>0.?half_.x:-half_.x)-vPos.x)/d.x;
  float ty=((d.y>0.?half_.y:-half_.y)-vPos.y)/d.y;
  float tz=(-uDepth-vPos.z)/d.z;
  float t=min(tz,min(tx,ty));
  vec3 h=vPos+d*t;
  float depth=clamp(-h.z/uDepth,0.,1.);
  vec3 wall=uColor;
  vec3 col;
  if(t==tz){
    // The far end: a glimpse of the destination room, framed and lit.
    vec2 uv=vec2(h.x/uSize.x+.5,h.y/uSize.y+.5);
    vec3 v=uHasView>.5?texture2D(uView,uv).rgb:mix(wall,vec3(1.),.4);
    col=mix(v*.55,v*1.05,uOpen);
  }else if(t==ty&&d.y<0.){
    // Floor: planks running into the room, with a lit runner down the middle when open.
    float plank=step(.5,fract(h.z*2.2));
    col=mix(vec3(.55,.42,.3),vec3(.6,.47,.33),plank);
    float runner=smoothstep(.32,.28,abs(h.x/uSize.x));
    col=mix(col,mix(wall,vec3(1.),.35),runner*(.25+.6*uOpen));
  }else if(t==ty){
    // Ceiling with light strips that pulse gently when open.
    float strip=smoothstep(.06,.0,abs(fract(h.z*1.6)-.5)-.18);
    col=mix(wall*.45,vec3(1.,.96,.85),strip*(.15+.75*uOpen)*(.85+.15*sin(uTime*3.)));
  }else{
    // Side walls: the wing colour, panelled, darker further in.
    float panel=step(.06,fract(h.z*1.4))*step(.06,fract((h.y+half_.y)*1.1));
    col=wall*mix(.62,.82,panel)*(d.x>0.?.9:1.);
  }
  // Depth fog toward the room's dark backdrop; opening pushes the fog back.
  vec3 fog=mix(vec3(.08,.08,.14),wall*.25,.5);
  col=mix(col,fog,depth*mix(.75,.25,uOpen));
  // Locked: cold and grey.
  col=mix(col,vec3(dot(col,vec3(.3,.59,.11)))*.55,uLocked);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function portal(o:PortalOptions){
  const geo=new T.PlaneGeometry(o.width,o.height);
  const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{
    uCam:{value:new T.Vector3()},uColor:{value:new T.Color(o.color)},uSize:{value:new T.Vector2(o.width,o.height)},uDepth:{value:o.depth??2.6},
    uOpen:{value:0},uLocked:{value:o.locked?1:0},uTime:{value:0},uView:{value:o.view??null},uHasView:{value:o.view?1:0}}});
  material.userData.outlineParameters={visible:false};
  const mesh=new T.Mesh(geo,material);mesh.userData.noAO=true;
  const inv=new T.Matrix4();
  // The camera position in the plane's own space, every frame it is drawn.
  mesh.onBeforeRender=(_r,_s,camera)=>{inv.copy(mesh.matrixWorld).invert();material.uniforms.uCam.value.copy(camera.position).applyMatrix4(inv);};
  return {mesh,set(open:number,time:number){material.uniforms.uOpen.value=open;material.uniforms.uTime.value=time;}};
}
