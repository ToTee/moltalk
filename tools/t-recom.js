// 조사용(읽기만): 추천 단추를 눌렀을 때 디시 화면이 어떤 요청을 보내고 응답을 어떻게 다루는지 스크립트 본문에서 찾습니다. 누르지 않습니다.
(async()=>{
 const code=`(async()=>{const out={srcs:[...document.scripts].map(s=>s.src).filter(Boolean).filter(s=>/dcinside/.test(s)).slice(0,30),hits:[]};
  const grab=t=>{let i=0;while((i=t.indexOf('recommend_join',i))>=0&&out.hits.length<4){out.hits.push(t.slice(Math.max(0,i-80),i+900).replace(/\\s+/g,' '));i+=900}};
  for(const s of document.scripts)if(!s.src)grab(s.textContent);
  for(const u of out.srcs){if(out.hits.length>=3)break;try{const t=await (await fetch(u)).text();if(t.includes('recommend_join')){out.from=u;grab(t)}}catch(e){}}
  return out})()`;
 return JSON.stringify(await window.native.drive('https://m.dcinside.com/board/programming/2942913',code,{timeout:60000}),null,1);
})()