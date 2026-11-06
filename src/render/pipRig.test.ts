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
// render-1: the hard-stop stumble reads the run, not one render frame that ran no physics step.
function feed(r:PipRig,frames:number,dt:number,speed:(i:number)=>number,seen={stumbled:false}){for(let i=0;i<frames;i++){r.update({...rest,dt,time:i*dt,speed:speed(i)});if(r.stumbling)seen.stumbled=true;}return seen;}
it('does not stumble while sprinting on a 144 Hz screen, where most frames run no physics step',()=>{
  // A 6.8 m/s sprint measured per rendered frame at 144 Hz: a step lands on about 1 frame in 2.4.
  const r=rig(),dt=1/144;feed(r,144,dt,()=>6.8);
  expect(feed(r,288,dt,i=>i%12===0||i%12===5||i%12===10?16:0).stumbled).toBe(false);
});
it('does not stumble on one 60 Hz frame that ran no step mid-sprint (a hitstop frame or a timing slip)',()=>{
  const r=rig();feed(r,60,1/60,()=>6.8);expect(feed(r,60,1/60,i=>i===20?0:i===21?13.6:6.8).stumbled).toBe(false);
});
it('still stumbles on a real hard stop from a sprint, once',()=>{
  const r=rig();feed(r,60,1/60,()=>6.8);const stop=feed(r,20,1/60,()=>0);expect(stop.stumbled).toBe(true);
  expect(feed(r,60,1/60,()=>0).stumbled).toBe(true);expect(r.stumbling).toBe(false);
});
