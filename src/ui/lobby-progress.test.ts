import {beforeEach,it,expect,vi} from 'vitest';
import {record,isOptional,campaignProgress} from './store';
import type {Level} from '../levels/types';
const levels=[{id:'playground'},{id:'meeting'},{id:'arcade-rush',requires:'arcade'}] as Level[];
beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});});
it('completing every required job at C does not award mastery or star bonuses',()=>{
 for(const level of levels.filter(l=>!isOptional(l)))record(level.id,{grade:'C',time:500,damage:20,cost:800});
 expect(campaignProgress(levels)).toEqual({allJobs:true,goldJobs:0,stars:0});
});
