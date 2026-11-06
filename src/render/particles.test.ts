import {it,expect,vi} from 'vitest';
import * as T from 'three';
vi.hoisted(()=>vi.stubGlobal('location',{search:''}));
import {Particles} from './particles';

const rings=(root:T.Object3D)=>root.children.map(c=>(c as T.Mesh).material as T.MeshBasicMaterial);
// render-4: two same-colour rings in quick succession each fade on their own clock.
it('gives every live ring its own fading material',()=>{
  const root=new T.Group(),fx=new Particles(root);
  fx.spawn('ring',{x:0,y:0,z:0},1,'#c7b8ff');fx.update(.4);
  fx.spawn('ring',{x:1,y:0,z:0},1,'#c7b8ff');fx.update(1/60);
  const [old,fresh]=rings(root);
  expect(fresh).not.toBe(old);expect(old.opacity).toBeLessThan(.2);expect(fresh.opacity).toBeGreaterThan(.9);
  expect(fresh.blending).toBe(T.AdditiveBlending);expect(fresh.color.r).toBeGreaterThan(1);
});
it('resets a pooled ring material to full opacity and the new colour when it is reused',()=>{
  const root=new T.Group(),fx=new Particles(root);
  fx.spawn('ring',{x:0,y:0,z:0},1,'#8ff3ea');fx.update(.3);fx.update(.3);expect(fx.count).toBe(0);
  fx.spawn('ring',{x:0,y:0,z:0},1,'#ff0000');const [m]=rings(root);
  expect(m.opacity).toBe(1);expect(m.color.g).toBe(0);expect(m.color.r).toBeCloseTo(2);
});
