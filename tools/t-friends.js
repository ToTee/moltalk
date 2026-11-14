// 확인용: 친구 화면에서 사람 이름 바꾸기를 켜고 상태를 돌려줍니다.
(async()=>{
 const before=[...document.querySelectorAll('#fscroll .row b')].map(b=>b.textContent+' / '+(b.nextElementSibling?.textContent||''));
 document.querySelector('[data-alias]').click();
 const after=[...document.querySelectorAll('#fscroll .row b')].map(b=>b.textContent+' / '+(b.nextElementSibling?.textContent||''));
 return JSON.stringify({before,after});
})()
