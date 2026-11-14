// 확인용: 스크롤 막대가 자리를 차지하지 않는지(폭 0) 봅니다.
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const g=[...document.querySelectorAll('.row[data-g]')].find(n=>/프로그래밍/.test(n.textContent));if(g){g.click();for(let i=0;i<30&&!document.querySelector('#cscroll .row.post');i++)await wait(500)}
 /* 글 목록에서 댓글이 가장 많은 글을 열어 채팅방의 막대를 봅니다. */
 const rows=[...document.querySelectorAll('#cscroll .row.post[data-p]')].filter(r=>!r.querySelector('.grid'));
 const best=rows.sort((a,b)=>(+b.querySelector('small')?.textContent||0)-(+a.querySelector('small')?.textContent||0))[0];
 if(best){best.click();await wait(6000)}
 const s=document.querySelector('#rscroll')||document.querySelector('#cscroll')||document.querySelector('#fscroll');s.scrollTop=300;
 return JSON.stringify({id:s.id,barWidth:s.offsetWidth-s.clientWidth,scrollable:s.scrollHeight>s.clientHeight,display:getComputedStyle(s,'::-webkit-scrollbar').display,width:getComputedStyle(s,'::-webkit-scrollbar').width,thumb:getComputedStyle(s,'::-webkit-scrollbar-thumb').backgroundColor,pcMedia:matchMedia('(pointer:fine),(pointer:none),(min-width:601px)').matches})})()
