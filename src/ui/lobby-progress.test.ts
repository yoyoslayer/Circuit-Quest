import {beforeEach,it,expect,vi} from 'vitest';
import {Lobby} from '../hub/lobby';
import {levels} from '../levels';
import {record,isOptional} from './store';
import type {Game} from '../game';
beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});});
it('completing every required job at C does not award mastery or star bonuses',()=>{
 for(const level of levels.filter(l=>!isOptional(l)))record(level.id,{grade:'C',time:500,damage:20,cost:800});
 const lobby=new Lobby({} as Game);
 expect(lobby.job.bonuses.map(b=>b.ok())).toEqual([true,false,false]);
});
