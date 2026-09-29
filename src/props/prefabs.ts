import * as T from 'three';
import {toon} from '../render/toon';
export type PropKind='box'|'desk'|'chair'|'monitor'|'mug'|'paper'|'plant'|'cabinet'|'sofa'|'bin'|'reel'|'coupler'|'coffee'|'cart'|'glass'|'printer'|'whiteboard'|'bookshelf'|'vending'|'cooler'|'pingpong'|'bridge'|'mop'|'tray'|'lamp'|'dolly';
export interface PropSpec {kind:PropKind;x:number;z:number;y?:number;color?:string;rotation?:number;id?:string}
export interface Prefab {size:[number,number,number];mass:number;cost:number;color:string}
export const prefabs:Record<PropKind,Prefab>={
  box:{size:[.7,.6,.7],mass:2,cost:5,color:'#cf9965'},desk:{size:[1.6,.95,.85],mass:15,cost:80,color:'#edddbd'},
  chair:{size:[.62,.95,.62],mass:3,cost:25,color:'#698d9d'},monitor:{size:[.63,.48,.17],mass:1.5,cost:130,color:'#303849'},
  mug:{size:[.16,.2,.16],mass:.15,cost:5,color:'#d2a455'},paper:{size:[.3,.03,.23],mass:.05,cost:1,color:'#fff7e0'},
  plant:{size:[.58,1.25,.58],mass:2,cost:15,color:'#5e9f69'},cabinet:{size:[.7,1.6,.7],mass:22,cost:110,color:'#a3a9a7'},
  sofa:{size:[2.6,1.1,1.0],mass:30,cost:180,color:'#d56d69'},bin:{size:[.38,.48,.38],mass:.5,cost:8,color:'#536a78'},
  reel:{size:[.7,.7,.55],mass:2,cost:15,color:'#f5b83f'},coupler:{size:[.36,.24,.24],mass:.4,cost:4,color:'#56d2c6'},
  coffee:{size:[.55,.65,.55],mass:5,cost:90,color:'#383a47'},cart:{size:[1.2,.65,.75],mass:8,cost:50,color:'#79a0a6'},
  glass:{size:[.12,2.6,2.5],mass:7,cost:250,color:'#98c8cd'},printer:{size:[.85,1.0,.75],mass:15,cost:200,color:'#d7daca'},
  whiteboard:{size:[1.7,1.7,.2],mass:9,cost:65,color:'#eee8d1'},bookshelf:{size:[2,1.8,.45],mass:24,cost:90,color:'#c79b69'},
  vending:{size:[1,2,.8],mass:45,cost:300,color:'#bd5f68'},cooler:{size:[.6,1.25,.6],mass:9,cost:75,color:'#c5dfe0'},
  pingpong:{size:[2.6,.9,1.5],mass:18,cost:80,color:'#418c73'},bridge:{size:[1.8,.18,1.0],mass:3,cost:10,color:'#edc34b'},mop:{size:[.6,1.5,.22],mass:1,cost:5,color:'#79bcb3'},tray:{size:[.8,.15,.5],mass:1,cost:10,color:'#edba76'},lamp:{size:[.65,1.5,.65],mass:3,cost:20,color:'#f3d491'},dolly:{size:[1.0,.65,.8],mass:30,cost:40,color:'#eab841'}
};
const cube=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,16);
function part(g:T.Group,shape:T.BufferGeometry,size:number[],pos:number[],color:string){const m=new T.Mesh(shape,toon(color));m.scale.set(size[0],size[1],size[2]);m.position.set(pos[0],pos[1],pos[2]);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function makeProp(kind:PropKind,color?:string):T.Group{
  const p=prefabs[kind],g=new T.Group(),[w,h,d]=p.size,c=color??p.color;
  if(kind==='desk'||kind==='pingpong'){
    part(g,cube,[w,.12,d],[0,h/2-.06,0],c);
    for(const x of [-w*.4,w*.4])for(const z of [-d*.35,d*.35])part(g,cube,[.075,h-.12,.075],[x,-.06,z],'#626d79');
    if(kind==='pingpong'){part(g,cube,[.025,.18,d],[0,h/2+.09,0],'#ecebd8');part(g,cube,[w,.012,.025],[0,h/2,0],'#ecebd8');}
  }else if(kind==='chair'){
    part(g,cube,[w,.13,d],[0,-.05,0],c);part(g,cube,[w,.48,.12],[0,.23,-d/2+.06],c);
    part(g,cylinder,[.045,.4,.045],[0,-.27,0],'#414b57');part(g,cube,[w,.07,.1],[0,-h/2+.04,0],'#414b57');part(g,cube,[.1,.07,d],[0,-h/2+.04,0],'#414b57');
  }else if(kind==='monitor'){
    part(g,cube,[w,h*.75,d],[0,.06,0],c);part(g,cube,[w*.86,h*.57,.02],[0,.06,d/2+.012],'#82b8c2');part(g,cube,[.09,.18,.09],[0,-h*.32,0],c);part(g,cube,[w*.5,.035,.3],[0,-h/2,0],c);
  }else if(kind==='plant'){
    part(g,cylinder,[.26,.42,.26],[0,-h/2+.21,0],'#d89260');part(g,ball,[.28,.42,.28],[0,.16,0],c);part(g,ball,[.22,.26,.22],[.2,.1,.06],c);
  }else if(kind==='reel'){
    for(const z of [-.23,.23])part(g,cylinder,[.35,.065,.35],[0,0,z],c).rotation.x=Math.PI/2;
    part(g,cylinder,[.24,.4,.24],[0,0,0],'#3c4659').rotation.x=Math.PI/2;
  }else if(kind==='cart'||kind==='dolly'){
    part(g,cube,[w,.15,d],[0,-h*.2,0],c);for(const x of [-w*.37,w*.37])for(const z of [-d*.35,d*.35])part(g,ball,[.12,.12,.12],[x,-h/2+.1,z],'#3a4256');
    part(g,cube,[.08,h,d],[w*.45,0,0],'#74818d');if(kind==='dolly'){const reel=makeProp('reel');reel.position.y=.13;g.add(reel);}
  }else if(kind==='lamp'){
    part(g,cylinder,[.28,.1,.28],[0,-.7,0],'#526579');part(g,cylinder,[.045,1.2,.045],[0,-.1,0],'#617184');part(g,ball,[.32,.2,.32],[0,.55,0],c);
  }else if(kind==='mop'){
    part(g,cylinder,[.035,1.4,.035],[0,.05,0],'#ceac77');part(g,cube,[.6,.12,.22],[0,-.68,0],c);
  }else if(kind==='bridge'){
    part(g,cube,[w,h,d],[0,0,0],c);for(let x=-.7;x<.8;x+=.3)part(g,cube,[.12,.012,d],[x,h/2+.007,0],'#3a4256');
  }else if(kind==='tray'){
    part(g,cube,[w,.08,d],[0,-.03,0],'#727e8a');for(const x of [-.23,0,.23])part(g,ball,[.09,.08,.15],[x,.04,0],c);
  }else if(kind==='mug'||kind==='bin'){
    part(g,cylinder,[w/2,h,w/2],[0,0,0],c);part(g,cylinder,[w*.36,.012,w*.36],[0,h/2+.002,0],'#38424a');
  }else if(kind==='sofa'){
    part(g,cube,[w,.45,d],[0,-.2,0],c);part(g,cube,[w,.7,.2],[0,.18,-.4],c);for(const x of [-1.2,1.2])part(g,cube,[.25,.65,d],[x,0,0],c);
  }else{
    const m=part(g,cube,[w,h,d],[0,0,0],c);
    if(kind==='glass'){m.material=toon(c).clone();m.material.transparent=true;m.material.opacity=.3;m.material.depthWrite=false;}
    if(['cabinet','printer','vending','bookshelf'].includes(kind))for(let i=0;i<3;i++)part(g,cube,[w*.7,.04,.025],[0,h*(i/3-.3),d/2+.015],'#4c5865');
    if(kind==='box')part(g,cube,[w*.17,h+.01,d+.01],[0,0,0],'#e4bc7f');
    if(kind==='cooler')part(g,cylinder,[.24,.38,.24],[0,h/2+.08,0],'#73b4cf');
  }
  return g;
}
