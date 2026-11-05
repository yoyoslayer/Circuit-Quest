import {it,expect,vi} from 'vitest';
import * as T from 'three';
vi.hoisted(()=>vi.stubGlobal('location',{search:''}));
import {blob} from './actors';

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
