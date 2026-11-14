/* 확인용: 설정 > 화면에서 '업데이트한 친구 숨기기'를 켜면 친구 화면의 그 묶음이 사라지고, 끄면 다시 나오는지 봅니다. 끝나면 원래대로 꺼 둡니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 await wait(2500);out.before=!!q('#fscroll .upd');
 const set=async on=>{q('[data-ov="set"]').click();await wait(400);q('[data-stab="화면"]').click();await wait(400);
  out['sum'+on]=undefined;const c=q('input[name="hideupd"]');out['was'+on]=c.checked;c.checked=on;q('#setf .save').click();await wait(400);
  out['saved'+on]=q('#setf [role="status"]')?.textContent;q('.bk[data-stab=""]').click();await wait(300);
  out['sum'+on]=q('[data-stab="화면"] .st')?.textContent;q('[data-ov="set"]').click();await wait(400);if(q('[data-stab="화면"]'))q('.ov [aria-label="닫기"]')?.click();await wait(400)};
 await set(true);out.hidden=!!q('#fscroll .upd');out.dots=document.querySelectorAll('#fscroll .row .dot').length;
 await set(false);out.after=!!q('#fscroll .upd');
 return JSON.stringify(out)})()
