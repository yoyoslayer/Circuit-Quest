export const BURN_SECONDS=90,BURN_WARNING=60;
/** Seconds the belt takes to carry the tray to the lift, and the lift to raise it. */
export const BELT_SECONDS=6,LIFT_SECONDS=5;
/** An unpowered fridge warms this much per second: from the start value it spoils after about 160 s. */
export const FRIDGE_WARMING=.0045;
export type TrayStage='raw'|'baked'|'carried'|'conveyor'|'lift'|'delivered'|'burned';
export interface LunchPower {oven:boolean;fridge:boolean;conveyor:boolean;lift:boolean}
export class LunchJob {
  temperature=.28;bake=0;ovenWait=0;transport=0;height=0;tray:TrayStage='raw';cooled=false;failed=false;done=false;
  /** The fridge only starts warming once the rush is on (the runtime starts it when the kitchen door
   *  first opens), so time spent looking round the power room is never counted against the lunch. */
  warming=true;
  tick(dt:number,power:LunchPower){
    if(this.failed||this.done)return;
    const rate=this.cooled?-.05:power.fridge?-.045:this.warming?FRIDGE_WARMING:0;
    this.temperature=Math.max(0,Math.min(1,this.temperature+rate*dt));
    if(this.temperature>=1){this.failed=true;return;}
    if(this.tray==='raw'){this.bake=Math.max(0,Math.min(20,this.bake+(power.oven?dt:-dt*.15)));if(this.bake>=20)this.tray='baked';}
    // A baked tray waits on the oven door; left there with the oven on it scorches (warning from 60 s).
    if(this.tray==='baked'&&power.oven){this.ovenWait+=dt;if(this.ovenWait>BURN_SECONDS){this.tray='burned';this.failed=true;}}
    if(this.tray==='conveyor'&&power.conveyor){this.transport=Math.min(1,this.transport+dt/BELT_SECONDS);if(this.transport>=1)this.tray='lift';}
    if(this.tray==='lift'&&power.lift){this.height=Math.min(1,this.height+dt/LIFT_SECONDS);if(this.height>=1){this.tray='delivered';this.done=true;}}
  }
  pickTray(){if(this.tray==='baked')this.tray='carried';}
  placeTray(){if(this.tray==='carried')this.tray='conveyor';}
}
