import {describe,expect,it} from 'vitest';
import {NETS,KNOBS,WHEELS,solve,reading,thevenin,pressureCart,flowCart,compare,same,solution,twoMeasurement,estimate,tier,checkAnswer,electrical,clampKnob,blankRecord,type Knob,type Net,type Pt} from './logic';

const net=(id:string)=>NETS.find(n=>n.id===id)!;
const near=(a:number,b:number,eps=1e-9)=>expect(Math.abs(a-b)).toBeLessThan(eps);

describe('network solver (modified nodal analysis)',()=>{
  it('solves a voltage divider',()=>{
    const s=solve(3,[{kind:'V',a:1,b:0,v:10},{kind:'R',a:1,b:2,r:1},{kind:'R',a:2,b:0,r:4}]);
    near(s.v[2],8);near(s.i[1],2);near(s.i[0],2);
  });
  it('handles a current source into a resistor',()=>{
    const s=solve(2,[{kind:'I',a:1,b:0,i:3},{kind:'R',a:1,b:0,r:5}]);near(s.v[1],15);
  });
  it('conserves flow at every node (KCL) in each hidden network under a load',()=>{
    for(const n of NETS)for(const load of WHEELS){
      const parts=[...n.parts.map(d=>d.part),{kind:'R' as const,a:n.port,b:0,r:load}],s=solve(n.nodes,parts);
      for(let node=1;node<n.nodes;node++){let sum=0;parts.forEach((p,k)=>{if(p.a===node)sum+=p.kind==='R'?-s.i[k]:s.i[k];if(p.b===node)sum+=p.kind==='R'?s.i[k]:-s.i[k];});near(sum,0,1e-9);}
    }
  });
});

describe('the drawings (pipes and the reveal share them)',()=>{
  // Two drawn points are the same node when they coincide or sit on one wire run.
  const onSeg=(p:Pt,a:Pt,b:Pt)=>Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))<1e-9&&p[0]>=Math.min(a[0],b[0])-1e-9&&p[0]<=Math.max(a[0],b[0])+1e-9&&p[1]>=Math.min(a[1],b[1])-1e-9&&p[1]<=Math.max(a[1],b[1])+1e-9;
  it('each part is drawn from its node a to its node b, and the ports sit on the right nodes',()=>{
    for(const n of NETS){
      const pts:{p:Pt;node:number}[]=[];n.parts.forEach(d=>{pts.push({p:d.path[0],node:d.part.a},{p:d.path[d.path.length-1],node:d.part.b});});
      pts.push({p:n.ports.a,node:n.port},{p:n.ports.b,node:0});
      const parent=pts.map((_,i)=>i),find=(i:number):number=>parent[i]===i?i:(parent[i]=find(parent[i]));
      const join=(i:number,j:number)=>{parent[find(i)]=find(j);};
      pts.forEach((x,i)=>pts.forEach((y,j)=>{if(i<j&&x.p[0]===y.p[0]&&x.p[1]===y.p[1])join(i,j);}));
      for(const w of n.wires){const on=pts.map((x,i)=>w.slice(1).some((b,k)=>onSeg(x.p,w[k],b))?i:-1).filter(i=>i>=0);on.slice(1).forEach(i=>join(on[0],i));}
      pts.forEach((x,i)=>pts.forEach((y,j)=>expect(find(i)===find(j),`${n.id}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`).toBe(x.node===y.node)));
    }
  });
});

describe('Thevenin and Norton at the ports',()=>{
  it('matches the hand-worked values for the three networks',()=>{
    const want:{[id:string]:[number,number,number]}={header:[9,1.5,6],twin:[14,4,3.5],booster:[24,6,4]};
    for(const n of NETS){const t=thevenin(n),[v,r,i]=want[n.id];near(t.vth,v,1e-9);near(t.rth,r,1e-9);near(t.iN,i,1e-9);}
  });
  it('I_N = V_th / R_th, and R_th from switching the sources off equals V_open / I_short',()=>{
    for(const n of NETS){const t=thevenin(n);near(t.iN,t.vth/t.rth,1e-9);}
  });
  it('both carts, set to the equivalent, behave exactly like the network under any load',()=>{
    for(const n of NETS){const {carts}=solution(n);
      for(const load of ['open','short',.5,1,2,3.7,6,12,40] as const){const h=reading(n,load);
        expect(same(h,pressureCart(carts.pP,carts.pR,load)),`${n.id} P ${load}`).toBe(true);
        expect(same(h,flowCart(carts.fQ,carts.fR,load)),`${n.id} F ${load}`).toBe(true);}
    }
  });
  it('the flow cart is a pressure cart in disguise: Q·R behind R',()=>{
    for(const load of [1,5,9])expect(same(flowCart(3,4,load),pressureCart(12,4,load))).toBe(true);
  });
});

