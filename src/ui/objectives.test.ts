import {it,expect,vi} from 'vitest';

vi.hoisted(()=>vi.stubGlobal('location',{search:''}));
import {bonusState,propName,promptFor,JOBS,stationJob,NAMES,ObjectivesHUD} from './objectives';
import {prefabs} from '../props/prefabs';

import type {Game} from '../game';

const game=(extra:Record<string,unknown>={})=>({running:true,won:false,paused:false,player:{translation:()=>({x:0,y:.8,z:0})},props:[],level:{id:'playground',target:{x:7,z:-6}},plugPosition:{x:9,z:9},rope:{peak:0},nearSwitch:()=>false,nearest:()=>undefined,...extra}) as unknown as Game;
it('gives every physics prefab a readable name',()=>{expect(Object.keys(NAMES).sort()).toEqual(Object.keys(prefabs).sort());});

it('keeps clean/time bonuses provisional and achievements earned',()=>{

 expect(bonusState('Break nothing',true,false)).toBe('at-risk');expect(bonusState('Finish before 4:00',true,false)).toBe('at-risk');expect(bonusState('Topple the carton tower',true,false)).toBe('earned');expect(bonusState('Break nothing',true,true)).toBe('earned');expect(bonusState('Never trip a breaker',false,false)).toBe('missed');

});

it('names carried job items rather than their generic prefab',()=>{

 expect(propName('box','parts')).toBe('parts crate');expect(propName('box','blocks')).toBe('resistor tray');expect(propName('box','robot')).toBe('robot');

 expect(promptFor(game({held:{spec:{kind:'box',id:'parts'}}}))?.text).toContain('parts crate');

});

it('describes E as dropping a carried item, never as moving it',()=>{

 const g=game({held:{spec:{kind:'cart',id:'motor'}},station:{prompt:()=>({key:'E',text:'Keep rolling it away'})}});

 expect(promptFor(g)).toEqual({key:'E',text:'Put the motor cart down · Q throws it'});

});

it('prioritises recovering a dropped plug over an unpowered switch',()=>{

 const g=game({plugPosition:{x:.2,z:.1},nearSwitch:()=>true,connected:false});expect(promptFor(g)).toEqual({key:'F',text:'Pick up the plug'});

});

it('does not advertise a slingshot when the cable is not loaded',()=>{

 const g=game({holdingPlug:true,rope:{peak:0},stripPlaced:()=>true});expect(promptFor(g)?.key).toBe('F');

});

it('keeps safety conditions live instead of letting a dead feed count as powered',()=>{

 const feed=JOBS.lunch.steps.find(s=>s.text.includes('feed post'))!;

 const g=game({lunch:{powered:()=>false,job:{bake:20}}});expect(feed.recheck).toBeTruthy();expect(feed.done(g)).toBe(false);

});

it('strips duplicate key letters from station task text',()=>{

 const g=game({station:{stand:{x:0,z:0},job:{goal:'Test',steps:[{text:'Step up to the bench (E)',done:()=>false}],bonuses:[]}}});expect(stationJob(g).steps[0].text).toBe('Step up to the bench');

});

it('the lobby card starts with every finished job ticked, in any order, and rings no bell for them',()=>{
 const el=()=>({className:'',hidden:false,innerHTML:'',style:{},setAttribute(){},append(){},addEventListener(){},classList:{toggle(){}}});
 vi.stubGlobal('document',{createElement:el});
 // Lunch (step 3) finished before Playground and the Meeting.
 const done=[false,false,true,false],bell=vi.fn();
 const g=game({running:false,hub:{job:{goal:'HQ',steps:done.map((_,i)=>({text:`job ${i}`,done:()=>done[i]})),bonuses:[]}},audio:{bell},root:{add(){}}});
 const hud=new ObjectivesHUD(g,el() as unknown as HTMLElement);hud.update();
 expect(hud.card.innerHTML).toContain('Step 2 of 4');expect((hud.card.innerHTML.match(/class="done"/g)??[]).length).toBe(1);expect(bell).not.toHaveBeenCalled();
 // A job's own steps still latch in order: step 2 being true early waits for step 1.
 const order=[false,true],sb=vi.fn();
 const st=new ObjectivesHUD(game({running:false,station:{stand:{x:0,z:0},job:{goal:'S',steps:order.map((_,i)=>({text:`s ${i}`,done:()=>order[i]})),bonuses:[]}},audio:{bell:sb},root:{add(){}}}),el() as unknown as HTMLElement);st.update();
 expect(st.card.innerHTML).toContain('Step 1 of 2');expect(sb).not.toHaveBeenCalled();
 vi.unstubAllGlobals();vi.stubGlobal('location',{search:''});
});

