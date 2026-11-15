/* 확인용: 설정 > 화면에서 '다크 모드'를 켜면 화면에 dark 표시가 붙어 바탕색이 바뀌고 저장되며, 끄면 원래대로 돌아오는지 봅니다. 끝나면 꺼 둡니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 const st=()=>({cls:document.documentElement.classList.contains('dark'),bg:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.body).color,saved:!!JSON.parse(localStorage.getItem('moltalk-v1')||'{}').dark});
 await wait(1500);out.before=st();
 const set=async on=>{q('[data-ov="set"]').click();await wait(400);q('[data-stab="화면"]').click();await wait(400);
  q('input[name="dark"]').checked=on;q('#setf .save').click();await wait(400);q('.bk[data-stab=""]').click();await wait(300);
  out['sum'+on]=q('[data-stab="화면"] .st')?.textContent;q('.ov [aria-label="닫기"]')?.click();await wait(400)};
 await set(true);out.on=st();await set(false);out.off=st();
 return JSON.stringify(out)})()
