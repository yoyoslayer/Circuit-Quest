export class Sound {
  context?:AudioContext;hum?:OscillatorNode;gain?:GainNode;muted=false;buffer?:AudioBuffer;
  start(){if(!this.context){this.context=new AudioContext();this.hum=this.context.createOscillator();this.gain=this.context.createGain();this.hum.type='sine';this.gain.gain.value=0;this.hum.connect(this.gain).connect(this.context.destination);this.hum.start();}void this.context.resume();}
  tone(freq=220,duration=.12,volume=.06,type:OscillatorType='sine'){
    if(!this.context||this.muted)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.5),c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration);
  }
  strain(ratio:number){if(this.gain&&this.context&&this.hum){this.gain.gain.setTargetAtTime(this.muted?0:Math.max(0,ratio-.7)*.12,this.context.currentTime,.08);this.hum.frequency.setTargetAtTime(70+ratio*110,this.context.currentTime,.08);}}
  /** Filtered noise burst for crashes, thuds and breaker clunks. */
  noise(duration=.18,volume=.08,freq=900){
    if(!this.context||this.muted)return;const c=this.context;if(!this.buffer){this.buffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=this.buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.buffer;f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
    s.connect(f).connect(g).connect(c.destination);s.start(0,Math.random()*.5,duration);
  }
  cheer(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>this.tone(f,.32,.05),i*110));}
}
