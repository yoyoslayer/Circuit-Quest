import {it,expect,vi} from 'vitest';
import * as T from 'three';
vi.hoisted(()=>vi.stubGlobal('location',{search:''}));
import {blob,glossyToon} from './actors';
import {seeOff} from './toon';

// render-3: a clone (seeOff on Pip's hat, gloves and boots; fading occluders) must keep the gloss and rim.
const compiled=(m:T.Material)=>{const s={uniforms:{} as Record<string,{value:unknown}>,vertexShader:'',fragmentShader:'#include <common>\n#include <opaque_fragment>'};m.onBeforeCompile(s as unknown as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);return s;};
it('keeps the glossy highlight and rim on a cloned glossyToon material',()=>{
  const m=glossyToon('#ffc629',{spec:.7,size:.97}),c=m.clone(),s=compiled(c);
  expect(s.uniforms.specK?.value).toBe(.7);expect(s.uniforms.specEdge?.value).toBe(.97);expect(s.uniforms.rimStrength).toBeDefined();
  expect(s.fragmentShader).toContain('specEdge + .012');expect(c.customProgramCacheKey()).toBe(m.customProgramCacheKey());
  const mesh=new T.Mesh(new T.BoxGeometry(),m);seeOff(mesh);const off=mesh.material as T.Material;
  expect(off).not.toBe(m);expect(off.defines?.SEE_OFF).toBe('');expect(compiled(off).uniforms.specK?.value).toBe(.7);expect(off.customProgramCacheKey()).toContain('seeoff');
  expect(m.defines?.SEE_OFF).toBeUndefined();
});
it('keeps SEE_OFF and keepAO when a see-exempt glossy material is cloned',()=>{
  const m=glossyToon('#ffffff',{vertexColors:true,spec:.75,size:.982,seeExempt:true}),c=m.clone();
  expect(c.defines?.SEE_OFF).toBe('');expect(c.defines?.TOON).toBe('');expect(c.userData.keepAO).toBe(true);expect(c.defines).not.toBe(m.defines);
});

it('turns a coworker face without moving the body or changing its neighbours',()=>{
  const a=blob('#84b2b5','calm',['glasses']),b=blob('#84b2b5','calm',['glasses']);
  const original=Array.from(a.geometry.attributes.position.array),other=Array.from(b.geometry.attributes.position.array);
  for(let i=0;i<90;i++)a.updateLook(new T.Vector3(3,1.2,2),1,1/60);
  const posed=Array.from(a.geometry.attributes.position.array);
  expect(posed).not.toEqual(original);expect(posed.slice(0,30)).toEqual(original.slice(0,30));
  expect(Array.from(b.geometry.attributes.position.array)).toEqual(other);expect(a.children).toHaveLength(0);
});
it('keeps normals finite and avoids uploading an unchanged settled pose',()=>{
  const actor=blob('#a1bc92','alarm',['tuft']);
  for(let i=0;i<180;i++)actor.updateLook(new T.Vector3(-2,1.4,3),1,1/60);
  const attribute=actor.geometry.attributes.position as T.BufferAttribute,version=attribute.version;
  for(let i=0;i<20;i++)actor.updateLook(new T.Vector3(-2,1.4,3),1,1/60);
  expect(attribute.version).toBe(version);
  expect(Array.from(actor.geometry.attributes.normal.array).every(Number.isFinite)).toBe(true);
});
