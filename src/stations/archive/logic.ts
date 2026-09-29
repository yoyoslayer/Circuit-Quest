// Datasheet detective rules (The Archive). Pure data and functions: no three.js, no DOM.
//
// Every manufacturer, part number, price and measured "unit" below is ORIGINAL AND FICTIONAL.
// The datasheets are internally consistent so the player can reason from them, but they are
// teaching material, not real parts.
//
// What the station teaches (and the guardrails it keeps):
//  - Typical values describe a typical unit at the stated test conditions. They are not promised.
//  - Min / max values in the electrical tables are guaranteed over the stated conditions.
//  - Recommended operating conditions are the range the part is designed to work in.
//  - An absolute maximum is a stress limit, not a design target: exceeding it may damage the
//    part, and running near it is not promised to work.
//  - Test conditions matter: a value measured at 25 °C says nothing about -30 °C.
//  - The ordering suffix picks the package and the temperature grade of the same die.
// A part is judged against a job only with guaranteed values and recommended operating
// conditions (never typical, never absolute maximum): that is exactly what `check` does.

export type Param='mpn'|'r'|'tol'|'pkg'|'vsup'|'iout'|'temp'|'misc';
/** Where a value sits in the datasheet, which decides how much it promises. */
export type Kind='front'|'typ'|'min'|'max'|'rec'|'absmax'|'order'|'stock'|'pin'|'note';
export interface Clue {id:string;doc:string;param:Param;kind:Kind;text:string;applies:string[];value?:number|string;lo?:number;hi?:number;cond?:string}
export interface Row {label:string;cells:(string|Clue)[];clue?:Clue;cond?:string}
export interface Section {title:string;cols?:string[];rows?:Row[];text?:string;note?:string}
export interface Doc {id:string;maker:string;title:string;subtitle:string;parts:string[];rev:string;features:(string|Clue)[];sections:Section[]}
export type PartKind='resistor'|'driver'|'controller';
export interface Part {mpn:string;doc:string;kind:PartKind;price:number;bin:string;desc:string}

// ---------- building the documents ----------
type Draft=Omit<Clue,'id'|'doc'|'applies'>&{key:string;applies?:string[]};
const c=(key:string,param:Param,kind:Kind,text:string,o:Partial<Pick<Clue,'value'|'lo'|'hi'|'cond'|'applies'>>={}):Draft=>({key,param,kind,text,...o});
type DraftRow={label:string;cells:(string|Draft)[];clue?:Draft;cond?:string};
type DraftSection={title:string;cols?:string[];rows?:DraftRow[];text?:string;note?:string};
function doc(d:{id:string;maker:string;title:string;subtitle:string;parts:string[];rev:string;features:(string|Draft)[];sections:DraftSection[]}):Doc{
  const fin=(x:Draft):Clue=>{const {key,...rest}=x;return {...rest,id:`${d.id}/${key}`,doc:d.id,applies:x.applies??d.parts};};
  const cell=(x:string|Draft)=>typeof x==='string'?x:fin(x);
  return {...d,features:d.features.map(cell),sections:d.sections.map(s=>({...s,rows:s.rows?.map(r=>({label:r.label,cond:r.cond,cells:r.cells.map(cell),clue:r.clue&&fin(r.clue)}))}))};
}
/** An electrical-characteristics row: min / typ / max cells, each its own clue. */
function elec(key:string,param:Param,label:string,unit:string,cond:string,[mn,ty,mx]:(number|undefined)[],applies?:string[]):DraftRow{
  const cellFor=(k:'min'|'typ'|'max',v?:number)=>v===undefined?'—':c(`${key}-${k}`,param,k,`${label}: ${v} ${unit} (${k==='typ'?'typical':k==='min'?'min, guaranteed':'max, guaranteed'})`,{value:v,cond,applies});
  return {label,cond,cells:[cellFor('min',mn),cellFor('typ',ty),cellFor('max',mx),unit]};
}
/** A recommended-operating or absolute-maximum row: the whole row is one clue (a range). */
function range(key:string,param:Param,kind:'rec'|'absmax',label:string,lo:number,hi:number,unit:string,applies?:string[]):DraftRow{
  const clue=c(key,param,kind,`${label}: ${fmtNum(lo)} to ${fmtNum(hi)} ${unit} (${kind==='rec'?'recommended operating':'absolute maximum'})`,{lo,hi,applies});
  return {label,cells:[fmtNum(lo),fmtNum(hi),unit],clue};
}
const fmtNum=(n:number)=>(n<0?'−':'')+String(Math.abs(n));
export const fmtOhms=(r:number)=>r>=1e6?`${+(r/1e6).toFixed(2)} MΩ`:r>=1e3?`${+(r/1e3).toFixed(2)} kΩ`:`${+r.toFixed(1)} Ω`;
const orderRow=(mpn:string,cells:{pkg:string;temp?:[number,number];r?:number;tol?:number})=>{
  const out:(string|Draft)[]=[c(`${mpn}-mpn`,'mpn','order',`Part number ${mpn}`,{value:mpn,applies:[mpn]})];
  if(cells.r!==undefined)out.push(c(`${mpn}-r`,'r','order',`${mpn}: ${fmtOhms(cells.r)}`,{value:cells.r,applies:[mpn]}));
  if(cells.tol!==undefined)out.push(c(`${mpn}-tol`,'tol','order',`${mpn}: ±${cells.tol} %`,{value:cells.tol,applies:[mpn]}));
  out.push(c(`${mpn}-pkg`,'pkg','order',`${mpn}: ${cells.pkg} package`,{value:cells.pkg,applies:[mpn]}));
  if(cells.temp)out.push(c(`${mpn}-temp`,'temp','order',`${mpn}: rated ${fmtNum(cells.temp[0])} to ${fmtNum(cells.temp[1])} °C ambient`,{lo:cells.temp[0],hi:cells.temp[1],applies:[mpn]}));
  return {label:'',cells:out};
};

