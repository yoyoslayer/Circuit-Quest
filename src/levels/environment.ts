import type {Game} from '../game';
import {box,cyl,sphere,part,toon,group} from '../render/kit';

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
    part(r,box(100,.025,5),toon('#626d7a'),0,-.565,z,false);
    for(let i=-5;i<=5;i++)part(r,box(2,.012,.08),toon('#e6d9aa'),i*6,-.545,z,false);
  }
  for(const s of [-1,1])for(let i=0;i<5;i++){
    const x=s*(W+17+i%2*8),z=-D-15+i*11,h=4+(i*7%6);
    const b=group(r,x,-.5,z);
    part(b,box(6,h,6),toon(p.building),0,h/2,0,false);
    part(b,box(6.3,.25,6.3),toon('#596778'),0,h+.1,0,false);
    for(let row=0;row<Math.floor(h/1.5);row++)for(let col=0;col<3;col++)
      part(b,box(.8,.65,.03),toon('#cfdfdf'),-1.8+col*1.8,.9+row*1.5,3.02,false);
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
}
