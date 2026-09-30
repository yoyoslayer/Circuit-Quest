import {expect,test} from 'vitest';
import {footAt,kneeAt} from './gait';
test('a planted foot stays in the same world position while the body advances',()=>{
  const a=.03,b=.31,fa=footAt(a,0),fb=footAt(b,0);
  expect(fa.stance&&fb.stance).toBe(true);
  expect(a+fa.z).toBeCloseTo(b+fb.z,9);
  expect(fa.y+fb.y).toBe(0);
  expect(footAt(.95,0).y).toBeGreaterThan(.1);
});
test('the knee bends forward with two consistent leg lengths',()=>{
  const hip={y:.6,z:0},foot={y:.045,z:.2},k=kneeAt(hip,foot);
  expect(k.z).toBeGreaterThan(.2);
  expect(Math.hypot(k.y-hip.y,k.z-hip.z)).toBeCloseTo(.34,5);
  expect(Math.hypot(k.y-foot.y,k.z-foot.z)).toBeCloseTo(.34,5);
});