// ---------- the documents (fictional) ----------
const RC=['RC0603F472','RC0603J472','RC0603F471'];
export const DOCS:Doc[]=[
  doc({id:'bw-rc',maker:'Brambleworth Passives',title:'RC series',subtitle:'Thick-film chip resistors, 0402 to 0805',parts:RC,rev:'Rev. D',
    features:['General-purpose thick-film chip resistors','Values 1 Ω to 10 MΩ (E24 and E96)',c('front-tol','tol','front','Tolerance ±1 % (F) or ±5 % (J)'),'Not polarized: either way round'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-temp','temp','absmax','Storage temperature',-55,155,'°C'),{label:'Overload voltage, 0603 (5 s)',cells:['—','100','V']}]},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[range('rec-temp','temp','rec','Operating temperature',-55,125,'°C'),{label:'Power at 70 °C, 0603',cells:['—','0.1','W']}]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],rows:[elec('tcr','misc','Temp. coefficient (F)','ppm/°C','−55 to 125 °C',[undefined,undefined,100])],note:'Tolerance is guaranteed at 25 °C by the tolerance code below.'},
      {title:'How to read the part number',text:'RC · 0603 · F · 472 = series · size code · tolerance code · value code. Value code: two digits, then how many zeros. 472 = 47 × 10² Ω = 4.7 kΩ. 471 = 47 × 10¹ Ω = 470 Ω.',
        cols:['Code','Meaning'],rows:[{label:'0603',cells:['1.6 × 0.8 mm footprint']},{label:'F',cells:['±1 %']},{label:'J',cells:['±5 %']}]},
      {title:'Ordering information',cols:['Part number','Value','Tolerance','Package'],rows:[orderRow('RC0603F472',{r:4700,tol:1,pkg:'0603'}),orderRow('RC0603J472',{r:4700,tol:5,pkg:'0603'}),orderRow('RC0603F471',{r:470,tol:1,pkg:'0603'})]},
      {title:'Application note',text:'For dividers and meter shunts that need better than ±1 %, use a thin-film part. Two terminals, no pin 1.'},
    ]}),
  doc({id:'fw-rt',maker:'Fenwick Thin Film',title:'RT series',subtitle:'Precision thin-film chip resistors',parts:['RT0603D472'],rev:'Rev. B',
    features:[c('front-tol','tol','front','Tolerance down to ±0.1 %'),'Low noise, TCR ±25 ppm/°C','0603 and 0805 sizes'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-temp','temp','absmax','Storage temperature',-55,155,'°C')]},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[range('rec-temp','temp','rec','Operating temperature',-55,125,'°C'),{label:'Power at 70 °C, 0603',cells:['—','0.1','W']}]},
      {title:'Part number',text:'RT · 0603 · D · 472: size code 0603, tolerance D = ±0.5 % (B = ±0.1 %), value code 472 = 4.7 kΩ.'},
      {title:'Ordering information',cols:['Part number','Value','Tolerance','Package'],rows:[orderRow('RT0603D472',{r:4700,tol:.5,pkg:'0603'})]},
      {title:'Application note',text:'Thin film costs more than thick film. Pick it when the job needs tighter than ±1 %.'},
    ]}),
  doc({id:'qs-qm2201',maker:'Quillon Semiconductor',title:'QM2201',subtitle:'Brushed DC motor driver, 1.5 A',parts:['QM2201-S8'],rev:'Rev. A',
    features:[c('front-vm','vsup','front','Motor supply up to 15 V',{lo:4.5,hi:15}),c('front-i','iout','front','1.5 A continuous output',{value:1.5}),'Overvoltage lockout and thermal shutdown'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-vm','vsup','absmax','Motor supply VM',-0.3,15,'V'),{label:'Peak output current (100 ms)',cells:['—','3','A'],clue:c('abs-i','iout','absmax','Peak output current: 3 A (absolute maximum, 100 ms)',{value:3})},range('abs-temp','temp','absmax','Storage temperature',-65,150,'°C')],note:'Stresses beyond these may damage the device. They are not operating conditions.'},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[range('rec-vm','vsup','rec','Motor supply VM',4.5,12,'V'),range('rec-i','iout','rec','Continuous output current',0,1.5,'A'),range('rec-temp','temp','rec','Ambient temperature',-40,85,'°C')]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],note:'TA = 25 °C, VM = 12 V unless noted.',rows:[
        elec('ovlo','misc','Overvoltage lockout, VM rising','V','TA = −40 to 85 °C',[12.4,12.8,13.1]),
        elec('ocp','iout','Current limit IOCP','A','TA = −40 to 85 °C',[2,2.6,3.2]),
        elec('rds','misc','On-resistance, high + low side','Ω','TA = 25 °C',[undefined,.45,.6])]},
      {title:'Pinout · HSOIC-8',cols:['Pin','Name'],rows:[{label:'1 · 2',cells:['IN1 · IN2']},{label:'3',cells:['VM']},{label:'4 · 5',cells:['OUT1 · OUT2']},{label:'6 · 8',cells:['PGND · GND']},{label:'7',cells:['nFAULT']},{label:'Pad',cells:['Exposed pad: GND']}]},
      {title:'Ordering information',cols:['Part number','Package','Temperature'],rows:[orderRow('QM2201-S8',{pkg:'HSOIC-8',temp:[-40,85]})]},
      {title:'Application note',text:'Put 10 µF plus 100 nF next to VM. The overvoltage lockout switches the bridge off when VM rises past 12.4 to 13.1 V, which keeps the part inside its 15 V stress limit.'},
    ]}),
  doc({id:'om-omd40',maker:'Ottery Microsystems',title:'OMD-40',subtitle:'H-bridge motor driver',parts:['OMD40-S8'],rev:'Rev. C',
    features:[c('front-i','iout','front','Drives motors up to 1.4 A',{value:1.4}),c('front-vm','vsup','front','4 V to 16 V supply',{lo:4,hi:16}),'Current limit and sleep mode'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-vm','vsup','absmax','Motor supply VM',-0.3,18,'V'),{label:'Peak output current',cells:['—','2.5','A'],clue:c('abs-i','iout','absmax','Peak output current: 2.5 A (absolute maximum)',{value:2.5})},range('abs-temp','temp','absmax','Storage temperature',-65,150,'°C')]},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[range('rec-vm','vsup','rec','Motor supply VM',4,16,'V'),range('rec-i','iout','rec','Continuous output current',0,1,'A'),range('rec-temp','temp','rec','Ambient temperature',-40,85,'°C')]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],note:'Typical at TJ = 25 °C. Min and max over TJ = −40 to 125 °C.',rows:[
        elec('ocp','iout','Current limit IOCP','A','Typ at TJ = 25 °C; min/max over −40 to 125 °C',[1,1.4,1.9]),
        elec('iq','misc','Supply current, motor off','mA','VM = 12 V',[undefined,1.2,2.5])]},
      {title:'Pinout · SOIC-8',cols:['Pin','Name'],rows:[{label:'1',cells:['VM']},{label:'2 · 4',cells:['OUT1 · OUT2']},{label:'3 · 8',cells:['PGND · GND']},{label:'5 · 6',cells:['IN2 · IN1']},{label:'7',cells:['nSLEEP']}]},
      {title:'Ordering information',cols:['Part number','Package','Temperature'],rows:[orderRow('OMD40-S8',{pkg:'SOIC-8',temp:[-40,85]})]},
      {title:'Application note',text:'The current-limit threshold varies from unit to unit and with temperature; design with the guaranteed values in Electrical characteristics.'},
    ]}),
  doc({id:'hg-hdm',maker:'Harrowgate Microdevices',title:'HDM-7 / HDM-9',subtitle:'Motor driver family',parts:['HDM7-S8','HDM9-P16'],rev:'Rev. F',
    features:[c('front-i','iout','front','HDM-7: 1.5 A, HDM-9: 3 A continuous',{value:1.5}),'4.5 V to 18 V (HDM-7), 4.5 V to 36 V (HDM-9)','Thermal and current protection'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-vm7','vsup','absmax','Motor supply VM, HDM-7',-0.3,20,'V',['HDM7-S8']),range('abs-vm9','vsup','absmax','Motor supply VM, HDM-9',-0.3,40,'V',['HDM9-P16']),range('abs-temp','temp','absmax','Storage temperature',-65,150,'°C')]},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[
        range('rec-vm7','vsup','rec','Motor supply VM, HDM-7',4.5,18,'V',['HDM7-S8']),range('rec-vm9','vsup','rec','Motor supply VM, HDM-9',4.5,36,'V',['HDM9-P16']),
        range('rec-i7','iout','rec','Continuous output current, HDM-7',0,1.5,'A',['HDM7-S8']),range('rec-i9','iout','rec','Continuous output current, HDM-9',0,3,'A',['HDM9-P16']),
        range('rec-temp','temp','rec','Ambient temperature',-40,105,'°C')]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],note:'Typical at TJ = 25 °C. Min and max over TJ = −40 to 125 °C.',rows:[
        elec('ocp7','iout','Current limit, HDM-7','A','−40 to 125 °C',[1.6,2.2,3],['HDM7-S8']),elec('ocp9','iout','Current limit, HDM-9','A','−40 to 125 °C',[3.2,4,5],['HDM9-P16'])]},
      {title:'Pinout',cols:['Package','Pins'],rows:[{label:'SOIC-8 (HDM-7)',cells:['VM, OUT1, PGND, OUT2, IN2, IN1, nSLEEP, GND']},{label:'HTSSOP-16 (HDM-9)',cells:['Two pins per output, exposed pad = GND']}]},
      {title:'Ordering information',cols:['Part number','Package','Temperature'],rows:[orderRow('HDM7-S8',{pkg:'SOIC-8',temp:[-40,105]}),orderRow('HDM9-P16',{pkg:'HTSSOP-16',temp:[-40,105]})]},
      {title:'Application note',text:'Solder the HTSSOP exposed pad to a ground copper area; the 3 A rating assumes it.'},
    ]}),
  doc({id:'qs-qx8',maker:'Quillon Semiconductor',title:'QX8',subtitle:'8-bit controller, 8 kB flash',parts:['QX8-S8C','QX8-S8I','QX8-D8I'],rev:'Rev. B',
    features:[c('front-vdd','vsup','front','1.8 V to 3.6 V operation',{lo:1.8,hi:3.6}),'8 kB flash, 512 B RAM',c('front-osc','misc','front','Internal 8 MHz oscillator, ±1 %'),'SOIC-8 and DFN-8 packages'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-vdd','vsup','absmax','Supply VDD',-0.3,4,'V'),range('abs-temp','temp','absmax','Storage temperature',-65,150,'°C')],note:'Storage temperature is for an unpowered part on the shelf.'},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[
        range('rec-vdd','vsup','rec','Supply VDD',1.8,3.6,'V'),
        range('rec-temp-c','temp','rec','Ambient temperature, C grade',0,70,'°C',['QX8-S8C']),range('rec-temp-i','temp','rec','Ambient temperature, I grade',-40,85,'°C',['QX8-S8I','QX8-D8I'])]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],note:'VDD = 3.3 V, TA = 25 °C unless noted.',rows:[
        elec('osc','misc','Oscillator error','%','Typ at 25 °C; max over the rated TA',[undefined,1,3]),elec('idd','misc','Supply current, 8 MHz','mA','VDD = 3.3 V',[undefined,1.6,2.4])]},
      {title:'Pinout',cols:['Package','Pins'],rows:[
        {label:'SOIC-8 (S8)',cells:[c('pin-s8','pkg','pin','S8 = SOIC-8 package',{value:'SOIC-8',applies:['QX8-S8C','QX8-S8I']}),'1 VDD, 4 RESET, 8 GND, others I/O']},
        {label:'DFN-8 (D8)',cells:[c('pin-d8','pkg','pin','D8 = DFN-8 3 × 3 mm package',{value:'DFN-8',applies:['QX8-D8I']}),'Same pins, exposed pad = GND']}]},
      {title:'Ordering information',text:'QX8 · S8 · I = device · package · temperature grade. C = 0 to 70 °C, I = −40 to 85 °C.',cols:['Part number','Package','Temperature'],rows:[orderRow('QX8-S8C',{pkg:'SOIC-8',temp:[0,70]}),orderRow('QX8-S8I',{pkg:'SOIC-8',temp:[-40,85]}),orderRow('QX8-D8I',{pkg:'DFN-8',temp:[-40,85]})]},
      {title:'Application note',text:'Decouple VDD with 100 nF within 3 mm of the pins. The grade suffix sets the rated operating range; outside it the oscillator and flash are not guaranteed.'},
    ]}),
  doc({id:'om-om8',maker:'Ottery Microsystems',title:'OM8',subtitle:'Low-power 8-bit controller',parts:['OM8-SE'],rev:'Rev. A',
    features:[c('front-vdd','vsup','front','2.7 V to 5.5 V',{lo:2.7,hi:5.5}),c('front-temp','temp','front','Extended temperature, −40 to 105 °C',{lo:-40,hi:105}),'SOIC-8, pin-compatible with common 8-pin controllers'],
    sections:[
      {title:'Absolute maximum ratings',cols:['Parameter','Min','Max','Unit'],rows:[range('abs-vdd','vsup','absmax','Supply VDD',-0.3,6,'V'),range('abs-temp','temp','absmax','Storage temperature',-65,150,'°C')]},
      {title:'Recommended operating conditions',cols:['Parameter','Min','Max','Unit'],rows:[range('rec-vdd','vsup','rec','Supply VDD',2.7,5.5,'V'),range('rec-temp','temp','rec','Ambient temperature, E grade',-40,105,'°C')]},
      {title:'Electrical characteristics',cols:['Parameter','Min','Typ','Max','Unit'],note:'VDD = 3.3 V, TA = 25 °C unless noted.',rows:[elec('bor','misc','Brown-out reset','V','Over the rated TA',[2.45,2.55,2.65])]},
      {title:'Pinout · SOIC-8',cols:['Pin','Name'],rows:[{label:'1 · 8',cells:['VDD · GND']},{label:'4',cells:['RESET']},{label:'2, 3, 5–7',cells:['I/O']}]},
      {title:'Ordering information',cols:['Part number','Package','Temperature'],rows:[orderRow('OM8-SE',{pkg:'SOIC-8',temp:[-40,105]})]},
      {title:'Application note',text:'Keep a 100 nF capacitor close to VDD. Brown-out reset holds the part in reset below 2.65 V.'},
    ]}),
];

