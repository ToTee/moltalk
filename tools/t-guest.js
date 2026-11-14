// 조사용(읽기만): 로그인하지 않은 상태에서 디시 모바일 화면의 댓글 칸·글쓰기 칸·디시콘 창이 어떻게 생겼는지 봅니다. 아무것도 등록하지 않습니다.
(async()=>{
 const inputs=`[...document.querySelectorAll(SEL)].map(n=>n.tagName.toLowerCase()+'#'+n.id+'[name='+n.getAttribute('name')+'][type='+(n.getAttribute('type')||'')+']'+(n.getAttribute('placeholder')?'{'+n.getAttribute('placeholder')+'}':'')+(getComputedStyle(n).display==='none'||n.type==='hidden'?'(숨김)':''))`;
 const view=`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const f=document.querySelector('#comment_write');
  const out={user:(document.querySelector('#user_id')||{}).value||'',form:!!f,inputs:f?${inputs.replace('document.querySelectorAll(SEL)',"f.querySelectorAll('input,textarea,select,img')")}:[],fns:['comment_write_ok','show_dccon','insertDccon','show_txtcon'].map(k=>k+':'+typeof window[k])};
  try{window.alert=m=>{(out.alerts=out.alerts||[]).push(String(m))};window.show_dccon('commentWrite');await wait(4000);const b=document.querySelector('#dcconBoxComment');out.dccon=b?{items:b.querySelectorAll('.sm-img').length,text:(b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,200),tabs:[...b.querySelectorAll('li,button')].slice(0,8).map(n=>(n.textContent||'').trim().slice(0,12))}:'창 없음'}catch(e){out.dcconErr=e.message}
  return out})()`;
 const write=`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(1500);
  return {url:location.href,user:(document.querySelector('#user_id')||{}).value||'',inputs:${inputs.replace('document.querySelectorAll(SEL)',"document.querySelectorAll('form input:not([type=hidden]),form textarea,form select,img[src*=captcha],img[id*=captcha],img[id*=kcaptcha]')")}.slice(0,40),fns:['write_submit'].map(k=>k+':'+typeof window[k]),editor:!!document.querySelector('.note-editable')}})()`;
 const a=await window.native.drive('https://m.dcinside.com/board/programming/2942913',view,{timeout:40000});
 const b=await window.native.drive('https://m.dcinside.com/write/programming',write,{timeout:40000});
 return JSON.stringify({view:a,write:b},null,1);
})()
