/* 확인용: 글 검색에서 글자를 쳐도 입력칸이 새로 만들어지지 않고(한글 조합이 끊기지 않게), 목록만 걸러지는지 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),rows=()=>document.querySelectorAll('#cscroll .row.post').length;
 q('#fscroll .row')?.click();await wait(3500);q('[data-filter]').click();await wait(300);
 const i=q('#filter'),all=rows(),word=(q('#cscroll .row.post:not(.pin) .t')||q('#cscroll .row.post .t')).textContent.trim().slice(0,2);
 const type=v=>{i.value=v;i.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}))};
 type(word[0]);await wait(200);const same1=q('#filter')===i,focus1=document.activeElement===i;
 type(word);await wait(200);const some=rows();
 type('없는글자열zzz');await wait(200);const none=rows();
 type('');await wait(200);
 return JSON.stringify({word,all,some,none,back:rows(),sameInput:same1&&q('#filter')===i,focus:focus1&&document.activeElement===i})})()
