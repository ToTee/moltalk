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
 // 로그인하지 않았으면(유동) 닉네임과 비밀번호 칸을 채웁니다. 문제가 없으면 null, 있으면 돌려줄 결과를 냅니다.
 const guest=(a,root,nickSel,pwSel)=>{
  if(user())return null;
  const n=root.querySelector(nickSel),p=root.querySelector(pwSel);
  if(!n||!p)return {error:'이 갤러리는 로그인해야 쓸 수 있습니다.'};
  const g=a.guest;if(!g||!g.nick||!g.pw)return {need:'guest'};
  n.value=g.nick;p.value=g.pw;for(const x of [n,p]){x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}))}
  return null;
 };
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
   if(!st){st=document.createElement('style');st.id='yj-human';st.textContent='html,body{background:#fff!important;overflow:hidden!important}body *{visibility:hidden!important}.yj-host,.yj-host *,#yj-tip,#yj-tip *{visibility:visible!important}.yj-host{position:fixed!important;left:0!important;right:0!important;top:56%!important;transform:translateY(-50%)!important;display:flex!important;justify-content:center!important;margin:0!important;z-index:2147483646!important}';document.head.appendChild(st)}
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
  /* 디시 화면은 확인값이 없어도 등록 요청을 보내고(확인 상태만 함께 알림), 받아 줄지는 디시 서버가 정합니다.
     그래서 확인이 오류로 끝났을 때는 여기서 막지 않고 디시 화면과 똑같이 등록을 진행합니다. 직접 눌러야 할 때만 창을 보여 주고 기다립니다. */
  if(token()||ts.state!=='interactive')return true;
  reveal(true,ts.host||slot);
  const ok=await until(()=>token()||ts.state!=='interactive',170000);reveal(false);
  return !!ok;
 };
 // 보안 문자(그림 속 글자 입력). 댓글 폼에 입력 칸이 있으면 그림과 입력 칸만 작은 창으로 보여 주고, 사용자가 글자를 넣고 확인을 누를 때까지 기다립니다.
 // 돌려주는 값: true(칸이 없거나 입력을 마침), false(입력하지 않음), null(그림을 찾지 못함: 예전처럼 디시 화면을 엽니다).
 const captcha=async(root,sel='[id^="captcha_codeC"]')=>{
  const inp=root.querySelector(sel);if(!inp)return true;
  let host=inp.parentElement;while(host&&host!==root&&!host.querySelector('img'))host=host.parentElement;
  if(!host||host===root||host===document.body||!host.querySelector('img'))return null;
  reveal(true,host);
  const tip=document.querySelector('#yj-tip');let ok=false;
  if(tip){tip.textContent='그림의 글자를 아래 칸에 입력하고 확인을 누르면 등록됩니다.';const b=document.createElement('button');b.type='button';b.textContent='확인';b.style.cssText='display:block;margin:10px auto 0;padding:8px 28px;border:0;border-radius:4px;background:#fee500;color:#111;font-size:15px;font-weight:700';b.onclick=()=>{ok=true};tip.appendChild(b)}
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ok=true}});
  try{inp.focus()}catch(e){}
  await until(()=>ok&&inp.value.trim(),170000);reveal(false);
  return !!inp.value.trim()&&ok;
 };
 const CAP_FAIL={error:'보안 문자를 입력하지 않아 등록하지 않았습니다.'};
 const HUMAN_FAIL={error:"'사람인지 확인'을 마치지 못해 등록하지 않았습니다. 다시 시도해 주세요."};
 // 오래 걸리는 작업(사진·동영상 올리기)의 진행 상황을 앱 화면에 알립니다(안드로이드는 YJD.progress, 윈도우는 콘솔 신호).
 const prog=o=>{const s=JSON.stringify(o);try{if(window.__yjProg)window.__yjProg(s)}catch(e){}console.log('__YJ_PROG__'+s)};
 return {alerts,wait,until,ajax,user,guest,done,form,human,captcha,CAP_FAIL,HUMAN_FAIL,prog};
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
   /* 게시글·댓글 목록: 줄마다 갤러리 번호(gall_code)와 글 번호만 있고, 갤러리 주소는 누를 때 디시가 따로 알려 줍니다. */
   for(const li of document.querySelectorAll('.gall-detail-lst li[gall_code][gall_no]')){
    const type=li.getAttribute('gall_type')||'',body=li.querySelector('.fxo-txt'),num=clean((li.querySelector('.num')||{}).textContent),orig=clean((li.querySelector('.original-tit')||{}).textContent);
    const title=clean(body&&body.textContent)||(body&&body.querySelector('img,video')?'(디시콘)':'')||orig;
    items.push({code:li.getAttribute('gall_code'),no:Number(li.getAttribute('gall_no')),type,mini:/^[NISX]$/.test(type),person:/^[PLQ]$/.test(type),orig,title:title+(num?' '+num:''),
     sub:[...li.querySelectorAll('.ginfo li')].map(n=>clean(n.textContent)).filter(Boolean).concat(orig&&orig!==title?['원글: '+orig]:[]).join(' · ').slice(0,90)});
   }
   /* 스크랩 가운데 주소 대신 moveScrapView(갤러리 번호, 글 번호, 종류)로 되어 있는 줄 */
   for(const link of document.querySelectorAll('.container a[href^="javascript:moveScrapView"]')){
    const m=link.getAttribute('href').match(/moveScrapView\((\d+),\s*(\d+),\s*'(\w+)'/);if(!m)continue;
    items.push({code:m[1],no:Number(m[2]),type:m[3],mini:/^[NISX]$/.test(m[3]),person:/^[PLQ]$/.test(m[3]),title:clean((link.querySelector('.fxo-txt')||link).textContent),sub:[...link.querySelectorAll('.ginfo li')].map(n=>clean(n.textContent)).filter(Boolean).join(' · ').slice(0,90)});
   }
   for(const link of document.querySelectorAll('.container a[href]')){
    const m=link.href.match(/m\.dcinside\.com\/(board|mini)\/([A-Za-z0-9_]+)\/(\d+)/);if(!m)continue;
    const key=m[2]+'/'+m[3]+'/'+clean(link.textContent).slice(0,40);if(seen.has(key))continue;seen.add(key);
    const row=link.closest('li')||link,parts=[...row.querySelectorAll('.tit,.subject,.txt,p,span,em')].map(n=>clean(n.textContent)).filter(Boolean);
    items.push({mini:m[1]==='mini',id:m[2],no:Number(m[3]),title:clean(link.textContent)||parts[0]||'',sub:clean(row.textContent).replace(clean(link.textContent),'').trim().slice(0,80)});
   }
  }
  return {items,note:items.length?'':clean((document.querySelector('.container')||document.body).textContent).slice(0,100)};
 },

 // 갤로그 목록의 갤러리 번호를 갤러리 주소(id)로 바꿉니다. 디시 화면이 줄을 눌렀을 때 쓰는 것과 같은 요청입니다.
 async gallId(a,h){
  const $=window.jQuery,r=await new Promise(res=>{const t=setTimeout(()=>res(null),15000);$.ajax({type:'post',url:'/gallog/list-direct',headers:{'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content')},data:{gall_code:a.code,gall_type:a.type},success:v=>{clearTimeout(t);res(v)},error:()=>{clearTimeout(t);res(null)}})});
  return r&&r.gall_id?{id:String(r.gall_id)}:{error:'글이 있는 갤러리를 찾지 못했습니다.'};
 },

 // 추천·비추천: 디시 화면의 단추를 그대로 누릅니다(로그인하지 않아도 됩니다).
 async recommend(a,h){
  const btn=document.querySelector(a.down?'#nonrecommend_join':'#recommend_join');if(!btn)return {error:'이 글은 추천할 수 없습니다.'};
  /* 추천에도 보안 문자가 붙는 갤러리가 있습니다(추천 코드 입력 칸). */
  {const cap=await h.captcha(document.body,'#captcha_codeR');if(cap===null)return {need:'captcha'};if(!cap)return h.CAP_FAIL}
  const p=h.ajax(/recommend/,12000);btn.click();const r=await p;
  const num=s=>Number(((document.querySelector(s)||{}).textContent||'').replace(/[^\d]/g,''))||0;
  if(!r)return {error:h.alerts.join(' ')||'디시에서 응답이 없습니다.'};
  if(r.result===true||r.result===1||r.result==='1'||r.result==='success')return {ok:true,up:num('#recomm_btn'),down:num('#nonrecomm_btn')};
  if(r.cause==='captcha')return {need:'captcha'};
  return {error:String(r.cause||r.msg||h.alerts.join(' ')||'추천하지 못했습니다.')};
 },

 // 댓글·답글 쓰기
 async comment(a,h){
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:a.parentNo?'답글을 달 댓글을 찾지 못했습니다.':'댓글을 쓸 수 없는 글입니다.'};
  const gq=h.guest(a,f.form,'[id^="comment_nick"]','[id^="comment_pw"]');if(gq)return gq;
  f.form.querySelector(f.memo).value=a.text;
  const cap=await h.captcha(f.form);if(cap===null)return {need:'captcha'};if(!cap)return h.CAP_FAIL;
  if(!await h.human(f.form))return h.HUMAN_FAIL;
  const p=h.ajax(/\/ajax\/comment-write/);window.comment_write_ok(f.form);
  return h.done(await p);
 },

 // 사용할 수 있는 디시콘 목록 읽기
 async dcconList(a,h){
  if(!document.querySelector('#commentWrite'))return {error:'이 글에서는 디시콘을 쓸 수 없습니다.'};
  /* 디시 화면은 디시콘 창을 한 시간 동안 기억해 둡니다. 방금 디시콘을 산 뒤처럼 새로 읽어야 할 때는 그 기억을 지웁니다. */
  if(a.fresh)for(const k of Object.keys(localStorage))if(/^(show_dccon_|dccon_layer_timer_|dccon_fav_layer_timer_)/.test(k))localStorage.removeItem(k);
  window.show_dccon('commentWrite');
  const box=document.querySelector('#dcconBoxComment');
  await h.until(()=>!box.querySelector('.dccon-loading'),12000);await h.wait(300);
  const read=()=>[...box.querySelectorAll('.sm-img')].map(n=>{const img=n.querySelector('img');return {pkg:String(n.getAttribute('data-dccon-package')||''),detail:String(n.getAttribute('data-dccon-detail')||''),src:img?(img.getAttribute('data-src')||img.getAttribute('data-original')||img.src||''):'',alt:img?img.alt:''}}).filter(x=>x.pkg&&x.detail&&/^https:/.test(x.src));
  const seen=new Set(),items=[],add=()=>{for(const x of read()){const k=x.pkg+'/'+x.detail;if(!seen.has(k)){seen.add(k);items.push(x)}}};
  add();
  /* 디시콘 묶음이 여러 개면 창 위쪽에 묶음마다 탭이 있고, 탭을 눌러야 그 묶음의 그림이 불려 옵니다. 탭을 차례로 눌러 모두 모읍니다(최대 20묶음). */
  const tabs=[...box.querySelectorAll('#swiper-dccon-tab li a')].filter(t=>/getDccon_tab/.test(t.getAttribute('onclick')||''));
  for(const t of tabs.slice(0,20)){
   if(t.closest('li').classList.contains('on'))continue;
   t.click();await h.until(()=>read().some(x=>!seen.has(x.pkg+'/'+x.detail)),2500);await h.wait(200);add();
  }
  return {user:h.user(),items,double:!!document.querySelector('#dbl_con_chk'),note:items.length?'':(box.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)};
 },

 // 디시콘 1개 또는 2개(더블콘) 댓글로 등록
 async dccon(a,h){
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:'디시콘을 달 곳을 찾지 못했습니다.'};
  const gq=h.guest(a,f.form,'[id^="comment_nick"]','[id^="comment_pw"]');if(gq)return gq;
  window.show_dccon(f.mode);
  const box=await h.until(()=>{const b=document.querySelector(f.mode==='commentWrite'?'#dcconBoxComment':'#dcconBoxReple');return b&&!b.querySelector('.dccon-loading')?b:null},12000);
  if(!box)return {error:'디시콘 창을 열지 못했습니다.'};
  {const cap=await h.captcha(f.form);if(cap===null)return {need:'captcha'};if(!cap)return h.CAP_FAIL}
  if(!await h.human(f.form))return h.HUMAN_FAIL;
  const p=h.ajax(/\/ajax\/comment-write/);
  if(a.items.length===2){const chk=document.querySelector('#dbl_con_chk');if(!chk)return {error:'이 화면에서는 더블콘을 쓸 수 없습니다.'};if(!chk.checked)chk.click()}
  for(const it of a.items){window.insertDccon({dcconPackage:it.pkg,dcconDetail:it.detail});await h.wait(400)}
  return h.done(await p);
 },

 // 글자콘 등록
 async txtcon(a,h){
  const f=h.form(a.parentNo);if(!f||!f.form)return {error:'글자콘을 달 곳을 찾지 못했습니다.'};
  const gq=h.guest(a,f.form,'[id^="comment_nick"]','[id^="comment_pw"]');if(gq)return gq;
  const btn=f.form.querySelector('.add-txtdccon');if(!btn||getComputedStyle(btn).display==='none')return {error:'이 갤러리는 글자콘을 쓸 수 없습니다.'};
  window.show_txtcon(f.tmode);
  const memo=await h.until(()=>document.querySelector('#txtcon_memo'),5000);if(!memo)return {error:'글자콘 창을 열지 못했습니다.'};
  const pick=(list,c)=>{const b=document.querySelector(list+' [data-txtcon-color="'+c+'"]');if(b)b.click()};
  pick('#txtcon_bg_list',a.bg);pick('#txtcon_font_list',a.fg);
  memo.value=a.text;memo.dispatchEvent(new Event('input',{bubbles:true}));memo.dispatchEvent(new Event('keyup',{bubbles:true}));
  {const cap=await h.captcha(f.form);if(cap===null)return {need:'captcha'};if(!cap)return h.CAP_FAIL}
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
  {const gq=h.guest(a,document,'#name','#password');if(gq)return gq}
  /* 디시 글쓰기 칸은 편집기(summernote)가 만든 .note-editable 이 실제 본문입니다. #textbox 에 넣으면 등록할 때 빈 글로 읽힙니다. */
  const subject=document.querySelector('#subject'),box=await h.until(()=>document.querySelector('.note-editable'),8000);
  if(!subject||!box)return {error:'글쓰기 화면을 열지 못했습니다.'};
  /* 빈 글쓰기 칸에는 디시가 넣어 둔 안내 문구("내용")가 들어 있습니다. 그대로 두면 글 맨 앞에 "내용"이 함께 올라가므로 지웁니다. */
  for(const n of box.querySelectorAll('.wrt-guide-preview'))n.remove();
  if(!box.textContent.trim()&&!box.querySelector('img,video,iframe'))box.innerHTML='';
  /* 사진·영상은 편집기가 커서 자리에 넣으므로, 올리기 전에 커서를 본문 맨 끝으로 옮깁니다. */
  const toEnd=()=>{box.focus();const r=document.createRange();r.selectNodeContents(box);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);try{window.jQuery('#textbox').summernote('saveRange')}catch(e){}};
  subject.value=a.title;subject.dispatchEvent(new Event('input',{bubbles:true}));
  if(a.head!==''&&a.head!=null){const pick=document.querySelector('li.swiper-slide[data-no="'+a.head+'"] a');if(pick)pick.click();const hid=document.querySelector('#headtext');if(hid)hid.value=a.head}
  const media=()=>box.querySelectorAll('img,video,.block').length;
  /* 첨부를 하나씩 올리는 동안 "몇 번째 중 몇 번째"와, 동영상이면 디시 화면이 계산해 보여 주는 진행률(%)을 앱에 알립니다. */
  const total=a.blocks.filter(b=>b.t!=='text').length;let nth=0,last='';
  const tell=(b,pct)=>{const s=nth+'/'+pct;if(s===last)return;last=s;h.prog({stage:'upload',i:nth,n:total,video:b.t==='video',pct})};
  const pctNow=()=>{const v=parseInt((document.querySelector('#progress_bar_cur_per_txt')||{}).textContent,10);return v>=0&&v<=100?v:null};
  for(const b of a.blocks){
   if(b.t==='text'){for(const line of b.v.split('\n')){const p=document.createElement('p');if(line)p.textContent=line;else p.appendChild(document.createElement('br'));box.appendChild(p)}continue}
   const bin=atob(b.b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
   const input=document.querySelector(b.t==='video'?'#upload_movie':'#upload');if(!input)return {error:'첨부 칸을 찾지 못했습니다.'};
   const dt=new DataTransfer();dt.items.add(new File([bytes],b.name,{type:b.type}));input.files=dt.files;
   nth++;tell(b,null);
   toEnd();const before=media();input.dispatchEvent(new Event('change',{bubbles:true}));
   /* 동영상은 전송이 끝나면 디시가 "동영상 등록" 창(대표 그림·설명·등록 방식)을 띄우고, 거기서 [등록]을 눌러야 본문에 들어갑니다.
      그 창이 뜨고 대표 그림이 정해지면 디시의 등록 함수(insertMovieInfo)를 한 번 불러 줍니다. 설명·태그는 비워 둡니다. */
   let placed=false,info=null,infoAt=0;
   const place=()=>{if(placed||b.t!=='video')return;const lay=document.querySelector('#mvinfo_insert_layer'),th=document.querySelector('#mv_thumb');
    if(lay&&getComputedStyle(lay).display!=='none'&&th&&th.getAttribute('src')&&typeof window.insertMovieInfo==='function'){placed=true;toEnd();
     h.ajax(/\/movie\/insert-mvinfo/,60000).then(r=>{info=r||{};infoAt=Date.now()});window.insertMovieInfo()}};
   /* 디시 편집기는 대표 그림을 다 읽은 뒤에야 본문에 영상 칸을 넣는데, 숨은 화면에서는 그 그림을 못 읽어 칸이 들어가지 않을 때가 있습니다.
      등록 응답을 받고도 칸이 생기지 않으면, 편집기가 넣는 것과 같은 모양의 영상 칸을 직접 넣습니다. */
   const byHand=()=>{if(!info||info.result!==true||Date.now()-infoAt<2500||media()>before)return;
    const up=(document.querySelector('#upmov_no')||{}).value||'',mk=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n};
    const div=mk('div','block mv'),cont=mk('span','cont video'),inr=mk('span','cont-inr'),del=mk('button','sp-imgclose'),blind=mk('span','blind'),pos=mk('span','pos'),img=mk('img'),txt=mk('span','info-txt'),p=mk('p');
    div.setAttribute('data-movie',up+'|'+info.mv_no+'|'+info.mv_token);div.setAttribute('contenteditable','false');
    del.type='button';blind.textContent='삭제';del.appendChild(blind);pos.appendChild(mk('span','order-handle'));img.src=String(info.mv_thumb||'');txt.textContent='게시물 등록 후 재생 가능합니다.';
    inr.append(del,pos,img,txt);cont.appendChild(inr);div.appendChild(cont);p.appendChild(mk('br'));box.append(div,p);info=null;
    const lay=document.querySelector('#mvinfo_insert_layer'),md=document.querySelector('#movieData');if(lay)lay.style.display='none';if(md)md.value='1'};
   const bad=()=>info&&info.result!==true;
   if(!await h.until(()=>{if(b.t==='video'){tell(b,pctNow());place();byHand()}return media()>before||bad()},b.t==='video'?780000:60000)||bad())return {error:(h.alerts.join(' ')||(bad()&&info.cause)||'첨부를 올리지 못했습니다')+': '+b.name};
   await h.wait(500);
  }
  /* 편집기가 뒤늦게 같은 영상 칸을 한 번 더 넣었으면 하나만 남깁니다. */
  {const seen=new Set();for(const n of box.querySelectorAll('.block.mv')){const k=n.getAttribute('data-movie');if(seen.has(k))n.remove();else seen.add(k)}}
  h.prog({stage:'submit'});
  /* 동영상 등록 방식은 "빠른 등록"(글을 바로 올리고 본문에서 인코딩)으로 합니다. 기본값인 "완성 등록"은 인코딩이 끝날 때까지 글이 목록에 나오지 않습니다. */
  {const q=document.querySelector('#quick_upload'),v=document.querySelector('#movie_upload_type_val');if(q)q.checked=true;if(v)v.value='0'}
  box.dispatchEvent(new Event('input',{bubbles:true}));
  if(!await h.human(document.body))return h.HUMAN_FAIL;
  window.write_submit();
  /* 등록되면 화면이 글 목록으로 넘어가면서 이 작업이 끝납니다. 디시가 안내 창(alert)을 띄우면 그 내용을 바로 돌려줍니다. */
  await h.until(()=>h.alerts.length,25000);
  return {error:h.alerts.join(' ')||'등록 응답을 확인하지 못했습니다. 글 목록에서 올라갔는지 확인해 주세요.'};
 }
};

// 공식 화면에서 실행할 코드 문자열을 만듭니다.
export function script(name,args={}){
 if(!SCRIPTS[name])throw Error('없는 조작입니다: '+name);
 return '(async()=>{const h=('+helpers.toString()+')();return await ('+SCRIPTS[name].toString().replace(/^(async\s+)?(\w+)\(/,'$1function(')+')('+JSON.stringify(args)+',h)})()';
}
