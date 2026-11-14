// 확인용: PC에서 휴대폰 모양을 강제로 켜고(손가락 조건을 흉내 낼 수 없어 규칙의 조건만 바꿉니다) 화면 배치를 잽니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 /* 기본은 친구 화면입니다. window.__yjChats를 켜면 채팅 화면(글 목록을 한 번 읽음)을 봅니다. */
 if(window.__yjChats){[...document.querySelectorAll('.row[data-g]')].find(n=>n.getClientRects().length)?.click();await wait(2500)}
 const box=s=>{const n=document.querySelector(s);if(!n)return null;const b=n.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)]};
 const shown=s=>[...document.querySelectorAll(s)].filter(n=>n.getClientRects().length).length;
 return JSON.stringify({win:[innerWidth,innerHeight],rail:box('#rail'),railButtons:[...document.querySelectorAll('#rail .ic')].filter(n=>n.getClientRects().length).map(n=>n.getAttribute('aria-label')),
  head:box('.head'),who:box('.who'),h2Shown:shown('.head h2'),meShown:shown('.me'),updShown:shown('.upd'),cog:box('.head [data-ov="set"]'),chip:box('.chip'),row:box('.row[data-g],.row.post'),av:box('.row .av'),
  overflowX:document.documentElement.scrollWidth>innerWidth});
})()
