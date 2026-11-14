// 확인용: 사진 고르기 창 대신 직접 그린 그림을 넣어, 내 프로필 사진과 갤러리 프로필 사진이 들어가고 지워지는지 봅니다(디시 요청 없음).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 const q=s=>{const n=document.querySelector(s);if(!n)throw Error('없음: '+s+' / 지금까지 '+JSON.stringify(out));return n};
 const orig=document.createElement.bind(document);
 document.createElement=t=>{const el=orig(t);if(t==='input')el.click=()=>{const c=orig('canvas');c.width=300;c.height=200;const x=c.getContext('2d');x.fillStyle='#d33';x.fillRect(0,0,300,200);c.toBlob(b=>{Object.defineProperty(el,'files',{value:[new File([b],'t.png',{type:'image/png'})]});el.onchange()})};return el};
 if(!q('[data-ov="set"]'))return '메뉴 없음: rail='+q('#rail').innerHTML.length+' pane='+q('#pane').textContent.slice(0,120);
 q('[data-ov="set"]').click();await wait(200);
 if(!q('[data-stab="프로필"]'))return '설정 목록 없음: '+q('#pane').textContent.slice(0,200);
 q('[data-stab="프로필"]').click();await wait(200);
 if(!q('[data-mephoto]'))return '프로필 설정 화면: '+q('#pane').textContent.slice(0,200);
 q('[data-mephoto]').click();await wait(2500);out.toast=document.querySelector('#toast').hidden?'':document.querySelector('#toast').textContent;out.photoset=document.querySelector('.photoset')?.innerHTML.slice(0,160);
 const me=q('.photoset .av img');out.me=me.src.slice(0,23)+' '+me.naturalWidth+'x'+me.naturalHeight;
 q('[data-ov=""]').click();await wait(200);out.meOnFriends=!!document.querySelector('.me .av img');
 const row=q('.row[data-g]');row.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));await wait(300);
 out.menu=[...document.querySelectorAll('#pane .ov .row b')].map(b=>b.textContent);
 q('[data-gphoto]').click();await wait(2500);out.galPhoto=!!document.querySelector('.row[data-g] .av img');
 /* 원래대로 되돌립니다. */
 q('.row[data-g]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));await wait(300);out.menuAfter=[...document.querySelectorAll('#pane .ov .row b')].map(b=>b.textContent);
 q('[data-gphotodel]').click();await wait(300);out.galPhotoAfterDelete=!!document.querySelector('.row[data-g] .av img');
 q('[data-ov="set"]').click();await wait(200);q('[data-stab="프로필"]').click();await wait(200);q('[data-mephotodel]').click();await wait(300);out.meAfterDelete=!!document.querySelector('.photoset .av img');
 return JSON.stringify(out,null,1);
})()
