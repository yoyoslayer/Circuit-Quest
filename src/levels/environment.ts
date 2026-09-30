import type {Game} from '../game';
import {box,cyl,sphere,part,toon,group,concrete} from '../render/kit';

export interface RoomPalette {upper:string;lower:string;trim:string;ground:string;building:string;park:boolean}
const office:RoomPalette={upper:'#efe2c8',lower:'#c7b08e',trim:'#a8734a',ground:'#778c78',building:'#879bb0',park:true};
const lab:RoomPalette={upper:'#e1e8f0',lower:'#97aac3',trim:'#526e91',ground:'#75848b',building:'#697d95',park:false};
const workshop:RoomPalette={upper:'#e4e4d8',lower:'#9bbdb3',trim:'#367d78',ground:'#82918a',building:'#789390',park:false};
export function roomPalette(id:string):RoomPalette{
  if(['qfn','spectrum','observatory'].includes(id))return {...lab,...(id==='observatory'?{upper:'#d8ddf0',lower:'#8892b8',trim:'#595c89'}:{})};
  if(['vias','vias-rush','waterworks','garage','depot'].includes(id))return workshop;
  if(id==='arcade')return {...lab,upper:'#e8dcef',lower:'#b494c7',trim:'#76558f'};
  if(id==='archive')return {...office,upper:'#eadfc6',lower:'#b7ad83',trim:'#7a4b2c'};
  if(['lunch','clockwork'].includes(id))return {...office,upper:'#e8eee5',lower:'#a3c8bc',trim:'#528d80'};
  return office;
}

/** Non-interactive surroundings beyond the office footprint, not a second playable level.
 * The cutaway still exposes the inside, but no longer leaves it floating in a void. */
export function exterior(game:Game){
  const r=game.decorRoot,l=game.level,p=roomPalette(l.id),W=l.width/2,D=l.depth/2;
  part(r,box(130,.12,130),toon(p.ground),0,-.65,0,false);
  part(r,box(l.width+9,.08,l.depth+9),toon('#b9bec0'),0,-.55,0,false);
  for(const z of [-D-8,D+8]){
    part(r,box(100,.025,5),toon('#ffffff',{map:concrete('#697277')}),0,-.565,z,false);
    for(let i=-5;i<=5;i++)part(r,box(2,.012,.08),toon('#e6d9aa'),i*6,-.545,z,false);
    for(const side of [-1,1]){part(r,box(100,.12,.18),toon('#bcc3c3'),0,-.5,z+side*2.7,false);part(r,box(100,.05,1.2),toon('#d1d1c8'),0,-.51,z+side*3.4,false);}
    for(let i=0;i<7;i++)part(r,box(.3,.01,3.7),toon('#e7e4d7'),-W-5+i*.65,-.544,z,false);
    const traffic=group(game.root,0,-.5,z+1.2);car(traffic,'#718da1');game.ambient.push(time=>{traffic.position.x=((time*2.3+W)%(W*2+20))-W-10;});
  }
  for(const s of [-1,1])for(let i=0;i<5;i++){
    const x=s*(W+17+i%2*8),z=-D-15+i*11,h=4+(i*7%6);
    const b=group(r,x,-.5,z);
    part(b,box(6,h,6),toon(p.building),0,h/2,0,false);
    part(b,box(6.3,.25,6.3),toon('#596778'),0,h+.1,0,false);
    for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){const facade=group(b,0,0,0,yaw);
      for(let row=0;row<Math.floor(h/1.5);row++)for(let col=0;col<3;col++){
        part(facade,box(1,.8,.08),toon('#526c79'),-1.8+col*1.8,1.8+row*1.5,3.01,false);
        part(facade,box(.83,.62,.02),toon('#a4c4cb'),-1.8+col*1.8,1.8+row*1.5,3.06,false);
      }
      part(facade,box(1.2,1.7,.08),toon('#526472'),0,.85,3.02,false);part(facade,box(1.5,.08,.7),toon('#8d9f9f'),0,1.83,3.22,false);
    }
    part(b,box(1.3,.6,1.1),toon('#7a898f'),1,h+.4,1,false);
  }
  // Planting and loading-yard details distinguish the campus from the utility wings.
  for(const s of [-1,1])for(let i=0;i<4;i++){
    const x=s*(W+5.8),z=-D+2+i*(l.depth-4)/3;
    if(p.park){
      part(r,cyl(.13,.17,1.7,8),toon('#80644f'),x,.25,z,false);
      part(r,sphere(1.1,10,8),toon('#527a60'),x,1.7,z,false);
      part(r,sphere(.8,10,8),toon('#729776'),x+.35,2.4,z,false);
    }else{
      part(r,box(1.2,.5,.9),toon(i%2?'#ba9d75':'#a1adb6'),x,-.25,z,false);
      part(r,box(1.3,.08,1),toon('#596778'),x,.04,z,false);
    }
  }
  // A car park and street lighting establish scale and occupied surroundings.
  for(let i=0;i<4;i++){const parked=group(r,-W-5,-.5,-D+2+i*4.1,Math.PI/2);car(parked,['#8b999d','#af9b83','#7b8d95','#657787'][i]);}
  for(const side of [-1,1])for(const z of [-D-4,D+4]){const lamp=group(r,side*(W+4),-.5,z);part(lamp,cyl(.05,.08,3.7,10),toon('#596773'),0,1.85,0,false);part(lamp,box(.45,.08,.7),toon('#b7c5c7'),0,3.7,.25,false);part(lamp,box(.3,.025,.45),toon('#ece8ce'),0,3.64,.25,false);}
}
function car(parent:import('three').Object3D,color:string){
  part(parent,box(3.6,.55,1.65),toon(color),0,.6,0,false);part(parent,box(1.85,.6,1.45),toon(color),-.2,1.12,0,false);
  for(const z of [-.733,.733])part(parent,box(1.58,.4,.02),toon('#495e6b'),-.2,1.13,z,false);
  for(const x of [-1.1,1.1])for(const z of [-.82,.82]){part(parent,cyl(.32,.32,.16,12,'z'),toon('#3e4549'),x,.32,z,false);part(parent,cyl(.16,.16,.17,12,'z'),toon('#849197'),x,.32,z,false);}
  for(const z of [-.5,.5])part(parent,box(.04,.15,.3),toon('#e8dfbb'),1.82,.65,z,false);
}
