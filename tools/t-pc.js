// 확인용: PC 왼쪽 메뉴에 어떤 버튼이 보이는지와, ··· 버튼이 사람 이름 바꾸기를 켜고 끄는지 봅니다(디시 요청 없음).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const shown=()=>[...document.querySelectorAll('#rail .ic')].filter(n=>n.getClientRects().length).map(n=>n.getAttribute('aria-label')+(n.classList.contains('on')?'(켜짐)':''));
 const names=()=>[...document.querySelectorAll('.row[data-g] b')].slice(0,3).map(n=>n.textContent);
 const out={before:shown(),namesBefore:names()};
 document.querySelector('#rail .deco').click();await wait(300);out.afterOn=shown();out.namesOn=names();
 document.querySelector('#rail .deco').click();await wait(300);out.namesOff=names();
 return JSON.stringify(out,null,1);
})()
