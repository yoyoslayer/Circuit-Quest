import {describe,expect,it} from 'vitest';
import {CASES,DOCS,PARTS,adequate,cheapest,check,clue,allClues,governing,judgeCitation,tierFor,bestCitations,search,meets,part,type Param} from './logic';

const job=(id:string)=>CASES.find(k=>k.id===id)!;

describe('archive datasheets are consistent',()=>{
  it('every stocked part has exactly one ordering row in its own datasheet',()=>{
    for(const p of PARTS){
      const rows=allClues().filter(x=>x.doc===p.doc&&x.param==='mpn'&&x.kind==='order'&&x.value===p.mpn);
      expect(rows,p.mpn).toHaveLength(1);
      expect(DOCS.find(d=>d.id===p.doc)!.parts,p.mpn).toContain(p.mpn);
    }
  });
  it('every clue points at parts its document covers, and ids are unique',()=>{
    const ids=allClues().map(x=>x.id);expect(new Set(ids).size).toBe(ids.length);
    for(const x of allClues()){const d=DOCS.find(d=>d.id===x.doc)!;for(const m of x.applies)expect(d.parts,x.id).toContain(m);}
  });
  it('each part has a recommended range inside its absolute maximum',()=>{
    for(const p of PARTS)for(const param of ['vsup','temp'] as Param[]){
      const rec=governing(p.mpn,param);const abs=allClues().find(x=>x.doc===p.doc&&x.kind==='absmax'&&x.param===param&&x.applies.includes(p.mpn));
      if(rec&&abs){expect(rec.lo!,`${p.mpn} ${param}`).toBeGreaterThanOrEqual(abs.lo!);expect(rec.hi!,`${p.mpn} ${param}`).toBeLessThanOrEqual(abs.hi!);}
    }
  });
  it('typical sits between min and max on every electrical row',()=>{
    const byRow=new Map<string,Record<string,number>>();
    for(const x of allClues())if(['min','typ','max'].includes(x.kind)){const row=x.id.replace(/-(min|typ|max)$/,'');const r=byRow.get(row)??{};r[x.kind]=x.value as number;byRow.set(row,r);}
    for(const [row,v] of byRow){if(v.min!==undefined&&v.typ!==undefined)expect(v.typ,row).toBeGreaterThanOrEqual(v.min);if(v.max!==undefined&&v.typ!==undefined)expect(v.typ,row).toBeLessThanOrEqual(v.max);}
  });
  it('search narrows the documents',()=>{
    expect(search('').length).toBe(DOCS.length);
    expect(search('QX8').map(d=>d.id)).toEqual(expect.arrayContaining(['qs-qx8','stock']));
    expect(search('thin film').map(d=>d.id)).toContain('fw-rt');
    expect(search('nothing-like-this')).toHaveLength(0);
  });
});

