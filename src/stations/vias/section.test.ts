import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {sectionSlab,sectionBarrel} from './section';

describe('visible manufacturing section',()=>{
  const material=new T.MeshBasicMaterial({side:T.DoubleSide});
  const ray=new T.Raycaster(new T.Vector3(0,0,1),new T.Vector3(0,0,-1));
  it('opens the front face at the drill, while leaving the rest solid',()=>{
    const slab=new T.Mesh(sectionSlab(.9,.34,.1,[{x:0,r:.045}]),material);
    slab.updateMatrixWorld();
    const opening=ray.intersectObject(slab)[0];
    expect(opening.point.z).toBeLessThan(-.04);
    ray.set(new T.Vector3(.1,0,1),new T.Vector3(0,0,-1));
    expect(ray.intersectObject(slab)[0].point.z).toBeCloseTo(0);
    ray.set(new T.Vector3(0,0,1),new T.Vector3(0,0,-1));
    slab.geometry.dispose();
  });
  it('shows the copper liner before the insulating wall from the cut face',()=>{
    const slab=new T.Mesh(sectionSlab(.9,.34,.1,[{x:0,r:.045}]),material);
    const copper=new T.Mesh(sectionBarrel(.045,.1),material);
    slab.updateMatrixWorld();copper.updateMatrixWorld();
    expect(ray.intersectObject(copper)[0].distance).toBeLessThan(ray.intersectObject(slab)[0].distance);
    slab.geometry.dispose();copper.geometry.dispose();
  });
});
