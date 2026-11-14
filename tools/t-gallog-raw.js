// 확인용: 갤로그 게시글·댓글 화면이 실제로 무엇을 담고 있는지 그대로 읽어 봅니다(읽기만 합니다).
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),out={};
 q('[data-ov="set"]').click();await wait(300);q('[data-stab="계정"]').click();await wait(7000);
 const user=(q('#setf p').textContent.match(/로그인됨: (\S+)/)||[])[1];if(!user)return '로그인 안 됨';
 /* 갤로그 목록을 눌렀을 때 디시 화면이 어디로 가는지(스크립트의 해당 부분)를 찾아 봅니다. */
 const code='(async()=>{const out=[];const srcs=[...document.scripts].map(s=>s.src).filter(s=>/dcinside/.test(s));const texts=[...document.scripts].filter(s=>!s.src).map(s=>s.textContent);for(const s of srcs){try{texts.push(await (await fetch(s)).text())}catch(e){}}for(const t of texts){const re=/gall_code|list-direct/g;let m,last=-1e9;while((m=re.exec(t))&&out.length<8){if(m.index-last<600)continue;last=m.index;out.push(t.slice(Math.max(0,m.index-350),m.index+650).replace(/\\s+/g," "))}}return {n:srcs.length,out}})()';
 for(const menu of ['G_all']){out[menu]=await window.native.drive('https://m.dcinside.com/gallog/'+encodeURIComponent(user)+'?menu='+menu,code);await wait(1500)}
 return JSON.stringify(out,null,1);
})()
