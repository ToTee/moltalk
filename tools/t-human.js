// 진단용: 앱이 실제로 쓰는 보조 창(요청 차단·휴대폰 모드 포함)에서 '사람인지 확인' 상자를 불러오기만 하고 상태를 봅니다.
// 아무것도 누르거나 등록하지 않습니다. 디시 모바일 글 화면을 한 번 엽니다.
(async()=>{
 const code=`(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const slot=document.querySelector('#dc-turnstile, .dc-ts-slot'),ts=window.dcTs;
  if(!slot||!ts||typeof window.dcTsLoad!=='function')return {note:'확인 상자 없음'};
  const root=slot.closest('form')||document.body;
  if(!ts.focusAt)ts.focusAt=Date.now();
  window.dcTsLoad();window.dcTsUse(root);
  const token=()=>{try{return window.turnstile&&ts.id!==null&&window.turnstile.getResponse(ts.id)||''}catch(e){return ''}};
  const seen=[],t0=Date.now();let shown=false;for(let i=0;i<36&&!token();i++){if(!shown&&ts.state==='interactive'){shown=true;console.log('__YJ_SHOW__')}if(seen[seen.length-1]!==ts.state)seen.push(ts.state+'@'+((Date.now()-t0)/1000).toFixed(1));await wait(500)}
  return {states:seen,final:ts.state,token:token().length,ua:navigator.userAgent.slice(0,40),plat:navigator.platform,keys:Object.keys(ts).join(',')};
 })()`;
 const r=await window.native.drive('https://m.dcinside.com/board/programming/2942913',code,{timeout:60000});
 return JSON.stringify(r,null,1);
})()
