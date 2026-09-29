export type TrayStage='raw'|'baked'|'carried'|'conveyor'|'lift'|'delivered'|'burned';
export interface LunchPower {oven:boolean;fridge:boolean;conveyor:boolean;lift:boolean}
export class LunchJob {
  temperature=.28;bake=0;ovenWait=0;transport=0;height=0;tray:TrayStage='raw';cooled=false;failed=false;done=false;
  tick(dt:number,power:LunchPower){
    if(this.failed||this.done)return;
    this.temperature=Math.max(0,Math.min(1,this.temperature+(this.cooled?-.05:power.fridge?-.045:.006)*dt));
    if(this.temperature>=1){this.failed=true;return;}
    if(this.tray==='raw'){this.bake=Math.max(0,Math.min(20,this.bake+(power.oven?dt:-dt*.15)));if(this.bake>=20)this.tray='baked';}
    if(this.tray==='baked'&&power.oven){this.ovenWait+=dt;if(this.ovenWait>45){this.tray='burned';this.failed=true;}}
    if(this.tray==='conveyor'&&power.conveyor){this.transport=Math.min(1,this.transport+dt/9);if(this.transport>=1)this.tray='lift';}
    if(this.tray==='lift'&&power.lift){this.height=Math.min(1,this.height+dt/6);if(this.height>=1){this.tray='delivered';this.done=true;}}
  }
  pickTray(){if(this.tray==='baked')this.tray='carried';}
  placeTray(){if(this.tray==='carried')this.tray='conveyor';}
}
