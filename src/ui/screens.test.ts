import {it,expect} from 'vitest';
import {resultMarkup} from './screens';
import type {Level} from '../levels/types';
const level={id:'playground',name:'CABLE PLAYGROUND',number:'00',badge:'plug'} as Level;
it('results consistently return to HQ and offer the next job secondarily',()=>{
 const html=resultMarkup({level,time:30,damage:0,cost:0,parts:['A','A','A'],overall:'A',improved:false,next:level});
 expect(html).toContain('btn primary next jobs');expect(html).toContain('aria-label="Return to HQ"');expect(html).toContain('Next unfinished job:');
});
it('practice shows completion without grade medals or a grade announcement',()=>{
 const html=resultMarkup({level,time:30,damage:0,cost:0,parts:['A','A','A'],overall:'A',improved:false,practice:true});
 expect(html).toContain('Practice complete');expect(html).not.toContain('class="medal');expect(html).not.toContain('Job done, grade');
});
it('shows the previous best cabinet count with higher-is-better feedback',()=>{
 const html=resultMarkup({level,time:180,damage:0,cost:0,parts:['B','A','A'],overall:'B',improved:true,served:6,previous:{grade:'C',time:180,damage:0,cost:0,served:3}});
 expect(html).toContain('data-kind="served"');expect(html).toContain('prev better');expect(html).toContain('best 3');
});
