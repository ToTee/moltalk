// 확인용: 갤러리 열기 → 말머리 탭 → 공지 펼치기 → 글 열기 → 설정 저장까지 차례로 눌러 봅니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 document.querySelector('[data-g="minor:singlebungle1472"]').click();await wait(3500);
 out.rows=document.querySelectorAll('#cscroll [data-p]').length;
 out.chips=[...document.querySelectorAll('#chips .chip')].map(c=>c.textContent).filter(Boolean);
 out.pinsFolded=document.querySelectorAll('#cscroll .av.grid').length;
 document.querySelector('.chip[data-pintog]').click();
 out.pinsOpen=document.querySelectorAll('#cscroll .av.grid').length;
 out.pinNames=[...document.querySelectorAll('#cscroll .row.post')].filter(r=>r.querySelector('.grid')).map(r=>r.querySelector('.t').textContent+' | '+r.querySelector('.pv').textContent);
 document.querySelectorAll('#chips .chip')[2].click();await wait(3000);
 out.headRows=document.querySelectorAll('#cscroll [data-p]').length;
 document.querySelector('[data-ov="set"]').click();document.querySelector('[data-stab="공지 채팅방 이름"]').click();
 const f=document.querySelector('#setf');f.elements.m0.value='custom';f.elements.t0.disabled=false;f.elements.t0.value='대학 동기 모임';f.requestSubmit();await wait(200);
 document.querySelector('[data-ov=""]').click();
 out.afterName=document.querySelector('#cscroll .row.post .t').textContent;
 const p=[...document.querySelectorAll('#cscroll [data-p]')].find(b=>!b.querySelector('.grid')&&+b.querySelector('small').textContent>2);p.click();await wait(5000);
 out.room={title:document.querySelector('.rhead b').textContent,bubbles:document.querySelectorAll('#rscroll .bub').length,imgs:document.querySelectorAll('#rscroll img').length,sys:[...document.querySelectorAll('#rscroll .sys')].map(s=>s.textContent)};
 return JSON.stringify(out,null,1);
})()
