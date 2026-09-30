import * as T from 'three';
import type {Game} from '../../game';
import type {Order} from './logic';
import {box,cyl,sphere,part,group,toon,INK,DMETAL} from '../../render/kit';
import {solid} from '../../levels/decor';
import {signPlate} from '../../render/labels';
/** Customer hardware gives each fabrication choice a purpose. The response is
 * driven by the rule verdict; these are demonstrators, not thermal/RF solvers. */
export class DeviceFixture{
  root:T.Group;private model:T.Group;private shown='';private lamp?:T.Mesh;private light?:T.PointLight;private indicators:T.Mesh[]=[];private ok=false;
  constructor(game:Game,click:(obj:T.Object3D,act:string)=>void){
    this.root=group(game.root,6.6,0,-.85,-Math.PI/2);this.model=group(this.root,0,1.02,0);
    part(this.root,box(2.4,.12,1.6),toon('#c6d0c9'),0,.96,0);for(const x of [-1,1])part(this.root,box(.13,.9,1.3),toon('#4b5e68'),x,.45,0);
    solid(game,1.6,1,2.4,6.6,.5,-.85);signPlate(this.root,'CUSTOMER HARDWARE',0,.7,.83,2,{bg:'#29444b',fg:'#edf2e8'});
    const test=part(this.root,box(.35,.1,.3),toon('#d6ba77'),-.65,1.07,.6);signPlate(test,'TEST',0,.06,0,.3,{bg:'#d6ba77'});click(test,'test');
    const send=part(this.root,box(.35,.1,.3),toon('#83b39c'),.65,1.07,.6);signPlate(send,'SEND',0,.06,0,.3,{bg:'#83b39c'});click(send,'serve');
  }
  order(o:Order){if(this.shown===o.id)return;this.shown=o.id;this.model.clear();this.indicators=[];this.light=undefined;this.lamp=undefined;this.ok=false;
    const m=this.model;
    if(o.inPad){
      part(m,box(1.1,.04,.8),toon('#50846c'),0,.03,0);part(m,box(.5,.14,.5),toon(INK),0,.13,0);
      for(let k=0;k<7;k++)part(m,box(.04,.45,.7),toon('#98a6a7'),-.36+k*.12,.44,0);
      for(const z of [-.3,.3])for(let k=0;k<5;k++)part(m,box(.04,.025,.13),toon('#c5cfd0'),-.23+k*.115,.07,z);
      this.lamp=part(m,box(.48,.02,.48),toon('#d78b5a'),0,.22,0);signPlate(m,'THERMAL PAD',0,.75,0,1.25,{bg:'#dfc29a'});
    }else if(o.maxPad){
      part(m,box(1.15,.04,.8),toon('#4c8268'),0,.02,0);part(m,box(.65,.12,.56),toon(INK),0,.13,-.06);
      for(let row=0;row<4;row++)for(let col=0;col<5;col++)part(m,sphere(.035,8,6),toon('#c0c7c8'),-.23+col*.115,.057,-.28+row*.12);
      signPlate(m,'FINE-PITCH BGA',0,.48,0,1.4,{bg:'#e0d7ba'});
    }else if(o.stitch){
      part(m,box(1.35,.045,.85),toon('#4a8067'),0,.03,0);part(m,box(1.05,.035,.7),toon('#b0b9b8'),0,.45,0);
      for(const x of [-.5,.5])part(m,box(.035,.4,.68),toon('#a1afad'),x,.24,0);
      for(let k=0;k<o.stitch;k++)part(m,cyl(.035,.035,.015,10),toon('#dbab65'),-.55+k*1.1/(o.stitch-1),.063,.34);
      signPlate(m,'GROUNDED SHIELD',0,.75,0,1.6,{bg:'#d9decc'});
    }else if(o.from===2&&o.to===3){
      part(m,box(1.1,.25,.65),toon('#dce1d8'),0,.14,0);for(const x of [-.4,.4])part(m,cyl(.025,.025,.65,10),toon(INK),x,.57,-.24);
      for(let k=0;k<4;k++)part(m,box(.12,.055,.04),toon('#526573'),-.3+k*.2,.17,.34);
      signPlate(m,'INTERNAL ROUTER NET',0,.95,0,1.7,{bg:'#d9decc'});
    }else{
      part(m,cyl(.32,.32,.07,20),toon('#627b85'),0,.06,0);part(m,cyl(.035,.035,.65,12),toon(DMETAL),0,.42,0);
      part(m,box(.5,.07,.035),toon(DMETAL),.22,.76,0);part(m,cyl(.25,.13,.25,20),toon('#c4b28a'),.4,.68,0);
      this.lamp=part(m,sphere(.09),toon('#d5d1b8'),.4,.55,0);this.light=new T.PointLight('#ffe1a0',0,2);this.light.position.set(.4,.48,0);m.add(this.light);
      signPlate(m,'DESK LAMP',-.2,1.1,0,1,{bg:'#dfc29a'});
    }
    for(let k=0;k<3;k++)this.indicators.push(part(m,sphere(.035,8,6),toon('#526573'),-.2+k*.2,.1,.49,false));
  }
  test(tier:number){this.ok=tier>0;for(const m of this.indicators)m.material=toon(this.ok?'#6eac82':'#c36b58',{emissive:this.ok?'#36643e':'#622b26',ei:.5});
    if(this.light)this.light.intensity=this.ok?1.8:0;if(this.lamp)this.lamp.material=toon(this.ok?'#e5c07b':'#b69678',{emissive:this.ok?'#947338':'#000000',ei:.5});
  }
}
