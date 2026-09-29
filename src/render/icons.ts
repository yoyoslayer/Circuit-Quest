const paths:Record<string,string>={
  plug:'<path d="M9 3v5m6-5v5M7 8h10v5a5 5 0 0 1-10 0V8Zm5 10v4"/>',
  hand:'<path d="M8 12V6a2 2 0 0 1 3 0v4-6a2 2 0 0 1 3 0v6-4a2 2 0 0 1 3 0v6-2a2 2 0 0 1 3 0v6c0 4-3 6-7 6-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2Z"/>',
  throw:'<path d="m4 18 6-6m-6 0v6h6M9 8c7-8 11-3 11 5m-3-3 3 3 2-4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  damage:'<path d="M6 4h12l-2 17H8L6 4Zm7 0-3 7 5 2-4 8"/>',
  coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 4 16 4 16 0V6M4 11v5c0 4 16 4 16 0v-5"/>',
  reel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  retry:'<path d="M5 8a8 8 0 1 1-1 8M5 3v5h5"/>',
  play:'<path d="m8 4 12 8-12 8V4Z"/>',
  projector:'<rect x="3" y="8" width="18" height="12" rx="3"/><circle cx="15" cy="14" r="3"/><path d="m7 5 4-3M6 12h2"/>',
  sound:'<path d="m10 5-5 4H2v6h3l5 4V5Zm4 3c4 2 4 6 0 8m3-11c7 4 7 10 0 14"/>',
  camera:'<rect x="2" y="6" width="20" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M7 6V3h10v3"/>',
  bolt:'<path d="m14 2-9 12h6l-1 8 9-13h-6l1-7Z"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  pause:'<path d="M8 4v16M16 4v16"/>',
  arrow:'<path d="M3 12h18m-7-7 7 7-7 7"/>',
  jump:'<path d="M12 21V3m-6 6 6-6 6 6M3 21h18"/>',
  move:'<path d="M12 2v20M2 12h20m-13-7 3-3 3 3m-6 14 3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3"/>'
};
export const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.bolt}</svg>`;
