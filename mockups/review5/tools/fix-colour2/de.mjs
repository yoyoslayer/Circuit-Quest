// CIE76 ΔE of each argument colour against BLOBC (after R5 colour2) and job yellow.
const lab=(hex)=>{const n=parseInt(hex.slice(1),16),[R,G,B]=[n>>16,n>>8&255,n&255].map(v=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;});
  const f=(t)=>t>.008856?Math.cbrt(t):7.787*t+16/116,X=f((R*.4124+G*.3576+B*.1805)/.95047),Y=f(R*.2126+G*.7152+B*.0722),Z=f((R*.0193+G*.1192+B*.9505)/1.08883);
  return [116*Y-16,500*(X-Y),200*(Y-Z)];};
const dE=(a,b)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);};
const BLOBC=['#b392f0','#6cc58a','#5b9cf0','#f08a4b','#f78fd0','#f6a07a','#8fd3c8'];
const J=['#ffc94d','#ffc629'];
for(const c of process.argv.slice(2))console.log(c,'minBLOB',Math.min(...BLOBC.map(b=>dE(c,b))).toFixed(1),BLOBC.map(b=>dE(c,b).toFixed(0)).join(','),'job',Math.min(...J.map(j=>dE(c,j))).toFixed(1));