describe('matching the hidden network',()=>{
  it('the solver finds settings on the dial grid for every network',()=>{
    for(const n of NETS){const s=solution(n);expect(s.reachable,n.id).toBe(true);
      for(const k of Object.keys(KNOBS) as Knob[]){const x={...s.carts,eV:s.answer.v,eR:s.answer.r,eI:s.answer.mA}[k];expect(x).toBeGreaterThanOrEqual(KNOBS[k].min);expect(x).toBeLessThanOrEqual(KNOBS[k].max);}
      const c=compare(n,s.carts);expect(c.pOk&&c.fOk).toBe(true);}
  });
  it('the equivalent is unique on the dials: no other pressure-cart setting passes',()=>{
    const n=net('twin'),best=solution(n).carts;let passes=0;
    for(let P=0;P<=40;P+=.5)for(let R=.5;R<=20;R+=.5)if(compare(n,{...best,pP:P,pR:R}).pOk)passes++;
    expect(passes).toBe(1);
  });
  it('matching at one wheel is not enough: the other wheels expose it',()=>{
    const n=net('twin'),at6=reading(n,6);
    // A pressure cart with a 1-unit restriction, pumped so it agrees with the 6 wheel only.
    const P=at6.q*(1+6),c=compare(n,{pP:P,pR:1,fQ:3.5,fR:4});
    expect(c.rows.find(r=>r.load===6)!.pOk).toBe(true);expect(c.pOk).toBe(false);expect(c.fOk).toBe(true);
    expect(c.problems[0]).toMatch(/one load can't pin down two knobs/);
  });
  it('explains a wrong shut-port pressure first',()=>{
    const c=compare(net('header'),{pP:12,pR:1.5,fQ:6,fR:1.5});expect(c.problems[0]).toMatch(/shut/);
  });
  it('the two-measurement method recovers the equivalent',()=>{
    for(const n of NETS){const t=thevenin(n),open=reading(n,'open').p;
      for(const other of ['short',2,6,12] as const){const e=estimate(open,{load:other,r:reading(n,other)});near(e.R,t.rth,1e-9);near(e.Q,t.iN,1e-9);}}
    expect(twoMeasurement(['open',6])).toBe(true);expect(twoMeasurement(['short',6])).toBe(false);expect(twoMeasurement(['open',2,6])).toBe(false);
  });
});

describe('grades',()=>{
  const rec=(o:Partial<ReturnType<typeof blankRecord>>)=>({...blankRecord(),...o});
  it('works, works reliably, elegant',()=>{
    expect(tier(rec({}))).toBe(0);
    expect(tier(rec({measured:['open',6,2,'short'],tries:3,matchedAfter:4}))).toBe(1);
    expect(tier(rec({measured:['open',6,2],tries:2,matchedAfter:3}))).toBe(2);
    expect(tier(rec({measured:['open',6,2],tries:1,matchedAfter:3}))).toBe(2);
    expect(tier(rec({measured:['open','short'],tries:1,matchedAfter:2}))).toBe(3);
    // Readings taken after the match don't spoil the method.
    expect(tier(rec({measured:['open',12,2,6],tries:1,matchedAfter:2}))).toBe(3);
  });
});

describe('the electrical reveal',()=>{
  it('maps water to electronics with V = I·R intact',()=>{
    for(const n of NETS){const e=electrical(n);near(e.mA/1000,e.v/e.r,1e-9);}
    expect(electrical(net('header'))).toEqual({v:9,r:150,mA:60});
  });
  it('checks V_th, R_th and I_N and explains mistakes',()=>{
    const n:Net=net('booster');expect(checkAnswer(n,{v:24,r:600,mA:40}).ok).toBe(true);
    const bad=checkAnswer(n,{v:24,r:600,mA:60});expect(bad.ok).toBe(false);expect(bad.problems[0]).toMatch(/V_th \/ R_th/);
    expect(checkAnswer(n,{v:30,r:600,mA:40}).problems[0]).toMatch(/open terminals/);
    expect(checkAnswer(n,{v:24,r:1200,mA:40}).problems[0]).toMatch(/switched off/);
  });
  it('dials snap to their step and range',()=>{
    expect(clampKnob('pP',9.3)).toBe(9.5);expect(clampKnob('pR',0)).toBe(.5);expect(clampKnob('eR',2100)).toBe(2000);
  });
});
