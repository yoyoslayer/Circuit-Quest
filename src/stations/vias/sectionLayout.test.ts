import {test,expect} from 'vitest';
import {sectionLayout} from './sectionLayout';

test('every selectable stitch count leaves distinct pads inside the sample',()=>{
  for(let n=1;n<=8;n++){
    const {scale,xs}=sectionLayout(n),diameter=.6*scale;
    expect(xs).toHaveLength(n);
    for(let i=0;i<n;i++){
      expect(Math.abs(xs[i])+diameter/2).toBeLessThan(.6);
      if(i)expect(xs[i]-xs[i-1]).toBeGreaterThan(diameter);
    }
  }
});
test('a single hole keeps its magnification and a row stays centered',()=>{
  expect(sectionLayout(1)).toEqual({scale:.8,xs:[0]});
  for(let n=2;n<=8;n++)expect(sectionLayout(n).xs.reduce((a,b)=>a+b,0)).toBeCloseTo(0);
});
