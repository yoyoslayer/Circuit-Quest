// Makes tests/lunch-dbg.spec.ts: the Lunch clean route with the final 14 s wait logged every 0.1 s.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../../../..');
let s=fs.readFileSync(path.join(root,'tests/lunch.spec.ts'),'utf8');
s=s.replace("test('intended Lunch Rush solution delivers the tray upstairs'","test('dbg lunch'");
const from=process.argv[2]==='early'?"const cap=(await snapshot(page)).items":"await wait(page,14);s=await snapshot(page);";
const logger=`const log:any[]=[];for(let i=0;i<140;i++){await wait(page,.1);const q=await snapshot(page);const c=q.lunch.cables.find((c:any)=>c.id==='thin-1');
log.push({i,ports:c.ports.join(','),strain:+c.strain.toFixed(3),len:c.length,nick:c.nicked,lift:load(q,'lift').state,charge:q.lunch.capCharge,bots:q.lunch.bots.map((b:any)=>b.x+'/'+b.z+'/'+(b.snag??'')).join(' '),pts:JSON.stringify(q.lunch.cablePoints['thin-1'])});}
for(const l of log)console.log('DBG '+JSON.stringify(l));s=await snapshot(page);`;
if(!s.includes(from))throw new Error('marker missing');
s=s.replace(from,logger);
fs.writeFileSync(path.join(root,'tests/lunch-dbg.spec.ts'),s);
