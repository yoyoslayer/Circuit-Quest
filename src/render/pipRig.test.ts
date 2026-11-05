import {it,expect} from 'vitest';
import * as T from 'three';
import {PipRig,type PipState} from './pipRig';

function rig(){
  const model=new T.Group();
  for(const name of ['Torso','Head','HeadEyeL','HeadEyeR','HeadMouth','Helmet','LegL','LegR','BootL','BootR','ArmL','ArmR','GloveL','GloveR']){
    const part=new T.Object3D();part.name=name;model.add(part);
  }
  return new PipRig(model);
}
const rest:PipState={dt:1/60,time:0,speed:0,grounded:true,rising:false,airborne:0,turnRate:0,carrying:'none',holdingPlug:false,strain:0,won:false,waving:false};
function advance(r:PipRig,seconds:number,patch:Partial<PipState>={}){for(let i=0;i<Math.ceil(seconds*60);i++)r.update({...rest,time:i/60,...patch});}

it('absorbs landing with a small rig squash and recovers without changing root placement',()=>{
  const r=rig();advance(r,.4,{grounded:false,airborne:.6});advance(r,.08);
  expect(r.body.scale.y).toBeLessThan(1);expect(r.body.scale.y).toBeGreaterThan(.85);
  advance(r,1);expect(r.body.scale.y).toBeCloseTo(1,2);expect(r.torso.position.y).toBeCloseTo(.62,1);
});
it('reaches into a grab and settles into the existing carry grip',()=>{
  const r=rig();advance(r,.4);advance(r,.06,{carrying:'light'});const early=r.arms[0].rotation.x;
  advance(r,.8,{carrying:'light'});expect(r.arms[0].rotation.x).toBeLessThan(early);expect(r.arms[0].rotation.x).toBeLessThan(-1);
});
it('keeps the loaded cable hand below and clear of the helmet',()=>{
  const r=rig();advance(r,1,{holdingPlug:true,strain:1.1});r.body.updateMatrixWorld(true);
  const glove=r.hand.getWorldPosition(new T.Vector3()),helmet=r.head.getWorldPosition(new T.Vector3());
  expect(glove.distanceTo(helmet)).toBeGreaterThan(.5);expect(glove.y).toBeLessThan(helmet.y);
});
it('gives a bump a brief response and restores the neutral stance',()=>{
  const r=rig();advance(r,.5);advance(r,.08,{bumped:true});const reaction=Math.abs(r.body.rotation.z);
  expect(reaction).toBeGreaterThan(.02);advance(r,1);expect(Math.abs(r.body.rotation.z)).toBeLessThan(reaction);
});
it('has a tired idle but immediately attends to carrying work',()=>{
  const r=rig();advance(r,15);const tired=r.head.rotation.x;expect(tired).toBeGreaterThan(.1);
  advance(r,1,{carrying:'light'});expect(r.head.rotation.x).toBeLessThan(tired);
});
it('separates a quiet failure pose from the raised-arm celebration',()=>{
  const r=rig();advance(r,1,{won:true});expect(r.arms[0].rotation.x).toBeLessThan(-2);
  advance(r,1,{failed:true});expect(r.arms[0].rotation.x).toBeGreaterThan(-.7);expect(r.head.rotation.x).toBeGreaterThan(.2);
});
it('keeps every joint finite through low-frame-rate pose changes',()=>{
  const r=rig();for(let i=0;i<120;i++)r.update({...rest,dt:.1,time:i*.1,grounded:i%3===0,airborne:.4,speed:i%2?7:0,sinceRelease:i%7/10});
  for(const joint of [r.body,r.torso,r.head,r.hat,...r.arms,...r.legs,...r.knees,...r.elbows]){
    expect([...joint.position.toArray(),...joint.scale.toArray(),joint.rotation.x,joint.rotation.y,joint.rotation.z].every(Number.isFinite)).toBe(true);
  }
});