/** The shop's stock (prices are this shop's fictional prices, not from any datasheet). */
export const PARTS:Part[]=[
  {mpn:'RC0603F472',doc:'bw-rc',kind:'resistor',price:1,bin:'A1',desc:'4.7 kΩ thick film'},
  {mpn:'RC0603J472',doc:'bw-rc',kind:'resistor',price:.5,bin:'A2',desc:'4.7 kΩ thick film'},
  {mpn:'RC0603F471',doc:'bw-rc',kind:'resistor',price:1,bin:'A3',desc:'470 Ω thick film'},
  {mpn:'RT0603D472',doc:'fw-rt',kind:'resistor',price:3,bin:'A4',desc:'4.7 kΩ thin film'},
  {mpn:'QM2201-S8',doc:'qs-qm2201',kind:'driver',price:2,bin:'B1',desc:'Motor driver'},
  {mpn:'OMD40-S8',doc:'om-omd40',kind:'driver',price:3,bin:'B2',desc:'Motor driver'},
  {mpn:'HDM7-S8',doc:'hg-hdm',kind:'driver',price:5,bin:'B3',desc:'Motor driver'},
  {mpn:'HDM9-P16',doc:'hg-hdm',kind:'driver',price:8,bin:'B4',desc:'Motor driver'},
  {mpn:'QX8-S8C',doc:'qs-qx8',kind:'controller',price:4,bin:'C1',desc:'8-bit controller'},
  {mpn:'QX8-S8I',doc:'qs-qx8',kind:'controller',price:5,bin:'C2',desc:'8-bit controller'},
  {mpn:'QX8-D8I',doc:'qs-qx8',kind:'controller',price:5,bin:'C3',desc:'8-bit controller'},
  {mpn:'OM8-SE',doc:'om-om8',kind:'controller',price:7,bin:'C4',desc:'8-bit controller'},
];
/** Where each stock box sits on its counter in the room (world metres; rows A, B, C back to front). */
export function binSpot(bin:string){const row=bin[0],k=Number(bin[1])-1;return {x:4.9+k*.9,z:({A:-6.2,B:-3.2,C:-.2} as Record<string,number>)[row]};}
export const part=(mpn:string)=>PARTS.find(p=>p.mpn===mpn);
const KIND_NAMES:Record<PartKind,string>={resistor:'resistor',driver:'motor driver',controller:'controller'};
const STOCK:Doc=doc({id:'stock',maker:'The Archive',title:'Stock list',subtitle:'What is on the shelves (shop prices, fictional)',parts:PARTS.map(p=>p.mpn),rev:'Today',
  features:['Every box on the stock shelves, with its bin and price','Click a part number to bookmark it'],
  sections:[{title:'Stock shelves',cols:['Part number','Maker','Part','Bin','Price'],rows:PARTS.map(p=>({label:'',cells:[c(`${p.mpn}`,'mpn','stock',`Part number ${p.mpn}`,{value:p.mpn,applies:[p.mpn]}),DOCS.find(d=>d.id===p.doc)!.maker,p.desc,p.bin,`${p.price}`]}))}]});
