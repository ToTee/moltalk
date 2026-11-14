// 화면에 쓰는 아이콘(직접 그린 SVG).
const s=(d,w=24,extra='')=>'<svg viewBox="0 0 24 24" width="'+w+'" height="'+w+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+extra+'>'+d+'</svg>';
const f=(d,w=28)=>'<svg viewBox="0 0 24 24" width="'+w+'" height="'+w+'" fill="currentColor" aria-hidden="true">'+d+'</svg>';
const cog=(()=>{const pt=(r,a)=>(12+r*Math.cos(a*Math.PI/180)).toFixed(2)+' '+(12+r*Math.sin(a*Math.PI/180)).toFixed(2);let d='';for(let i=0;i<8;i++){const a=i*45;d+=(i?'L':'M')+pt(7,a-15)+'L'+pt(9.4,a-9)+'L'+pt(9.4,a+9)+'L'+pt(7,a+15)}return s('<path d="'+d+'Z"/><circle cx="12" cy="12" r="3"/>')})();
export const I={
 person:f('<circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/>'),
 chat:f('<path d="M12 3.5c-5 0-9 3.3-9 7.4 0 2.6 1.6 4.9 4.1 6.2L6.3 21l4.3-2.8c.5.1.9.1 1.4.1 5 0 9-3.3 9-7.4s-4-7.4-9-7.4z"/>'),
 more:f('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>'),
 smile:s('<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/><circle cx="9" cy="10" r=".8" fill="currentColor"/><circle cx="15" cy="10" r=".8" fill="currentColor"/>'),
 bell:s('<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>'),
 sun:s('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
 cog,
 /* 휴대폰 하단 메뉴용(속을 채운 모양) */
 personM:f('<circle cx="12" cy="7.4" r="3.9"/><path d="M12 13c-4.7 0-7.4 1.9-7.4 4.2 0 1.4 1 2.2 2.5 2.2h9.8c1.5 0 2.5-.8 2.5-2.2 0-2.3-2.7-4.2-7.4-4.2z"/>',30),
 chatM:f('<ellipse cx="12" cy="10.8" rx="8.7" ry="7.1"/><path d="M6.9 15.6 6.3 20c-.1.6.5.9.9.6l4.6-3.3z"/>',30),
 conM:'<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><ellipse cx="15.6" cy="9.6" rx="6.6" ry="5.7"/><path d="M19.3 13.4l.6 3.4c.1.5-.4.8-.8.5l-3.5-2.5z"/><g stroke="#fff" stroke-width="1.3"><ellipse cx="9.2" cy="12.6" rx="6.9" ry="6"/></g><path d="M5.2 16.6l-.5 3.3c-.1.5.4.8.8.5l3.6-2.6z"/><circle cx="6.9" cy="11.6" r="1" fill="#fff"/><circle cx="11.5" cy="11.6" r="1" fill="#fff"/><path d="M6.4 14.1h5.6a2.9 2.9 0 0 1-5.6 0z" fill="#fff"/></svg>',
 bellF:f('<path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v5.2L3.6 17.6c-.4.7.1 1.4.9 1.4h15c.8 0 1.3-.7.9-1.4l-1.9-3.4V9A6.5 6.5 0 0 0 12 2.5z"/><path d="M9.6 20.2a2.5 2.5 0 0 0 4.8 0z"/>'),
 smileF:f('<path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM8.9 8.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm6.2 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM7.4 13.6h9.2a4.7 4.7 0 0 1-9.2 0z"/>'),
 sunF:'<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4" stroke="none"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>',
 search:s('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',22),
 plusGal:s('<circle cx="9.5" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 3-6 7-6s7 2.4 7 6M19 6v6M16 9h6"/>'),
 write:s('<path d="M11 4.5c-4.4 0-8 2.8-8 6.3 0 2.2 1.4 4.1 3.5 5.2L6 19.5l3.6-2.4c.5.1.9.1 1.4.1 4.4 0 8-2.8 8-6.4"/><path d="M19 2.5v6M16 5.5h6"/>'),
 menu:s('<path d="M4 6h16M4 12h16M4 18h16"/>',22),
 refresh:s('<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/>',22),
 horn:'<svg viewBox="0 0 24 24" width="20" height="20" fill="#3b8de0" aria-hidden="true"><path d="M3 9.5h4l8-5v15l-8-5H3z"/><path d="M17.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="#3b8de0" stroke-width="1.8" stroke-linecap="round"/></svg>',
 down:s('<path d="m6 9 6 6 6-6"/>',18,' style="color:#888"'),
 up:s('<path d="m6 15 6-6 6 6"/>',16,' style="color:#888"'),
 back:s('<path d="m15 5-7 7 7 7"/>',22),
 next:s('<path d="m9 5 7 7-7 7"/>',18,' style="color:#888;flex:none"'),
 plus:s('<path d="M12 5v14M5 12h14"/>',22),
 file:s('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',22),
 listp:s('<path d="M4 6h14M4 12h8M4 18h8M17 12v6M14 15h6"/>',18),
 pin:'<svg viewBox="0 0 24 24" width="14" height="14" fill="#8a8a8a" style="margin-left:5px" role="img" aria-label="상단 고정"><path d="M8 3h8v2l-1.5 1v5l3 3v2h-4.5v5l-1 1-1-1v-5H6.5v-2l3-3V6L8 5z"/></svg>',
 /* 기본 프로필: 머리와 어깨가 칸 한가운데에 다 들어오는 사람 모양 */
 sil:'<svg viewBox="0 0 24 24" fill="rgba(255,255,255,.7)" aria-hidden="true"><circle cx="12" cy="8.6" r="3.7"/><path d="M12 13.4c-4.2 0-7 1.9-7 4.6 0 1 .8 1.6 1.8 1.6h10.4c1 0 1.8-.6 1.8-1.6 0-2.7-2.8-4.6-7-4.6z"/></svg>'
};
