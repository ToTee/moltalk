// 확인용: 로그인하지 않은 상태에서 댓글을 보내면 닉네임·비밀번호를 묻는 창이 뜨는지 봅니다. 창에서 '취소'를 눌러 아무것도 등록하지 않습니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const g=[...document.querySelectorAll('.row[data-g]')].find(n=>/프로그래밍/.test(n.textContent));if(!g)return '갤러리 없음';
 g.click();for(let i=0;i<30&&!document.querySelector('#cscroll .row.post');i++)await wait(500);
 document.querySelector('#cscroll .row.post[data-p]').click();await wait(5000);
 const t=document.querySelector('#cform textarea');t.value='확인용 글자(등록하지 않음)';t.dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('#cform').requestSubmit();
 for(let i=0;i<40&&document.querySelector('#gask').hidden;i++)await wait(500);
 const box=document.querySelector('#gask');
 out.asked=!box.hidden;out.fields=[...box.querySelectorAll('input')].map(i=>i.name+':'+i.type);out.buttons=[...box.querySelectorAll('button')].map(b=>b.textContent);
 if(out.asked){box.querySelector('.gok').click();await wait(200);out.emptyError=box.querySelector('.gerr')?.textContent;box.querySelector('[data-gcancel]').click();await wait(1500)}
 out.closed=box.hidden;out.toast=document.querySelector('#toast').textContent;out.draftKept=document.querySelector('#cform textarea')?.value;
 out.savedGuest=JSON.parse(localStorage.getItem('moltalk-v1')).guest||null;
 return JSON.stringify(out,null,1);
})()
