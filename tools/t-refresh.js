// 확인용: 새로고침 버튼·F5·당기기 동작이 걸리는지 봅니다. 디시 요청은 친구 목록 새로고침 한 번(등록한 갤러리 수만큼)만 일어납니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const btn=document.querySelector('#pane .head [data-refresh]');out.button=!!btn;out.ptr=!!document.querySelector('#ptr');
 /* 당기기: 맨 위에서 아래로 140픽셀 끌었다 놓습니다. */
 const s=document.querySelector('#fscroll'),tp=y=>new Touch({identifier:1,target:s,clientX:100,clientY:y});
 const fire=(n,y)=>s.dispatchEvent(new TouchEvent(n,{bubbles:true,touches:n==='touchend'?[]:[tp(y)],changedTouches:[tp(y)]}));
 fire('touchstart',100);fire('touchmove',170);fire('touchmove',240);out.pulling=document.querySelector('#ptr').style.transform;
 fire('touchend',240);await wait(100);out.afterPull={spin:document.querySelector('#ptr').classList.contains('spin'),toast:document.querySelector('#toast').hidden?'':document.querySelector('#toast').textContent};
 /* 3초 안의 두 번째 새로고침(F5)은 무시되어야 합니다. */
 document.querySelector('#toast').hidden=true;
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5',bubbles:true,cancelable:true}));await wait(100);out.f5WithinGuardIgnored=document.querySelector('#toast').hidden;
 await wait(3200);document.querySelector('#pane .head [data-refresh]').click();await wait(100);out.buttonAfterGuard=document.querySelector('#toast').hidden?'':document.querySelector('#toast').textContent;
 return JSON.stringify(out,null,1);
})()
