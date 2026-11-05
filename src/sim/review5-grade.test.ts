import {describe,it,expect,vi,beforeEach} from 'vitest';
import {grade,gradeRush,crewGold} from './grade';
describe('review 5 grading contracts',()=>{
 it('keeps clean ordinary runs A on every axis',()=>expect(grade(120,10,300).parts).toEqual(['A','A','A']));
 it('rewards fast chaos without failing the job',()=>expect(grade(60,100,12000).overall).toBe('A'));
 it('never awards an idle Rush an A despite zero breakage',()=>expect(gradeRush(0,0,0)).toEqual({parts:['D','A','A'],overall:'D'}));
 it('ranks Rush work at the published boundaries',()=>expect([0,2,3,5,6,9,10].map(n=>gradeRush(n,0,0).overall)).toEqual(['D','D','C','C','B','B','A']));
 it('drops a destructive Rush one grade but still returns a result',()=>expect(gradeRush(10,7,0).overall).toBe('B'));
 it('requires every axis and every star in the same run for Crew Gold',()=>{expect(crewGold(['A','A','A'],7)).toBe(true);expect(crewGold(['A','B','A'],7)).toBe(false);expect(crewGold(['A','A','A'],3)).toBe(false);});
});
