/* 확인용: 유튜브 재생. 본문에 들어가는 것과 같은 미리 보기 단추를 화면에 넣고, 눌러서 재생기가 뜨는지와 [크게]가 창을 채우는지 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={},id='jNQXAC9IVRw';
 document.querySelector('#pane').insertAdjacentHTML('afterbegin','<div id="tyt"><button class="ytb" data-yt="'+id+'" aria-label="유튜브 영상 재생"><img loading="lazy" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt=""><i>▶</i></button></div>');
 await wait(1500);const b=document.querySelector('#tyt .ytb'),im=b.querySelector('img');
 out.thumb=[Math.round(b.getBoundingClientRect().width),Math.round(b.getBoundingClientRect().height)]+' img '+im.naturalWidth;
 b.click();await wait(300);const f=document.querySelector('#tyt iframe');
 out.inline=f?[Math.round(f.getBoundingClientRect().width),Math.round(f.getBoundingClientRect().height)]+' '+f.src:'none';
 if(window.__ytInline){await wait(6000);return JSON.stringify(out)}
 document.querySelector('#tyt [data-ytbig]').click();await wait(300);
 const v=document.querySelector('#viewer'),bf=v.querySelector('iframe');
 out.big=bf?[Math.round(bf.getBoundingClientRect().width),Math.round(bf.getBoundingClientRect().height)]+' of '+[innerWidth,innerHeight]:'none';
 out.inlineBack=!!document.querySelector('#tyt .ytb')&&!document.querySelector('#tyt iframe');
 await wait(7000);
 return JSON.stringify(out)})()
