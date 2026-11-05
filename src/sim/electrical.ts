// An edge models both insulated conductors in a complete power lead.
// A missing return is represented explicitly, rather than teaching a one-wire circuit.
export interface Source {id:string;limit:number;tripped:boolean}
export interface Lead {id:string;from:string;to:string;rating:number;closed:boolean;returnClosed?:boolean;wet?:boolean;heat:number;dead:boolean}
/** A capacitor that helps a load start: it supplies the start-up kick above the steady draw. If it
 *  has a `node`, it helps only when the load's feed actually runs through that node (it is wired
 *  inline); without one, `atLoad` says so directly. It charges only by drawing real current from a
 *  live supply: `chargeRate` bars (default 1) while it is below full and not giving a kick, and that
 *  current counts on the supply and on every lead it flows through. It holds no charge it was never
 *  given. `charging` reports whether it drew charging current on the last tick. */
export interface Capacitor {node?:string;atLoad:boolean;charge:number;chargeRate?:number;charging?:boolean}
/** A full capacitor holds this much (bar·seconds). */
export const CAP_FULL=12;
export interface Load {id:string;steady:number;kick?:number;kickSeconds?:number;enabled:boolean;state:'off'|'on'|'brownout';started:number;capacitor?:Capacitor}
export interface ElectricalEvent {time:number;kind:'trip'|'short'|'scorch'|'start'|'stop';id:string}
/** How fast a lead heats (heat units/s). Over its rating it is I²R heating, so it grows with the
 *  square of the overload; the time scale is tuning (real cables take minutes): 4 bars on a 3-bar
 *  cable (1.33×) heats at about 0.33/s and dies (heat 2) in about 6 s. Under its rating it cools at 0.4/s. */
export const heatRate=(amps:number,rating:number)=>amps>rating?((amps/rating)**2-1)*.43:-.4;
export class Circuit {
  time=0;events:ElectricalEvent[]=[];draw=new Map<string,number>();
  constructor(public sources:Source[],public leads:Lead[],public loads:Load[]){}
  resetBreaker(id:string){const s=this.sources.find(s=>s.id===id);if(s)s.tripped=false;}
  tick(dt:number){
    this.time+=dt;this.draw.clear();
    const routes=new Map<string,{source:Source;path:Lead[]}>();
    for(const source of this.sources){
      if(source.tripped)continue;
      const visit=(node:string,path:Lead[],seen:Set<string>)=>{
        if(seen.has(node))return;const next=new Set(seen).add(node);
        for(const edge of this.leads.filter(e=>e.from===node&&e.closed&&e.returnClosed!==false&&!e.dead)){
          if(edge.wet){source.tripped=true;this.events.push({time:this.time,kind:'short',id:source.id});return;}
          if(!routes.has(edge.to))routes.set(edge.to,{source,path:[...path,edge]});visit(edge.to,[...path,edge],next);
        }
      };visit(source.id,[],new Set());
    }
    // Current drawn along a route counts on its supply and on every lead it flows through.
    const carry=(route:{source:Source;path:Lead[]},value:number)=>{
      this.draw.set(route.source.id,(this.draw.get(route.source.id)??0)+value);
      for(const edge of route.path)this.draw.set(edge.id,(this.draw.get(edge.id)??0)+value);};
    for(const load of this.loads){
      const route=routes.get(load.id),cap=load.capacitor;
      if(cap?.node)cap.atLoad=!!route&&route.path.some(e=>e.from===cap.node);
      let kickActive=false;
      if(load.enabled&&route&&!route.source.tripped){
        if(load.state!=='on')load.started=this.time;
        kickActive=this.time-load.started<(load.kickSeconds??1);
        let value=kickActive?Math.max(load.steady,load.kick??0):load.steady;
        // The capacitor gives the kick above the steady draw, as far as its charge lasts.
        if(cap?.atLoad&&value>load.steady){const supplied=Math.min(cap.charge,(value-load.steady)*dt);cap.charge-=supplied;value-=supplied/dt;}
        carry(route,value);
      }
      if(!cap)continue;
      // Charging is a real current from a live supply into the capacitor, through its node (or with
      // its load's feed): it adds to what the supply and those leads carry, and never runs during a kick.
      const feed=cap.node?routes.get(cap.node):route,rate=cap.chargeRate??1;
      cap.charging=!!feed&&!feed.source.tripped&&rate>0&&cap.charge<CAP_FULL-1e-9&&!(cap.atLoad&&kickActive);
      if(cap.charging){const amps=Math.min(rate,(CAP_FULL-cap.charge)/dt);const next=cap.charge+amps*dt;cap.charge=next>CAP_FULL-1e-6?CAP_FULL:next;carry(feed!,amps);}
    }
    for(const source of this.sources)if(!source.tripped&&(this.draw.get(source.id)??0)>source.limit+1e-6){source.tripped=true;this.events.push({time:this.time,kind:'trip',id:source.id});}
    for(const edge of this.leads){
      edge.heat=Math.max(0,edge.heat+heatRate(this.draw.get(edge.id)??0,edge.rating)*dt);
      if(edge.heat>=2&&!edge.dead){edge.dead=true;this.events.push({time:this.time,kind:'scorch',id:edge.id});}
    }
    for(const load of this.loads){
      const route=routes.get(load.id),was=load.state;
      load.state=!load.enabled||!route?'off':route.source.tripped||route.path.some(e=>e.dead)?'brownout':'on';
      if(was!=='on'&&load.state==='on')this.events.push({time:this.time,kind:'start',id:load.id});
      if(was==='on'&&load.state!=='on')this.events.push({time:this.time,kind:'stop',id:load.id});
    }
  }
}
