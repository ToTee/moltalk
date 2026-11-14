/* 소개글용 추가 촬영: 알림, 설정, 설정의 세부 화면 네 개를 휴대폰 모양으로 찍고 단추 자리를 적어 둡니다. 알림은 보기용 예시 두 줄을 화면에만 넣고 저장하지 않습니다. 아무것도 등록하지 않습니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 window.dispatchEvent(new Event('resize'));document.querySelector('[data-view="chats"]')?.click();await wait(400);document.querySelector('[data-view="friends"]')?.click();await wait(1500);
 const rects=()=>[...document.querySelectorAll('button,input:not([type=file]),textarea,select')].map(n=>{const b=n.getBoundingClientRect();
  if(b.width<4||b.height<4||b.bottom<0||b.top>innerHeight||b.right<0||b.left>innerWidth)return null;const top=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(!top||!(n.contains(top)||top.contains(n)))return null;
  return [(n.getAttribute('aria-label')||n.name||n.id||n.textContent.trim().slice(0,14)||n.className).replace(/\s+/g,' '),n.className.split(' ')[0],Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)].join('|')}).filter(Boolean);
 const snap=async name=>{await wait(500);out[name]=rects();console.log('__YJ_SNAP__'+name);await wait(1200)};
 const click=s=>{const n=typeof s==='string'?document.querySelector(s):s;if(n)n.click();return !!n};
 out.size=[innerWidth,innerHeight,devicePixelRatio];
 let keep=null;
 try{keep=D.notis.slice();D.notis.splice(0,D.notis.length,
  {g:'',no:0,title:'밥 먹습니다. 하루벌어 하루 먹고사는 하루살이 인생',who:'프갤러1',head:'프갤러1님이 댓글을 남겼습니다',text:'ㅋㅋㅋㅋ',read:false},
  {g:'',no:0,title:'액정만 다른 판매자한테 샀습니다.',who:'ㅇㅇ',head:'ㅇㅇ님이 답글을 남겼습니다',text:'어디서 사셨어요?',read:true});out.sample=true}catch(e){out.sample=String(e)}
 click('[data-ov="noti"]');await wait(600);await snap('noti');
 if(keep){try{D.notis.splice(0,D.notis.length,...keep)}catch(e){}}
 click('[data-ov="set"]');await wait(600);await snap('set');
 const names=['profile','rooms','account','info'];
 for(let i=0;i<4;i++){const rows=document.querySelectorAll('[data-stab]');click([...rows].filter(n=>n.dataset.stab)[i]);await wait(700);await snap('set-'+names[i]);click('.bk[data-stab=""]');await wait(400)}
 return JSON.stringify(out)})()