DOCS.unshift(STOCK);

const CLUES=new Map<string,Clue>();
for(const d of DOCS){for(const f of d.features)if(typeof f!=='string')CLUES.set(f.id,f);
  for(const s of d.sections)for(const r of s.rows??[]){if(r.clue)CLUES.set(r.clue.id,r.clue);for(const x of r.cells)if(typeof x!=='string')CLUES.set(x.id,x);}}
export const clue=(id:string)=>CLUES.get(id);
export const allClues=()=>[...CLUES.values()];
export const docById=(id:string)=>DOCS.find(d=>d.id===id);

/** Plain words for how much a value promises; used on evidence chips and in explanations. */
export const KIND_LABEL:Record<Kind,string>={front:'Front page',typ:'Typical',min:'Guaranteed min',max:'Guaranteed max',rec:'Recommended',absmax:'Absolute max',order:'Ordering info',stock:'Stock list',pin:'Pinout',note:'Note'};
export const GLOSSARY:[string,string][]=[
  ['Typical','What a typical unit does at the test conditions. Not promised.'],
  ['Min / max','Guaranteed limits over the stated conditions.'],
  ['Recommended','The operating range the part is designed to work in.'],
  ['Absolute max','A stress limit. Beyond it the part may be damaged; it is not a design target.'],
  ['Test conditions','The temperature and supply a value was measured at.'],
  ['Ordering suffix','Letters in the part number that pick package and temperature grade.'],
];

