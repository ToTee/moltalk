// 확인용(디시에 글 목록 요청을 새로 보내지 않는 부분만): 설정, 알림, 갤로그 창, 계정 상태, 글쓰기 화면의 말풍선 합치기.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const q=s=>document.querySelector(s);
 q('[data-ov="noti"]').click();out.noti=q('#pane .ov .empty')?.textContent;q('[data-ov=""]').click();
 q('[data-ov="log"]').click();await wait(9000);out.gallog=q('#pane .ov .scroll').textContent.slice(0,60);out.gallogTabs=[...document.querySelectorAll('#pane .logtabs .chip')].map(c=>c.textContent);q('[data-ov=""]').click();
 q('[data-ov="set"]').click();out.settings=[...document.querySelectorAll('#pane .setlist b')].map(b=>b.textContent+' = '+b.nextElementSibling.textContent);
 q('[data-stab="계정"]').click();await wait(300);out.account=[...document.querySelectorAll('#setf p')][0].textContent;q('[data-ov=""]').click();
 return JSON.stringify(out,null,1);
})()
