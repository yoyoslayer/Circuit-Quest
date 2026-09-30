export type Workcell='inspect'|'press'|'drill'|'plate'|'verify';
export const CELLS={
  inspect:{at:{x:0,z:-.85},table:{x:0,y:1,z:-2.45},label:'Inspection & dispatch'},
  press:{at:{x:-2.65,z:-.3},table:{x:-4,y:1,z:-.3},label:'Lamination press'},
  drill:{at:{x:-2.65,z:4.8},table:{x:-4,y:1,z:4.8},label:'Drill & laser'},
  plate:{at:{x:2.65,z:4.8},table:{x:4,y:1,z:4.8},label:'Copper plating bath'},
  verify:{at:{x:5,z:-.85},table:{x:6.6,y:1,z:-.85},label:'Customer hardware test'},
} as const;
export const cellFor=(action:string):Workcell=>action==='press'?'press':['bit','drill'].includes(action)?'drill':action==='plate'?'plate':['test','serve'].includes(action)?'verify':'inspect';
