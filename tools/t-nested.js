/* 확인용(YJ_DRYDRIVE=1 로 실행): 답글에 다시 답장하면 원래 댓글 번호와 @이름이 붙은 내용으로 보내려 하는지 봅니다. 실제로는 보내지 않습니다. 글은 최대 4개까지만 열어 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={tried:[]};
 q('#fscroll .row[data-g="normal:programming"]')?.click()||q('#fscroll .row')?.click();await wait(4000);
 const rows=[...document.querySelectorAll('#cscroll .row.post')].filter(n=>Number((n.querySelector('.tx small')||{}).textContent)>=4).slice(0,4);
 for(const row of rows){row.click();await wait(5000);
  const msgs=[...document.querySelectorAll('[data-lp="msg"]')],nested=msgs.find(n=>/에게 답장/.test(n.textContent));
  out.tried.push({title:row.textContent.slice(0,16),msgs:msgs.length,nested:!!nested});
  if(nested){out.cid=nested.dataset.cid;out.quote=nested.textContent.replace(/\s+/g,' ').slice(0,60);
   nested.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));await wait(400);
   const rb=q('[data-reply]');out.menu=!!rb;rb?.click();await wait(400);out.bar=(q('.replybar span')||{}).textContent;
   const ta=q('#cform textarea');ta.value='시험';ta.dispatchEvent(new Event('input',{bubbles:true}));q('#cform .send').click();await wait(1500);
   out.toast=(q('#toast,.toast')||{}).textContent||'';break}
  q('[data-back]')?.click();await wait(700)}
 return JSON.stringify(out)})()