// ---------- the jobs ----------
export interface Needs {r?:number;tol?:number;pkg?:string;vsup?:[number,number];iout?:number;temp?:[number,number]}
export interface Case {id:string;title:string;who:string;brief:string;kind:PartKind;needs:Needs;slots:Param[];stock:string[];rig:'led'|'fan'|'freezer'}
export const SLOT_LABEL:Record<Param,string>={mpn:'Part number',r:'Resistance',tol:'Tolerance',pkg:'Footprint',vsup:'Supply range',iout:'Drive current',temp:'Temperature range',misc:'Other'};
export const CASES:Case[]=[
  {id:'led',title:'Status-LED resistor',who:'Mara',kind:'resistor',rig:'led',brief:'The meter panel lost its status-LED resistor. The board says 4.7 kΩ, ±1 %, 0603 pads.',
    needs:{r:4700,tol:1,pkg:'0603'},slots:['mpn','r','tol','pkg'],stock:['RC0603F472','RC0603J472','RC0603F471','RT0603D472']},
  {id:'fan',title:'Cooling-fan driver',who:'Ossie',kind:'driver',rig:'fan',brief:'The cabinet fan runs from a 12 V rail that swings from 10.8 to 13.2 V, and it draws 1.2 A. The driver must be guaranteed to handle both.',
    needs:{vsup:[10.8,13.2],iout:1.2},slots:['mpn','vsup','iout'],stock:['QM2201-S8','OMD40-S8','HDM7-S8','HDM9-P16']},
  {id:'freezer',title:'Freezer controller',who:'Juno',kind:'controller',rig:'freezer',brief:'The walk-in freezer\'s controller died. It lives in the cold (−30 to +25 °C) on a 3.3 V rail (3.15 to 3.45 V), with SOIC-8 pads. The old chip said QX8.',
    needs:{vsup:[3.15,3.45],temp:[-30,25],pkg:'SOIC-8'},slots:['mpn','vsup','temp','pkg'],stock:['QX8-S8C','QX8-S8I','QX8-D8I','OM8-SE']},
];
export const needText=(n:Needs)=>[
  n.r!==undefined&&fmtOhms(n.r),n.tol!==undefined&&`±${n.tol} % or better`,n.pkg&&`${n.pkg} pads`,
  n.vsup&&`${n.vsup[0]}–${n.vsup[1]} V supply`,n.iout!==undefined&&`${n.iout} A load`,n.temp&&`${fmtNum(n.temp[0])} to ${fmtNum(n.temp[1])} °C`].filter(Boolean) as string[];

