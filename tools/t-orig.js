// 확인용(읽기만): 글 하나를 열어 오른쪽 위 메뉴 → 원본 모양으로 보기를 눌러 봅니다. 글 목록 1번, 글 1번, 댓글 1번을 읽습니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const g=[...document.querySelectorAll('.row[data-g]')].find(n=>/프로그래밍/.test(n.textContent));if(!g)return '갤러리 없음';
 g.click();
 const rows=()=>[...document.querySelectorAll('#cscroll .row.post[data-p]')];
 for(let i=0;i<30&&!rows().length;i++)await wait(500);
 if(!rows().length)return '목록 비어 있음';
 rows()[0].click();await wait(5000);
 out.moreGone=!document.querySelector('#room .more');
 const ln=[...document.querySelectorAll('#room .m .ln')].find(n=>!n.querySelector('.tm'));out.padNoTime=ln?getComputedStyle(ln).paddingRight:'해당 줄 없음';
 document.querySelector('#room [data-rmenu]').click();await wait(200);
 out.menu=[...document.querySelectorAll('#room .rpop button')].map(b=>b.textContent+(b.disabled?'(꺼짐)':''));
 document.querySelector('#room .rpop [data-orig]').click();await wait(1500);
 const o=document.querySelector('#room .oin');
 out.orig=o?{chars:o.textContent.length,styled:o.querySelectorAll('[style]').length,imgs:o.querySelectorAll('img').length,scripts:o.querySelectorAll('script,[onclick],[onerror],[class]:not(.embed),[id]').length,overflowX:o.scrollWidth>o.clientWidth,head:document.querySelector('#room .ohead').textContent}:'원본 화면 없음';
 if(window.__back){window.yjBack();await wait(200);out.afterBack=!!document.querySelector('#room .orig')}
 return JSON.stringify(out,null,1);
})()
