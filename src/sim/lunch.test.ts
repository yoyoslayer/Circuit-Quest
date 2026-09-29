import {it,expect} from 'vitest';
import {LunchJob} from './lunch';
const none={oven:false,fridge:false,conveyor:false,lift:false};
it('requires baking, physical handoff, conveyor and lift in order',()=>{const j=new LunchJob();for(let i=0;i<200;i++)j.tick(.1,{...none,oven:true,fridge:true});expect(j.tray).toBe('baked');j.tick(9,{...none,conveyor:true,fridge:true});expect(j.tray).toBe('baked');j.pickTray();j.placeTray();j.tick(9,{...none,conveyor:true,fridge:true});expect(j.tray).toBe('lift');j.tick(6,{...none,lift:true,fridge:true});expect(j.done).toBe(true);});
it('fridge warms, cools under power and spoilage requires retry',()=>{const j=new LunchJob();j.tick(30,none);expect(j.temperature).toBeCloseTo(.46);j.tick(5,{...none,fridge:true});expect(j.temperature).toBeCloseTo(.235);j.tick(200,none);expect(j.failed).toBe(true);});
it('cooler provides a valid alternate solution and oven can burn tray',()=>{const j=new LunchJob();j.cooled=true;j.tick(300,none);expect(j.failed).toBe(false);j.tick(20,{...none,oven:true});j.tick(46,{...none,oven:true});expect(j.tray).toBe('burned');});
