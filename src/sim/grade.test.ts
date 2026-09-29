import {expect,it} from 'vitest';
import {grade} from './grade';
it('rewards the best category even after expensive chaos',()=>{expect(grade(60,90,12000).overall).toBe('A');expect(grade(500,50,1500).overall).toBe('D');});