/** Does this value (read at face value) cover the need? Says nothing about how much it promises. */
export function meets(n:Needs,x:Clue):boolean{
  switch(x.param){
    case 'r':return n.r!==undefined&&x.value===n.r;
    case 'tol':return n.tol!==undefined&&typeof x.value==='number'&&x.value<=n.tol;
    case 'pkg':return n.pkg!==undefined&&x.value===n.pkg;
    case 'vsup':return !!n.vsup&&x.lo!==undefined&&x.hi!==undefined&&x.lo<=n.vsup[0]&&x.hi>=n.vsup[1];
    case 'iout':{if(n.iout===undefined)return false;const v=x.kind==='rec'?x.hi:typeof x.value==='number'?x.value:undefined;return v!==undefined&&v>=n.iout;}
    case 'temp':return !!n.temp&&x.lo!==undefined&&x.hi!==undefined&&x.lo<=n.temp[0]&&x.hi>=n.temp[1];
    default:return false;
  }
}
/** The value that actually governs a part for a need: ordering data for identity, recommended
 *  operating conditions for ranges (never typical, never absolute maximum). */
export function governing(mpn:string,param:Param):Clue|undefined{
  const p=part(mpn);if(!p)return undefined;const kinds:Kind[]=param==='r'||param==='tol'||param==='pkg'?['order']:['rec'];
  return allClues().find(x=>x.doc===p.doc&&x.param===param&&kinds.includes(x.kind)&&x.applies.includes(mpn));
}
const guaranteedMin=(mpn:string,key:string)=>{const p=part(mpn)!;return allClues().find(x=>x.doc===p.doc&&x.kind==='min'&&x.id.includes(`/${key}`)&&x.applies.includes(mpn));};
const typicalOf=(mpn:string,key:string)=>{const p=part(mpn)!;return allClues().find(x=>x.doc===p.doc&&x.kind==='typ'&&x.id.includes(`/${key}`)&&x.applies.includes(mpn));};
const absOf=(mpn:string,param:Param)=>{const p=part(mpn)!;return allClues().find(x=>x.doc===p.doc&&x.kind==='absmax'&&x.param===param&&x.applies.includes(mpn));};

