/* 확인용: 장식 광고 세 가지가 화면을 옮길 때마다 바뀌는지, 폰 카드에서 문구가 잘리지 않고 높이가 같은지, 개념글 단추가 '전체' 바로 오른쪽인지 봅니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const a=document.querySelector('#adpc');out.pc0=a.className+' | '+a.innerText.replace(/\n/g,' / ');
 document.querySelector('.row[data-g="normal:dcbest"]')?.click();await wait(1500);
 out.pc1=a.className+' | '+a.innerText.replace(/\n/g,' / ');
 out.chips=[...document.querySelectorAll('#chips .chip')].slice(0,4).map(n=>n.textContent.trim());
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 out.m=[];
 for(let i=0;i<3;i++){document.querySelector('[data-view="friends"]')?.click();await wait(200);
  const f=document.querySelector('#fscroll .adb');if(!f){out.m.push('none');break}
  out.m.push({cls:f.className,w:Math.round(f.getBoundingClientRect().width),h:Math.round(f.getBoundingClientRect().height),clipped:[...f.querySelectorAll('.tx b,.tx span')].map(n=>n.scrollWidth+'/'+n.clientWidth).concat([...f.querySelectorAll('.logo b,.logo i')].map(n=>'logo '+Math.round(n.getBoundingClientRect().width)+'/'+f.querySelector('.logo').clientWidth)),text:f.innerText.replace(/\n/g,' / ')});
  if(i<2){document.querySelector('[data-view="chats"]')?.click();await wait(200)}}
 return JSON.stringify(out,null,1)})()
