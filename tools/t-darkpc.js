/* 확인용(다크 모드, t-guide.js에서 만든 것): 휴대폰 모양으로 각 화면을 찍고(tmp/snap-이름.png), 그 화면에 있는 단추들의 자리를 함께 적어 둡니다. 아무것도 등록하지 않습니다. */
(async()=>{document.documentElement.classList.add('dark');const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 document.querySelector('[data-view="chats"]')?.click();await wait(400);document.querySelector('[data-view="friends"]')?.click();await wait(1500);
 const rects=()=>[...document.querySelectorAll('button,input:not([type=file]),textarea,select,.me,.pinbar,.ann,.rhead .tt')].map(n=>{const b=n.getBoundingClientRect();
  if(b.width<4||b.height<4||b.bottom<0||b.top>innerHeight||b.right<0||b.left>innerWidth)return null;const top=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(!top||!(n.contains(top)||top.contains(n)))return null;
  return [(n.getAttribute('aria-label')||n.id||n.textContent.trim().slice(0,14)||n.className).replace(/\s+/g,' '),n.className.split(' ')[0],Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)].join('|')}).filter(Boolean);
 const snap=async name=>{await wait(500);out[name]=rects();console.log('__YJ_SNAP__dp-'+name);await wait(1200)};
 const click=s=>{const n=typeof s==='string'?document.querySelector(s):s;if(n)n.click();return !!n};
 out.size=[innerWidth,innerHeight,devicePixelRatio];
 await snap('friends');
 click('.row[data-g="normal:programming"]')||click('#fscroll .row');await wait(3500);
 await snap('chats');
 const post=[...document.querySelectorAll('#cscroll .row.post')].find(n=>/밥 먹습니다/.test(n.textContent))||document.querySelectorAll('#cscroll .row.post')[2];
 click(post);await wait(5000);
 await snap('room');
 click('[data-rmenu]');await wait(400);await snap('roommenu');click('[data-rmenu]');await wait(300);
 click('[data-cpanel]');for(let i=0;i<80&&!document.querySelector('.cons .con');i++)await wait(500);await wait(1500);
 await snap('cons');
 click('[data-cpanel]');await wait(300);click('[data-tpanel]');await wait(600);await snap('tcon');click('[data-tpanel]');await wait(300);
 click('[data-back]');await wait(500);click('[data-write]');await wait(600);
 const ta=document.querySelector('#wbody');if(ta){ta.value='첫 말풍선';ta.dispatchEvent(new Event('input',{bubbles:true}));click('#wform .send');await wait(400);click('[data-attach]');await wait(400)}
 await snap('write');
 click('[data-wcancel]');await wait(400);click('[data-view="friends"]');await wait(400);click('[data-ov="set"]');await wait(600);
 await snap('set');
 click('[data-stab="화면"]');await wait(500);await snap('set-view');click('.bk[data-stab=""]');await wait(300);click('[data-ov="noti"]');await wait(500);await snap('noti');
 return JSON.stringify(out)})()
