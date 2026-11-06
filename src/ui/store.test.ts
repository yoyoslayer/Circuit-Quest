import {beforeEach,it,expect,vi} from 'vitest';
import {bestFor,record,markReturn,takeReturn,dropStaleReturn} from './store';
beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});});
it('does not synthesize mastery from independent record stats or stars',()=>{
 record('playground',{grade:'A',time:10,damage:40,cost:90,stars:1});
 record('playground',{grade:'A',time:90,damage:0,cost:0,stars:6});
 expect(bestFor('playground')?.stars).toBe(7);expect(bestFor('playground')?.crewGold).toBe(false);
});
it('preserves earned mastery and returns the actual previous best',()=>{
 const first={grade:'A' as const,time:10,damage:0,cost:0,stars:7,crewGold:true};record('playground',first);
 const next=record('playground',{grade:'C',time:100,damage:20,cost:50});
 expect(next.old).toEqual(first);expect(next.best.crewGold).toBe(true);expect(next.improved).toBe(false);
});
it('a Rush run with fewer cabinets served is not a new best just because its clock read lower',()=>{
 record('arcade-rush',{grade:'A',time:205,damage:0,cost:0,served:10});
 const worse=record('arcade-rush',{grade:'C',time:200,damage:0,cost:0,served:3});
 expect(worse.improved).toBe(false);expect(worse.best.time).toBe(205);expect(worse.best.served).toBe(10);
 // Outside Rush a faster time still counts.
 record('playground',{grade:'A',time:40,damage:0,cost:0});expect(record('playground',{grade:'A',time:30,damage:0,cost:0}).improved).toBe(true);
});
it('reads the stored record once and keeps it in step with its own writes',()=>{
 const get=vi.spyOn(localStorage,'getItem');
 for(let i=0;i<100;i++)bestFor('meeting');
 expect(get.mock.calls.length).toBeLessThanOrEqual(1);
 record('meeting',{grade:'B',time:90,damage:1,cost:2});expect(bestFor('meeting')?.grade).toBe('B');
 expect(JSON.parse(localStorage.getItem('circuit-crew:best:v1')!).meeting.grade).toBe('B');
});
it('the return door names the job Pip is coming back from, never one from two jobs ago',()=>{
 const data=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)});
 // Through door 00, then "next job" loads 01 without the lobby: the old key goes.
 markReturn('playground');dropStaleReturn('meeting');expect(takeReturn()).toBeNull();
 // Through door 01 and back to HQ: the key survives the job and is taken once.
 markReturn('meeting');dropStaleReturn('meeting');markReturn('meeting');expect(takeReturn()).toBe('meeting');expect(takeReturn()).toBeNull();
});
