// Prop census per room: count, kinds, job-yellow lookalikes, audit(.02). BASE=http://localhost:4205
// node mockups/review5/tools/fix-colour/census.mjs [level...]
import {launch} from '../cap.mjs';
const levels=process.argv.slice(2).length?process.argv.slice(2):['lobby','lunch','arcade','garage','qfn','observatory','spectrum','playground','meeting'];
const JOB=['#ffc94d','#ffc629'];
const lab=h=>{const n=parseInt(h.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;});
  const X=(c[0]*.4124+c[1]*.3576+c[2]*.1805)/.95047,Y=c[0]*.2126+c[1]*.7152+c[2]*.0722,Z=(c[0]*.0193+c[1]*.1192+c[2]*.9505)/1.08883,f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;
  return [116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))];};
const dE=(a,b)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);};
for(const lv of levels){
  const g=await launch(lv,{fullfx:false});
  await g.advance(.2);
  const props=await g.ev('return window.__game.props.map(p=>({kind:p.spec.kind,id:p.spec.id,color:p.spec.color,x:p.spec.x,z:p.spec.z}))');
  const audit=await g.audit(.02);
  const kinds={};for(const p of props)kinds[p.kind]=(kinds[p.kind]??0)+1;
  const yellow=props.filter(p=>!p.id&&p.color&&JOB.some(j=>dE(p.color,j)<25)).map(p=>`${p.kind}@${p.x},${p.z} ${p.color}`);
  const noColor=props.filter(p=>!p.id&&!p.color&&['mug','beanbag','splitter','reel'].includes(p.kind)).length;
  const lookalike=props.filter(p=>!p.id&&['reel','splitter','dolly','plug','bridge','wedge','strip','coupler'].includes(p.kind)).map(p=>`${p.kind}@${p.x},${p.z}`);
  console.log(`\n== ${lv}: props ${props.length}  audit.02 ${audit.length}${audit.length?' '+JSON.stringify(audit.slice(0,6)):''}`);
  console.log('  kinds',JSON.stringify(kinds));
  console.log('  yellow non-job',yellow.length,yellow.slice(0,12).join(' | '),' default-coloured mugs/beanbags',noColor);
  console.log('  lookalikes',lookalike.join(' | '));
  if(g.errors.length)console.log('  errors',g.errors.slice(0,3));
  await g.browser.close();
}
