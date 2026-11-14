// 조사용(읽기만): 디시 PC 화면(gall.dcinside.com)의 댓글 칸과 '사람인지 확인' 구성이 어떻게 되어 있는지 봅니다.
// 브라우저는 꾸미지 않은 실제 정보(윈도우, 실제 엔진 버전)로 알립니다. 아무것도 누르거나 등록하지 않습니다.
const {app,BrowserWindow}=require('electron');
app.commandLine.appendSwitch('disable-gpu-compositing');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+process.versions.chrome.split('.')[0]+'.0.0.0 Safari/537.36';
if(process.env.P_ONEUA)app.userAgentFallback=UA;
setTimeout(()=>{console.log('TIMEOUT');app.exit(0)},150000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1100,height:800,show:!!process.env.P_SHOW,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 /* P_ONEUA=1: 창뿐 아니라 앱 전체가 같은 브라우저 이름을 쓰게 합니다(보조 작업·워커 포함). */
 if(!process.env.P_ONEUA)w.webContents.setUserAgent(UA);
 if(process.env.P_SHOW){w.setAlwaysOnTop(true);w.center();w.setTitle('양지톡 시험 창');w.show();w.focus();w.flashFrame(true)}
 const t0=Date.now(),logs=[];w.webContents.on('console-message',e=>{const s=String(e.message||'');if(/turnstile|cloudflare/i.test(s))logs.push(((Date.now()-t0)/1000).toFixed(1)+'s '+s.slice(0,100))});
 await w.loadURL(process.env.P_URL).catch(e=>logs.push('load: '+e.message));
 const out=await w.webContents.executeJavaScript(`(async()=>{window.__ask=${process.env.P_SHOW?1:0};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(1500);
  const desc=n=>n.tagName.toLowerCase()+'#'+n.id+'.'+String(n.className).split(' ')[0]+'[name='+n.getAttribute('name')+']'+(n.getAttribute('placeholder')?'{'+n.getAttribute('placeholder')+'}':'');
  const box=document.querySelector('.cmt_write_box');
  const out={url:location.href,box:!!box,inputs:box?[...box.querySelectorAll('input:not([type=hidden]),textarea,button,img')].map(desc).slice(0,30):[],
   globals:Object.keys(window).filter(k=>/turnstile|dcTs|Ts$|captcha/i.test(k)).slice(0,30),
   slots:[...document.querySelectorAll('[id*=turnstile],[class*=turnstile],[class*="ts-slot"],[id*=captcha],[class*=captcha]')].map(desc).slice(0,20),
   scripts:[...document.scripts].map(s=>s.src).filter(s=>/turnstile|cloudflare|captcha|comment/i.test(s)).slice(0,10)};
  if(typeof ts_cmt_touch==='function'&&box){
   /* PC 화면: 댓글 칸을 건드리면 확인 상자를 불러옵니다. 확인값이 저절로 생기는지만 봅니다. */
   const ta=box.querySelector('textarea');try{ts_cmt_touch.call(ta)}catch(e){out.touchErr=e.message}
   const tok=()=>{try{return window.turnstile&&ts_cmt.id!==null&&turnstile.getResponse(ts_cmt.id)||''}catch(e){return ''}};
   if(window.__ask){const tip=document.createElement('div');tip.textContent='양지톡 시험용 창입니다. 아래 댓글 칸의 [사람인지 확인] 상자를 한 번만 눌러 주세요. 아무것도 등록되지 않고, 누르면 잠시 뒤 창이 저절로 닫힙니다.';tip.style.cssText='position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#fee500;color:#111;font:700 15px/1.5 sans-serif;padding:12px 16px;text-align:center';document.body.appendChild(tip);box.scrollIntoView({block:'center'})}
   const seen=[],s0=Date.now(),lim=window.__ask?200:40;let endAt=0,last=null;for(let i=0;i<lim;i++){const s=String(ts_cmt.st)+(ts_cmt.ix?'+clicked':'');if(last!==s){last=s;seen.push(s+'@'+((Date.now()-s0)/1000).toFixed(0))}if(tok()&&!endAt)endAt=i+2;if(/error|fail/i.test(s)&&!endAt)endAt=i+6;if(endAt&&i>=endAt)break;await wait(500)}
   out.pc={states:seen,final:String(ts_cmt.st),token:tok().length,took:((Date.now()-s0)/1000).toFixed(1),keys:Object.keys(ts_cmt).join(','),iframe:!!box.querySelector('iframe')};
  }
  const ts=window.dcTs;
  if(ts&&typeof window.dcTsLoad==='function'){
   const slot=document.querySelector('#dc-turnstile, .dc-ts-slot');out.tsKeys=Object.keys(ts).join(',');out.slot=slot?desc(slot):null;
   try{if(!ts.focusAt)ts.focusAt=Date.now();window.dcTsLoad();if(typeof window.dcTsUse==='function')window.dcTsUse(box||document.body)}catch(e){out.loadErr=e.message}
   const token=()=>{try{return window.turnstile&&ts.id!==null&&window.turnstile.getResponse(ts.id)||''}catch(e){return ''}};
   const seen=[],s0=Date.now();for(let i=0;i<40&&!token();i++){if(seen[seen.length-1]!==ts.state)seen.push(ts.state);await wait(500)}
   out.states=seen;out.final=ts.state;out.token=token().length;out.took=((Date.now()-s0)/1000).toFixed(1);
  }
  return out})()`,true).catch(e=>({error:e.message}));
 console.log(JSON.stringify({out,logs:logs.filter(x=>!/data:,/.test(x)).slice(0,10)},null,1));app.quit();
});
