// Read-only helpers for the playground-play review scripts.
export const hud=g=>g.page.evaluate(()=>{const p=document.querySelector('.prompt-pill');const card=document.querySelector('.objective .cur');
  const acts=[...document.querySelectorAll('.act')].map(a=>`${a.dataset.action}:${a.classList.contains('ready')?'R':''}${a.classList.contains('on')?'O':''}${a.classList.contains('off')?'x':''}`).join(' ');
  const strain=document.querySelector('.strain');
  return {card:card?.textContent,prompt:p&&!p.hidden?p.innerText.replace(/\n/g,' '):'-',acts,strain:strain?.classList.contains('show')?'shown':'hidden'};});
// Captures the game's props array by briefly hooking Array.prototype.filter while snapshot() runs.
export const props=g=>g.page.evaluate(()=>{let got;const f=Array.prototype.filter;
  Array.prototype.filter=function(...a){if(!got&&this.length&&this[0]&&this[0].spec&&this[0].body)got=this;return f.apply(this,a);};
  try{window.__circuitCrew.snapshot();}finally{Array.prototype.filter=f;}
  return (got??[]).map(p=>{const t=p.body.translation();return {kind:p.spec.kind,id:p.spec.id,x:+t.x.toFixed(2),y:+t.y.toFixed(2),z:+t.z.toFixed(2),visible:p.mesh.visible,damaged:p.damaged,color:p.spec.color};});});
export const brief=s=>({t:+s.time.toFixed(2),won:s.won,p:{x:+s.player.x.toFixed(2),z:+s.player.z.toFixed(2)},hold:s.holdingPlug,held:s.held,strain:+s.rope.strain.toFixed(3),len:+s.rope.length.toFixed(2),bends:s.rope.bends.length,dmg:s.damage,cost:s.cost,el:s.electrical,sw:s.switchedOn,pins:s.pinsDown,alarmed:s.alarmed,fast:+s.fastestProp.toFixed(2),dc:s.drawCalls});
