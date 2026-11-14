// 확인용: 갤로그의 스크랩 탭을 한 번 열어 무엇이 읽히는지 봅니다(읽기만 합니다).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s);
 q('[data-ov="log"]').click();await wait(7000);
 [...document.querySelectorAll('#pane .logtabs .chip')].find(c=>c.textContent==='스크랩').click();await wait(8000);
 const rows=[...document.querySelectorAll('#pane .ov .scroll .row')];
 return JSON.stringify({count:rows.length,first:rows.slice(0,3).map(r=>r.textContent.slice(0,80)),empty:rows.length?'':q('#pane .ov .scroll').textContent.slice(0,80)},null,1);
})()
