// 확인용(읽기만): 계정 상태 확인, 채팅방의 디시콘 창과 글자콘 창, 글쓰기 화면 열기. 실제 등록은 하지 않습니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 document.querySelector('[data-ov="set"]').click();document.querySelector('[data-stab="계정"]').click();await wait(9000);
 out.account=document.querySelector('#setf p').textContent;
 document.querySelector('[data-ov=""]').click();
 document.querySelector('[data-g="minor:singlebungle1472"]').click();
 const rows=()=>[...document.querySelectorAll('#cscroll [data-p]')].filter(b=>!b.querySelector('.grid'));
 for(let i=0;i<30&&!rows().length;i++)await wait(500);
 if(!rows().length)return '목록이 비어 있음: '+document.querySelector('#pane').textContent.slice(0,200);
 rows()[0].click();await wait(4000);
 document.querySelector('[data-cpanel]').click();await wait(14000);
 out.cons=document.querySelectorAll('#room .con').length;out.consNote=document.querySelector('#room .cpanel')?.textContent.slice(0,120);
 document.querySelector('[data-tpanel]').click();await wait(300);
 const t=document.querySelector('#tcin');t.value='ㅋㅋ';t.dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('[data-tbg="d2f0e6"]').click();
 out.txtcon={text:document.querySelector('#tcprev').textContent,style:document.querySelector('#tcprev').getAttribute('style'),swatches:document.querySelectorAll('#room .sw').length};
 document.querySelector('[data-back]').click();
 document.querySelector('[data-write]').click();await wait(300);
 const title=document.querySelector('#wtitle');title.value='시험 제목';title.dispatchEvent(new Event('input',{bubbles:true}));
 const body=document.querySelector('#wbody');body.value='첫 줄\n둘째 줄';body.dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('#wform').requestSubmit();document.querySelector('#wform').requestSubmit();
 const b2=document.querySelector('#wbody');b2.value='이어 쓴 글';b2.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#wform').requestSubmit();
 out.write={heads:document.querySelectorAll('#whead option').length,bubbles:[...document.querySelectorAll('#wscroll .bub')].map(b=>b.textContent)};
 return JSON.stringify(out,null,1);
})()
