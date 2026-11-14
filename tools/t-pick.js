/* 확인용: 글쓰기에서 사진을 고르면 내용이 앱 안으로 복사되어 말풍선에 쌓이는지 봅니다. 아무것도 등록하지 않습니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
 document.querySelector('#fscroll .row')?.click();await wait(3000);document.querySelector('[data-write]')?.click();await wait(600);
 const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));
 const dt=new DataTransfer();dt.items.add(new File([png],'a.png',{type:'image/png'}));dt.items.add(new File([png],'b.png',{type:'image/png'}));
 const i=document.querySelector('#pick');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await wait(800);
 const before=document.querySelectorAll('#wform img, .wpend img, form img').length;
 document.querySelector('#wform .send')?.click();await wait(500);
 const imgs=[...document.querySelectorAll('img')].filter(n=>n.src.startsWith('blob:'));
 const ok=await Promise.all(imgs.map(n=>fetch(n.src).then(r=>r.arrayBuffer()).then(b=>b.byteLength).catch(e=>String(e))));
 return JSON.stringify({before,blobImgs:imgs.length,sizes:ok,inputCleared:i.files.length})})()
