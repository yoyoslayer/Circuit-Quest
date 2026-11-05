import {beforeEach,it,expect,vi} from 'vitest';
import {bestFor,record} from './store';
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
