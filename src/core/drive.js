// 디시 공식 모바일 화면 안에서 실행되는 조작 스크립트.
// 쓰기·삭제는 디시 화면이 직접 만드는 보안 값이 필요해서, 그 화면의 폼과 함수를 그대로 사용합니다.
// 각 함수는 공식 화면 안에서 따로 실행되므로 바깥 변수를 쓰지 않고, 인자 a와 도우미 h만 씁니다.

const M='https://m.dcinside.com';
export const mView=(g,no)=>M+'/'+(g.type==='mini'?'mini':'board')+'/'+g.id+'/'+no;
export const mList=g=>M+'/'+(g.type==='mini'?'mini':'board')+'/'+g.id;
export const mWrite=g=>M+'/'+(g.type==='mini'?'writemini':'write')+'/'+g.id;
export const mModify=(g,no)=>mWrite(g)+'/modify/'+no;
export const mGallog=(user,menu)=>M+'/gallog/'+encodeURIComponent(user)+(menu?'?menu='+menu:'');
export const LOGIN_URL='https://msign.dcinside.com/login?r_url='+encodeURIComponent(M+'/');
export const LOGIN_DONE=M+'/';

function helpers(){
 const alerts=[];
 window.alert=m=>{alerts.push(String(m))};window.confirm=()=>true;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(test,ms=10000)=>{const end=Date.now()+ms;for(;;){const v=test();if(v)return v;if(Date.now()>end)return null;await wait(150)}};
 // 공식 화면이 보내는 요청 중 주소가 pat에 맞는 것의 응답을 기다립니다.
 const ajax=(pat,ms=20000)=>new Promise(res=>{const t=setTimeout(()=>res(null),ms);window.jQuery(document).ajaxComplete((e,xhr,s)=>{if(!pat.test(s.url||''))return;clearTimeout(t);let j=null;try{j=xhr.responseJSON||JSON.parse(xhr.responseText)}catch{}res(j||{})})});
 const user=()=>(document.querySelector('#user_id')||{}).value||'';
 const done=r=>!r?{error:alerts.join(' ')||'디시에서 응답이 없습니다.'}:r.result===true||r.result===1||r.result==='1'||r.result==='success'?{ok:true}:r.cause==='captcha'?{need:'captcha'}:{error:String(r.cause||r.msg||alerts.join(' ')||'요청이 거절되었습니다.')};
 // 답글이면 그 댓글 아래에 공식 답글 폼을 열고, 아니면 기본 댓글 폼을 씁니다.
 const form=parentNo=>{
  if(!parentNo)return {form:document.querySelector('#comment_write'),memo:'#comment_memo',mode:'commentWrite',tmode:'txtconWrite'};
  const li=document.querySelector('#comment_box li.comment[no="'+parentNo+'"]');if(!li)return null;
  const idx=li.id.replace('comment_cnt_','');if(!document.querySelector('#comment_addDiv'+idx))window.comment_reple(idx);
  return {form:document.querySelector('#comment_write_reple'),memo:'#comment_memo_reple',mode:'commentReple',tmode:'txtconReple'};
 };
 // 숨겨진 공식 화면을 사용자에게 잠깐 보여 주거나 다시 숨깁니다(안드로이드는 YJD.show, 윈도우는 콘솔 신호).
 // 보여 줄 때는 디시 화면의 나머지를 모두 가리고 확인 상자(host)만 가운데에 남겨, 작은 팝업처럼 보이게 합니다.
 const reveal=(on,host)=>{
  let tip=document.querySelector('#yj-tip'),st=document.querySelector('#yj-human');
  if(on){
   if(!st){st=document.createElement('style');st.id='yj-human';st.textContent='html,body{background:#fff!important;overflow:hidden!important}body *{visibility:hidden!important}.yj-host,.yj-host *,#yj-tip{visibility:visible!important}.yj-host{position:fixed!important;left:0!important;right:0!important;top:56%!important;transform:translateY(-50%)!important;display:flex!important;justify-content:center!important;margin:0!important;z-index:2147483646!important}';document.head.appendChild(st)}
   if(host)host.classList.add('yj-host');
   if(!tip){tip=document.createElement('div');tip.id='yj-tip';tip.textContent='확인을 누르면 자동으로 등록됩니다.';tip.style.cssText='position:fixed;left:0;right:0;top:0;z-index:2147483647;color:#444;font-size:14px;line-height:1.4;padding:14px 14px 0;text-align:center';document.body.appendChild(tip)}
  }else{
   if(st)st.remove();if(tip)tip.remove();
   for(const n of document.querySelectorAll('.yj-host'))n.classList.remove('yj-host');
  }
  try{if(window.__yjShow)window.__yjShow(!!on)}catch(e){}
  console.log(on?'__YJ_SHOW__':'__YJ_HIDE__');
 };
 // 사람인지 확인(디시가 글·댓글 등록에 붙인 클라우드플레어 확인 상자). root 안에 확인 칸이 있으면 불러와서
 // 확인값이 생길 때까지 기다립니다. 대부분 자동으로 통과하고, 직접 눌러야 할 때만 화면을 보여 줍니다.
 const human=async root=>{
  const slot=root&&root.querySelector('#dc-turnstile, .dc-ts-slot'),ts=window.dcTs;
  if(!slot||!ts||typeof window.dcTsLoad!=='function')return true;
  if(!ts.focusAt)ts.focusAt=Date.now();
  window.dcTsLoad();window.dcTsUse(root);
  const token=()=>{try{return window.turnstile&&ts.id!==null&&window.turnstile.getResponse(ts.id)||''}catch(e){return ''}};
  await until(()=>token()||ts.state==='interactive'||ts.state==='error',20000);
  if(token())return true;
  reveal(true,ts.host||slot);
  const ok=await until(token,170000);reveal(false);
  return !!ok;
 };
 const HUMAN_FAIL={error:"'사람인지 확인'을 마치지 못해 등록하지 않았습니다. 다시 시도해 주세요."};
 return {alerts,wait,until,ajax,user,done,form,human,HUMAN_FAIL};
}

