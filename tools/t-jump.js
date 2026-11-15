/* 확인용: 채팅방의 이동 단추(맨 위로, 댓글 시작으로, 맨 마지막 댓글로)가 자리에 맞게 보이고 숨겨지며, 누르면 그 자리로 가는지 봅니다. 휴대폰 모양으로 찍습니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 window.dispatchEvent(new Event('resize'));await wait(1200);
 q('#fscroll .row[data-g="normal:programming"]')?.click()||q('#fscroll .row')?.click();await wait(4000);
 const rows=[...document.querySelectorAll('#cscroll .row.post')].filter(n=>!/2020/.test(n.textContent)).sort((a,b)=>Number((b.querySelector('.tx small')||{}).textContent||0)-Number((a.querySelector('.tx small')||{}).textContent||0));
 out.title=rows[0].textContent.slice(0,20);rows[0].click();await wait(6000);
 const sc=q('#rscroll'),st=()=>{const c=q('#cstart'),r=x=>{const b=x.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)]};
  return {top:Math.round(sc.scrollTop),max:sc.scrollHeight-sc.clientHeight,cstartY:c?Math.round(c.getBoundingClientRect().top-sc.getBoundingClientRect().top):null,shown:[...document.querySelectorAll('#jump button')].filter(b=>!b.hidden).map(b=>b.dataset.jump).join(','),box:r(q('#jump')),scr:r(sc),on:q('#jump').classList.contains('on')}};
 const snap=async n=>{console.log('__YJ_SNAP__jump-'+n);await wait(1200)};
 out.atTop=st();await snap('top');
 q('[data-jump="cm"]').click();await wait(1200);out.afterCm=st();await snap('cm');
 q('[data-jump="end"]').click();await wait(1200);out.afterEnd=st();await snap('end');
 q('[data-jump="top"]').click();await wait(1200);out.afterTop=st();
 await wait(2300);out.idleOn=q('#jump').classList.contains('on');
 document.documentElement.classList.add('dark');q('[data-jump="cm"]').click();await wait(1200);out.darkCm=st();await snap('dark');
 return JSON.stringify(out)})()
