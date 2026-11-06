import {test,expect,type Page} from '@playwright/test';
import {open,wait} from './navigation';
// Review 6 Lunch rules, set up directly on the runtime (props placed, plugs seated) so each one is quick.
test.describe.configure({timeout:120000});
/** Moves job props (by id) to x,z on the floor, then steps once so their sockets follow. */
const place=(page:Page,at:Record<string,[number,number]>)=>page.evaluate(at=>{const g=(window as any).__game;
  for(const [id,[x,z]] of Object.entries(at)){const p=g.props.find((q:any)=>q.spec.id===id);p.body.setTranslation({x,y:p.body.translation().y,z},true);p.body.setLinvel({x:0,y:0,z:0},true);}},at).then(()=>wait(page,.05));
/** Seats a cable's ends in these sockets (null leaves an end loose where it lies) with a fresh, unwrapped route. */
const plug=(page:Page,id:string,ports:[string|null,string|null])=>page.evaluate(([id,ports])=>{const g=(window as any).__game,L=g.lunch,c=L.cables.find((c:any)=>c.id===id);c.ports=[...ports];
  for(const e of [0,1]){const port=L.ports.find((q:any)=>q.id===c.ports[e]);if(port)c.ends[e].copy(port.pos);}c.rope.reset(c.ends[1-c.active]);c.pluggedAt=g.time;},[id,ports] as const);
const lunch=(page:Page)=>page.evaluate(()=>(window as any).__game.lunch.snapshot());
const setPip=(page:Page,x:number,z:number)=>page.evaluate(([x,z])=>{const g=(window as any).__game;g.player.setTranslation({x,y:g.player.translation().y,z},true);},[x,z]);
const dry=(page:Page)=>page.evaluate(()=>{(window as any).__game.lunch.water=0;});

