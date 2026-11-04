import {Circuit} from './electrical.mjs';
// Cart A -> thin lead -> cap node -> cap lead -> lift. Plus conveyor via another lead.
const mk=()=>{const loads=[{id:'lift',steady:3,kick:9,kickSeconds:1,enabled:false,state:'off',started:0,capacitor:{node:'cap',atLoad:false,charge:12}},{id:'conveyor',steady:1.5,kick:3,kickSeconds:1,enabled:false,state:'off',started:0}];
 const leads=[{id:'l1',from:'a',to:'cap',rating:3,closed:true,heat:0,dead:false},{id:'cap-lead',from:'cap',to:'lift',rating:10,closed:true,heat:0,dead:false},{id:'l2',from:'a',to:'conveyor',rating:3,closed:true,heat:0,dead:false}];
 return new Circuit([{id:'a',limit:5,tripped:false}],leads,loads);};
const dt=1/60;
// 1) lift start with cap: peak draw on a, cap charge after kick, recharge with no extra draw
let c=mk();const lift=c.loads[0];lift.enabled=true;let peak=0,t=0;
for(;t<1.2;t+=dt){c.tick(dt);peak=Math.max(peak,c.draw.get('a')??0);}
console.log('cap: peak draw a',peak.toFixed(2),'charge after kick',lift.capacitor.charge.toFixed(2),'tripped',c.sources[0].tripped);
const ch0=lift.capacitor.charge;let maxDraw=0;for(let k=0;k<180;k++){c.tick(dt);maxDraw=Math.max(maxDraw,c.draw.get('a'));}
console.log('3s later charge',lift.capacitor.charge.toFixed(2),'(from',ch0.toFixed(2)+') max draw on a',maxDraw.toFixed(2),'-> free recharge');
// 2) conveyor started after lift running
c.loads[1].enabled=true;c.tick(dt);console.log('conveyor after lift: draw a',c.draw.get('a'),'tripped',c.sources[0].tripped);
// 3) no cap: lift trips first tick
c=mk();c.leads[1].closed=false;c.leads.push({id:'direct',from:'a',to:'lift',rating:3,closed:true,heat:0,dead:false});c.loads[0].enabled=true;c.tick(dt);
console.log('no cap: tripped after 1 tick',c.sources[0].tripped,'events',JSON.stringify(c.events));
// 4) heat 4 on 3 linear: time to dead
c=new Circuit([{id:'a',limit:5,tripped:false}],[{id:'t',from:'a',to:'k',rating:3,closed:true,heat:0,dead:false}],[{id:'k',steady:4,enabled:true,state:'off',started:0}]);
let tt=0;while(!c.leads[0].dead&&tt<60){c.tick(dt);tt+=dt;}console.log('4 on 3 cable dead at',tt.toFixed(2),'s (proposed I^2 rule rate',((4/3)**2-1).toFixed(3),'/s ->',(2/((4/3)**2-1)).toFixed(2),'s)');
// 5) cap charges with no supply? cart unpowered storeroom: starts at 12
console.log('initial cap charge in runtime = 12 (lunch-runtime.ts:44)');
