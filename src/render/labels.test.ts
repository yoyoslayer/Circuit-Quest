import {it,expect,vi} from 'vitest';
// render-6: a sign drawn before the Fredoka face loads is redrawn once it has, not kept in the fallback.
// Node has no canvas or FontFaceSet, so both are faked: the fake context records the font of each fillText.
const drawn:string[]=[];let loaded!:(faces:unknown[])=>void;const asked:string[]=[];
vi.hoisted(()=>vi.stubGlobal('location',{search:''}));
vi.stubGlobal('document',{
  createElement:()=>{const canvas={width:0,height:0,getContext:()=>ctx};const ctx={canvas,font:'',fillStyle:'',strokeStyle:'',lineWidth:0,textAlign:'',textBaseline:'',
    beginPath(){},roundRect(){},fill(){},stroke(){},clearRect(){},measureText:()=>({width:40}),fillText(){drawn.push(ctx.font);}};return canvas;},
  fonts:{check:()=>false,load:(spec:string)=>{asked.push(spec);return new Promise(r=>{loaded=r;});}},
});
const {labelTexture}=await import('./labels');

it('redraws cached sign textures when the Fredoka face finishes loading',async()=>{
  const a=labelTexture('WORKSHOP'),b=labelTexture('LOCKED',{w:256,h:56});
  expect(labelTexture('WORKSHOP')).toBe(a);expect(asked).toHaveLength(1);expect(asked[0]).toContain('Fredoka Variable');
  expect(drawn).toHaveLength(2);const va=a.version,vb=b.version;
  loaded([{}]);await new Promise(r=>setTimeout(r,0));
  expect(drawn).toHaveLength(4);expect(drawn.every(f=>f.includes('"Fredoka Variable"'))).toBe(true);
  expect(a.version).toBeGreaterThan(va);expect(b.version).toBeGreaterThan(vb);
});
