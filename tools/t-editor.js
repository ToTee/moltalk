// 조사용(읽기만): 디시 모바일 글쓰기 화면의 본문 칸이 처음에 어떤 내용으로 시작하는지 봅니다.
(async()=>{
 const code=`(async()=>{await new Promise(r=>setTimeout(r,2500));const b=document.querySelector('.note-editable');return {html:b?b.innerHTML.slice(0,400):null,placeholder:(document.querySelector('.note-placeholder')||{}).outerHTML||null,textbox:(document.querySelector('#textbox')||{}).value}})()`;
 return JSON.stringify(await window.native.drive('https://m.dcinside.com/write/programming',code,{timeout:40000}),null,1);
})()
