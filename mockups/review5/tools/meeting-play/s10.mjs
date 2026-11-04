import {launch} from '../cap.mjs';import {route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(.3);
await route(g,[[-10,-1],[-10.6,2.8]],.3);
// walk west through the standing coworker at (-12.7,2.8)
let w=await g.walk(-12.7,2.8,.15);log('reached blob centre',w.arrived,JSON.stringify(w.state.player));
await g.zoom(-1500);await g.shot(`${K}-85-pip-inside-coworker`);
console.log('errors',JSON.stringify(await g.close()));
