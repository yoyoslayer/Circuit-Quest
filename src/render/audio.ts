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
  constructor(){try{this.isMuted=localStorage.getItem('circuit-crew-muted')==='1';}catch{/* storage unavailable */}}
  get muted(){return this.isMuted;}
  // Mute survives restarts and moving on to the next job.
  set muted(value:boolean){this.isMuted=value;try{localStorage.setItem('circuit-crew-muted',value?'1':'0');}catch{/* storage unavailable */}if(this.master&&this.context)this.master.gain.setTargetAtTime(value?0:.9,this.context.currentTime,.05);}
  start(){
    // Browsers refuse audio before a user gesture; the first click or key starts it instead.
    if(!this.context&&!(navigator as Navigator&{userActivation?:{hasBeenActive:boolean}}).userActivation?.hasBeenActive)return;
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
  strain(ratio:number){if(ratio>.88&&Math.random()<(ratio-.85)*.25)this.creak(ratio);if(this.gain&&this.context&&this.hum){this.gain.gain.setTargetAtTime(this.isMuted?0:Math.max(0,ratio-.7)*.09,this.t,.08);this.hum.frequency.setTargetAtTime(55+ratio*90,this.t,.08);}}
  /** Rubbery creak of a cable near its limit. */
  creak(ratio=1){this.noise(.09,.03+Math.min(.04,(ratio-.85)*.2),700+Math.random()*500,'bandpass');this.tone(140+Math.random()*60,.08,.02,'sawtooth');}
  /** Glass smash: a bright burst and falling tinkles. */
  glass(){this.noise(.3,.12,5000,'highpass');for(let i=0;i<6;i++)this.bell(1800+Math.random()*2400,.25,.025,.05+i*.06+Math.random()*.04);}
  /** Light props (mugs, bins, paper) clatter higher and shorter than furniture. */
  clatter(){this.noise(.06,.05,2600+Math.random()*1500,'bandpass');this.tone(600+Math.random()*400,.05,.025,'triangle');}
  /** Soft footstep; pitch varies so a walk never sounds like a metronome. */
  step(){this.noise(.07,.035,260+Math.random()*120);this.tone(80+Math.random()*20,.06,.03);}
  /** Wooden knock when the cable wraps a corner. */
  knock(pitch=1){if(!this.context)return;if(this.t-this.lastKnock<.3)return;this.lastKnock=this.t;this.tone(190*pitch,.07,.07,'triangle');this.noise(.03,.04,2400,'bandpass');}
  private lastKnock=-9;
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
  // Three tiers of success (R5-093): a step's bell (objectives), a milestone, and the win.
  /** Milestone (a bench sign-off, ship, log or send, the Meeting extension, a strike): a short two-note
   *  up-chime and one crew "hm-cheer". */
  milestone(){this.bell(784,.25,.05);this.bell(1175,.35,.05,.12);setTimeout(()=>this.voice('cheer',1.1),180);}
  /** The win: a low kick, the arpeggio an octave lower, a held five-note chord and a crowd. Music ducks under it. */
  win(){if(!this.context||this.isMuted)return;const c=this.context,t=this.t,o=c.createOscillator(),g=c.createGain();
    o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(45,t+.15);g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g).connect(this.out());o.start(t);o.stop(t+.32);
    [262,330,392,523,659,784,1047].forEach((f,i)=>this.bell(f,.35,.055,.05+i*.08));[262,330,392,494,659].forEach(f=>this.bell(f,1.8,.03,.62));
    this.duck(.12,2.5);setTimeout(()=>{for(let i=0;i<7;i++)setTimeout(()=>this.voice('cheer',.75+Math.random()*.6),i*110);},420);}
  /** Music ducks to `level` of its volume for `secs`, then comes back. */
  duck(level:number,secs:number){const b=this.musicBus,c=this.context;if(!b||!c)return;b.gain.cancelScheduledValues(c.currentTime);b.gain.setTargetAtTime(.55*level,c.currentTime,.08);if(secs>0)b.gain.setTargetAtTime(.55,c.currentTime+secs,.4);}
  /** Paused: the music sits low until play resumes. */
  paused(on:boolean){this.duck(on?.25:1,0);}
  /** A failed job: a sad trombone of four falling notes, with the fault's own tail (R5-088). */
  fail(kind:'spoil'|'burn'|'other'='other'){if(!this.context||this.isMuted)return;const c=this.context;
    [392,370,349,294].forEach((f,i)=>{const t=this.t+.15+i*.26,o=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f,t);if(i===3)o.frequency.linearRampToValueAtTime(f*.94,t+.5);lp.type='lowpass';lp.frequency.value=1200;
      this.env(g,t,.09,.02,i===3?.6:.25);o.connect(lp).connect(g).connect(this.out());o.start(t);o.stop(t+.7);});
    if(kind==='spoil')this.noise(.12,.1,250);if(kind==='burn')this.noise(.8,.06,3000,'highpass');
    if(this.musicBus)this.musicBus.gain.setTargetAtTime(0,c.currentTime,.3);}
  /** Lunch fridge warming (R5-088): a compressor stutter, then an urgent double beep near spoiling. */
  fridgeWarn(urgent:boolean){if(urgent){this.tone(660,.08,.05,'square');this.tone(660,.08,.05,'square',.14);}else{this.noise(.09,.07,200);this.noise(.09,.06,200,'lowpass',.16);}}
  // Named fault cues (R5-120), so different faults never sound the same.
  /** Breaker trip: a heavy clack, then a power-down whirr for each load that drops. */
  breakerTrip(loads=1){this.noise(.1,.14,300);for(let i=0;i<Math.max(1,loads);i++)this.sweep(220,55,.6,.05,'sawtooth',800,.08+i*.12);}
  /** Short circuit: a sharp zap and crackle; with water, a hiss as well. */
  short(water=false){this.noise(.08,.14,4000,'highpass');for(let i=0;i<3;i++)this.tone(2000+Math.random()*1000,.03,.03,'square',.03+i*.05);if(water)this.noise(.5,.04,6000,'highpass',.05);}
  /** A PTC fuse trips: a tick, then a rising thermal hum (not the garage's fuse bang). */
  ptcTrip(){this.noise(.03,.1,3000,'highpass');this.sweep(90,160,.5,.04,'sawtooth',500,.04);}
  /** A fuse blowing on a dead short (garage): a bang and a crackle. */
  fuseBang(){this.noise(.2,.14,1800,'bandpass');this.tone(120,.3,.06,'square');this.short();}
  /** A bench verdict that fails, with a timbre per kind (R5-120). */
  verdictFail(kind:'reset'|'weak'|'layout'|'other'='other'){
    if(kind==='reset'){this.sweep(500,140,.25,.06,'square',1400);this.tone(90,.12,.05,'sine',.22);}
    else if(kind==='weak')this.sweep(420,160,.45,.06,'sine',3000);
    else if(kind==='layout'){this.tone(150,.12,.06,'square');this.tone(150,.12,.06,'square',.18);}
    else this.tone(160,.25,.06,'square');}
  /** A send-back (QFN): a rubber-stamp thunk and a two-pulse reject buzzer (R5-219). */
  reject(){this.noise(.1,.12,400);this.tone(140,.12,.07,'square',.12);this.tone(140,.12,.07,'square',.3);}
  /** A part set into a bench slot: two dry clicks, no success bells (R5-261). */
  seat(){this.noise(.02,.06,3200,'highpass');this.noise(.02,.06,2600,'highpass',.04);}
  /** A short motor whirr (the garage robot driving) and the docked clunk plus chime. */
  whirr(){this.sweep(90,120,.5,.02,'sawtooth',500);}
  docked(){this.noise(.08,.12,350);this.tone(70,.15,.06);[1047,1319,1568].forEach((f,i)=>this.bell(f,.5,.045,.12+i*.09));}
  /** The cable sliding off a corner: a soft slip, never louder than the wrap knock. */
  slip(){if(!this.context||this.t-this.lastSlip<.5)return;this.lastSlip=this.t;this.noise(.05,.02,1500,'bandpass');}
  private lastSlip=-9;
  private sweep(from:number,to:number,duration:number,volume:number,type:OscillatorType,cutoff:number,at=0){
    if(!this.context||this.isMuted)return;const c=this.context,t=this.t+at,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+duration);f.type='lowpass';f.frequency.value=cutoff;
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(f).connect(g).connect(this.out());o.start(t);o.stop(t+duration+.02);}
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
