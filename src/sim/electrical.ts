// An edge models both insulated conductors in a complete power lead.
// A missing return is represented explicitly, rather than teaching a one-wire circuit.
export interface Source {id:string;limit:number;tripped:boolean}
export interface Lead {id:string;from:string;to:string;rating:number;closed:boolean;returnClosed?:boolean;wet?:boolean;heat:number;dead:boolean}
/** A capacitor that helps a load start: it supplies the start-up kick above the steady draw. If it
 *  has a `node`, it helps only when the load's feed actually runs through that node (it is wired
 *  inline); without one, `atLoad` says so directly. Either way it charges only from a live supply. */
export interface Capacitor {node?:string;atLoad:boolean;charge:number}
export interface Load {id:string;steady:number;kick?:number;kickSeconds?:number;enabled:boolean;state:'off'|'on'|'brownout';started:number;capacitor?:Capacitor}
export interface ElectricalEvent {time:number;kind:'trip'|'short'|'scorch'|'start'|'stop';id:string}
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
    const demand=new Map<string,number>();
    for(const load of this.loads){
      const route=routes.get(load.id),cap=load.capacitor;
      if(cap?.node)cap.atLoad=!!route&&route.path.some(e=>e.from===cap.node);
      // A capacitor charges from a live supply only: its node (or its load) must be fed. It supplies
      // a start-up kick; it does not absorb one, and it holds no charge it was never given.
      const fed=!!cap&&(cap.node?routes.has(cap.node):!!route);
      if(!load.enabled||!route||route.source.tripped){if(cap&&fed)cap.charge=Math.min(12,cap.charge+dt);continue;}
      const starting=load.state!=='on';
      if(starting)load.started=this.time;
      const kickActive=this.time-load.started<(load.kickSeconds??1);
      let value=kickActive?Math.max(load.steady,load.kick??0):load.steady;
      if(cap?.atLoad&&value>load.steady){const supplied=Math.min(cap.charge,(value-load.steady)*dt);cap.charge-=supplied;value-=supplied/dt;}
      else if(cap&&fed)cap.charge=Math.min(12,cap.charge+dt);
      demand.set(load.id,value);
      this.draw.set(route.source.id,(this.draw.get(route.source.id)??0)+value);
      for(const edge of route.path)this.draw.set(edge.id,(this.draw.get(edge.id)??0)+value);
    }
    for(const source of this.sources)if(!source.tripped&&(this.draw.get(source.id)??0)>source.limit+1e-6){source.tripped=true;this.events.push({time:this.time,kind:'trip',id:source.id});}
    for(const edge of this.leads){
      const amps=this.draw.get(edge.id)??0;
      edge.heat=Math.max(0,edge.heat+(amps>edge.rating?(amps/edge.rating-1)*dt: -dt*.4));
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
