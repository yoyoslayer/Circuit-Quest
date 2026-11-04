// Audio cue logger: wraps WebAudio so each played oscillator/noise is logged with its bus (sfx/music/ambience).
import {launch as base} from '../cap.mjs';
const INIT=()=>{
  const L=window.__aud=[];let gains=0;
  const AC=window.AudioContext;
  const origGain=AC.prototype.createGain;AC.prototype.createGain=function(){const g=origGain.call(this);gains++;if(gains<=4)g.__bus=['master','sfx','music','amb'][gains-1];return g;};
  const oc=AudioNode.prototype.connect;AudioNode.prototype.connect=function(d,...r){(this.__to??=[]).push(d);return oc.call(this,d,...r);};
  const sv=AudioParam.prototype.setValueAtTime;AudioParam.prototype.setValueAtTime=function(v,t){if(this.__first===undefined)this.__first=v;return sv.call(this,v,t);};
  const desc=Object.getOwnPropertyDescriptor(AudioParam.prototype,'value');Object.defineProperty(AudioParam.prototype,'value',{get(){return desc.get.call(this);},set(v){this.__set=v;desc.set.call(this,v);}});
  const bus=n=>{const seen=new Set();const walk=x=>{if(!x||seen.has(x))return null;seen.add(x);if(x.__bus&&x.__bus!=='master')return x.__bus;for(const y of x.__to??[]){const b=walk(y);if(b)return b;}return null;};return walk(n);};
  const filt=n=>{for(const y of n.__to??[])if(y instanceof BiquadFilterNode)return `${y.type}${Math.round(y.frequency.__set??y.frequency.value)}${y.Q.__set?'Q'+y.Q.__set:''}`;return '';};
  const gainOf=n=>{const seen=new Set();const walk=x=>{if(!x||seen.has(x))return null;seen.add(x);if(x instanceof GainNode&&!x.__bus)return x.gain.__first??x.gain.__set;for(const y of x.__to??[]){const b=walk(y);if(b!=null)return b;}return null;};return walk(n);};
  const os=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...a){const b=bus(this);if(b==='sfx')L.push({t:performance.now(),k:'osc',type:this.type,f:Math.round(this.frequency.__first??this.frequency.__set??this.frequency.value),filt:filt(this),vol:gainOf(this)});return os.apply(this,a);};
  const bs=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){const b=bus(this);if(b==='sfx')L.push({t:performance.now(),k:'noise',filt:filt(this),dur:a[2],vol:gainOf(this)});return bs.apply(this,a);};
};
export async function launch(level,opts={}){
  // cap.mjs navigates inside launch; patch chromium page creation by re-navigating with the init script.
  const g=await base(level,{...opts,start:false});
  await g.page.addInitScript(INIT);await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  g.drain=async(label)=>{const l=await g.page.evaluate(()=>{const x=window.__aud.splice(0);return x;});
    const sum=l.map(e=>e.k==='osc'?`${e.type[0]}${e.f}${e.filt?'/'+e.filt:''}@${e.vol==null?'?':(+e.vol).toFixed(3)}`:`N${e.filt}@${e.vol==null?'?':(+e.vol).toFixed(3)}`);
    // drop footsteps (lowpass ~260-380 noise + sine 80-100) and hum noise to keep the log readable
    const keep=sum.filter(s=>!/^N(lowpass(2[6-9]\d|3[0-8]\d))@0.035/.test(s)&&!/^s(8\d|9\d|100)@0.030/.test(s));
    console.log(`[${label}] (${l.length} cues, ${l.length-keep.length} steps dropped) ${keep.join(' ')}`);return keep;};
  return g;
}
import {resolve} from 'node:path';import {SHOTS} from '../cap.mjs';
export const now=(g,name)=>g.page.screenshot({path:resolve(SHOTS,`${name}.png`)});
