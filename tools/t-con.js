// 확인용: 친구 목록에서 이름에 GAL이 들어간 갤러리를 열고, 제목에 POST가 들어간 글의 디시콘이 어떻게 읽히는지 봅니다(읽기만 합니다).
(async()=>{
 const GAL='블랙핑크',POST='지수 가사';
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s);
 const g=[...document.querySelectorAll('[data-g]')].find(n=>n.textContent.includes(GAL));if(!g)return '갤러리 없음: '+[...document.querySelectorAll('.row[data-g]')].map(n=>n.textContent.slice(0,12)).join(',');
 g.click();await wait(4000);
 const p=[...document.querySelectorAll('.row.post')].find(n=>n.textContent.includes(POST));if(!p)return '글 없음: '+[...document.querySelectorAll('.row.post')].slice(0,6).map(n=>n.textContent.slice(0,16)).join(' | ');
 p.click();await wait(6000);
 const out=[];
 for(const n of document.querySelectorAll('#room .dcon1')){
  const o={tag:n.tagName,src:n.currentSrc||n.src,w:n.naturalWidth||n.videoWidth||0,ready:n.readyState,err:n.error&&n.error.message};
  try{const r=await window.native.http(o.src,{});o.status=r.status;o.len=r.text.length;o.head=JSON.stringify(r.text.slice(0,16))}catch(e){o.httpErr=e.message}
  out.push(o);await wait(700);
 }
 return JSON.stringify(out,null,1);
})()
