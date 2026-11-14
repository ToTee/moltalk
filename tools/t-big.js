/* 확인용: 동영상 크게 보기. 디시에 요청하지 않게, 화면에서 바로 만든 짧은 영상을 본문 영상과 같은 모양으로 넣고 단추를 눌러 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d');
 const rec=new MediaRecorder(c.captureStream(15),{mimeType:'video/webm'}),parts=[];rec.ondataavailable=e=>parts.push(e.data);rec.start();
 for(let i=0;i<20;i++){x.fillStyle='hsl('+i*18+',70%,50%)';x.fillRect(0,0,320,180);x.fillStyle='#fff';x.font='40px sans-serif';x.fillText('TEST '+i,90,100);await wait(70)}
 rec.stop();await new Promise(r=>rec.onstop=r);const url=URL.createObjectURL(new Blob(parts,{type:'video/webm'}));
 document.querySelector('#pane').insertAdjacentHTML('afterbegin','<span class="mvw" id="tmv"><video class="media mv" controls playsinline preload="metadata" src="'+url+'" data-page="https://gall.dcinside.com/"></video><button class="mvbig" data-mvbig aria-label="동영상 크게 보기">크게</button></span>');
 await wait(600);const small=document.querySelector('#tmv video'),btn=document.querySelector('#tmv .mvbig');
 out.small=[Math.round(small.getBoundingClientRect().width),Math.round(small.getBoundingClientRect().height)]+'';
 const br=btn.getBoundingClientRect(),sr=small.getBoundingClientRect();out.btnInside=br.right<=sr.right+1&&br.top>=sr.top-1;{const w=document.querySelector('#tmv'),cs=getComputedStyle(w),wr=w.getBoundingClientRect(),bs=getComputedStyle(btn);out.wrap=[wr.left,wr.right].map(Math.round)+' '+cs.display+' '+cs.position+' '+cs.width+' | btn '+bs.position+' '+bs.right+' '+bs.top}out.rects=[sr.left,sr.top,sr.right,br.left,br.top,br.right,br.width,br.height].map(Math.round)+'';
 btn.click();await wait(700);
 const v=document.querySelector('#viewer'),big=v.querySelector('video');
 out.open=!v.hidden;out.big=big?[Math.round(big.getBoundingClientRect().width),Math.round(big.getBoundingClientRect().height)]+' of window '+[innerWidth,innerHeight]:'none';out.bigReady=big?.readyState;
 big.click();await wait(100);out.staysOpenOnVideoClick=!v.hidden;
 if(window.__keepOpen)return JSON.stringify(out);
 v.querySelector('.vclose').click();await wait(100);out.closed=v.hidden&&!v.querySelector('video');
 return JSON.stringify(out)})()
