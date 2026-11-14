/* 확인용: 글쓰기 진행 창. 실제 글은 올리지 않고(제목을 비워 등록이 막히게 둠), 진행 창 그리는 부분만 화면에 넣어 모양과 글자를 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 document.querySelector('.row[data-g="normal:dcbest"]')?.click();await wait(1200);
 document.querySelector('[data-write]')?.click();await wait(300);
 const room=document.querySelector('#room');out.write=!!document.querySelector('#wtitle');
 out.roomPos=getComputedStyle(room).position;
 room.insertAdjacentHTML('beforeend','<div class="wprog" id="wprog"><div class="box"><i class="sp"></i><b>동영상 올리는 중 (1/2) · 72%</b><span class="pbar"><i style="width:72%"></i></span><small>디시에서 동영상을 처리하고 있습니다. 조금 더 걸립니다.</small></div></div>');
 const r=document.querySelector('#wprog').getBoundingClientRect(),b=document.querySelector('#wprog .box').getBoundingClientRect(),rr=room.getBoundingClientRect();
 out.cover=[Math.round(r.width),Math.round(r.height)]+' of room '+[Math.round(rr.width),Math.round(rr.height)];out.box=[Math.round(b.width),Math.round(b.height)]+'';
 /* 진행 신호가 숨은 디시 화면에서 앱 화면까지 오는지: 디시 목록 화면을 한 번 열어 신호만 보내 봅니다(글은 쓰지 않음). */
 const got=[];window.native.onProgress(j=>got.push(j));
 out.drive=await window.native.drive('https://m.dcinside.com/board/dcbest','(async()=>{console.log("__YJ_PROG__"+JSON.stringify({stage:"upload",i:1,n:1,video:true,pct:42}));await new Promise(r=>setTimeout(r,400));return {ok:1}})()',{timeout:20000});
 out.got=got;
 return JSON.stringify(out)})()
