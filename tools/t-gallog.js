// 확인용: 갤로그의 댓글·방명록 탭을 한 번씩 열어 무엇이 읽히는지 봅니다(읽기만 합니다).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 q('[data-ov="log"]').click();await wait(7000);
 const read=name=>{const rows=[...document.querySelectorAll('#pane .ov .scroll .row')];out[name]={count:rows.length,first:rows[0]?.textContent.slice(0,90)||q('#pane .ov .scroll').textContent.slice(0,70)}};
 read('게시글');
 [...document.querySelectorAll('#pane .logtabs .chip')].find(c=>c.textContent==='댓글').click();await wait(8000);read('댓글');
 /* 첫 줄을 눌러 글이 열리는지 봅니다(갤러리 번호를 주소로 바꾸는 요청 1번). */
 q('#pane .ov .scroll .row')?.click();await wait(9000);
 out.opened={inRoom:q('#app').classList.contains('in-room'),roomTitle:q('#room .rhead b')?.textContent||'',toast:q('#toast').hidden?'':q('#toast').textContent};
 return JSON.stringify(out,null,1);
})()