describe('archive jobs',()=>{
  it('the solver finds the intended adequate parts and the cheapest one',()=>{
    expect(adequate(job('led')).sort()).toEqual(['RC0603F472','RT0603D472']);expect(cheapest(job('led'))).toBe('RC0603F472');
    expect(adequate(job('fan')).sort()).toEqual(['HDM7-S8','HDM9-P16']);expect(cheapest(job('fan'))).toBe('HDM7-S8');
    expect(adequate(job('freezer')).sort()).toEqual(['OM8-SE','QX8-S8I']);expect(cheapest(job('freezer'))).toBe('QX8-S8I');
  });
  it('the cheapest trap in each job is cheaper than the right answer',()=>{
    for(const k of CASES){const traps=k.stock.filter(m=>!check(k,m).ok);expect(Math.min(...traps.map(m=>part(m)!.price))).toBeLessThanOrEqual(part(cheapest(k))!.price);}
  });
  it('resistors: value code and tolerance code decide it',()=>{
    expect(check(job('led'),'RC0603J472').problem).toMatch(/only guarantees ±5 %/);
    expect(check(job('led'),'RC0603F471').problem).toMatch(/470 Ω.*10¹/);
  });
  it('the absolute-maximum trap: 13.2 V is inside 15 V abs max but outside the 12 V recommended range',()=>{
    const fan=job('fan'),abs=clue('qs-qm2201/abs-vm')!,rec=clue('qs-qm2201/rec-vm')!;
    expect(meets(fan.needs,abs)).toBe(true);expect(meets(fan.needs,rec)).toBe(false);
    const r=check(fan,'QM2201-S8');expect(r.ok).toBe(false);expect(r.problem).toMatch(/overvoltage lockout.*stress limit/);
  });
  it('the typical trap: 1.4 A typical looks fine, 1.0 A guaranteed does not',()=>{
    const fan=job('fan');expect(meets(fan.needs,clue('om-omd40/ocp-typ')!)).toBe(true);expect(meets(fan.needs,clue('om-omd40/ocp-min')!)).toBe(false);
    expect(check(fan,'OMD40-S8').problem).toMatch(/only 1 A is guaranteed \(min\); 1.4 A is typical/);
  });
  it('the ordering-suffix twist: the C grade fails in the freezer, the DFN does not fit',()=>{
    const fz=job('freezer');
    expect(meets(fz.needs,clue('qs-qx8/abs-temp')!)).toBe(true);
    expect(check(fz,'QX8-S8C').problem).toMatch(/0 to 70 °C.*ordering suffix/);
    expect(check(fz,'QX8-D8I').problem).toMatch(/DFN-8 package does not fit/);
    expect(check(fz,'RC0603F472').problem).toMatch(/needs a controller/);
  });
});

describe('archive work orders',()=>{
  it('guaranteed and recommended values are sound; typical, abs max and front-page claims are not',()=>{
    const fan=job('fan');
    expect(judgeCitation(fan,'vsup',clue('hg-hdm/rec-vm7'),'HDM7-S8').ok).toBe(true);
    expect(judgeCitation(fan,'vsup',clue('hg-hdm/abs-vm7'),'HDM7-S8').why).toMatch(/stress limit/);
    expect(judgeCitation(fan,'iout',clue('hg-hdm/ocp7-min'),'HDM7-S8').ok).toBe(true);
    expect(judgeCitation(fan,'iout',clue('hg-hdm/ocp7-typ'),'HDM7-S8').why).toMatch(/not a promise/);
    expect(judgeCitation(fan,'iout',clue('hg-hdm/front-i'),'HDM7-S8').why).toMatch(/summary/);
    // A row for the sister part does not count.
    expect(judgeCitation(fan,'vsup',clue('hg-hdm/rec-vm9'),'HDM7-S8').why).toMatch(/not HDM7-S8/);
    const fz=job('freezer');
    expect(judgeCitation(fz,'temp',clue('qs-qx8/abs-temp'),'QX8-S8I').ok).toBe(false);
    expect(judgeCitation(fz,'temp',clue('qs-qx8/rec-temp-i'),'QX8-S8I').ok).toBe(true);
  });
  it('every job can reach elegant (tier 3) with the solver\'s part and sound citations',()=>{
    for(const k of CASES){const cites=bestCitations(k);expect(Object.keys(cites).sort(),k.id).toEqual([...k.slots].sort());
      expect(tierFor(k,cheapest(k),cites,0).tier,k.id).toBe(3);}
  });
  it('tiers: works, reliable, elegant',()=>{
    const led=job('led'),good=bestCitations(led);
    expect(tierFor(led,'RC0603F472',{mpn:good.mpn},0).tier).toBe(1);
    expect(tierFor(led,'RT0603D472',bestCitations(led,'RT0603D472'),0).tier).toBe(2);
    expect(tierFor(led,'RC0603F472',good,1).tier).toBe(2);
    expect(tierFor(led,'RC0603F472',good,0).tier).toBe(3);
  });
});