const SCRIPTS={
 // 로그인 상태 확인
 state(a,h){return {user:h.user()}},

 // 갤로그 목록 읽기. menu가 U면 방명록, 그 밖(게시글 G_all, 댓글 R_all, 스크랩 B)은 글로 가는 링크를 모읍니다.
 gallog(a,h){
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim(),items=[];
  if(a.menu==='U'){
   for(const li of document.querySelectorAll('.all-comment-lst li.comment'))items.push({name:clean((li.querySelector('.nick')||{}).textContent),text:clean((li.querySelector('.txt')||{}).textContent),date:clean((li.querySelector('.date')||{}).textContent)});
  }else{
   const seen=new Set();
   for(const link of document.querySelectorAll('.container a[href]')){
    const m=link.href.match(/m\.dcinside\.com\/(board|mini)\/([A-Za-z0-9_]+)\/(\d+)/);if(!m)continue;
    const key=m[2]+'/'+m[3]+'/'+clean(link.textContent).slice(0,40);if(seen.has(key))continue;seen.add(key);
    const row=link.closest('li')||link,parts=[...row.querySelectorAll('.tit,.subject,.txt,p,span,em')].map(n=>clean(n.textContent)).filter(Boolean);
    items.push({mini:m[1]==='mini',id:m[2],no:Number(m[3]),title:clean(link.textContent)||parts[0]||'',sub:clean(row.textContent).replace(clean(link.textContent),'').trim().slice(0,80)});
   }
  }
  return {items,note:items.length?'':clean((document.querySelector('.container')||document.body).textContent).slice(0,100)};
 },

 // 댓글·답글 쓰기
 async comment(a,h){
  if(!h.user())return {need:'login'};
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:a.parentNo?'답글을 달 댓글을 찾지 못했습니다.':'댓글을 쓸 수 없는 글입니다.'};
  if(f.form.querySelector('[id^="captcha_codeC"]'))return {need:'captcha'};
  f.form.querySelector(f.memo).value=a.text;
  if(!await h.human(f.form))return h.HUMAN_FAIL;
  const p=h.ajax(/\/ajax\/comment-write/);window.comment_write_ok(f.form);
  return h.done(await p);
 },

 // 사용할 수 있는 디시콘 목록 읽기
 async dcconList(a,h){
  if(!document.querySelector('#commentWrite'))return {error:'이 글에서는 디시콘을 쓸 수 없습니다.'};
  window.show_dccon('commentWrite');
  const box=document.querySelector('#dcconBoxComment');
  await h.until(()=>!box.querySelector('.dccon-loading'),12000);await h.wait(300);
  const items=[...box.querySelectorAll('.sm-img')].map(n=>{const img=n.querySelector('img');return {pkg:String(n.getAttribute('data-dccon-package')||''),detail:String(n.getAttribute('data-dccon-detail')||''),src:img?(img.getAttribute('data-src')||img.getAttribute('data-original')||img.src||''):'',alt:img?img.alt:''}}).filter(x=>x.pkg&&x.detail&&/^https:/.test(x.src));
  return {user:h.user(),items,double:!!document.querySelector('#dbl_con_chk'),note:items.length?'':(box.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)};
 },

 // 디시콘 1개 또는 2개(더블콘) 댓글로 등록
 async dccon(a,h){
  if(!h.user())return {need:'login'};
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:'디시콘을 달 곳을 찾지 못했습니다.'};
  window.show_dccon(f.mode);
  const box=await h.until(()=>{const b=document.querySelector(f.mode==='commentWrite'?'#dcconBoxComment':'#dcconBoxReple');return b&&!b.querySelector('.dccon-loading')?b:null},12000);
  if(!box)return {error:'디시콘 창을 열지 못했습니다.'};
  if(!await h.human(f.form))return h.HUMAN_FAIL;
  const p=h.ajax(/\/ajax\/comment-write/);
  if(a.items.length===2){const chk=document.querySelector('#dbl_con_chk');if(!chk)return {error:'이 화면에서는 더블콘을 쓸 수 없습니다.'};if(!chk.checked)chk.click()}
  for(const it of a.items){window.insertDccon({dcconPackage:it.pkg,dcconDetail:it.detail});await h.wait(400)}
  return h.done(await p);
 },

 // 글자콘 등록
 async txtcon(a,h){
  if(!h.user())return {need:'login'};
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:'글자콘을 달 곳을 찾지 못했습니다.'};
  const btn=f.form.querySelector('.add-txtdccon');if(!btn||getComputedStyle(btn).display==='none')return {error:'이 갤러리는 글자콘을 쓸 수 없습니다.'};
  window.show_txtcon(f.tmode);
  const memo=await h.until(()=>document.querySelector('#txtcon_memo'),5000);if(!memo)return {error:'글자콘 창을 열지 못했습니다.'};
  const pick=(list,c)=>{const b=document.querySelector(list+' [data-txtcon-color="'+c+'"]');if(b)b.click()};
  pick('#txtcon_bg_list',a.bg);pick('#txtcon_font_list',a.fg);
  memo.value=a.text;memo.dispatchEvent(new Event('input',{bubbles:true}));memo.dispatchEvent(new Event('keyup',{bubbles:true}));
  if(!await h.human(f.form))return h.HUMAN_FAIL;
  const p=h.ajax(/\/ajax\/comment-write/);window.insertTxtcon();
  return h.done(await p);
 },

 // 댓글 삭제(내 댓글, 또는 내 글에 달린 댓글)
 async delComment(a,h){
  if(!h.user())return {need:'login'};
  const li=document.querySelector('#comment_box li.comment[no="'+a.no+'"]');if(!li)return {error:'삭제할 댓글을 찾지 못했습니다.'};
  if(!li.querySelector('.comment-del'))return {error:'이 댓글을 삭제할 권한이 없습니다.'};
  const p=h.ajax(/\/del\/comment|comment-del|\/ajax\/comment_del/);
  window.comment_del(li.id.replace('comment_cnt_',''));
  const pw=document.querySelector('#pw_layer');
  if(pw&&getComputedStyle(pw).display==='block')return {error:'비회원 댓글은 비밀번호가 필요해 여기서 삭제할 수 없습니다.'};
  return h.done(await p);
 },

 // 글 삭제
 async delPost(a,h){
  if(!h.user())return {need:'login'};
  if(typeof window.boardDel_action!=='function')return {error:'삭제할 수 없는 글입니다.'};
  const p=h.ajax(/\/del\/board/);window.boardDel_action(1);
  return h.done(await p);
 },

 // 글쓰기: 글과 사진을 보낸 순서대로 본문에 넣고 등록합니다. 등록되면 화면이 글 목록으로 넘어갑니다.
 async write(a,h){
  if(!h.user())return {need:'login'};
  const subject=document.querySelector('#subject'),box=document.querySelector('#textbox');
  if(!subject||!box)return {error:'글쓰기 화면을 열지 못했습니다.'};
  subject.value=a.title;subject.dispatchEvent(new Event('input',{bubbles:true}));
  if(a.head!==''&&a.head!=null){const pick=document.querySelector('li.swiper-slide[data-no="'+a.head+'"] a');if(pick)pick.click();const hid=document.querySelector('#headtext');if(hid)hid.value=a.head}
  const media=()=>box.querySelectorAll('img,video,.block').length;
  for(const b of a.blocks){
   if(b.t==='text'){for(const line of b.v.split('\n')){const p=document.createElement('p');if(line)p.textContent=line;else p.appendChild(document.createElement('br'));box.appendChild(p)}continue}
   const bin=atob(b.b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
   const input=document.querySelector(b.t==='video'?'#upload_movie':'#upload');if(!input)return {error:'첨부 칸을 찾지 못했습니다.'};
   const dt=new DataTransfer();dt.items.add(new File([bytes],b.name,{type:b.type}));input.files=dt.files;
   const before=media();input.dispatchEvent(new Event('change',{bubbles:true}));
   if(!await h.until(()=>media()>before,b.t==='video'?240000:60000))return {error:(h.alerts.join(' ')||'첨부를 올리지 못했습니다')+': '+b.name};
   await h.wait(500);
  }
  box.dispatchEvent(new Event('input',{bubbles:true}));
  if(!await h.human(document.body))return h.HUMAN_FAIL;
  window.write_submit();
  await h.wait(20000);
  return {error:h.alerts.join(' ')||'등록 응답을 확인하지 못했습니다.'};
 }
};

// 공식 화면에서 실행할 코드 문자열을 만듭니다.
export function script(name,args={}){
 if(!SCRIPTS[name])throw Error('없는 조작입니다: '+name);
 return '(async()=>{const h=('+helpers.toString()+')();return await ('+SCRIPTS[name].toString().replace(/^(async\s+)?(\w+)\(/,'$1function(')+')('+JSON.stringify(args)+',h)})()';
}
