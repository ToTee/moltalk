/* 확인용: 설정 > 화면에서 '공지 숨기기'를 켜면 글 목록의 공지 줄과 공지 펼치기 단추가 사라지고, 끄면 다시 나오는지 봅니다. 끝나면 원래대로 꺼 둡니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 const st=()=>({pins:document.querySelectorAll('#cscroll .row.post .pin, #cscroll .row.post svg.pin').length,pinRows:[...document.querySelectorAll('#cscroll .row.post')].filter(n=>/2020|공지|이용 안내/.test(n.textContent)).length,rows:document.querySelectorAll('#cscroll .row.post').length,chip:!!q('#chips [data-pintog]'),tabs:[...document.querySelectorAll('#chips .chip')].map(n=>n.textContent).join(',')});
 q('#fscroll .row[data-g="normal:programming"]')?.click()||q('#fscroll .row')?.click();await wait(3500);out.before=st();
 const set=async on=>{q('[data-ov="set"]').click();await wait(400);q('[data-stab="화면"]').click();await wait(400);
  q('input[name="hidenotice"]').checked=on;q('#setf .save').click();await wait(400);q('.bk[data-stab=""]').click();await wait(300);
  out['sum'+on]=q('[data-stab="화면"] .st')?.textContent;q('.ov [aria-label="닫기"]')?.click();await wait(400)};
 await set(true);out.hidden=st();await set(false);out.after=st();
 return JSON.stringify(out)})()
