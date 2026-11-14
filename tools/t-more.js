// 확인용: 글 목록이 20개로 시작하고, 스크롤하면 10개씩 늘며, 미리보기 줄이 본문으로 채워지는지 봅니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const rows=()=>[...document.querySelectorAll('#cscroll .row.post')].filter(r=>!r.querySelector('.grid'));
 document.querySelector('[data-g="minor:singlebungle1472"]').click();await wait(9000);
 out.first=rows().length;
 out.previews=rows().slice(0,6).map(r=>r.querySelector('.t').textContent.slice(0,14)+' => '+r.querySelector('.pv').textContent.slice(0,30));
 const sc=document.querySelector('#cscroll');sc.scrollTop=sc.scrollHeight;await wait(1500);
 out.afterScroll1=rows().length;
 const s2=document.querySelector('#cscroll');s2.scrollTop=s2.scrollHeight;await wait(1500);
 out.afterScroll2=rows().length;
 return JSON.stringify(out,null,1);
})()