/** What the rig measures on the one sample in each box (fictional units, for the failure story). */
export const UNIT:Record<string,{r?:number;trip?:number;stall?:number}>={
  'RC0603J472':{r:4612},'RC0603F471':{r:469},'OMD40-S8':{trip:1.08},'QX8-S8C':{stall:-14},
};
export interface RigLine {label:string;ok:boolean}
export interface Install {ok:boolean;lines:RigLine[];problem?:string;works?:string}
/** The rig test: the part either meets every need with its guaranteed / recommended values, or it
 *  fails, and the rig reports a symptom plus the datasheet reason. */
export function check(k:Case,mpn:string):Install{
  const p=part(mpn),n=k.needs,lines:RigLine[]=[];let problem:string|undefined;
  const fail=(label:string,why:string)=>{lines.push({label,ok:false});problem??=why;};
  if(!p||p.kind!==k.kind)return {ok:false,lines:[{label:'Right kind of part',ok:false}],problem:`${mpn} is ${p?`a ${KIND_NAMES[p.kind]}`:'not in stock'}; this job needs a ${KIND_NAMES[k.kind]}.`};
  if(n.pkg!==undefined){const g=governing(mpn,'pkg');if(g&&g.value===n.pkg)lines.push({label:`Fits the ${n.pkg} pads`,ok:true});
    else fail(`Fits the ${n.pkg} pads`,`The ${g?.value??'?'} package does not fit the board's ${n.pkg} pads. The package code in the part number picks the footprint.`);}
  if(n.r!==undefined){const g=governing(mpn,'r')!,v=g.value as number,meas=UNIT[mpn]?.r??v;
    if(v===n.r)lines.push({label:`Reads ${fmtOhms(meas)}`,ok:true});
    else fail(`Reads ${fmtOhms(meas)}`,`The LED glares: ${mpn} is ${fmtOhms(v)} (value code ${mpn.slice(-3)} = ${mpn.slice(-3,-1)} × 10${SUP[Number(mpn.slice(-1))]} Ω), so about ${+(n.r/v).toFixed(0)} times the planned current flows.`);}
  if(n.tol!==undefined){const g=governing(mpn,'tol')!,v=g.value as number,meas=UNIT[mpn]?.r;
    if(v<=n.tol)lines.push({label:`Within ±${n.tol} %`,ok:true});
    else fail(`Within ±${n.tol} %`,`This unit measures ${fmtOhms(meas??n.r??0)}, ${Math.abs(((meas??0)-(n.r??0))/(n.r??1)*100).toFixed(1)} % off. The meter needs ±${n.tol} %; this tolerance code only guarantees ±${v} %.`);}
  if(n.vsup){const g=governing(mpn,'vsup'),label=`Runs at ${n.vsup[0]}–${n.vsup[1]} V`;
    if(g&&meets(n,g))lines.push({label,ok:true});
    else{const abs=absOf(mpn,'vsup'),ovlo=guaranteedMin(mpn,'ovlo');
      fail(label,ovlo&&abs&&g&&abs.hi!>=n.vsup[1]?`At ${n.vsup[1]} V the overvoltage lockout trips (it starts at ${ovlo.value} V) and the load stops. ${g.hi} V is the recommended maximum; the ${abs.hi} V absolute maximum is a stress limit, not a working range.`
        :`The supply leaves the recommended ${g?`${g.lo} to ${g.hi} V`:'range'} and the part is no longer guaranteed to work.`);}}
  if(n.iout!==undefined){const g=governing(mpn,'iout'),ocp=guaranteedMin(mpn,'ocp'),label=`Drives ${n.iout} A`;
    if(g&&meets(n,g)&&(!ocp||(ocp.value as number)>n.iout))lines.push({label,ok:true});
    else{const typ=typicalOf(mpn,'ocp'),trip=UNIT[mpn]?.trip;
      fail(label,`The fan draws ${n.iout} A. ${trip?`This unit's current limit tripped at ${trip} A`:'The driver current-limits'}: only ${ocp?.value??g?.hi} A is guaranteed (min)${typ?`; ${typ.value} A is typical`:''}.`);}}
  if(n.temp){const g=governing(mpn,'temp'),label=`Runs at ${fmtNum(n.temp[0])} °C`;
    if(g&&meets(n,g))lines.push({label,ok:true});
    else{const stall=UNIT[mpn]?.stall;
      fail(label,`The chamber cools toward ${fmtNum(n.temp[0])} °C.${stall!==undefined?` At ${fmtNum(stall)} °C this unit stopped responding.`:''} ${mpn} is only rated ${g?`${fmtNum(g.lo!)} to ${fmtNum(g.hi!)} °C`:'for a narrower range'}; the ordering suffix sets the grade.`);}}
  const ok=!problem;
  return {ok,lines,problem,works:ok?{led:'The status LED glows steady and the meter calibrates.',fan:'The fan spins up and holds speed across the whole 10.8 to 13.2 V swing.',freezer:'The freezer holds −30 °C and the controller keeps ticking.'}[k.rig]:undefined};
}
const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
export const adequate=(k:Case)=>k.stock.filter(m=>check(k,m).ok);
/** Solver: the cheapest part that passes (the elegant answer). */
export const cheapest=(k:Case)=>adequate(k).sort((a,b)=>part(a)!.price-part(b)!.price)[0];

// ---------- citations (the work order) ----------
export interface Citation {ok:boolean;why:string}
/** Judges one piece of evidence in one work-order slot, for the part that was installed. */
export function judgeCitation(k:Case,slot:Param,x:Clue|undefined,mpn:string):Citation{
  if(!x)return {ok:false,why:`${SLOT_LABEL[slot]}: nothing cited.`};
  if(x.param!==slot)return {ok:false,why:`${SLOT_LABEL[slot]}: that value is not about ${SLOT_LABEL[slot].toLowerCase()}.`};
  if(!x.applies.includes(mpn))return {ok:false,why:`${SLOT_LABEL[slot]}: that row is for ${x.applies.join(', ')}, not ${mpn}.`};
  if(slot==='mpn')return {ok:true,why:''};
  if(x.kind==='typ')return {ok:false,why:`${SLOT_LABEL[slot]}: a typical value is not a promise. Cite the guaranteed min or max.`};
  if(x.kind==='absmax')return {ok:false,why:`${SLOT_LABEL[slot]}: an absolute maximum is a stress limit, not a design target. Cite the recommended range.`};
  if(x.kind==='front')return {ok:false,why:`${SLOT_LABEL[slot]}: the front page is a summary. Cite the table that guarantees it.`};
  if(x.kind==='max'&&slot==='iout')return {ok:false,why:`${SLOT_LABEL[slot]}: the maximum current limit is the worst case the other way. Cite the minimum.`};
  if(!meets(k.needs,x))return {ok:false,why:`${SLOT_LABEL[slot]}: the cited value doesn't cover the need.`};
  return {ok:true,why:''};
}
/** A citation's immediate teaching note when it goes into a slot (before anything is installed). */
export function citeNote(slot:Param,x:Clue):string|undefined{
  if(x.kind==='typ')return 'Typical: what most units do at the test conditions. It is not promised; use min or max.';
  if(x.kind==='absmax')return 'Absolute maximum is a stress limit, not an operating range. Look at recommended operating conditions.';
  if(x.kind==='front')return 'Front-page claims are summaries. Check the tables for what is guaranteed.';
  if(x.kind==='max'&&slot==='iout')return 'That is the most any unit might allow. Your load must fit under the guaranteed minimum.';
  return undefined;
}
/** Tier for a finished job. 1 = works, 2 = works and the work order cites guaranteed or
 *  recommended values, 3 = reliable, the cheapest adequate part, and no failed installs. */
export function tierFor(k:Case,mpn:string,cites:Partial<Record<Param,string>>,fails:number):{tier:1|2|3;notes:string[]}{
  const notes=k.slots.map(s=>judgeCitation(k,s,cites[s]?clue(cites[s]!):undefined,mpn)).filter(v=>!v.ok).map(v=>v.why);
  if(notes.length)return {tier:1,notes};
  const best=cheapest(k);
  if(mpn!==best)return {tier:2,notes:[`${best} also passes and costs ${part(best)!.price} instead of ${part(mpn)!.price}.`]};
  if(fails)return {tier:2,notes:['Elegant needs the right part on the first install.']};
  return {tier:3,notes:[]};
}
/** For each slot, the evidence a careful reader would cite for this part (proves tier 3 exists). */
export function bestCitations(k:Case,mpn=cheapest(k)):Partial<Record<Param,string>>{
  const out:Partial<Record<Param,string>>={};
  for(const s of k.slots){const x=allClues().find(y=>judgeCitation(k,s,y,mpn).ok);if(x)out[s]=x.id;}
  return out;
}
/** Search over documents: every whitespace-separated word must appear somewhere in the doc. */
export function search(query:string):Doc[]{
  const words=query.toLowerCase().split(/\s+/).filter(Boolean);if(!words.length)return DOCS;
  return DOCS.filter(d=>{const hay=docText(d);return words.every(w=>hay.includes(w));});
}
const docTexts=new Map<string,string>();
function docText(d:Doc){let t=docTexts.get(d.id);if(!t){const parts:string[]=[d.maker,d.title,d.subtitle,...d.parts];
  const cell=(x:string|Clue)=>typeof x==='string'?x:x.text;d.features.forEach(f=>parts.push(cell(f)));
  for(const s of d.sections){parts.push(s.title,s.text??'',s.note??'');for(const r of s.rows??[]){parts.push(r.label,r.cond??'');r.cells.forEach(x=>parts.push(cell(x)));}}
  t=parts.join(' ').toLowerCase();docTexts.set(d.id,t);}return t;}
