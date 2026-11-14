/* 확인용: 갤러리의 글 목록과 글 하나(본문·댓글)가 불러와지는지, 안 되면 화면에 나온 오류 문구가 무엇인지 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 q('#fscroll .row[data-g="normal:programming"]')?.click()||q('#fscroll .row')?.click();await wait(4000);
 out.rows=document.querySelectorAll('#cscroll .row.post').length;out.listMsg=(q('#cscroll .empty,#cscroll .spin')||{}).textContent||'';
 const post=[...document.querySelectorAll('#cscroll .row.post')].find(n=>!n.querySelector('.pin')&&!/2020/.test(n.textContent))||q('#cscroll .row.post');
 if(post){out.title=post.textContent.slice(0,30);post.click();await wait(6000);
  const room=q('#room')||document.body;out.bubbles=room.querySelectorAll('.msg,.bubble,.b').length;out.roomMsg=[...room.querySelectorAll('.empty,.spin,.err')].map(n=>n.textContent.slice(0,120)).join(' | ');out.roomText=room.textContent.replace(/\s+/g,' ').slice(0,300);out.toast=(q('#toast,.toast')||{}).textContent||''}
 return JSON.stringify(out)})()
