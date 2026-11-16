/* 확인용: 글 검색(디시에서 제목+내용으로 찾기)과 퍼 온 글 카드가 나오는지 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 window.dispatchEvent(new Event('resize'));await wait(1200);
 if(!q('#fscroll .row[data-g="minor:ai_utilize"]')){q('[data-ov="find"]').click();await wait(300);q('#findq').value='AI 활용';q('#findf').requestSubmit();await wait(3500);
  const b=[...document.querySelectorAll('[data-add]')][0];out.addName=b?.closest('.row,li,div')?.textContent.slice(0,30);b?.click();await wait(500);q('.ov [data-ov]')?.click();await wait(500)}
 q('#fscroll .row[data-g="minor:ai_utilize"]').click();await wait(4000);
 out.before=document.querySelectorAll('#cscroll .row.post').length;
 q('[data-filter]').click();await wait(300);q('#filter').value='테스트';q('#filterf').requestSubmit();await wait(4000);
 const rows=[...document.querySelectorAll('#cscroll .row.post')];out.results=rows.length;out.first=rows.slice(0,3).map(n=>n.querySelector('.t').textContent);out.more=q('[data-more]')?.textContent;
 console.log('__YJ_SNAP__pum-search');await wait(1200);
 rows.find(n=>n.dataset.p==='187975').click();await wait(6000);
 const c=q('.pumc');out.card=c?c.innerText.slice(0,200):null;out.cardBox=c?[c.offsetWidth,c.offsetHeight]:null;
 console.log('__YJ_SNAP__pum-room');await wait(1200);
 document.documentElement.classList.add('dark');await wait(300);console.log('__YJ_SNAP__pum-dark');await wait(1200);document.documentElement.classList.remove('dark');
 q('[data-back]')?.click();await wait(500);q('[data-filter]').click();await wait(4000);out.afterClose=document.querySelectorAll('#cscroll .row.post').length;out.barGone=!q('#filter');
 return JSON.stringify(out)})()