test('a splitter-to-splitter cable conducts whichever way round it is plugged',async({page})=>{
  await open(page,'lunch');await dry(page);
  await place(page,{'supply-a':[-1.5,-2.8],'splitter-1':[-2.4,-1.9],'splitter-2':[-3,-1.1]});
  await plug(page,'thin-2',['a','splitter-1']);await plug(page,'thin-1',['splitter-2','fridge']);
  for(const ends of [['splitter-2','splitter-1'],['splitter-1','splitter-2']] as [string,string][]){
    await plug(page,'thin-3',ends);await wait(page,.5);const s=await lunch(page);
    expect(s.loads.find((l:any)=>l.id==='fridge').state,ends.join(' to ')).toBe('on');}
});
test('the plug target skips a full socket for a free one beside it',async({page})=>{
  await open(page,'lunch');
  // The thick cable fills the kitchen post; a thin end held a little nearer the post than the fridge socket.
  await plug(page,'thick',['b','kitchen']);await setPip(page,-3.2,-2.45);
  const id=await page.evaluate(()=>{const L=(window as any).__game.lunch,c=L.cables.find((c:any)=>c.id==='thin-3');c.ports[1]=null;c.ends[1].set(-3.6,.4,-2.5);return L.plugTarget(c,1)?.id;});
  expect(id).toBe('fridge');
});
test('E resets the tripped cart even with an untripped one nearer',async({page})=>{
  await open(page,'lunch');await place(page,{'supply-a':[-13,5.3]});await setPip(page,-12,6);
  const tripped=await page.evaluate(()=>{const L=(window as any).__game.lunch;L.circuit.sources.find((s:any)=>s.id==='b').tripped=true;L.interact(false);return L.circuit.sources.map((s:any)=>s.tripped);});
  expect(tripped).toEqual([false,false]);
});
test('a cart that cut out from a lift surge keeps the surge badge until reset, and an overload elsewhere keeps its own',async({page})=>{
  await open(page,'lunch');await place(page,{'supply-a':[10.5,-3.6],'capacitor':[-11.6,8.6]});
  await plug(page,'thin-1',['a','lift']);await page.evaluate(()=>{(window as any).__game.lunch.load('lift').enabled=true;});await wait(page,.3);
  const badge=(id:string)=>page.evaluate(id=>{const L=(window as any).__game.lunch,a=L.alerts.get(id);return {visible:a.visible,surge:a.material.map===L.surgeBadge.material.map};},id);
  expect((await lunch(page)).cause.a).toBe('surge');expect(await badge('a')).toEqual({visible:true,surge:true});
  // Cart B overloads (charging the capacitor cart past a lowered limit) while the lift's surge hint is still up.
  await page.evaluate(()=>{(window as any).__game.lunch.circuit.sources.find((s:any)=>s.id==='b').limit=.5;});await plug(page,'thin-3',['b','cap']);await wait(page,.3);
  expect((await lunch(page)).cause.b).toBe('overload');expect(await badge('b')).toEqual({visible:true,surge:false});
  // Long after the 6 s hint, the walk back from the winch: cart A still says surge.
  await wait(page,7);expect(await badge('a')).toEqual({visible:true,surge:true});
});
test('a leak that cuts a cart drops its running motors out, so a reset does not restart them',async({page})=>{
  await open(page,'lunch');await place(page,{'supply-a':[4.2,-3.6]});await plug(page,'thin-2',['a','conveyor']);
  await page.evaluate(()=>{(window as any).__game.lunch.load('conveyor').enabled=true;});await wait(page,2);
  expect((await lunch(page)).loads.find((l:any)=>l.id==='conveyor').state).toBe('on');
  // Another lead from cart A with its bare plug in the corridor puddle.
  await page.evaluate(()=>{const L=(window as any).__game.lunch,c=L.cables.find((c:any)=>c.id==='thin-3');c.ports=['a',null];c.ends[0].copy(L.ports.find((q:any)=>q.id==='a').pos);c.ends[1].set(-.2,.15,.8);c.rope.reset(c.ends[0]);c.active=1;});
  await wait(page,.2);let s=await lunch(page);
  expect(s.sources.find((x:any)=>x.id==='a').tripped).toBe(true);expect(s.cause.a).toBe('leak');expect(s.loads.find((l:any)=>l.id==='conveyor').enabled).toBe(false);
  await page.evaluate(()=>{const L=(window as any).__game.lunch;L.cables.find((c:any)=>c.id==='thin-3').ports=[null,null];L.circuit.resetBreaker('a');});await wait(page,.5);
  s=await lunch(page);expect(s.sources.find((x:any)=>x.id==='a').tripped).toBe(false);expect(s.loads.find((l:any)=>l.id==='conveyor').state).toBe('off');
});
test('an over-strained cable pops out of the socket being pulled away and drops to the floor',async({page})=>{
  await open(page,'lunch');await plug(page,'thin-3',['splitter-1','b']);await wait(page,.2);
  // Carry the splitter off down the corridor: its plug comes out (not cart B's), and lies on the floor.
  for(let x=-12;x<=8;x+=2){await place(page,{'splitter-1':[x,3]});}
  const c=(await lunch(page)).cables.find((c:any)=>c.id==='thin-3');
  expect(c.ports).toEqual([null,'b']);expect(c.ends[0].y).toBeCloseTo(.15,2);
  const socket=await page.evaluate(()=>(window as any).__game.lunch.ports.find((q:any)=>q.id==='splitter-1').pos);
  expect(Math.hypot(c.ends[0].x-socket.x,c.ends[0].z-socket.z)).toBeGreaterThan(.2);
});
test('the tray cannot be picked back up off the belt',async({page})=>{
  await open(page,'lunch');
  const r=await page.evaluate(()=>{const L=(window as any).__game.lunch,t=L.prop('tray').body.translation(),out:boolean[]=[];for(const tray of ['baked','conveyor','lift','delivered']){L.job.tray=tray;out.push(L.canGrab(t));}return out;});
  expect(r).toEqual([true,false,false,false]);
});
test('the portable lamp lights the storeroom only from inside it',async({page})=>{
  // Cart B in the kitchen feeds the post (the portable lamp's circuit); the storeroom lamp is switched off.
  await open(page,'lunch');await place(page,{'supply-b':[-2.6,-4.6]});await plug(page,'thick',['b','kitchen']);
  await page.evaluate(()=>{(window as any).__game.lunch.load('store-lamp').enabled=false;});await wait(page,.2);
  const litAt=async(x:number,z:number)=>{await place(page,{'portable-lamp':[x,z]});return (await lunch(page)).lit;};
  expect(await litAt(-9.5,3)).toBe(false);expect(await litAt(-9.5,-3.5)).toBe(true);
});
