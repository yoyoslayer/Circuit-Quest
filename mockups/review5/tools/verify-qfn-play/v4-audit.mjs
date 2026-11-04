import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:false});await g.advance(.2);
const a=await g.audit(.005);console.log(JSON.stringify(a).slice(0,1500));
console.log('errors',await g.close());
