import {readFileSync} from 'node:fs';
const c=JSON.parse(readFileSync('mockups/review5/tools/props-gallery/census.json'));
const H={box:.6,desk:.95,chair:.95,monitor:.48,mug:.2,paper:.03,plant:1.25,cabinet:1.6,sofa:1.1,bin:.48,reel:.7,coupler:.24,coffee:.65,cart:.65,glass:2.6,printer:1,whiteboard:1.7,bookshelf:1.8,vending:2,cooler:1.25,pingpong:.9,bridge:.2,mop:1.5,tray:.15,lamp:1.5,dolly:1.3,supply:1.3,capcart:1.2,coolbox:.6,splitter:.24,plug:.22,wedge:.35,beanbag:.6,cone:.62,strip:.14};
const DEF={box:'#c98f5a',mug:'#ffc94d',reel:'#ffc94d',beanbag:'#ffc94d',splitter:'#ffc94d',wedge:'#ffc94d',bridge:'#ffc94d',chair:'#3f7fd6',cabinet:'#aab3c2',bookshelf:'#c7ccd6',cart:'#5f8fa8'};
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lab=h=>{let [r,g,b]=hex(h).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});let x=(r*.4124+g*.3576+b*.1805)/.95047,y=r*.2126+g*.7152+b*.0722,z=(r*.0193+g*.1192+b*.9505)/1.08883;const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))];};
const dE=(a,b)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);};
const JOB=['#ffc94d','#ffc629','#ffd84a'];
const BLOBC=['#b392f0','#6cc58a','#5b9cf0','#f08a4b','#f78fd0','#ffc94d','#8fd3c8'];
for(const [l,v] of Object.entries(c)){
  const kinds={};for(const p of v.census){kinds[p.kind]=(kinds[p.kind]??0)+1;}
  const yel=v.census.filter(p=>!p.id&&p.visible).map(p=>({...p,col:p.color??DEF[p.kind]})).filter(p=>p.col&&Math.min(...JOB.map(j=>dE(p.col,j)))<25);
  const yk={};for(const p of yel)yk[p.kind]=(yk[p.kind]??0)+1;
  const odd=v.census.filter(p=>p.visible&&p.y<4&&(Math.abs(p.y-H[p.kind]/2)>.06)&&p.y<H[p.kind]/2+.3).map(p=>`${p.kind}${p.id?'#'+p.id:''}@${p.x},${p.z} y${p.y} (exp ${H[p.kind]/2})`);
  const blobbags=v.census.filter(p=>p.kind==='beanbag').map(p=>p.color??DEF.beanbag).filter(c=>BLOBC.some(b=>dE(c,b)<15)).length;
  const boxcols=[...new Set(v.census.filter(p=>p.kind==='box').map(p=>p.color??DEF.box))];
  const notKraft=v.census.filter(p=>p.kind==='box'&&!['#c98f5a','#d7a56d','#e0b47a'].includes(p.color??DEF.box)).length;
  console.log(`\n== ${l} n=${v.n} dc=${v.drawCalls}`,JSON.stringify(kinds));
  console.log(' job-yellow non-job:',yel.length,JSON.stringify(yk));
  console.log(' beanbags in BLOBC hue:',blobbags,'/',kinds.beanbag??0,' boxes not kraft:',notKraft,'/',kinds.box??0,boxcols.join(' '));
  console.log(' off-floor/tipped:',odd.slice(0,12).join(' | '));
  const reels=v.census.filter(p=>['reel','splitter','coupler','plug','strip'].includes(p.kind)).map(p=>`${p.kind}${p.id?'#'+p.id:'(decoy)'}@${p.x},${p.z}`);console.log(' job-like:',reels.join(' '));
}
