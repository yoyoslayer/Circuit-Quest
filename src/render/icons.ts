// Circuit Crew icon sprite (32-unit grid, 2.4 ink stroke, round joins, duotone fills).
// Fills read CSS custom properties so one symbol serves every state:
//   --ic   body fill   (default paper)
//   --ic-a accent fill (default hard-hat yellow)
//   --ink-c ink        (default ink)
const F='style="fill:var(--ic,#FAF3E3)"';
const A='style="fill:var(--ic-a,#FFC53D)"';
const K='style="fill:var(--ink-c,#262A40)"';
const symbols:Record<string,string>={
  hand:`<path ${F} d="M9.2 18.5V10.2a2.3 2.3 0 0 1 4.6 0V16 7.6a2.3 2.3 0 0 1 4.6 0v7.9-6.1a2.3 2.3 0 0 1 4.6 0v7-3.6a2.3 2.3 0 0 1 4.6 0V20c0 5.6-4 9.4-9.4 9.4h-1.2c-3.2 0-5.2-1.2-7.1-4L4.3 20a2.3 2.3 0 0 1 3.6-2.9z"/>`,
  plug:`<path d="M12 11V4.5M20 11V4.5"/><path ${A} d="M8 11h16v5a8 8 0 0 1-16 0z"/><path d="M16 24v5.5"/><path d="M12.5 15.5h7"/>`,
  throw:`<path d="M4.5 28c2-8 6.5-13 12-15" stroke-dasharray="0 4.6"/><circle ${A} cx="22" cy="10" r="5.6"/><path d="M19.6 5.4c2 1.4 3.2 3.4 3.4 6M26 3.5l1.8-1.5M28.5 8h2"/>`,
  jump:`<path ${A} d="M16 3.5l9.5 9.5h-5.2v8.5h-8.6V13H6.5z"/><path d="M6 27.5h20"/>`,
  camera:`<path ${F} d="M6 11h4.5l2-3.5h7l2 3.5H26a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 26 26H6a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 6 11z"/><circle ${A} cx="16" cy="18" r="4.6"/>`,
  clock:`<circle ${F} cx="16" cy="17.5" r="11"/><path d="M16 11.5v6l4 2.6M12.5 3.5h7M16 3.5v3"/>`,
  mug:`<path d="M22 13h2.4a3.6 3.6 0 0 1 0 7.2H22"/><path ${F} d="M6 10h16v11a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M15 10l-2.6 5.2 4.2 2-3.2 5.4"/><path d="M25.5 6.5l2-2.2M22.5 4.5l.3-2.5M28 9.8l2.4-.4"/>`,
  coins:`<circle ${A} cx="12" cy="19" r="8.4"/><circle ${A} cx="20.5" cy="13" r="8.4"/><circle cx="20.5" cy="13" r="4.6"/>`,
  reel:`<circle ${A} cx="16" cy="16" r="12.5"/><circle ${F} cx="16" cy="16" r="7.4"/><circle ${K} cx="16" cy="16" r="2.4"/><path d="M11.2 12.4a6 6 0 0 1 9.6 0M11.2 19.6a6 6 0 0 0 9.6 0"/>`,
  oven:`<rect ${F} x="4" y="4.5" width="24" height="23.5" rx="3.5"/><path d="M4 10.5h24"/><rect ${A} x="8" y="14.5" width="16" height="9.5" rx="2"/><path d="M8.5 7.5h.01M13 7.5h.01M17.5 7.5h.01" stroke-width="3.2"/>`,
  conveyor:`<rect ${A} x="11" y="6" width="10" height="8.5" rx="1.6"/><rect ${F} x="3" y="14.5" width="26" height="8.5" rx="4.25"/><circle ${K} cx="7.6" cy="18.75" r="1.5"/><circle ${K} cx="16" cy="18.75" r="1.5"/><circle ${K} cx="24.4" cy="18.75" r="1.5"/><path d="M8 23v5M24 23v5"/>`,
  lift:`<path d="M6 29V4h20v25"/><path d="M16 4v14"/><path d="M12 10.5l4-4 4 4"/><rect ${A} x="9" y="18" width="14" height="6" rx="1.6"/><path d="M3.5 29h25"/>`,
  thermometer:`<path ${F} d="M12 18.8V7.5a4 4 0 0 1 8 0v11.3a6.6 6.6 0 1 1-8 0z"/><circle style="fill:var(--ic-a,#E5484D)" cx="16" cy="24" r="3.3"/><path d="M16 21V12" style="stroke:var(--ic-a,#E5484D)" stroke-width="3"/>`,
  fridge:`<rect ${F} x="8" y="3" width="16" height="26.5" rx="3.2"/><path d="M8 12.5h16M12.2 6.8v2.6M12.2 16v4.4"/>`,
  via:`<path ${A} d="M5 8.5h22v5H5zM5 18.5h22v5H5z"/><path d="M13 5v22M19 5v22" style="stroke:var(--ic,#FAF3E3);stroke-width:3.4"/><path d="M13 5v22M19 5v22"/>`,
  signal:`<path ${A} d="M16 13.5l6.5 15h-13z"/><circle ${F} cx="16" cy="11" r="3"/><path d="M10.5 5.5a8 8 0 0 0 0 11M21.5 5.5a8 8 0 0 1 0 11M6.5 2.5a13 13 0 0 0 0 17M25.5 2.5a13 13 0 0 1 0 17"/>`,
  archive:`<path ${F} d="M6 4.5h14l6 6v17H6z"/><path d="M20 4.5v6h6M10 14h8M10 18.5h5"/><circle ${A} cx="19.5" cy="21" r="4.6"/><path d="M22.8 24.3l4.4 4.4" stroke-width="3"/>`,
  led:`<path ${F} d="M9.5 16a6.5 6.5 0 0 1 13 0v5h-13z"/><path ${A} d="M7.5 21h17v3.2h-17z"/><path d="M13 24.2v5M19 24.2v3.2M5.5 9.5l-2-1.5M26.5 9.5l2-1.5M16 5.5V3"/>`,
  waterwheel:`<circle ${F} cx="15" cy="13.5" r="9.5"/><circle ${A} cx="15" cy="13.5" r="3"/><path d="M15 4v19M5.5 13.5h19M8.3 6.8l13.4 13.4M21.7 6.8L8.3 20.2"/><path d="M3.5 27c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0 4.3-1.6 6.5 0 4.3 1.6 6.5 0" style="stroke:#43B8C4"/>`,
  tray:`<path d="M16 9.6V7.4M13.6 7h4.8"/><path ${A} d="M5 22a11 11 0 0 1 22 0z"/><path d="M3 22.5h26M6 26.5h20"/><path d="M10 17.5a6.5 6.5 0 0 1 3-3.6" style="stroke:var(--ic,#FAF3E3)"/>`,
  projector:`<path d="M23.5 13.5l5.5-3v12l-5.5-3"/><rect ${F} x="3" y="10" width="21" height="13.5" rx="4"/><circle ${A} cx="16.5" cy="16.75" r="3.8"/><path d="M7 14.5h3.5M7 18.5h2"/><path d="M8 27.5l1.5-4M19 27.5l-1.5-4"/>`,
  bolt:`<path ${A} d="M18.5 2.5L6.5 18h8.2l-2.2 11.5L25.5 13.5h-8.3z"/>`,
  retry:`<path d="M7.4 12.2A10 10 0 1 1 6.6 20"/><path ${K} d="M3.8 6.2l1.3 8.4 8.2-1.8z" stroke-width="2"/>`,
  play:`<path ${K} d="M10.5 6.4v19.2c0 1.2 1.3 1.9 2.3 1.3l15.2-9.6c.9-.6.9-2 0-2.6L12.8 5.1c-1-.6-2.3.1-2.3 1.3z"/>`,
  pause:`<rect ${K} x="8" y="6" width="6" height="20" rx="2"/><rect ${K} x="18" y="6" width="6" height="20" rx="2"/>`,
  next:`<path d="M5 16h20M17 7.5l8.5 8.5-8.5 8.5" stroke-width="3.4"/>`,
  jobs:`<rect ${F} x="4" y="4" width="10.5" height="10.5" rx="3"/><rect ${A} x="17.5" y="4" width="10.5" height="10.5" rx="3"/><rect ${F} x="4" y="17.5" width="10.5" height="10.5" rx="3"/><rect ${F} x="17.5" y="17.5" width="10.5" height="10.5" rx="3"/>`,
  sound:`<path ${F} d="M4 12h5l7-6v20l-7-6H4z"/><path d="M20.5 11.5a6.4 6.4 0 0 1 0 9M24 8a11 11 0 0 1 0 16"/>`,
  mute:`<path ${F} d="M4 12h5l7-6v20l-7-6H4z"/><path d="M21 12.5l7 7M28 12.5l-7 7"/>`,
  check:`<path d="M6 16.5l6.2 6.2L26 9" stroke-width="4"/>`,
  star:`<path ${A} d="M16 3.5l3.8 7.8 8.5 1.2-6.2 6 1.5 8.5L16 23l-7.6 4 1.5-8.5-6.2-6 8.5-1.2z"/>`,
  spoiled:`<path d="M10 7.5c-1.6-1.4 1.6-2.6 0-4.2M16 6.5c-1.6-1.4 1.6-2.6 0-4.2M22 7.5c-1.6-1.4 1.6-2.6 0-4.2" style="stroke:#6FA05A"/><path style="fill:#A8C66C" d="M7 16c0-3.6 4-5.8 9-5.8s9 2.2 9 5.8"/><path ${F} d="M3.5 16h25a12.5 11.5 0 0 1-25 0z"/><path d="M12 20.6v.01M20 20.6v.01" stroke-width="3.2"/><path d="M13 25.2c2-1.4 4-1.4 6 0"/>`,
  socket:`<rect ${F} x="4.5" y="4.5" width="23" height="23" rx="7"/><rect ${K} x="10.5" y="10.5" width="3.2" height="7.5" rx="1.6" stroke="none"/><rect ${K} x="18.3" y="10.5" width="3.2" height="7.5" rx="1.6" stroke="none"/><circle ${K} cx="16" cy="22" r="1.7" stroke="none"/>`,
  gamepad:`<path ${F} d="M9.5 9.5h13a6.5 6.5 0 0 1 6.4 5.4l1 6.4a3.6 3.6 0 0 1-6.3 2.9L21 21H11l-2.6 3.2a3.6 3.6 0 0 1-6.3-2.9l1-6.4a6.5 6.5 0 0 1 6.4-5.4z"/><path d="M9.5 13v5.5M6.8 15.8h5.5"/><circle ${K} cx="21.6" cy="14.2" r="1.4" stroke="none"/><circle ${K} cx="24.8" cy="17.6" r="1.4" stroke="none"/>`,
  cart:`<rect ${A} x="4" y="7.5" width="19" height="14" rx="2.4"/><path d="M23 10.5h4.5v11"/><path d="M9 16.5a4.6 4.6 0 0 1 9.2 0M13.6 16.5l2.2-2.8"/><circle ${F} cx="9" cy="25" r="2.6"/><circle ${F} cx="20" cy="25" r="2.6"/>`,
  move:`<path d="M16 5v22M5 16h22"/><path ${K} d="M16 2.5l4 4.5h-8zM16 29.5l4-4.5h-8zM2.5 16L7 12v8zM29.5 16L25 12v8z" stroke-width="1.6"/>`,
  mouse:`<rect ${F} x="8.5" y="3.5" width="15" height="25" rx="7.5"/><path ${A} d="M16 3.5a7.5 7.5 0 0 1 7.5 7.5v2.5H16z"/><path d="M16 3.5v10M8.5 13.5h15"/>`,
  dash:`<path d="M6 8.5l7.5 7.5L6 23.5M16.5 8.5L24 16l-7.5 7.5" stroke-width="3.4"/>`,
  home:`<path ${F} d="M5 15L16 5l11 10v12a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 5 27z"/><path ${A} d="M13 28.5v-7h6v7"/>`,
  lock:`<path d="M10.5 14v-3.5a5.5 5.5 0 0 1 11 0V14"/><rect ${F} x="6.5" y="14" width="19" height="14" rx="3.5"/><path d="M16 19.5v3"/>`,
  survey:`<rect ${F} x="3.5" y="7" width="25" height="18" rx="3"/><path d="M3.5 12.5h25M11 12.5V25" /><path ${A} d="M14.5 16h10v5.5h-10z"/>`
};
// Older names still used by callers.
const aliases:Record<string,string>={damage:'mug',arrow:'next'};
/** Inject the sprite once; `<use>` references resolve whenever it lands in the DOM. */
export function installIcons(){
  if(document.getElementById('cc-icons'))return;
  const sprite=`<svg id="cc-icons" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${Object.entries(symbols).map(([k,v])=>`<symbol id="i-${k}" viewBox="0 0 32 32">${v}</symbol>`).join('')}</svg>`;
  document.body.insertAdjacentHTML('afterbegin',sprite);
}
export const hasIcon=(name:string)=>name in symbols||name in aliases;
export const icon=(name:string,cls='')=>`<svg class="ico${cls?` ${cls}`:''}" aria-hidden="true" focusable="false"><use href="#i-${aliases[name]??(name in symbols?name:'bolt')}"/></svg>`;
