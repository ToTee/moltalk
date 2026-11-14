// 확인용: 휴대폰 모양을 강제로 켜고, 스크롤 손잡이가 나타나는지와 잡고 끌면 목록이 움직이는지 봅니다(글 목록을 한 번 읽습니다).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 const g=[...document.querySelectorAll('.row[data-g]')].find(n=>n.getClientRects().length&&/프로그래밍/.test(n.textContent));if(!g)return '갤러리 없음';
 g.click();for(let i=0;i<30&&!document.querySelector('#cscroll .row.post');i++)await wait(500);
 const s=document.querySelector('#cscroll'),t=document.querySelector('#sthumb');
 t.style.transition='none';out.scrollable=s.scrollHeight>s.clientHeight;out.nativeBar=s.offsetWidth-s.clientWidth;
 s.scrollTop=40;await wait(200);
 const b=()=>{const r=t.getBoundingClientRect();return {on:t.classList.contains('on'),top:Math.round(r.top),h:Math.round(r.height),right:Math.round(innerWidth-r.right),opacity:getComputedStyle(t).opacity}};
 out.afterScroll=b();
 const ev=(n,y)=>t.dispatchEvent(new PointerEvent(n,{bubbles:true,cancelable:true,pointerId:1,pointerType:'touch',clientX:innerWidth-8,clientY:y}));
 const y0=out.afterScroll.top+10;t.setPointerCapture=()=>{};
 ev('pointerdown',y0);ev('pointermove',y0+200);await wait(100);out.draggedTo=Math.round(s.scrollTop);out.max=s.scrollHeight-s.clientHeight;out.duringDrag=b();
 ev('pointermove',y0+2000);await wait(100);out.atBottom=Math.round(s.scrollTop)>=out.max-1;
 ev('pointerup',y0+2000);await wait(4500);out.hiddenAfterIdle=!t.classList.contains('on');
 return JSON.stringify(out,null,1);
})()
