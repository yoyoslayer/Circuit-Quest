import {test,expect} from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import {furnitureShapes} from './colliders';
test('a desk supports objects on top without ejecting an object from the empty space below',async()=>{
  await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});
  try{
    world.createCollider(RAPIER.ColliderDesc.cuboid(4,.1,4).setTranslation(0,-.1,0));
    const desk=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,.475,0));
    for(const s of furnitureShapes('desk')!)world.createCollider(RAPIER.ColliderDesc.cuboid(s.size[0]/2,s.size[1]/2,s.size[2]/2).setTranslation(...s.at),desk);
    const balls=[.3,1.3].map(y=>{const b=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,y,0));world.createCollider(RAPIER.ColliderDesc.ball(.08).setMass(1),b);return b;});
    for(let i=0;i<120;i++)world.step();
    const low=balls[0].translation(),high=balls[1].translation();
    expect(Math.abs(low.x)+Math.abs(low.z)).toBeLessThan(.03);expect(low.y).toBeCloseTo(.08,2);
    expect(high.y).toBeCloseTo(1.03,2);
  }finally{world.free();}
});
