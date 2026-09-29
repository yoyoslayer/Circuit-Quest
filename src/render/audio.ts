// Procedural WebAudio: sound effects, coworker gibberish, a light music loop and room tone.
// Everything is synthesised at runtime, so there are no licensed samples to track.
type Song={chords:number[][];bass:number[];swing:number;bpm:number};
const note=(n:number)=>440*2**((n-69)/12);
// MIDI note numbers; four bars per loop, one chord per bar.
const SONGS:Record<string,Song>={
  playground:{bpm:92,swing:.12,chords:[[65,69,72,76],[64,67,71,74],[62,65,69,72],[60,64,67,71]],bass:[41,40,38,36]},
  meeting:{bpm:100,swing:.18,chords:[[60,64,67,71],[57,60,64,67],[62,65,69,72],[55,59,62,65]],bass:[36,33,38,31]},
  lunch:{bpm:112,swing:.22,chords:[[65,69,72,74],[62,66,69,72],[67,70,74,77],[60,64,67,70]],bass:[41,38,43,36]},
};
export class Sound {
  context?:AudioContext;hum?:OscillatorNode;gain?:GainNode;buffer?:AudioBuffer;
  private master?:GainNode;private sfx?:GainNode;private musicBus?:GainNode;private ambience?:GainNode;private isMuted=false;
  private song?:Song;private nextStep=0;private stepIndex=0;private level='playground';private timer?:number;
  get muted(){return this.isMuted;}
  set muted(value:boolean){this.isMuted=value;if(this.master&&this.context)this.master.gain.setTargetAtTime(value?0:.9,this.context.currentTime,.05);}
  start(){
    if(!this.context){const c=this.context=new AudioContext();
      const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(c.destination);
      this.master=c.createGain();this.master.gain.value=this.isMuted?0:.9;this.master.connect(comp);
      this.sfx=c.createGain();this.sfx.gain.value=1;this.sfx.connect(this.master);
      this.musicBus=c.createGain();this.musicBus.gain.value=.55;this.musicBus.connect(this.master);
      this.ambience=c.createGain();this.ambience.gain.value=1;this.ambience.connect(this.master);
      this.hum=c.createOscillator();this.gain=c.createGain();this.hum.type='sawtooth';this.gain.gain.value=0;const hf=c.createBiquadFilter();hf.type='lowpass';hf.frequency.value=600;this.hum.connect(hf).connect(this.gain).connect(this.sfx);this.hum.start();
      this.startAmbience();this.song=SONGS[this.level]??SONGS.playground;this.nextStep=c.currentTime+.2;this.timer=window.setInterval(()=>this.schedule(),60);}
    void this.context.resume();
  }
  setLevel(id:string){this.level=id;this.song=SONGS[id]??SONGS.playground;}
  private get t(){return this.context!.currentTime;}
  private out(){return this.sfx!;}
  private noiseBuffer(){const c=this.context!;if(!this.buffer){this.buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=this.buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}return this.buffer;}
  private env(g:GainNode,at:number,peak:number,attack:number,decay:number){g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(peak,at+attack);g.gain.exponentialRampToValueAtTime(.0001,at+attack+decay);}
  tone(freq=220,duration=.12,volume=.06,type:OscillatorType='sine',at=0){
    if(!this.context||this.isMuted)return;const c=this.context,t=this.t+at,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.5),t+duration);
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.out());o.start(t);o.stop(t+duration+.02);
  }
  /** Filtered noise burst for crashes, thuds and breaker clunks. */
  noise(duration=.18,volume=.08,freq=900,type:BiquadFilterType='lowpass',at=0){
    if(!this.context||this.isMuted)return;const c=this.context,t=this.t+at,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer();f.type=type;f.frequency.value=freq;
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f).connect(g).connect(this.out());s.start(t,Math.random()*1.5,duration+.02);
  }
  strain(ratio:number){if(this.gain&&this.context&&this.hum){this.gain.gain.setTargetAtTime(this.isMuted?0:Math.max(0,ratio-.7)*.09,this.t,.08);this.hum.frequency.setTargetAtTime(55+ratio*90,this.t,.08);}}
  /** Soft footstep; pitch varies so a walk never sounds like a metronome. */
  step(){this.noise(.07,.035,260+Math.random()*120);this.tone(80+Math.random()*20,.06,.03);}
  /** Wooden knock when the cable wraps a corner. */
  knock(pitch=1){this.tone(190*pitch,.07,.07,'triangle');this.noise(.03,.04,2400,'bandpass');}
  pop(){this.tone(320,.06,.05,'sine');this.tone(520,.05,.03,'triangle',.03);}
  thud(mass=2){this.noise(.1+Math.min(.2,mass*.01),.05+Math.min(.07,mass*.004),300+Math.random()*500);this.tone(70+Math.random()*30,.12,.04);}
  /** Plug seated: a mechanical click-clack, then a bright rising chime. */
  plug(){this.noise(.025,.08,3200,'highpass');this.noise(.025,.07,2600,'highpass',.05);[880,1109,1319].forEach((f,i)=>this.bell(f,.5,.04,.09+i*.07));}
  bell(freq:number,duration=.6,volume=.05,at=0){
    if(!this.context||this.isMuted)return;const c=this.context,t=this.t+at;
    for(const [ratio,v] of [[1,1],[2.01,.35],[3.98,.12]] as const){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq*ratio;this.env(g,t,volume*v,.005,duration);o.connect(g).connect(this.out());o.start(t);o.stop(t+duration+.05);}
  }
  /** Coworker gibberish: formant-filtered syllables. */
  voice(mood:'alarm'|'groan'|'cheer'|'hm'='hm',pitch=1){
    if(!this.context||this.isMuted)return;const c=this.context;
    const plan={alarm:{n:2,base:420,glide:1.5,len:.07},groan:{n:3,base:190,glide:.75,len:.16},cheer:{n:3,base:360,glide:1.3,len:.09},hm:{n:2,base:260,glide:1.1,len:.1}}[mood];
    for(let i=0;i<plan.n;i++){const t=this.t+i*plan.len*1.15+Math.random()*.02,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),f0=plan.base*pitch*(1+(Math.random()-.5)*.2);
      o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*plan.glide,t+plan.len);f.type='bandpass';f.Q.value=5;f.frequency.value=[700,1100,1600,900][Math.floor(Math.random()*4)];
      this.env(g,t,.06,.012,plan.len);o.connect(f).connect(g).connect(this.out());o.start(t);o.stop(t+plan.len+.05);}
  }
  cheer(){this.jingle();setTimeout(()=>{for(let i=0;i<4;i++)setTimeout(()=>this.voice('cheer',.8+Math.random()*.5),i*140);},250);}
  /** Win fanfare: arpeggio up the major chord, then a held bell chord. */
  jingle(){[523,659,784,1047].forEach((f,i)=>this.bell(f,.35,.06,i*.09));[523,659,784].forEach(f=>this.bell(f,1.4,.035,.4));}
  private startAmbience(){
    const c=this.context!,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer();s.loop=true;f.type='lowpass';f.frequency.value=260;g.gain.value=.018;s.connect(f).connect(g).connect(this.ambience!);s.start();
    const tick=()=>{if(!this.context)return;const busy=this.level==='meeting'?.55:.25;
      // Distant keyboards in the office, clinks and fridge ticks in the kitchen.
      if(Math.random()<busy&&!this.isMuted)for(let k=0;k<3+Math.floor(Math.random()*5);k++)this.noise(.015,.006,this.level==='lunch'?5200:3800,'highpass',k*.09+Math.random()*.03);
      setTimeout(tick,700+Math.random()*1600);};tick();
  }
  private schedule(){
    const c=this.context;if(!c||!this.song)return;const song=this.song,sixteenth=60/song.bpm/4;
    while(this.nextStep<c.currentTime+.25){const i=this.stepIndex%64,bar=Math.floor(i/16),beat=i%16,swing=beat%2?sixteenth*song.swing:0,t=this.nextStep+swing;
      if(!this.isMuted)this.playStep(song,bar,beat,t);this.nextStep+=sixteenth;this.stepIndex++;}
  }
  private playStep(song:Song,bar:number,beat:number,t:number){
    const c=this.context!,bus=this.musicBus!,chord=song.chords[bar];
    const voice=(freq:number,dur:number,vol:number,type:OscillatorType,cutoff:number)=>{const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=type;o.frequency.value=freq;f.type='lowpass';f.frequency.value=cutoff;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(f).connect(g).connect(bus);o.start(t);o.stop(t+dur+.05);};
    // Electric-piano comping on 1, the "and" of 2, and 4.
    if(beat===0||beat===6||beat===12)for(const n of chord)voice(note(n),beat===6?.35:.9,.022,'triangle',1800);
    // Walking-ish bass: root, fifth, octave.
    if(beat%4===0){const root=song.bass[bar],steps=[0,7,12,7];voice(note(root+steps[beat/4]),.35,.09,'sine',600);}
    // Soft kick on 1 and 3, brushed hats on the off-beats.
    if(beat===0||beat===8){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(bus);o.start(t);o.stop(t+.2);}
    if(beat%4===2){const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer();f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(.02,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f).connect(g).connect(bus);s.start(t,Math.random(),.06);}
    // A sparse vibraphone line picks chord tones.
    if((beat===3||beat===10)&&Math.random()<.6){const n=chord[Math.floor(Math.random()*chord.length)]+12;voice(note(n),.6,.018,'sine',4000);}
  }
}
