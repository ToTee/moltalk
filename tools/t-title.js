// 확인용: 긴 제목이 글 목록·채팅방 머리·공지 줄에서 두 줄까지 보이는지 잽니다. window.__yjRoom을 켜면 채팅방까지 엽니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 const LONG='네코냥 버택스 연결부터 막혔어 도와줘 제발 이거 왜 안되는지 모르겠음 진짜로 한참을 해봤는데 초록불이 안 떠';
 [...document.querySelectorAll('.row[data-g]')].find(n=>n.getClientRects().length)?.click();await wait(3000);
 const ts=[...document.querySelectorAll('.post b .t')].filter(n=>n.getClientRects().length);
 const before=ts[0]?.getBoundingClientRect().height;
 if(ts[0])ts[0].textContent=LONG;if(ts[2])ts[2].textContent=LONG;
 const out={posts:ts.length,oneLine:Math.round(before),longTitle:Math.round(ts[0]?.getBoundingClientRect().height),overflowX:document.documentElement.scrollWidth>innerWidth};
 {
  [...document.querySelectorAll('.row.post')].filter(n=>n.getClientRects().length)[1]?.click();await wait(4000);
  const b=document.querySelector('.rhead b'),s=document.querySelector('.rhead .tt span'),n=document.querySelector('.notice .tx div');
  if(b){const h1=b.getBoundingClientRect().height;b.textContent=LONG;if(n)n.textContent='[질문] '+LONG;if(s)s.textContent='AI 채팅 프론트엔드 마이너 갤러리 이름이 아주 긴 경우 · 참여 12명';
   Object.assign(out,{headOne:Math.round(h1),headLong:Math.round(b.getBoundingClientRect().height),sub:Math.round(s.getBoundingClientRect().height),notice:Math.round(n?.getBoundingClientRect().height||0)})}
 }
 return JSON.stringify(out);
})()
