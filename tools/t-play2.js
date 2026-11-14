/* 확인용: 동영상 위 작은 재생 단추가 영상 한가운데에 오는지 잽니다. 채팅방 말풍선 자리와 같은 구조 안에 넣어 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const c=document.createElement('canvas');c.width=180;c.height=320;const x=c.getContext('2d');x.fillStyle='#2a6';x.fillRect(0,0,180,320);
 const poster=c.toDataURL('image/png');
 const room=document.querySelector('#room');room.className='room';document.querySelector('#app').classList.add('in-room');
 room.innerHTML='<div class="scroll" id="rscroll"><div class="msgs"><div class="m first"><div class="avc"></div><div class="col"><div class="nm">시험<i>(글쓴이)</i></div><div class="ln"><span class="mvw"><video class="media mv" playsinline preload="none" poster="'+poster+'" data-page="https://gall.dcinside.com/"></video><button class="mvplay" data-mvplay aria-label="동영상 재생"></button><button class="mvbig" data-mvbig aria-label="동영상 크게 보기">크게</button></span></div><div class="ln"><button class="ytb" data-yt="jNQXAC9IVRw" aria-label="유튜브 영상 재생"><img loading="lazy" src="https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg" alt=""><i></i></button></div></div></div></div></div>';
 await wait(800);const v=room.querySelector('video').getBoundingClientRect(),b=room.querySelector('.mvplay').getBoundingClientRect(),w=room.querySelector('.mvw').getBoundingClientRect();
 const r=o=>[o.left,o.top,o.width,o.height].map(Math.round)+'';
 out.video=r(v);out.wrap=r(w);out.btn=r(b);out.dx=Math.round((b.left+b.width/2)-(v.left+v.width/2));out.dy=Math.round((b.top+b.height/2)-(v.top+v.height/2));
 const cs=getComputedStyle(room.querySelector('.mvplay'));out.css=cs.position+' '+cs.left+' '+cs.top+' '+cs.transform+' '+cs.margin+' '+cs.display;
 return JSON.stringify(out)})()

