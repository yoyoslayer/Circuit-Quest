import type {Level} from './types';
export const playground:Level={id:'playground',width:20,depth:20,spawn:{x:-7,z:5},anchor:{x:-8,z:4},target:{x:7,z:-6},length:19,
  obstacles:[{id:'pillar-a',minX:-2,maxX:-.6,minZ:-2,maxZ:-.6},{id:'pillar-b',minX:2.5,maxX:3.9,minZ:2,maxZ:3.4}],
  props:Array.from({length:14},(_,i)=>({kind:i%3===0?'chair':'box',x:(i%5)*1.5-4,z:Math.floor(i/5)*1.8+1})),npcs:[]};
