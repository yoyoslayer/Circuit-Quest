import {expect,test} from 'vitest';
import * as T from 'three';
import {PipRig} from './pipRig';

test('nested export groups put real boots and gloves on the animated joints',()=>{
  // Match the Scene -> Pip -> named meshes hierarchy in the shipped Blender export.
  // The browser regression additionally checks the actual loaded GLB.
  const scene=new T.Group(),wrapper=new T.Group();scene.add(wrapper);wrapper.name='Pip';
  for(const [name,x,y] of [['BootLSole',-.17,.045],['BootRSole',.17,.045],['GloveR',.42,.64]] as const){
    const mesh=new T.Mesh(new T.BoxGeometry(.1,.1,.1),new T.MeshBasicMaterial());mesh.name=name;mesh.position.set(x,y,0);wrapper.add(mesh);
  }
  const rig=new PipRig(scene);
  expect(rig.legs[0].getObjectByName('BootLSole')).toBeDefined();
  expect(rig.arms[1].getObjectByName('GloveR')).toBeDefined();
  const boot=rig.legs[0].getObjectByName('BootLSole')!;
  const initial=boot.getWorldPosition(new T.Vector3());
  for(let i=0;i<15;i++)rig.update({dt:1/60,time:i/60,speed:4.2,grounded:true,rising:false,airborne:0,turnRate:0,carrying:'none',holdingPlug:false,strain:0,won:false,waving:false});
  const walked=boot.getWorldPosition(new T.Vector3());
  expect(walked.distanceTo(initial)).toBeGreaterThan(.12);
  expect(Math.abs(rig.legs[0].position.z-rig.legs[1].position.z)).toBeGreaterThan(.1);
});
