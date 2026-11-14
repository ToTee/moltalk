// 몰톡 화면. 디시 읽기 코어(dc.js)의 결과를 메신저 모양으로 보여 줍니다.
import {createDc,ytButton} from '../core/dc.js';
import {script,mView,mList,mWrite,mModify,mGallog,LOGIN_URL,LOGIN_DONE} from '../core/drive.js';
import {I} from './icons.js';
import {androidNative} from './native-android.js';

const native=window.native||androidNative(window.YJ);
if(window.native)document.documentElement.classList.add('win');/* 윈도우판: 제목 줄 없는 창 모양(app.css의 .win 규칙) */
/* 디시로 가는 읽기 요청은 모두 한 줄로 세워 0.6초 간격으로 보냅니다. 막힌 응답(429, 403, 빈 응답)을 받으면 1분 동안 자동 요청(미리보기, 최근 글, 알림, 자동 더 보기)을 멈춥니다. */
let gate=Promise.resolve(),pvPause=0;
const blocked=r=>r.status===429||r.status===403||(r.status===200&&!r.text.trim());
function queued(url,opt){
 const run=gate.then(()=>native.http(url,opt));
 gate=run.then(r=>{if(blocked(r))pvPause=Date.now()+60000},()=>{}).then(()=>new Promise(r=>setTimeout(r,600)));
 return run;
}
const dc=createDc({http:queued,parse:html=>new DOMParser().parseFromString(html,'text/html')});
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS=['#a4b7e8','#8fcbd9','#e9a9a0','#b6a5e0','#8ec7a2','#e3bd7c','#d99cc0','#8aa3b8'];
const hash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const hue=s=>COLORS[hash(s)%COLORS.length];
/* 사람 자리에는 앱에 들어 있는 프로필 그림(avatars.jpg, 가로 8칸 × 세로 6칸) 가운데 하나를 보여 줍니다.
   이름으로 칸을 정하므로 같은 사람은 언제나 같은 그림이 나옵니다. 그림 48장(동물, 풍경·일상, 애니메이션풍 그림)은 이 앱을 위해 이미지 생성 모델(gpt-image-2)로 만든 것이며 실제 사람이나 기존 캐릭터가 아닙니다. */
const AV_COLS=8,AV_ROWS=6;
const AV_N=AV_COLS*AV_ROWS;
const avBase=(n,seed)=>hash('av'+n+(seed?'#'+seed:''))%AV_N;/* 이름(과 덧붙인 값)으로 정해지는 그림 번호 */
const avSpan=(i,n)=>'<span class="av avp" style="background-color:'+hue(n)+';background-position:'+(i%AV_COLS)/(AV_COLS-1)*100+'% '+Math.floor(i/AV_COLS)/(AV_ROWS-1)*100+'%"></span>';
const userAv=(n,seed)=>avSpan(avBase(n,seed),n);
/* 단체 채팅방(공지 글) 자리: 프로필 그림 네 장을 2×2로 모아 보여 줍니다. 글 번호로 정하므로 같은 방은 언제나 같은 네 장입니다. */
const gridAv=id=>'<span class="av grid">'+[0,1,2,3].map(i=>{const k=(hash('g'+id)+i*7)%AV_N;return '<i class="avp" style="background-color:'+COLORS[(hash(id)+i)%COLORS.length]+';background-position:'+(k%AV_COLS)/(AV_COLS-1)*100+'% '+Math.floor(k/AV_COLS)/(AV_ROWS-1)*100+'%"></i>'}).join('')+'</span>';

/* ---------- 저장되는 설정 ---------- */
/* 앱 이름을 바꾸기 전(yangjitalk)에 저장한 설정이 있으면 새 이름으로 옮기고, 실제로 쓸 이름을 돌려줍니다.
   저장 공간이 거의 찼을 때 두 벌이 되지 않게 예전 것을 먼저 지우고 새 이름으로 적습니다. 그래도 실패하면 예전 이름에 되돌려 놓고 그 이름을 계속 씁니다. */
function moveKey(o,n){
 const v=localStorage.getItem(o);if(v===null)return n;
 if(localStorage.getItem(n)!==null){localStorage.removeItem(o);return n}
 localStorage.removeItem(o);
 try{localStorage.setItem(n,v);return n}catch{try{localStorage.setItem(o,v)}catch{}return o}
}
const LS=moveKey('yangjitalk-v1','moltalk-v1');
const D=Object.assign({
 gals:[{id:'dcbest',type:'normal',name:'실시간 베스트'},{id:'singlebungle1472',type:'minor',name:'싱글벙글 지구촌'},{id:'programming',type:'normal',name:'프로그래밍'}],
 favs:['normal:dcbest','minor:singlebungle1472'],me:{name:'ㅇㅇ',status:''},photos:{},rooms:[],alias:{},aliasN:0,aliasOn:false,seen:{},top:{},tbg:'3b4890',tfg:'ffffff',trecent:[],watch:[],notis:[]
},JSON.parse(localStorage.getItem(LS)||native.backup||'{}'));/* 저장소가 비었으면 PC판은 파일로 남겨 둔 사본에서 되살립니다. */
while(D.rooms.length<10)D.rooms.push({mode:'random',text:''});
/* 예전 앱(양지톡)의 설정 가져오기(안드로이드 껍데기가 부릅니다). 새 설정을 저장한 뒤에는, 화면이 새로 그려지기 전까지
   지금 화면이 들고 있던 예전 내용으로 다시 덮어쓰지 못하게 저장을 막습니다. 원래 있던 설정은 다른 이름으로 남겨 둡니다. */
let importLock=false;
window.yjImport=json=>{
 try{const d=JSON.parse(json);if(!d||!Array.isArray(d.gals))return 'bad'}catch{return 'bad'}
 importLock=true;
 try{
  const old=localStorage.getItem('moltalk-v1');
  if(old!==null)try{localStorage.setItem('moltalk-v1-before-import',old)}catch{}
  try{localStorage.setItem('moltalk-v1',json)}catch{localStorage.removeItem('moltalk-v1-before-import');localStorage.removeItem('moltalk-pv');localStorage.setItem('moltalk-v1',json)}/* 자리가 모자라면 보관본과 미리보기 캐시를 비우고 다시 저장합니다. */
  localStorage.removeItem('yangjitalk-v1');return 'ok';
 }catch{importLock=false;return 'full'}
};
const save=()=>{if(importLock)return;const keys=Object.keys(D.seen);if(keys.length>3000)for(const k of keys.slice(0,keys.length-2000))delete D.seen[k];const json=JSON.stringify(D);localStorage.setItem(LS,json);native.backupSave?.(json)};
/* 시작할 때 사본을 한 번 맞춰 둡니다(저장소가 비어 사본에서 되살렸으면 저장소에도 다시 씁니다). */
if(localStorage.getItem(LS))native.backupSave?.(localStorage.getItem(LS));else if(native.backup)save();
const key=g=>g.type+':'+g.id;
const gal=k=>D.gals.find(g=>key(g)===k);

/* ---------- 사람 이름으로 바꾸기 ---------- */
const SUR=[...'조안김고백권문서유황차윤'],GIV=['민수','영호','재일','은채','승우','순용','지현','동혁','선아','보람','준석','하늘'];
const STATS=['오늘도 화이팅','','Carpe diem','주말엔 등산','','Have a nice day :)','커피 없인 못 살아','','Stay hungry, stay foolish','연락은 문자로','','No pain, no gain','봄이 오면'];
const personName=n=>SUR[n%12]+GIV[(n*5+Math.floor(n/12))%12];
/* 갤러리마다 사람 이름과 문구를 처음 한 번만 정해 저장하고, 이후에는 계속 같은 것을 씁니다. */
function alias(g){const k=key(g);if(!D.alias[k]){D.alias[k]={name:personName(D.aliasN++),stat:STATS[Math.floor(Math.random()*STATS.length)]};save()}return D.alias[k]}
const gname=g=>D.aliasOn?alias(g).name:g.name;
/* 직접 고른 프로필 사진(내 사진, 갤러리 사진)은 160픽셀로 줄여 기기에만 저장합니다. */
const photoAv=src=>'<span class="av"><img src="'+esc(src)+'" alt=""></span>';
const meAv=()=>D.me.photo?photoAv(D.me.photo):'<span class="av" style="background:'+'#a3c0ea'+'">'+I.sil+'</span>';
function pickPhoto(done){
 const i=document.createElement('input');i.type='file';i.accept='image/*';
 i.onchange=()=>{const f=i.files[0];if(!f)return;const img=new Image(),u=URL.createObjectURL(f);
  img.onload=()=>{const s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=160;c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,160,160);URL.revokeObjectURL(u);done(c.toDataURL('image/jpeg',.85))};
  img.onerror=()=>{URL.revokeObjectURL(u);toast('사진을 읽지 못했습니다.')};img.src=u};
 i.click();
}
const galAv=g=>D.photos[key(g)]?photoAv(D.photos[key(g)]):D.aliasOn?userAv(alias(g).name):'<span class="av" style="background:'+hue(g.name)+'">'+esc([...g.name][0]||'?')+'</span>';
/* 공지 채팅방 이름: 설정의 n번째 칸이 직접 입력이면 그 이름, 아니면 공지마다 겹치지 않는 사람 이름 묶음 */
function noticeName(g,idx,p){const r=D.rooms[idx];if(r&&r.mode==='custom'&&r.text)return r.text;const h=hash(key(g)+'/'+p.id);return [0,1,2,3].map(i=>personName((h+idx*4+i)%144)).join(', ')}

/* ---------- 시각 표시 ---------- */
function parseTime(s){
 let m=String(s||'').match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
 if(m)return new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5]);
 m=String(s||'').match(/(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})/);
 if(m){const now=new Date(),d=new Date(now.getFullYear(),m[1]-1,+m[2],+m[3],+m[4]);if(d-now>864e5)d.setFullYear(d.getFullYear()-1);return d}
 return null;
}
const clock=d=>(d.getHours()<12?'오전 ':'오후 ')+(d.getHours()%12||12)+':'+String(d.getMinutes()).padStart(2,'0');
const dayKey=d=>d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
function listTime(s){const d=parseTime(s);if(!d)return esc(s||'');const now=new Date(),y=new Date(now);y.setDate(now.getDate()-1);
 return dayKey(d)===dayKey(now)?clock(d):dayKey(d)===dayKey(y)?'어제':d.getFullYear()===now.getFullYear()?(d.getMonth()+1)+'월 '+d.getDate()+'일':d.getFullYear()+'. '+(d.getMonth()+1)+'. '+d.getDate()+'.'}
const dayLabel=d=>d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+'일월화수목금토'[d.getDay()]+'요일';

/* ---------- 실행 중 상태 ---------- */
const R={view:'friends',g:null,head:'',list:null,listErr:'',listBusy:false,seq:0,room:null,roomSeq:0,ov:'',pinOpen:false,nfold:false,stab:'',saved:false,
 latest:{},updated:{},cache:{},hk:{},pv:{},pc:{},shown:20,hidden:0,search:{q:'',res:null,busy:false,err:''},filter:'',filterOn:false,gmenu:null,log:'게시글',
 av:{},gallog:{},user:'',userKnown:false,reply:null,menu:null,ask:false,cpanel:false,tpanel:false,cons:{items:null,busy:false,err:''},con1:null,tcon:'',write:null,sending:false,toBottom:false};
const who=x=>x.name+(x.ip?'('+x.ip+')':'');
/* 글(채팅방)의 프로필 그림 번호. 글마다 따로 정합니다. 글 목록을 그릴 때 가까운 줄과 겹치지 않게 고른 번호를 R.av에 적어 두고,
   채팅방에서도 그 번호를 그대로 씁니다(목록을 거치지 않고 연 글은 글 번호로 정한 기본 번호를 씁니다). */
const postAvIdx=(gk,p)=>R.av[gk+'/'+p.id]??avBase(who(p),p.id);
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2600)}

/* ---------- 왼쪽 메뉴 ---------- */
function unreadOf(p){const s=D.seen[R.g+'/'+p.id];return s!=null&&p.comments>s?p.comments-s:0}
/* 넓은 화면(PC)과 좁은 화면(휴대폰)에서 다르게 보이는 부분은 둘 다 넣어 두고 app.css가 하나만 보여 줍니다. */
const two=(pc,mobile)=>'<span class="d-only">'+pc+'</span><span class="m-only">'+mobile+'</span>';
const cogM='<button class="ib m-only" data-ov="set" aria-label="설정">'+I.cog+'</button>';
function renderRail(){
 const n=R.list?R.list.posts.reduce((a,p)=>a+unreadOf(p),0):0;
 $('#rail').innerHTML='<button class="ic'+(R.view==='friends'?' on':'')+'" data-view="friends" aria-label="친구">'+two(I.person,I.personM)+'</button>'+
  '<button class="ic'+(R.view==='chats'?' on':'')+'" data-view="chats" aria-label="채팅">'+two(I.chat,I.chatM)+(n?'<span class="cnt">'+(n>999?'999+':n)+'</span>':'')+'</button>'+
  /* PC에서는 ··· 버튼이 갤러리 이름을 사람 이름으로 바꿉니다. 휴대폰에서는 이 버튼 대신 맨 아래의 해 모양 버튼이 같은 일을 합니다. */
  '<button class="ic deco'+(D.aliasOn?' on':'')+'" data-alias aria-pressed="'+D.aliasOn+'" aria-label="갤러리 이름을 사람 이름으로 바꾸기">'+I.more+'</button><span class="sp"></span>'+
  '<button class="ic'+(R.ov==='con'?' on':'')+'" data-ov="con" aria-label="디시콘">'+two(I.smile,I.conM)+'</button>'+
  '<button class="ic'+(R.ov==='noti'?' on':'')+'" data-ov="noti" aria-label="알림">'+two(I.bell,I.bellF)+(D.notis.some(n=>!n.read)?'<i class="dot" style="left:auto;right:-2px;top:-2px"></i>':'')+'</button>'+
  '<button class="ic m-only'+(D.aliasOn?' on':'')+'" data-alias aria-pressed="'+D.aliasOn+'" aria-label="갤러리 이름을 사람 이름으로 바꾸기">'+I.more+'</button>'+
  '<button class="ic'+(R.ov==='set'?' on':'')+'" data-ov="set" aria-label="설정">'+I.cog+'</button>';
}

/* ---------- 광고 칸 ----------
   진짜 광고는 블카이브 하나이고, 블랙핑크 갤러리를 볼 때만 나옵니다(누르면 기기의 브라우저로 엽니다).
   그 밖에는 사이버펑크 세계관을 찬양하는 장식용 광고가 나옵니다. 꾸밈일 뿐이라 눌러도 아무 일도 일어나지 않습니다.
   장식용 광고는 세 가지이고, 화면을 옮길 때마다(갤러리·글 목록·채팅방이 바뀔 때마다) 다음 것으로 넘어갑니다. */
const BLINK='normal:blackpink',BLINK_URL='https://blinkarea.synology.me/';
const ADS=[{c:'cy',t:'시스템의 오류인가, 새로운 진화인가',s:'정해진 알고리즘을 부수는 단 하나의 치명적 변수',k:'NEON NEVER SLEEPS',l:['CYBER','PUNK']},
 {c:'holo',t:'당신의 몸, 아직도 순정입니까?',s:'오메가 인더스트리 · 신체 개조 사업부',k:'UPGRADE YOURSELF',l:['OMEGA','INDUSTRIES']},
 {c:'term',t:'도시는 오늘도 당신을 스캔합니다',s:'&gt; 접속 승인됨. 신원 확인 생략',k:'STAY WIRED',l:['0xC0DE','RUNNING']}];
let adI=Math.floor(Math.random()*ADS.length),adNav=null;
/* 보고 있는 화면이 바뀌었으면 다음 광고로 넘깁니다. 같은 화면을 다시 그릴 때는 그대로 둡니다. */
function adTurn(){const k=R.view+'|'+R.g+'|'+(R.room?R.room.g+'/'+R.room.no:'');if(k!==adNav){if(adNav!==null)adI=(adI+1)%ADS.length;adNav=k}return ADS[adI]}
const adLogo=a=>'<span class="logo"><b>'+a.l[0]+'</b><i>'+a.l[1]+'</i></span><em>AD</em>';
const adM=blink=>blink?'<button class="adb m-only" data-url="'+BLINK_URL+'" aria-label="광고: 블카이브 열기"><span class="tx"><b>블랙핑크의 모든 기록, 블카이브</b><span>사진·영상·음원 기록을 한곳에서</span><i>지금 구경하기 ›</i></span><span class="logo"><b>블카이브</b><i>BLINK AREA</i></span><em>AD</em></button>':
 (a=>'<div class="adb dec '+a.c+' m-only" aria-hidden="true"><span class="tx"><b>'+a.t+'</b><span>'+a.s+'</span><i>'+a.k+'</i></span>'+adLogo(a)+'</div>')(adTurn());
/* PC 화면 맨 아래 광고 줄(index.html의 #adpc): 지금 보고 있는 갤러리에 맞춰 내용을 바꿉니다. */
function renderAd(){
 const a=adTurn(),el=$('#adpc');if(!el)return;const blink=(R.view==='chats'&&R.g===BLINK)||R.room?.g===BLINK,kind=blink?'b':a.c;
 if(el.dataset.kind===kind)return;el.dataset.kind=kind;el.className='adpc d-only'+(blink?'':' dec '+a.c);
 if(blink){el.dataset.url=BLINK_URL;el.setAttribute('aria-label','광고: 블카이브 열기');el.removeAttribute('aria-hidden');el.tabIndex=0;
  el.innerHTML='<span class="tx"><small>블카이브</small><b>블랙핑크의 모든 기록을 한곳에서</b><i>지금 구경하기 ›</i></span><span class="logo"><b>블카이브</b><i>BLINK AREA</i></span><em>AD</em>'}
 else{delete el.dataset.url;el.removeAttribute('aria-label');el.setAttribute('aria-hidden','true');el.tabIndex=-1;
  el.innerHTML='<span class="tx"><small>'+a.s+'</small><b>'+a.t+'</b><i>'+a.k+'</i></span>'+adLogo(a)}
}

/* ---------- 친구(갤러리 목록) ---------- */
function friendsHtml(){
 const row=g=>{const k=key(g),st=D.aliasOn?alias(g).stat:R.latest[k]?.title||'';
  return '<button class="row'+(k===R.g?' sel':'')+'" data-g="'+esc(k)+'" data-lp="gal">'+(R.updated[k]?'<i class="dot"></i>':'')+galAv(g)+'<span class="tx"><b>'+esc(gname(g))+'</b>'+(st?'<span class="st">'+esc(st)+'</span>':'')+'</span></button>'};
 const favs=D.favs.map(gal).filter(Boolean),upd=D.gals.filter(g=>R.updated[key(g)]),all=[...D.gals].sort((a,b)=>gname(a).localeCompare(gname(b),'ko'));
 return '<div class="head fr"><h2>친구</h2><button class="who m-only" data-ov="log" aria-label="내 프로필 열기">'+meAv()+'<span>'+esc(D.me.name)+'</span></button><button class="ib" data-ov="find" aria-label="갤러리 검색">'+I.search+'</button><button class="ib" data-ov="find" aria-label="갤러리 추가">'+I.plusGal+'</button><button class="ib d-only" data-refresh aria-label="새로고침 (F5)" title="새로고침 (F5)">'+I.refresh+'</button>'+cogM+'</div>'+
  '<div class="scroll" id="fscroll">'+
  /* 휴대폰 친구 화면 맨 위의 광고 칸: 장식용 사이버펑크 광고(눌러도 아무 일 없음). 블카이브 광고는 블랙핑크 갤러리 글 목록 맨 위에만 나옵니다. */
  adM(false)+
  '<div class="me">'+meAv()+'<span><b>'+esc(D.me.name)+'</b><span>'+esc(D.me.status)+'</span></span><button class="pill" data-ov="log">프로필</button></div>'+
  (favs.length?'<div class="sec"><span>즐겨찾기 &nbsp;'+favs.length+'</span>'+I.down+'</div><div class="favs">'+favs.map(g=>'<button class="fav" data-g="'+esc(key(g))+'" data-lp="gal" title="'+esc(gname(g))+'">'+(R.updated[key(g)]?'<i class="dot"></i>':'')+galAv(g)+'<span>'+esc(gname(g))+'</span></button>').join('')+'</div>':'')+
  (upd.length?'<div class="upd"><div class="sec"><span>업데이트한 친구 &nbsp;'+upd.length+'</span>'+I.down+'</div>'+upd.map(row).join('')+'</div>':'')+
  '<div class="sec" style="margin-top:6px"><span>친구 &nbsp;'+D.gals.length+'</span>'+I.down+'</div>'+
  (all.length?all.map(row).join(''):'<div class="empty">아직 추가한 갤러리가 없습니다.<br><button class="pill" data-ov="find">갤러리 추가</button></div>')+'</div>';
}

/* ---------- 채팅(글 목록) ---------- */
const PLAIN=['전체','안읽음','ChatGPT'];
function chatsHtml(){
 const g=gal(R.g);
 if(!g)return '<div class="head"><h2>채팅 <small>▼</small></h2>'+cogM+'</div><div class="empty">친구 목록에서 갤러리를 고르면<br>글 목록이 여기에 나옵니다.</div>';
 /* 말머리 탭은 갤러리마다 한 번 읽은 것을 기억해 둡니다. 탭을 눌러 목록을 다시 읽는 동안에도 같은 탭이 그대로 보입니다. */
 const L=R.list;if(L&&(L.heads?.length||!R.hk[R.g]))R.hk[R.g]=L.heads||[];
 const heads=R.hk[R.g]||[],plain=!!R.hk[R.g]&&!heads.length;
 const tabs=plain?PLAIN.map(n=>({id:n==='전체'?'':n,name:n})):[{id:'',name:'전체'},...heads];
 const pins=(L?.posts||[]).filter(p=>p.notice);
 let posts=L?L.posts:[];
 if(plain&&R.head==='안읽음')posts=posts.filter(p=>p.notice||unreadOf(p));
 if(plain&&R.head==='ChatGPT')posts=posts.filter(p=>p.notice);
 if(R.filter)posts=posts.filter(p=>p.notice||p.title.includes(R.filter));
 /* 같은 그림이 잇달아 나오지 않게, 바로 앞 8줄에 쓰인 그림은 건너뛰고 다음 그림을 씁니다. */
 const recent=[];
 const rowAv=p=>{let k=avBase(who(p),p.id);while(recent.includes(k))k=(k+1)%AV_N;recent.push(k);if(recent.length>8)recent.shift();R.av[R.g+'/'+p.id]=k;return avSpan(k,who(p))};
 const rowHtml=p=>{const pi=pins.indexOf(p),n=unreadOf(p),author=who(p);
  const pv=p.notice?p.title:R.pv[R.g+'/'+p.id]||(p.hasVideo?'동영상을 보냈습니다.':p.hasImage?'사진을 보냈습니다.':author+' · 조회 '+p.views.toLocaleString());
  return '<button class="row post'+(R.room&&R.room.g===R.g&&R.room.no===p.id?' sel':'')+'" data-p="'+p.id+'">'+
   (p.notice?gridAv(p.id):rowAv(p))+
   '<span class="tx"><b><span class="t">'+esc(p.notice?noticeName(g,pi,p):p.title)+'</span><small>'+(p.notice?pins.length:p.comments)+'</small>'+(p.notice?I.pin:'')+'</b><span class="pv">'+esc(pv)+'</span></span>'+
   '<span class="rt">'+listTime(p.time)+(n?'<br><em>'+n+'</em>':'')+'</span></button>'};
 /* 처음에는 20개만 보여 주고, 아래로 스크롤하면 10개씩 더 보여 줍니다. 보이는 글만 본문 미리보기를 읽어 옵니다. */
 const shownPins=posts.filter(p=>p.notice),allRest=posts.filter(p=>!p.notice),rest=allRest.slice(0,R.shown);
 R.hidden=allRest.length-rest.length;
 const body=!L?(R.listErr?'<div class="empty">'+esc(R.listErr)+'<br><button class="pill" data-reload>다시 시도</button></div>':'<div class="spin">불러오는 중…</div>'):
  (R.pinOpen?shownPins:shownPins.slice(0,1)).map(rowHtml).join('')+(shownPins.length>1?'<button class="pintog" data-pintog aria-expanded="'+R.pinOpen+'" aria-label="'+(R.pinOpen?'공지 접기':'공지 '+(shownPins.length-1)+'개 더 보기')+'"></button>':'')+
  (rest.length?rest.map(rowHtml).join(''):'<div class="empty">이 탭에는 아직 글이 없습니다.</div>')+
  (R.hidden>0||(L.more&&!(plain&&R.head))?'<button class="more-row" data-more>'+(R.listBusy?'불러오는 중…':'이전 글 더 보기')+'</button>':'');
 return '<div class="head"><h2>채팅 <small>▼</small></h2><button class="ib'+(R.filterOn?' act':'')+'" data-filter aria-label="글 검색">'+I.search+'</button><button class="ib" data-write aria-label="글쓰기">'+I.write+'</button><button class="ib d-only" data-refresh aria-label="새로고침 (F5)" title="새로고침 (F5)">'+I.refresh+'</button>'+cogM+'</div>'+
  (R.filterOn?'<div class="searchbar"><input id="filter" placeholder="불러온 글 제목에서 찾기" value="'+esc(R.filter)+'"></div>':'')+
  /* 개념글만 보기: 켜면 디시의 개념글 목록을 읽어 옵니다. 말머리 탭과 함께 쓸 수 있습니다. 맨 앞 '전체' 탭 바로 오른쪽에 둡니다. */
  '<div class="chips" id="chips">'+tabs.map((t,i)=>'<button class="chip'+(String(t.id)===String(R.head)?' on':'')+'" data-h="'+esc(t.id)+'">'+esc(t.name)+'</button>'+
   (i?'':'<button class="chip'+(R.rec?' on':'')+'" data-rec aria-pressed="'+!!R.rec+'">개념글</button>')).join('')+
  '<button class="chip ico'+(R.pinOpen?' on':'')+'" data-pintog aria-pressed="'+R.pinOpen+'" aria-label="'+(R.pinOpen?'공지 접기':'공지 모두 보기')+'">'+I.listp+(!R.pinOpen&&pins.length>1?'<i class="cdot"></i>':'')+'</button></div>'+
  '<div class="scroll" id="cscroll">'+(R.g===BLINK?adM(true):'')+body+'</div>';
}

/* ---------- 겹쳐 뜨는 창(갤러리 찾기, 설정, 갤로그, 알림, 디시콘) ---------- */
function overlayHtml(){
 const x='<button class="ib" data-ov="" aria-label="닫기">✕</button>';
 if(R.ov==='find'){const S=R.search;
  return '<div class="ov"><div class="head"><h2>갤러리 추가</h2>'+x+'</div><form class="searchbar" id="findf"><input id="findq" placeholder="갤러리 이름 검색" maxlength="60" value="'+esc(S.q)+'"><button class="pill">검색</button></form><div class="scroll">'+
   (S.busy?'<div class="spin">찾는 중…</div>':S.err?'<div class="empty">'+esc(S.err)+'</div>':!S.res?'<div class="empty">보고 싶은 갤러리 이름을 검색해 친구로 추가하세요.</div>':!S.res.length?'<div class="empty">검색 결과가 없습니다.</div>':
    S.res.map((g,i)=>'<div class="row">'+'<span class="av" style="background:'+hue(g.name)+'">'+esc([...g.name][0]||'?')+'</span><span class="tx"><b>'+esc(g.name)+'</b><span class="st">'+({normal:'갤러리',minor:'마이너 갤러리',mini:'미니 갤러리'}[g.type])+' · '+esc(g.id)+'</span></span>'+(gal(key(g))?'<span class="st">추가됨</span>':'<button class="pill" data-add="'+i+'">추가</button>')+'</div>').join(''))+'</div></div>'}
 if(R.ov==='gmenu'){const g=gal(R.gmenu);if(!g)return '';const fav=D.favs.includes(R.gmenu);
  return '<div class="ov"><div class="head"><h2>'+esc(gname(g))+'</h2>'+x+'</div><div class="scroll setlist"><button class="row" data-fav="'+esc(R.gmenu)+'"><span class="tx"><b>'+(fav?'즐겨찾기 해제':'즐겨찾기 추가')+'</b></span></button><button class="row" data-gphoto="'+esc(R.gmenu)+'"><span class="tx"><b>'+(D.photos[R.gmenu]?'프로필 사진 바꾸기':'프로필 사진 넣기')+'</b></span></button>'+(D.photos[R.gmenu]?'<button class="row" data-gphotodel="'+esc(R.gmenu)+'"><span class="tx"><b>프로필 사진 지우기</b></span></button>':'')+'<button class="row" data-open="'+esc(R.gmenu)+'"><span class="tx"><b>디시에서 열기</b></span></button><button class="row" data-remove="'+esc(R.gmenu)+'"><span class="tx"><b>친구 목록에서 삭제</b></span></button></div></div>'}
 if(R.ov==='set')return settingsHtml(x);
 if(R.ov==='log'){const cur=R.gallog[R.log];
  const list=!R.userKnown?'<div class="spin">로그인 상태 확인 중…</div>':!R.user?'<div class="empty">로그인하면 갤로그가 여기에 나옵니다.<br><button class="pill" data-login>로그인</button></div>':
   !cur||cur.busy?'<div class="spin">불러오는 중…</div>':cur.err?'<div class="empty">'+esc(cur.err)+'<br><button class="pill" data-log="'+R.log+'">다시 시도</button></div>':
   !cur.items.length?'<div class="empty">'+(R.log==='방명록'?'방명록이 비어 있습니다.':'표시할 '+R.log+'이 없습니다.')+'</div>':
   R.log==='방명록'?cur.items.map(v=>'<div class="row">'+userAv(v.name)+'<span class="tx"><b>'+esc(v.name)+'</b><span class="st">'+esc(v.text)+' · '+esc(v.date)+'</span></span></div>').join(''):
   cur.items.map((v,i)=>'<button class="row" data-glog="'+i+'"><span class="tx"><b>'+esc(v.title)+'</b><span class="st">'+esc(v.sub)+'</span></span></button>').join('');
  return '<div class="ov"><div class="cover">'+x+''+meAv()+'<b>'+esc(D.me.name)+'</b><span>'+esc(D.me.status)+'</span></div>'+
   '<div class="chips logtabs">'+Object.keys(GALLOG).map(k=>'<button class="chip'+(k===R.log?' on':'')+'" data-log="'+k+'">'+k+'</button>').join('')+'</div><div class="scroll wrap">'+list+'</div>'+
   '<div class="acts"><button class="pill" data-ov="set" data-stab="프로필">프로필 편집</button></div></div>'}
 if(R.ov==='noti')return '<div class="ov"><div class="head"><h2>알림</h2>'+(D.notis.length?'<button class="pill" data-noticlear>모두 지우기</button>':'')+x+'</div><div class="scroll wrap">'+
  (D.notis.length?D.notis.map((n,i)=>'<button class="row" data-noti="'+i+'">'+userAv(n.who)+'<span class="tx"><b>'+esc(n.head)+'</b><span class="st">'+esc(n.text)+'</span><span class="st">'+esc(n.title)+'</span></span></button>').join(''):
   '<div class="empty">새 알림이 없습니다.<br>'+(R.user?'내가 쓴 글과 댓글에 새 댓글이 달리면 여기에 나옵니다.':'로그인하면 내 글과 댓글의 새 댓글을 알려 드립니다.')+'</div>')+'</div></div>';
 if(R.ov==='con')return '<div class="ov"><div class="head"><h2>디시콘</h2>'+x+'</div><div class="scroll cpanel">'+(consHtml()||'<div class="spin">디시콘 불러오는 중…</div>')+'</div></div>';
 return '';
}
const TABS=['프로필','공지 채팅방 이름','계정','정보'];
function settingsHtml(x){
 if(!R.stab){const custom=D.rooms.filter(r=>r.mode==='custom'&&r.text).length;
  const sum={'프로필':D.me.name+(D.me.status?' · '+D.me.status:''),'공지 채팅방 이름':'직접 입력 '+custom+'개 · 랜덤 '+(D.rooms.length-custom)+'개','계정':!R.userKnown?'확인 중…':R.user?'로그인됨':'로그인하지 않음','정보':'몰톡 '+(native.version||'')};
  return '<div class="ov"><div class="head"><h2>설정</h2>'+x+'</div><div class="scroll setlist">'+TABS.map(t=>'<button class="row" data-stab="'+t+'"><span class="tx"><b>'+t+'</b><span class="st">'+esc(sum[t])+'</span></span>'+I.next+'</button>').join('')+'</div></div>'}
 const body=R.stab==='프로필'?'<div class="photoset">'+meAv()+'<button type="button" class="pill" data-mephoto>'+(D.me.photo?'사진 바꾸기':'사진 고르기')+'</button>'+(D.me.photo?'<button type="button" class="pill" data-mephotodel>사진 지우기</button>':'')+'</div><label>이름<input name="name" maxlength="20" value="'+esc(D.me.name)+'"></label><label>상태메시지<input name="status" maxlength="40" value="'+esc(D.me.status)+'"></label><p>친구 화면 맨 위 내 프로필에 표시되는 문구입니다.</p>':
  R.stab==='공지 채팅방 이름'?D.rooms.map((r,i)=>'<div class="slot"><span>'+(i+1)+'</span><select name="m'+i+'" aria-label="공지 '+(i+1)+' 이름 방식"><option value="random"'+(r.mode==='random'?' selected':'')+'>랜덤 이름</option><option value="custom"'+(r.mode==='custom'?' selected':'')+'>직접 입력</option></select><input name="t'+i+'" maxlength="30" placeholder="예: 대학 동기 모임" aria-label="공지 '+(i+1)+' 이름" value="'+esc(r.text)+'"'+(r.mode==='custom'?'':' disabled')+'></div>').join('')+'<p>갤러리마다 위에서부터 1번째, 2번째 공지에 차례로 적용됩니다. 직접 입력 칸이 비어 있으면 랜덤 이름이 쓰입니다.</p>':
  R.stab==='계정'?'<p>'+(!R.userKnown?'로그인 상태를 확인하는 중입니다…':R.user?'로그인됨: '+esc(R.user):'로그인하지 않았습니다.')+'</p><p>로그인은 디시인사이드 공식 로그인 화면에서 직접 합니다. 몰톡은 비밀번호를 저장하지도, 볼 수도 없습니다.</p><div class="savebar">'+(R.user?'<button type="button" class="pill" data-logout>로그아웃</button>':'<button type="button" class="save" data-login>로그인</button>')+'</div>'+
   '<label>비로그인 닉네임<input name="gnick" maxlength="20" placeholder="닉네임" value="'+esc(D.guest?.nick||'')+'"></label><label>비로그인 비밀번호<input name="gpw" type="password" maxlength="20" placeholder="2자 이상" value="'+esc(D.guest?.pw||'')+'"></label>'+
   '<p>로그인하지 않았을 때 글·댓글·디시콘을 이 닉네임으로 올립니다. 비밀번호는 디시에서 글을 지울 때 쓰는 것으로, 이 기기에만 저장됩니다. 둘 다 비우면 쓸 때마다 물어봅니다.</p><div class="savebar"><span role="status">'+(R.saved?'저장했습니다.':'')+'</span><button class="save">확인</button></div>':
  '<p>몰톡 '+esc(native.version||'')+'</p><p>디시인사이드를 메신저 화면으로 보는 비공식 열람 앱입니다. 디시인사이드와 관련이 없으며, 게시물과 첨부물의 권리는 각 작성자에게 있습니다.</p>';
 return '<div class="ov"><div class="head"><button type="button" class="ib bk" data-stab="" aria-label="설정 목록으로">'+I.back+'</button><h2>'+R.stab+'</h2>'+x+'</div><form id="setf" class="setf">'+body+
  (R.stab==='정보'||R.stab==='계정'?'':'<div class="savebar"><span role="status">'+(R.saved?'저장했습니다.':'')+'</span><button class="save">확인</button></div>')+'</form></div>';
}

function renderPane(){
 renderAd();
 const keep={f:$('#fscroll')?.scrollTop||0,c:$('#cscroll')?.scrollTop||0,ch:$('#chips')?.scrollLeft||0,fv:$('#pane .favs')?.scrollLeft||0};
 $('#pane').innerHTML=(R.view==='friends'?friendsHtml():chatsHtml())+overlayHtml();
 if($('#fscroll'))$('#fscroll').scrollTop=keep.f;if($('#cscroll'))$('#cscroll').scrollTop=keep.c;if($('#chips'))$('#chips').scrollLeft=keep.ch;if($('#pane .favs'))$('#pane .favs').scrollLeft=keep.fv;
 renderRail();previews();
}
/* 화면에 나온 글의 본문 첫 부분을 읽어 미리보기 줄에 채웁니다. 한 번에 둘씩만 요청하고, 읽은 본문은 글을 열 때 다시 씁니다. */
/* 디시는 요청이 잦으면 한동안 막기 때문에, 미리보기는 한 번에 하나씩 간격을 두고 읽고, 읽은 것은 기기에 저장해 다시 읽지 않습니다. 막히면 1분 쉽니다. */
const pvBusy=new Set(),PVLS=moveKey('yangjitalk-pv','moltalk-pv');
Object.assign(R.pv,JSON.parse(localStorage.getItem(PVLS)||'{}'));
const savePv=()=>{const e=Object.entries(R.pv).filter(x=>x[1]);localStorage.setItem(PVLS,JSON.stringify(Object.fromEntries(e.slice(-600))))};
let pvRunning=false;
async function previews(){
 if(R.view!=='chats'||!R.list||R.ov||pvRunning||Date.now()<pvPause)return;const gk=R.g,g=gal(gk);
 const todo=[...document.querySelectorAll('#cscroll .row.post[data-p]')].map(b=>+b.dataset.p).filter(no=>{const k=gk+'/'+no,p=R.list.posts.find(x=>x.id===no);return p&&!p.notice&&R.pv[k]==null&&!pvBusy.has(k)});
 for(const no of todo)pvBusy.add(gk+'/'+no);
 if(!todo.length)return;pvRunning=true;
 const work=async()=>{for(let no;(no=todo.shift())!=null;){const k=gk+'/'+no;
  if(R.g===gk&&Date.now()>=pvPause)try{await new Promise(r=>setTimeout(r,1400));const post=await dc.readPost(g,no),t=post.blocks.find(b=>b.t==='text');R.pc[k]={post,at:Date.now()};
   R.pv[k]=t?t.v.replace(/\s+/g,' ').slice(0,120):post.blocks.some(b=>b.t==='video'||b.t==='movie'||b.t==='yt'||b.t==='embed')?'동영상을 보냈습니다.':post.blocks.length?'사진을 보냈습니다.':'';
   const el=document.querySelector('#cscroll .row.post[data-p="'+no+'"] .pv');if(el&&R.g===gk&&R.view==='chats'&&R.pv[k])el.textContent=R.pv[k]}catch(e){if(e.code==='BUSY')pvPause=Date.now()+60000;else R.pv[k]=''}
  pvBusy.delete(k)}};
 await work();pvRunning=false;savePv();
 if(R.g!==gk||document.querySelector('#cscroll .row.post'))setTimeout(previews,50);
}
/* 스크롤로 자동 호출될 때(auto)는 직전 실패나 차단 뒤 잠시 쉽니다. 버튼을 직접 누르면 바로 시도합니다. */
let moreHold=0;
function showMore(auto){
 if(R.hidden>0){R.shown+=10;renderPane()}
 else if(auto&&Date.now()<Math.max(moreHold,pvPause))return;
 else if(R.list?.more&&!R.listBusy&&!(!R.list.heads.length&&R.head)){R.shown+=10;loadList({append:true})}
}
document.addEventListener('scroll',e=>{const t=e.target;if(t.id==='cscroll'&&t.scrollTop+t.clientHeight>t.scrollHeight-200)showMore(true)},true);

/* ---------- 채팅방(본문 + 댓글) ---------- */
/* 글 속의 주소는 누르면 기기의 브라우저로 열리는 링크가 됩니다. */
const linkify=t=>t.split(/(https?:\/\/[^\s<>"']+)/).map((s,i)=>i%2?'<a class="lk" href="'+esc(s)+'" data-url="'+esc(s)+'">'+esc(s)+'</a>':esc(s)).join('');
const bub=(t,q='')=>'<div class="bub">'+q+linkify(t)+'</div>';
/* 본문 동영상: 재생 단추를 누르면 디시의 재생 창 화면을 한 번 읽어 영상 주소를 알아낸 뒤 그 자리에서 틉니다.
   글을 열 때마다 미리 읽지 않는 것은 디시로 가는 요청을 줄이기 위해서입니다. 한 번 읽은 주소는 앱을 끌 때까지 기억합니다.
   기기에서 재생하지 못하면 디시 화면으로 여는 단추로 바꿉니다. */
const MV={},MVP={},MVT=new Set();
/* 눌러서 틀 때(auto)만 영상을 내려받기 시작합니다. 미리 보기 그림만 보여 줄 때는 영상을 받지 않습니다. */
const movieHtml=(u,m,auto)=>'<span class="mvw"><video class="media mv" controls playsinline preload="'+(auto?'metadata':'none')+'"'+(auto?' autoplay':'')+' src="'+esc(m.src)+'"'+(m.poster?' poster="'+esc(m.poster)+'"':'')+' data-page="'+esc(u)+'"></video><button class="mvbig" data-mvbig aria-label="동영상 크게 보기">크게</button></span>';
/* 크게 보기: 앱 창을 가득 채우는 화면에서 같은 영상을 보던 자리부터 이어서 틉니다. 닫으면 본문 영상도 그 자리로 맞춥니다. */
let bigFrom=null;
function openBig(b){const v=b.closest('.mvw')?.querySelector('video');if(!v)return;const at=v.currentTime||0,box=$('#viewer');v.pause();bigFrom=v;
 box.innerHTML='<video controls autoplay playsinline src="'+esc(v.currentSrc||v.src)+'"'+(v.poster?' poster="'+esc(v.poster)+'"':'')+'></video><button class="vclose" aria-label="크게 보기 닫기">✕</button>';
 const big=box.querySelector('video');if(at>0)big.addEventListener('loadedmetadata',()=>{big.currentTime=at},{once:true});box.hidden=false}
/* 유튜브(쇼츠 포함): 미리 보기 그림을 누르면 그 자리에서 유튜브 재생기를 엽니다. [크게]를 누르면 앱 창을 가득 채운 재생기로 옮깁니다.
   소리가 겹치지 않게, 크게 볼 때는 본문 쪽 재생기를 미리 보기 그림으로 되돌립니다. */
const ytOk=id=>/^[\w-]{11}$/.test(id);
const ytFrame=id=>'<iframe src="https://www.youtube.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" title="유튜브 영상"></iframe>';
function playYt(b){const id=b.dataset.yt;if(!ytOk(id))return;
 /* 휴대폰은 앱 화면과 따로 둔 재생 화면을 화면 가득 띄웁니다. PC는 그 자리에서 재생하고 [크게]로 키웁니다. */
 if(native.youtube){native.youtube(id);return}
 b.outerHTML='<span class="mvw yt">'+ytFrame(id)+'<button class="mvbig" data-ytbig="'+id+'" aria-label="유튜브 영상 크게 보기">크게</button></span>'}
function openBigYt(b){const id=b.dataset.ytbig,box=$('#viewer');if(!ytOk(id))return;b.closest('.mvw').outerHTML=ytButton(id);bigFrom=null;
 box.innerHTML=ytFrame(id)+'<button class="vclose" aria-label="크게 보기 닫기">✕</button>';box.hidden=false}
function closeViewer(){const box=$('#viewer'),big=box.querySelector('video');if(big&&bigFrom?.isConnected)try{bigFrom.currentTime=big.currentTime}catch{}
 bigFrom=null;box.innerHTML='';box.hidden=true}
/* 같은 영상을 두 번 읽지 않게, 읽는 중인 요청을 함께 씁니다. */
const movie=u=>MVP[u]||(MVP[u]=dc.readMovie(u).then(m=>MV[u]=m).catch(e=>{delete MVP[u];throw e}));
async function playMovie(b){const u=b.dataset.movie;if(b.disabled)return;
 if(!MV[u]){b.disabled=true;b.textContent='동영상 불러오는 중…';try{await movie(u)}catch(e){if(b.isConnected){b.disabled=false;b.textContent='▶ 동영상 재생'}toast(e.message);return}}
 for(const n of document.querySelectorAll('button[data-movie]'))if(n.dataset.movie===u)n.outerHTML=movieHtml(u,MV[u],n===b)}
/* 미리 보기 그림: 채팅방을 열어 화면에 나온 동영상만(한 번에 세 개까지) 재생 창을 한 번씩 읽어 그림을 붙입니다.
   영상 하나에 한 번만 시도하고, 디시가 요청을 막고 있는 동안에는 하지 않습니다. 실패하면 재생 단추를 그대로 둡니다. */
let thumbQ=Promise.resolve();
function thumbMovies(){let n=0;
 for(const b of document.querySelectorAll('#room button[data-movie]')){const u=b.dataset.movie;
  if(MV[u]){b.outerHTML=movieHtml(u,MV[u]);continue}
  if(MVT.has(u)||Date.now()<pvPause||++n>3)continue;MVT.add(u);
  /* 하나씩 차례로 읽고, 보내기 직전에 디시가 막고 있는지 다시 봅니다(앞 요청이 막혔으면 뒤 요청은 보내지 않습니다). */
  thumbQ=thumbQ.then(async()=>{if(Date.now()<pvPause)return;try{await movie(u)}catch{return}
   for(const x of document.querySelectorAll('#room button[data-movie]'))if(x.dataset.movie===u&&!x.disabled)x.outerHTML=movieHtml(u,MV[u])})}}
document.addEventListener('error',e=>{const n=e.target;if(n.tagName==='VIDEO'&&n.classList.contains('mv')&&n.isConnected)(n.closest('.mvw')||n).outerHTML='<button class="embed" data-url="'+esc(n.dataset.page)+'">동영상을 재생하지 못했습니다'+(n.error?' (오류 '+n.error.code+')':'')+'. 디시에서 열기</button>'},true);
const conVideo=(src,alt)=>'<video class="dcon1" autoplay loop muted playsinline src="'+esc(src)+'" aria-label="'+esc(alt||'디시콘')+'"></video>';
/* 디시콘 주소는 그림일 수도 영상일 수도 있습니다. 그림으로 못 읽으면 영상으로 한 번 바꿔 봅니다. */
document.addEventListener('error',e=>{const n=e.target;if(n.tagName==='IMG'&&n.classList.contains('dcon1')&&n.isConnected)n.outerHTML=conVideo(n.dataset.mp4||n.src,n.alt)},true);
/* 디시콘을 연달아 올린 것(더블콘)은 한 줄에 빈틈없이 나란히 놓습니다. */
const joinCons=list=>{const out=[];for(const b of list){const l=out[out.length-1];if(b.t==='dccon'&&l&&l.t==='dccons')l.items.push(b);else if(b.t==='dccon'&&l&&l.t==='dccon')out[out.length-1]={t:'dccons',items:[l,b]};else out.push(b)}return out};
function blockHtml(b,q=''){
 if(b.t==='dccons')return '<div class="dcons">'+b.items.map(x=>blockHtml(x)).join('')+'</div>';
 if(b.t==='text')return bub(b.v,q);
 if(b.t==='img')return '<img class="media" loading="lazy" src="'+esc(b.src)+'" alt="'+esc(b.alt||'본문 사진')+'" data-zoom>';
 if(b.t==='txtcon')return '<div class="tcon" style="'+tstyle(b.v,b.bg,b.fg)+'">'+esc(b.v)+'</div>';
 if(b.t==='dccon')return b.video?conVideo(b.src,b.alt):'<img class="dcon1" loading="lazy" src="'+esc(b.src)+'"'+(b.mp4?' data-mp4="'+esc(b.mp4)+'"':'')+' alt="'+esc(b.alt||'디시콘')+'">';
 /* 본문의 움직이는 그림(움짤)은 영상으로 들어옵니다. 재생 단추 없이 소리를 끈 채 되풀이 재생하고, 화면에 보일 때만 돌립니다(아래 gifIO). 누르면 조작 막대가 나옵니다. */
 if(b.t==='video')return '<video class="media gifv" loop muted playsinline preload="metadata" src="'+esc(b.src)+'"'+(b.poster?' poster="'+esc(b.poster)+'"':'')+'></video>';
 if(b.t==='yt')return ytButton(b.id);
 if(b.t==='movie')return MV[b.src]?movieHtml(b.src,MV[b.src]):'<button class="embed movie" data-movie="'+esc(b.src)+'">▶ 동영상 재생</button>';
 return '<button class="embed" data-url="'+esc(b.src)+'">동영상·외부 콘텐츠 열기</button>';
}
function renderRoom(keep){
 renderAd();
 if(R.write)return renderWrite();
 const el=$('#room'),r=R.room;
 if(!r){el.innerHTML='';$('#app').classList.remove('in-room');return}
 const g=gal(r.g),p=r.post,meta=r.meta,top=keep?$('#rscroll')?.scrollTop||0:0,otop=keep?$('#room .orig .scroll')?.scrollTop||0:0,draft=keep?$('#room textarea')?.value||'':'';
 el.className='room';$('#app').classList.add('in-room');
 const title=meta.notice?noticeName(g,r.pinIdx,meta):meta.title,author=who(p||meta),roomAvIdx=postAvIdx(r.g,meta);
 let h='';
 if(p){
  const merged=[];for(const b of p.blocks){const l=merged[merged.length-1];if(b.t==='text'&&l&&l.t==='text')l.v+='\n'+b.v;else merged.push({...b})}
  merged.splice(0,merged.length,...joinCons(merged));
  const msgs=merged.map(b=>({w:author,b,d:parseTime(p.time)}));
  msgs.push({sys:'댓글 '+(r.total??p.commentCount)+'개'});
  const byId=new Map((r.comments||[]).map(c=>[c.id,c]));
  for(const c of r.comments||[]){const par=c.parentId&&byId.get(c.parentId);
   const q=par?'<div class="q"><b>'+esc(who(par))+'에게 답장</b><span>'+esc(par.blocks.map(b=>b.t==='text'?b.v:b.t==='dccon'?'(디시콘)':'(사진)').join(' '))+'</span></div>':'';
   const cb=joinCons(c.blocks);
   cb.forEach((b,i)=>msgs.push({w:who(c),b,d:parseTime(c.time),q:i===0?q:'',mine:c.mine,c,lastBlock:i===cb.length-1,isAuthor:!!p.uid&&c.uid===p.uid||(!p.uid&&!c.uid&&c.ip&&c.ip===p.ip&&c.name===p.name)}))}
  /* 꾹 누르면 나오는 버튼: 댓글은 답장(+내 댓글이거나 내 글이면 삭제), 내가 쓴 글의 본문은 수정·삭제 */
  const myPost=!!R.user&&p.uid===R.user;
  let day='';
  /* 댓글 단 사람의 그림: 이 방에서 이미 쓰인 그림은 건너뛰어, 사람마다 다른 그림이 나오게 합니다(글쓴이는 방의 그림을 씁니다). */
  const cmtIdx=new Map(),taken=new Set([roomAvIdx]);
  const cAv=m=>{if(m.isAuthor)return avSpan(roomAvIdx,m.w);const ck=m.c.uid||m.w;let k=cmtIdx.get(ck);
   if(k==null){if(taken.size>=AV_N){taken.clear();for(const v of [...cmtIdx.values()].slice(-8))taken.add(v)}/* 그림을 다 썼으면 방금 쓴 8장만 피해서 다시 씁니다. */
    k=avBase(m.w,m.c.uid);for(let n=0;taken.has(k)&&n<AV_N;n++)k=(k+1)%AV_N;cmtIdx.set(ck,k);taken.add(k)}return avSpan(k,m.w)};
  msgs.forEach((m,i)=>{
   if(m.sys){h+='<div class="sys"><span>'+esc(m.sys)+'</span></div>';return}
   if(m.d&&dayKey(m.d)!==day){day=dayKey(m.d);h+='<div class="sys"><span>'+dayLabel(m.d)+'</span></div>'}
   const prev=msgs[i-1],next=msgs[i+1],first=!prev||prev.sys||prev.w!==m.w||prev.mine!==m.mine,last=!next||next.sys||next.w!==m.w;
   const body=m.q&&m.b.t!=='text'?bub('',m.q)+'</div><div class="ln blk">'+blockHtml(m.b):blockHtml(m.b,m.q||'');
   const lp=m.c?(m.c.deleted?'':' data-lp="msg" data-cid="'+m.c.id+'"'):myPost?' data-lp="msg" data-cid="body"':'';
   const menu=m.c?(R.menu===m.c.id&&m.lastBlock?'<button class="delbtn edit" data-reply="'+m.c.id+'">답장</button>'+(m.c.mine||myPost?'<button class="delbtn" data-cdel="'+m.c.id+'">삭제</button>':''):''):
    (R.menu==='body'&&i===merged.length-1?'<button class="delbtn edit" data-pedit>수정</button><button class="delbtn" data-postdel>'+(R.ask?'정말 삭제':'삭제')+'</button>':'');
   const ln='<div class="ln"'+lp+'>'+body+menu+(last&&m.d?'<span class="tm">'+clock(m.d)+'</span>':'')+'</div>';
   h+=m.mine?'<div class="m mine'+(first?' first':'')+'"><div class="col">'+ln+'</div></div>':
    '<div class="m'+(first?' first':'')+'"><div class="avc">'+(first?(m.c?cAv(m):avSpan(roomAvIdx,m.w)):'')+'</div><div class="col">'+(first?'<div class="nm">'+esc(m.w)+(i<merged.length||m.isAuthor?'<i>글쓴이</i>':'')+'</div>':'')+ln+'</div></div>';
  });
  if(r.cerr)h+='<div class="sys err"><span>'+esc(r.cerr)+'</span></div>';
  else if(!r.comments)h+='<div class="sys"><span>댓글 불러오는 중…</span></div>';
  else if(r.total>r.comments.length&&!r.noMore)h+='<div class="sys"><button data-cmore>'+(r.cbusy?'불러오는 중…':'댓글 더 보기')+'</button></div>';
 }else h=r.err?'<div class="sys err"><span>'+esc(r.err)+'</span></div><div class="sys"><button data-rreload>다시 시도</button></div>':'<div class="sys"><span>불러오는 중…</span></div>';
 const people=p?new Set([author,...(r.comments||[]).map(who)]).size:1;
 el.innerHTML='<div class="rhead"><button class="ib back" data-back aria-label="목록으로">'+I.back+'</button>'+(meta.notice?gridAv(meta.id):avSpan(roomAvIdx,author))+'<span class="tt"><b>'+esc(title)+'</b><span>'+esc(gname(g))+' · 참여 '+people+'명</span></span>'+
  '<button class="ib" data-rreload aria-label="새로고침">'+I.refresh+'</button><button class="ib" data-rmenu aria-label="글 메뉴" aria-expanded="'+!!R.rmenu+'">'+I.menu+'</button></div>'+
  /* 오른쪽 위 메뉴: 원본 모양으로 보기(글쓴이가 꾸민 그대로), 디시에서 열기 */
  (R.rmenu?'<button class="rdim" data-rmenu aria-label="메뉴 닫기"></button><div class="rpop"><button data-orig'+(p?'':' disabled')+'>원본 모양으로 보기</button><button data-vote="up"'+(p?'':' disabled')+'>추천'+(p?' '+(p.up||0):'')+'</button><button data-vote="down"'+(p?'':' disabled')+'>비추천'+(p&&p.down?' '+p.down:'')+'</button><button data-rmenu data-url="'+esc(postUrl(g,r.no))+'">디시에서 열기</button></div>':'')+
  (R.orig&&p?'<div class="orig"><div class="ohead"><button class="ib" data-orig aria-label="채팅방으로 돌아가기">'+I.back+'</button><b>원본 보기<small>'+esc(title)+'</small></b></div><div class="scroll" id="oscroll"><div class="oin">'+(p.html||'<p>본문이 없습니다.</p>')+'</div></div></div>':'')+
  (R.nfold?'<button class="nmini" data-nfold aria-label="공지 펼치기">'+I.horn+'</button>':'<div class="notice">'+I.horn+'<span class="tx"><div>'+((p||meta).head?'['+esc((p||meta).head)+'] ':'')+esc(meta.title)+'</div><div>'+esc(author)+' · 조회 '+((p||meta).views||0).toLocaleString()+' · 추천 '+((p||meta).up||0)+'</div></span><button class="nbtn" data-nfold aria-label="공지 접기">'+I.up+'</button></div>')+
  '<div class="scroll" id="rscroll"><div class="msgs">'+h+'</div></div>'+
  (R.cpanel?'<div class="cpanel">'+consHtml()+'</div>':'')+(R.tpanel?txtconHtml():'')+
  (R.reply?'<div class="replybar"><span>'+esc(who(R.reply))+'에게 답장</span><button class="ib" data-noreply aria-label="답장 취소">✕</button></div>':'')+
  '<form class="inp" id="cform"><textarea placeholder="메시지 입력" aria-label="댓글 입력" maxlength="200">'+esc(draft)+'</textarea><div class="bar"><button type="button" class="ib" data-url="'+esc(mView(g,r.no))+'" aria-label="디시 화면에서 열기">'+I.plus+'</button><button type="button" class="ib'+(R.cpanel?' act':'')+'" data-cpanel aria-expanded="'+R.cpanel+'" aria-label="디시콘">'+I.smile+'</button><button type="button" class="ib'+(R.tpanel?' act':'')+'" data-tpanel aria-expanded="'+R.tpanel+'" aria-label="글자콘">'+I.file+'</button><span></span><button class="send'+(draft.trim()&&!R.sending?' ok':'')+'"'+(R.sending?' disabled':'')+'>'+(R.sending?'보내는 중…':'전송')+'</button></div></form>';
 if(otop&&$('#room .orig .scroll'))$('#room .orig .scroll').scrollTop=otop;
 const sc=$('#rscroll');if(R.toBottom){sc.scrollTop=sc.scrollHeight;R.toBottom=false}else sc.scrollTop=top;
}
const postUrl=(g,no)=>'https://gall.dcinside.com/'+(g.type==='minor'?'mgallery/':g.type==='mini'?'mini/':'')+'board/view/?id='+g.id+'&no='+no;

/* ---------- 디시콘·글자콘 창 ---------- */
const DCCON_SHOP='https://m.dcinside.com/dcconShop/dcconList';
const TBG=['3b4890','b4b4e1','f5e1f0','d2f0e6','ffffff','333333'],TFG=['ffffff','333333'];
function tstyle(t,bg,fg){const n=[...String(t)].length;return 'background:#'+bg+';color:#'+fg+';font-size:'+(n<=2?44:n<=4?30:n<=8?22:n<=12?18:15)+'px'}
function consHtml(){
 const C=R.cons;
 if(C.busy)return '<div class="spin">디시콘 불러오는 중…</div>';
 if(C.err)return '<p class="hint">'+esc(C.err)+'</p>';
 if(!C.items)return '';
 /* 디시콘 샵: 디시 화면을 열어 다른 디시콘을 찾고 살 수 있습니다. 닫으면 목록을 새로 읽습니다. */
 const shop='<button type="button" class="cshop" data-conshop>＋ 디시콘 샵</button>';
 if(!C.items.length)return '<div class="cpkgs">'+shop+'</div><p class="hint">'+esc(C.note||('사용할 수 있는 디시콘이 없습니다.'))+'</p>';
 /* 묶음(패키지)이 여러 개면 묶음마다 탭을 두고, 고른 묶음의 그림만 보여 줍니다. 탭 그림은 그 묶음의 첫 디시콘입니다. */
 const pkgs=[...new Set(C.items.map(c=>c.pkg))],cur=pkgs.includes(R.conPkg)?R.conPkg:pkgs[0];
 return '<div class="cpkgs">'+(pkgs.length>1?pkgs.map(p=>'<button type="button" class="cpkg'+(p===cur?' on':'')+'" data-conpkg="'+esc(p)+'" aria-label="디시콘 묶음" aria-pressed="'+(p===cur)+'"><img loading="lazy" src="'+esc(C.items.find(c=>c.pkg===p).src)+'" alt=""></button>').join(''):'')+shop+'</div>'+
  '<div class="cons">'+C.items.map((c,i)=>c.pkg!==cur?'':'<button class="con'+(i===R.con1?' sel':'')+'" data-con="'+i+'" data-lp="con" aria-label="'+esc(c.alt||'디시콘')+'"><img loading="lazy" src="'+esc(c.src)+'" alt=""></button>').join('')+'</div>'+
  '<p class="hint">'+(R.con1!=null?'하나를 골랐습니다. 다른 디시콘을 누르면 2개가 좌우로 함께 올라갑니다.':'누르면 1개 등록 · 꾹 누른 뒤 다른 디시콘을 누르면 더블콘')+'</p>';
}
function txtconHtml(){
 return '<div class="cpanel tpanel"><div class="tcon" id="tcprev" style="'+tstyle(R.tcon,D.tbg,D.tfg)+'">'+esc(R.tcon)+'</div>'+
  '<div class="tcolors"><span>배경색</span>'+TBG.map(c=>'<button type="button" class="sw'+(c===D.tbg?' on':'')+'" data-tbg="'+c+'" style="background:#'+c+'" aria-label="배경색 '+c+'" aria-pressed="'+(c===D.tbg)+'"></button>').join('')+'<i></i><span>글자색</span>'+TFG.map(c=>'<button type="button" class="sw'+(c===D.tfg?' on':'')+'" data-tfg="'+c+'" style="background:#'+c+'" aria-label="글자색 '+c+'" aria-pressed="'+(c===D.tfg)+'"></button>').join('')+'</div>'+
  (D.trecent.length?'<div class="trecent">'+D.trecent.map(t=>'<button type="button" data-tuse="'+esc(t)+'">'+esc(t)+'</button>').join('')+'<button type="button" class="tclr" data-tclear>삭제</button></div>':'')+
  '<div class="trow"><input id="tcin" maxlength="20" placeholder="글자콘 내용 입력 (최대 20자)" aria-label="글자콘 내용" value="'+esc(R.tcon)+'"><button type="button" class="pub" data-tsend>등록</button></div></div>';
}
async function loadCons(fresh){
 const g=gal(R.room?.g||R.g)||D.gals[0],no=R.room?.no||R.latest[key(g)]?.id,C=R.cons;if(!g||!no||C.busy)return;
 C.busy=true;C.err='';renderRoom(true);if(R.ov==='con')renderPane();
 const r=await drive('dcconList',{fresh:!!fresh},mView(g,no),{timeout:90000});
 C.busy=false;if(r.error){C.err=r.error;C.items=null}else{C.items=r.items;C.note=r.note;if(r.user!=null){R.user=r.user;R.userKnown=true;D.user=R.user;save()}}
 renderRoom(true);if(R.ov==='con')renderPane();
}

/* ---------- 로그인과 쓰기 ---------- */
async function drive(name,args,url,opt){try{return await native.drive(url,script(name,args),opt)||{error:'응답이 없습니다.'}}catch(e){return {error:e.message}}}
async function checkUser(){const r=await drive('state',{},mList({id:'dcbest',type:'normal'}));if(!r.error){R.user=r.user||'';R.userKnown=true;D.user=R.user;save()}if(R.ov==='set'||R.ov==='log')renderPane();if(R.ov==='log'&&R.user&&!R.gallog[R.log])loadGallog();return R.user}
async function login(){await native.official(LOGIN_URL,{closeOn:LOGIN_DONE});R.cons.items=null;R.gallog={};await checkUser();if(R.user)toast('로그인했습니다.');return !!R.user}
/* 유동(비로그인) 닉네임·비밀번호를 묻는 작은 창. 화면을 다시 그려도 입력이 지워지지 않게 따로 둡니다. */
const gask=document.createElement('div');gask.id='gask';gask.hidden=true;document.body.append(gask);
let gaskDone=null;
function askGuest(){return new Promise(res=>{gaskDone=res;const g=D.guest||{};
 gask.innerHTML='<form id="gform" class="gbox"><b>비로그인으로 쓰기</b><p>닉네임과 비밀번호를 정하면 로그인 없이 글·댓글을 쓸 수 있습니다. 비밀번호는 나중에 지울 때 필요하며 이 기기에만 저장됩니다.</p>'+
  '<input name="gnick" maxlength="20" placeholder="닉네임" aria-label="닉네임" value="'+esc(g.nick||'')+'"><input name="gpw" type="password" maxlength="20" placeholder="비밀번호 (2자 이상)" aria-label="비밀번호" value="'+esc(g.pw||'')+'">'+
  '<span class="gerr" role="alert"></span><div class="gbtn"><button type="button" data-gcancel>취소</button><button type="button" data-glogin>로그인</button><button class="gok">이대로 쓰기</button></div></form>';
 gask.hidden=false;gask.querySelector('input').focus()})}
function gaskClose(v){gask.hidden=true;gask.innerHTML='';const d=gaskDone;gaskDone=null;if(d)d(v)}
/* 로그인이 필요하면 로그인 창을 띄운 뒤 한 번 더 시도하고, 보안 문자가 필요하면 디시 화면을 그대로 보여 줍니다. */
async function withAuth(name,args,url,opt){
 /* 로그인하지 않았으면 유동(비로그인)으로 씁니다. 닉네임·비밀번호를 아직 정하지 않았으면 물어봅니다. */
 const run=()=>drive(name,{...args,guest:D.guest||null},url,opt);
 let r=await run();
 if(r.need==='guest'){const c=await askGuest();if(c==='guest')r=await run();else if(c==='login'){if(await login())r=await run();else return {error:'로그인하지 않았습니다.'}}else return {error:'등록하지 않았습니다.'}}
 if(r.need==='guest')return {error:'닉네임과 비밀번호를 확인해 주세요.'};
 if(r.need==='login'){toast('로그인이 필요해 디시 로그인 화면을 엽니다.');if(await login())r=await run();else return {error:'로그인하지 않았습니다.'}}
 if(r.need==='captcha'){toast('보안 문자 입력이 필요해 디시 화면을 엽니다.');await native.official(url);return {manual:true,error:'디시 화면에서 직접 마무리해 주세요. 처리됐는지는 새로고침하면 보입니다.'}}
 if(r.need)return {error:'로그인이 필요합니다.'};
 return r;
}
/* 추천·비추천: 채팅방 오른쪽 위 메뉴에서 누릅니다. */
async function vote(down){
 const room=R.room;R.rmenu=false;renderRoom(true);if(!room||!room.post||R.voting)return;
 R.voting=true;toast(down?'비추천하는 중…':'추천하는 중…');
 const r=await drive('recommend',{down},mView(gal(room.g),room.no),{timeout:30000});R.voting=false;
 if(r.need==='captcha'){toast('보안 문자 입력이 필요해 디시 화면을 엽니다.');await native.official(mView(gal(room.g),room.no));if(R.room===room)openPost(room.no,true);return}
 if(!r.ok){toast(r.error||'추천하지 못했습니다.');return}
 if(R.room===room){room.post.up=r.up;room.post.down=r.down;if(room.meta)room.meta.up=r.up;renderRoom(true)}
 toast(down?'비추천했습니다.':'추천했습니다.');
}
async function sendToRoom(name,args){
 const room=R.room;if(!room||R.sending)return false;
 R.sending=true;renderRoom(true);
 const r=await withAuth(name,{...args,parentNo:R.reply?.id||''},mView(gal(room.g),room.no));
 R.sending=false;if(R.room!==room)return false;
 /* 보안 문자 때문에 디시 화면에서 직접 보낸 경우: 보냈는지 알 수 없으므로 쓰던 글은 지우지 않고 방만 새로 읽습니다. */
 if(r.manual){await openPost(room.no,true);return false}
 if(!r.ok){toast(r.error||'보내지 못했습니다.');renderRoom(true);return false}
 R.reply=null;R.toBottom=true;await openPost(room.no,true);
 /* 내가 댓글을 단 글은 알림 대상으로 기억합니다. 비로그인 댓글은 닉네임이 같은 가장 최근 댓글을 방금 내 것으로 봅니다. */
 const rm=R.room;if(rm&&rm.no===room.no&&rm.post&&rm.comments){const u=myUid(),nick=D.guest?.nick;
  const me=[...rm.comments].reverse().find(c=>c.mine||(!u&&!c.uid&&nick&&c.name===nick));
  watch(rm.g,rm.no,rm.post.title,rm.total??rm.comments.length,!!u&&rm.post.uid===u,me&&!me.mine?me.id:null)}
 return true;
}
async function removeComment(id){const room=R.room;R.menu=null;renderRoom(true);const r=await withAuth('delComment',{no:id},mView(gal(room.g),room.no));if(r.ok){toast('댓글을 삭제했습니다.');if(R.room===room)openPost(room.no,true)}else toast(r.error||'삭제하지 못했습니다.')}
async function removePost(){const room=R.room,g=room.g;R.menu=null;R.ask=false;renderRoom(true);const r=await withAuth('delPost',{},mView(gal(g),room.no));
 if(r.ok){toast('글을 삭제했습니다.');if(R.room===room){R.room=null;R.roomSeq++;renderRoom()}delete R.cache[g+'|'];if(R.g===g)loadList({fresh:true})}else toast(r.error||'삭제하지 못했습니다.')}

/* ---------- 갤로그와 알림 ---------- */
const GALLOG={'게시글':'G_all','댓글':'R_all','스크랩':'B','방명록':'U'};
async function loadGallog(){
 if(!R.user||R.gallog[R.log]?.busy)return;const tab=R.log,box=R.gallog;box[tab]={busy:true};renderPane();
 const r=await drive('gallog',{menu:GALLOG[tab]},mGallog(R.user,GALLOG[tab]));
 box[tab]=r.error?{err:r.error}:{items:r.items||[]};if(R.ov==='log')renderPane();
}
/* 갤로그·알림에서 글로 이동: 친구 목록에 있는 갤러리면 앱 안에서 열고, 아니면 디시 화면으로 엽니다. */
async function jump(v){
 /* 갤로그 줄에는 갤러리 번호만 있어서, 처음 열 때 디시에 갤러리 주소를 물어봅니다. */
 if(!v.id&&v.code){toast('글을 여는 중…');const r=await drive('gallId',{code:v.code,type:v.type},mGallog(R.user,''));if(!r.id){toast(r.error||'글을 열지 못했습니다.');return}v.id=r.id}
 if(v.person){native.open('https://m.dcinside.com/person/'+v.id+'/'+v.no);return}
 const g=D.gals.find(x=>x.id===v.id&&(x.type==='mini')===!!v.mini);
 if(!g){native.open('https://m.dcinside.com/'+(v.mini?'mini':'board')+'/'+v.id+'/'+v.no);return}
 await openGallery(key(g));openPost(v.no,false,{id:v.no,title:v.orig||v.title||'',notice:false,head:'',name:'',uid:'',ip:'',comments:0,views:0,up:0});
}
/* 알림: 내가 쓴 글과 내가 댓글을 단 글 가운데 최근 5개만 10분마다 다시 읽어 새 댓글을 찾습니다. 요청은 간격을 두고 하나씩 보냅니다. */
/* id: 방금 내가 쓴 댓글 번호(비로그인 댓글은 디시가 "내 댓글"이라고 알려 주지 않아 따로 기억합니다). 다시 살핀 글은 목록 맨 앞으로 옮깁니다. */
function watch(gk,no,title,count,mine,id){
 const i=D.watch.findIndex(w=>w.g===gk&&w.no===no),w=i<0?{g:gk,no,title,count,mine}:D.watch.splice(i,1)[0];
 w.count=count;w.mine=w.mine||mine;if(id){w.ids=(w.ids||[]).filter(x=>x!==id).concat(id).slice(-20)}
 D.watch.unshift(w);D.watch.length=Math.min(D.watch.length,20);
 save();
}
let polling=false,lastPoll=0;
async function poll(){
 if(polling||!D.watch.length)return;polling=true;lastPoll=Date.now();
 /* 로그인 아이디를 아직 모르면 한 번 확인합니다(내 댓글과 남의 댓글을 가리는 데 필요합니다). */
 if(!R.userKnown)await checkUser();
 const fresh=[];
 for(const w of D.watch.slice(0,5)){const g=gal(w.g);if(!g)continue;if(Date.now()<pvPause)break;
  try{await new Promise(r=>setTimeout(r,1500));const post=await dc.readPost(g,w.no);await new Promise(r=>setTimeout(r,1500));const cm=await readCm(g,w.no,post.token,1);
   if(cm.total>w.count){const mineIds=new Set(cm.comments.filter(c=>c.mine).map(c=>c.id).concat(w.ids||[]));
    for(const c of cm.comments.filter(c=>!c.mine&&!mineIds.has(c.id)&&!c.deleted).slice(-(cm.total-w.count))){const toMe=c.parentId&&mineIds.has(c.parentId);if(!w.mine&&!toMe)continue;
     const n={g:w.g,no:w.no,id:g.id,mini:g.type==='mini',title:w.title,who:who(c),head:who(c)+(toMe?'님이 답글을 남겼습니다':'님이 댓글을 남겼습니다'),text:c.blocks.map(b=>b.t==='text'?b.v:b.t==='img'?'(사진)':'(디시콘)').join(' ').slice(0,100),read:false};
     D.notis.unshift(n);fresh.push(n)}
    D.notis.length=Math.min(D.notis.length,50);w.count=cm.total;save();renderRail();if(R.ov==='noti')renderPane()}
  }catch(e){if(e.code==='BUSY')break}}
 polling=false;
 /* 새 알림은 기기의 알림(윈도우 오른쪽 아래, 안드로이드 알림 창)으로도 띄웁니다. */
 if(fresh.length)native.notify?.(fresh.length>1?'새 댓글 '+fresh.length+'개':fresh[0].head,fresh[0].text||fresh[0].title);
}
setTimeout(poll,90000);setInterval(poll,600000);
/* 휴대폰은 앱이 뒤에 가 있는 동안 위 시계가 멈출 수 있어, 앱으로 돌아왔을 때 10분이 지났으면 바로 확인합니다. */
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastPoll>600000)poll()});
/* 움짤: 화면에 보이는 것만 재생하고, 벗어나면 멈춥니다. 화면이 새로 그려질 때마다 새로 생긴 움짤을 찾아 지켜봅니다. */
const gifIO=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting)e.target.play().catch(()=>{});else e.target.pause()}},{threshold:.15});
new MutationObserver(()=>{for(const v of document.querySelectorAll('video.gifv:not([data-io])')){v.dataset.io='1';v.muted=true;gifIO.observe(v)}thumbMovies()}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{const v=e.target.closest?.('video.gifv');if(v&&!v.controls)v.controls=true});
/* 기기 알림을 누르면 알림 목록을 엽니다. */
native.onNotify?.(()=>{R.ov='noti';for(const n of D.notis)n.read=true;save();renderRail();renderPane()});

/* ---------- 글쓰기 화면 ---------- */
/* 글을 올리는 동안 보여 주는 진행 창. 첨부를 읽고, 하나씩 올리고, 마지막에 글을 등록하는 순서로 바뀝니다.
   동영상은 디시 화면이 계산한 진행률(%)을 그대로 보여 줍니다. 60%부터는 디시가 영상을 처리하는 시간입니다. */
function progHtml(p){
 const up=p?.stage==='upload',pct=up&&typeof p.pct==='number'?Math.max(0,Math.min(100,p.pct)):null;
 const text=up?(p.video?'동영상':'사진')+' 올리는 중 ('+p.i+'/'+p.n+')':p?.stage==='submit'?'글을 등록하는 중…':'첨부 파일을 준비하는 중…';
 const sub=up&&p.video?(pct!=null&&pct>=60?'디시에서 동영상을 처리하고 있습니다. 조금 더 걸립니다.':'동영상은 크기에 따라 몇 분 걸릴 수 있습니다.'):'잠시만 기다려 주세요.';
 return '<div class="box"><i class="sp"></i><b>'+text+(pct!=null?' · '+pct+'%':'')+'</b>'+(pct!=null?'<span class="pbar"><i style="width:'+pct+'%"></i></span>':'')+'<small>'+sub+'</small></div>';
}
/* 진행 신호는 디시 화면에서 오므로 믿지 않습니다. 정해진 모양(단계 이름, 정수, 참·거짓)만 골라 받습니다. */
native.onProgress?.(json=>{const w=R.write;if(!w||!w.busy)return;let p;try{p=JSON.parse(json)}catch{return}
 const int=v=>Number.isInteger(v)&&v>=0&&v<=100?v:null;
 if(p?.stage==='submit')w.prog={stage:'submit'};
 else if(p?.stage==='upload'&&int(p.i)!=null&&int(p.n)!=null)w.prog={stage:'upload',i:int(p.i),n:int(p.n),video:p.video===true,pct:int(p.pct)};
 else return;
 const el=$('#wprog');if(el)el.innerHTML=progHtml(w.prog)});
function renderWrite(){
 const el=$('#room'),w=R.write,g=gal(w.g),heads=R.list?.heads||[];
 el.className='room';$('#app').classList.add('in-room');
 const blk=x=>typeof x==='string'?bub(x):x.video?'<video class="media" src="'+x.url+'" controls aria-label="'+esc(x.name)+'"></video>':'<img class="media" src="'+x.url+'" alt="'+esc(x.name)+'">';
 el.innerHTML='<div class="rhead"><button class="ib back" data-wcancel aria-label="글쓰기 닫기">'+I.back+'</button>'+meAv()+'<span class="tt"><b>새 글</b><span>'+esc(gname(g))+'에 올리기</span></span><button class="pub" data-pub'+(w.busy?' disabled':'')+'>'+(w.busy?'등록 중…':'등록')+'</button></div>'+
  '<div class="wtitle"><label for="wtitle">제목</label>'+(heads.length?'<select id="whead" aria-label="말머리">'+heads.map(h=>'<option value="'+esc(h.id)+'"'+(String(h.id)===String(w.head)?' selected':'')+'>'+esc(h.name)+'</option>').join('')+'</select>':'')+'<input id="wtitle" maxlength="40" placeholder="제목 입력" aria-label="제목" value="'+esc(w.title)+'"></div>'+
  '<div class="scroll" id="wscroll"><div class="msgs">'+(w.blocks.length?'<div class="m first"><div class="avc">'+meAv()+'</div><div class="col"><div class="nm">'+esc(D.me.name)+'<i>글쓴이</i></div>'+
   w.blocks.map((x,i)=>'<div class="ln blk">'+blk(x)+'<button class="del" data-del="'+i+'" aria-label="이 말풍선 삭제">✕</button></div>').join('')+'</div></div>':'<div class="sys"><span>아래에 쓰고 전송하면 본문에 들어갑니다</span></div>')+
  (w.err?'<div class="sys err" role="alert"><span>'+esc(w.err)+'</span></div>':'')+'</div></div>'+
  '<form class="inp" id="wform"><label class="wlab" for="wbody">본문</label><textarea id="wbody" placeholder="본문 입력">'+esc(w.text)+'</textarea>'+
  (w.pending.length?'<div class="pend">'+w.pending.map((x,i)=>'<span class="pthumb">'+(x.video?'<video src="'+x.url+'" muted aria-label="'+esc(x.name)+'"></video>':'<img src="'+x.url+'" alt="'+esc(x.name)+'">')+'<button type="button" class="del" data-pdel="'+i+'" aria-label="첨부 취소">✕</button></span>').join('')+'</div>':'')+
  (w.menu?'<div class="amenu"><button type="button" data-pick="image">사진</button><button type="button" data-pick="video">동영상</button></div>':'')+
  '<div class="bar"><button type="button" class="ib" data-attach aria-expanded="'+!!w.menu+'" aria-label="사진·동영상 첨부">'+I.plus+'</button><span></span><button class="send ok">전송</button></div><input type="file" id="pick" multiple hidden></form>'+
  (w.busy?'<div class="wprog" id="wprog" role="status" aria-live="polite">'+progHtml(w.prog)+'</div>':'');
 const sc=$('#wscroll');sc.scrollTop=sc.scrollHeight;
}
/* 전송: 글을 이어 보내면 한 말풍선으로 합치고, 사이에 사진·영상을 보내면 그 지점에서 나뉩니다. 빈 전송은 빈 줄 한 줄입니다. */
function sendDraft(){
 const w=R.write,t=w.text,l=w.blocks.length-1,has=typeof w.blocks[l]==='string';
 if(!t&&!w.pending.length){if(has)w.blocks[l]+='\n';else w.blocks.push('')}
 else if(t){if(has)w.blocks[l]+='\n'+t;else w.blocks.push(t)}
 w.blocks.push(...w.pending);w.pending=[];w.text='';w.err='';w.menu=false;renderWrite();$('#wbody').focus({preventScroll:true});
}
const b64=file=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]||'');fr.onerror=()=>rej(Error('파일을 읽지 못했습니다: '+file.name));fr.readAsDataURL(file)});
async function publish(){
 const w=R.write;if(w.busy)return;if(w.text||w.pending.length)sendDraft();
 if(!w.title.trim()){w.err='제목을 입력해 주세요.';return renderWrite()}
 if(!w.blocks.some(x=>typeof x!=='string'||x.trim())){w.err='본문이나 사진을 추가해 주세요.';return renderWrite()}
 w.busy=true;w.err='';w.prog=null;renderWrite();
 try{
  const blocks=[];for(const x of w.blocks)blocks.push(typeof x==='string'?{t:'text',v:x}:{t:x.video?'video':'img',name:x.name,type:x.file.type,b64:await b64(x.file)});
  const g=gal(w.g),r=await withAuth('write',{title:w.title.trim(),head:w.head,blocks},mWrite(g),{timeout:blocks.some(b=>b.t==='video')?900000:300000});
  if(R.write!==w)return;
  if(r.navigated||r.ok){for(const x of w.blocks)if(x.url)URL.revokeObjectURL(x.url);R.write=null;toast('글을 올렸습니다.');renderRoom();delete R.cache[w.g+'|'];if(R.g===w.g){R.head='';loadList({fresh:true})}return}
  w.err=r.error||'글을 올리지 못했습니다.';
 }catch(e){w.err=e.message}
 w.busy=false;if(R.write===w)renderWrite();
}

/* ---------- 불러오기 ---------- */
async function loadList({append=false,fresh=false}={}){
 const g=gal(R.g);if(!g)return;const seq=++R.seq,head=R.list&&!R.list.heads.length?'':R.head,rec=!!R.rec;
 const ck=R.g+'|'+head+(rec?'|rec':''),c=R.cache[ck];
 if(!append&&!fresh&&c&&Date.now()-c.at<60000){R.list=c.list;R.listErr='';R.listBusy=false;renderPane();return}
 if(!append){R.list=null;R.listErr=''}R.listBusy=true;renderPane();
 try{const page=append?R.list.page+1:1,res=await dc.listPosts(g,{page,head,rec});if(seq!==R.seq)return;
  if(append){const ids=new Set(R.list.posts.map(p=>p.id)),add=res.posts.filter(p=>!p.notice&&!ids.has(p.id));R.list.posts.push(...add);R.list.page=page;R.list.more=add.length>0}
  else{
   /* 말머리 탭에서도 공지는 맨 위에 남도록, 전체 목록에서 본 공지를 앞에 붙입니다. */
   if(head||rec){const ids=new Set(res.posts.map(p=>p.id)),pins=(R.cache[R.g+'|']?.list.posts||[]).filter(p=>p.notice&&!ids.has(p.id));res.posts.unshift(...pins)}
   R.list={posts:res.posts,heads:res.heads.length?res.heads:R.list?.heads||[],page:1,more:res.posts.some(p=>!p.notice)}}
  if(!head&&!rec){const t=res.posts.find(p=>!p.notice);if(t&&!append){R.latest[R.g]={id:t.id,title:t.title};D.top[R.g]=t.id;delete R.updated[R.g];save()}}
  if(res.name&&g.name!==res.name&&/^[A-Za-z0-9_]+$/.test(g.name)){g.name=res.name;save()}
  R.cache[ck]={list:R.list,at:Date.now()};
 }catch(e){if(seq!==R.seq)return;if(append){moreHold=Date.now()+15000;toast(e.message)}else R.listErr=e.message}
 R.listBusy=false;renderPane();
}
async function openGallery(k){R.g=k;R.head='';R.rec=false;R.shown=20;R.view='chats';R.ov='';R.filter='';R.filterOn=false;R.pinOpen=false;R.list=null;await loadList()}
async function openPost(no,fresh,given){
 /* 지금 목록에서 연 글이면 현재 갤러리, 열려 있던 방을 다시 읽는 것이면 그 방의 갤러리를 씁니다(방을 연 뒤 다른 갤러리로 옮겼을 수 있습니다). */
 const inList=given||R.list?.posts.find(p=>p.id===no),meta=inList||R.room?.meta;if(!meta)return;
 const gk=inList?R.g:R.room.g,pins=(gk===R.g&&R.list?.posts||[]).filter(p=>p.notice),seq=++R.roomSeq,g=gal(gk);if(!g)return;
 if(!fresh)R.orig=false;R.rmenu=false;
 R.room={g:gk,no,meta,pinIdx:Math.max(0,pins.indexOf(meta)),post:null,comments:null,total:null,cpage:1};
 renderRoom(fresh);renderPane();
 try{const c=R.pc[gk+'/'+no],post=!fresh&&c&&Date.now()-c.at<120000?c.post:await dc.readPost(g,no);if(seq!==R.roomSeq)return;R.room.post=post;renderRoom(fresh);
  try{const cm=await readCm(g,no,post.token,1);if(seq!==R.roomSeq)return;R.room.comments=cm.comments;R.room.total=cm.total;
   meta.comments=Math.max(meta.comments,cm.total);D.seen[gk+'/'+no]=meta.comments;
   /* 내 글이거나 내가 댓글을 단 글은 알림 대상으로 기억해 둡니다. */
   const mine=!!myUid()&&post.uid===myUid();
   if(mine||cm.comments.some(c=>c.mine)||D.watch.some(w=>w.g===gk&&w.no===no))watch(gk,no,post.title,cm.total,mine);else save()}
  catch(e){if(seq!==R.roomSeq)return;R.room.cerr=e.message}
  /* 로그인 아이디를 아직 모르는데 "내 댓글" 표시가 있으면, 아이디를 한 번 확인해 다시 가립니다. */
  const rm=R.room;if(!R.userKnown&&rm.comments?.some(c=>c.my))checkUser().then(()=>{if(R.room===rm){fixMine(rm.comments);renderRoom(true);
   const me=!!R.user&&post.uid===R.user;if(me||rm.comments.some(c=>c.mine))watch(gk,no,post.title,rm.total,me)}})
 }catch(e){if(seq!==R.roomSeq)return;R.room.err=e.message}
 renderRoom(true);renderPane();
}
async function moreComments(){
 const r=R.room;if(!r||r.cbusy)return;r.cbusy=true;renderRoom(true);
 try{const cm=await readCm(gal(r.g),r.no,r.post.token,r.cpage+1),ids=new Set(r.comments.map(c=>c.id)),add=cm.comments.filter(c=>!ids.has(c.id));
  if(add.length){r.comments.push(...add);r.cpage++}else r.noMore=true}catch(e){toast(e.message)}
 r.cbusy=false;if(R.room===r)renderRoom(true);
}
/* 디시는 내가 쓴 글에서는 남의 댓글에도 "내 댓글" 표시(my_cmt)를 붙입니다(글쓴이가 지울 수 있다는 뜻). 그래서 내 댓글인지는 로그인한 아이디와 댓글 아이디를 견주어 정합니다.
   아이디를 아직 모를 때는, 표시가 붙은 댓글의 글쓴이가 여럿이면 내 댓글로 보지 않습니다. */
const myUid=()=>R.userKnown?R.user:D.user||'';
function fixMine(list){const u=myUid();for(const c of list)if(c.my==null)c.my=c.mine;
 const many=new Set(list.filter(c=>c.my).map(c=>c.uid||c.ip+'/'+c.name)).size>1;
 for(const c of list)c.mine=c.my&&(u?c.uid===u:!many)}
async function readCm(...a){const cm=await dc.readComments(...a);fixMine(cm.comments);return cm}
/* 친구 목록의 "최근 글" 문구와 새 글 표시를 채웁니다. 하나씩 요청하고, 1분 안에 읽은 갤러리는 건너뛰며, 막히면 멈춥니다. */
const latestQ=[];let latestRun=false;
async function loadLatest(list=D.gals){
 latestQ.push(...list.filter(g=>!latestQ.includes(g)));if(latestRun)return;latestRun=true;
 const queue=latestQ,work=async()=>{for(let g;(g=queue.shift());){const k=key(g),c=R.cache[k+'|'];if(Date.now()<pvPause){queue.length=0;break}if(c&&Date.now()-c.at<60000)continue;try{const res=await dc.listPosts(g),t=res.posts.find(p=>!p.notice);if(!t)continue;
   R.latest[k]={id:t.id,title:t.title};R.cache[k+'|']={list:{posts:res.posts,heads:res.heads,page:1,more:true},at:Date.now()};
   if(D.top[k]==null)D.top[k]=t.id;else if(t.id>D.top[k]&&k!==R.g)R.updated[k]=true;
   if(R.view==='friends'&&!R.ov)renderPane()}catch{}}};
 await work();latestRun=false;save();
}

/* ---------- 입력 처리 ---------- */
let drag=null,dragged=false,lp=null,lpSkip=false;
document.addEventListener('pointerdown',e=>{
 const c=e.target.closest('.chips,.favs');if(c)drag={c,x:e.clientX,l:c.scrollLeft,moved:false};
 const t=e.target.closest('[data-lp]');if(t&&!e.button){const x=e.clientX,y=e.clientY;lpEnd();
  /* 꾹 누르는 동안 손가락이 조금 흔들려도(8픽셀 이내) 길게 누르기로 봅니다. 그보다 많이 움직이면 아래 mv가 취소합니다. */
  lp=setTimeout(()=>{lpEnd();lpSkip=true;drag=null;longPress(t)},500);
  lpMove=v=>{if(Math.abs(v.clientX-x)+Math.abs(v.clientY-y)>8)lpEnd()};document.addEventListener('pointermove',lpMove)}
});
/* 길게 누르기 대기를 끝냅니다(손을 뗌, 취소, 많이 움직임, 길게 누르기 성립 모두). */
let lpMove=null;
function lpEnd(){clearTimeout(lp);lp=null;if(lpMove){document.removeEventListener('pointermove',lpMove);lpMove=null}}
document.addEventListener('pointermove',e=>{if(!drag)return;const d=e.clientX-drag.x;if(Math.abs(d)>8)drag.moved=true;if(drag.moved)drag.c.scrollLeft=drag.l-d});
document.addEventListener('pointerup',()=>{lpEnd();if(drag&&drag.moved){dragged=true;setTimeout(()=>dragged=false)}drag=null;if(lpSkip)setTimeout(()=>lpSkip=false,50)});
document.addEventListener('pointercancel',()=>{lpEnd();drag=null});
document.addEventListener('wheel',e=>{const c=e.target.closest('.chips,.favs');if(c&&c.scrollWidth>c.clientWidth){c.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
document.addEventListener('contextmenu',e=>{const t=e.target.closest('[data-lp]');if(t){e.preventDefault();longPress(t)}});
function longPress(t){
 if(t.dataset.lp==='gal'){R.gmenu=t.dataset.g;R.ov='gmenu';renderPane()}
 else if(t.dataset.lp==='msg'){R.menu=t.dataset.cid;R.ask=false;renderRoom(true)}
 else if(t.dataset.lp==='con'){pickCon(+t.dataset.con,true)}
}

document.addEventListener('click',e=>{
 if(dragged||lpSkip)return;
 if(e.target.closest('#viewer')){if(e.target.tagName!=='VIDEO')closeViewer();return}
 const z=e.target.closest('[data-zoom]');if(z){$('#viewer').innerHTML='<img src="'+esc(z.src)+'" alt="">';$('#viewer').hidden=false;return}
 if(R.menu!=null&&!e.target.closest('[data-reply],[data-cdel],[data-postdel],[data-pedit]')){R.menu=null;R.ask=false;renderRoom(true)}
 const a=e.target.closest('a[data-url]');if(a){e.preventDefault();native.open(a.dataset.url);return}
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.movie){playMovie(b);return}
 if(d.mvbig!=null){openBig(b);return}
 if(d.yt){playYt(b);return}
 if(d.ytbig){openBigYt(b);return}
 if(d.view){R.view=d.view;R.ov='';renderPane()}
 else if(d.stab!=null){R.stab=d.stab;R.saved=false;if(d.ov)R.ov=d.ov;renderPane();if(d.stab==='계정'&&!R.userKnown)checkUser()}
 else if(d.ov!=null){R.ov=R.ov===d.ov?'':d.ov;if(d.ov==='set')R.stab='';
  if(R.ov==='noti'){for(const n of D.notis)n.read=true;save()}
  renderPane();if(R.ov==='find')$('#findq')?.focus();if(R.ov==='con'&&!R.cons.items)loadCons();if(R.ov==='log'&&R.user&&!R.gallog[R.log])loadGallog()}
 else if(d.log){R.log=d.log;renderPane();if(R.user&&!R.gallog[R.log]?.items)loadGallog()}
 else if(d.glog!=null){const v=R.gallog[R.log]?.items?.[+d.glog];if(v){R.ov='';jump(v)}}
 else if(d.noti!=null){const n=D.notis[+d.noti];if(n){R.ov='';jump(n)}}
 else if(d.noticlear!=null){D.notis=[];save();renderPane()}
 else if(d.alias!=null){D.aliasOn=!D.aliasOn;save();renderPane();renderRoom(true)}
 else if(d.g){openGallery(d.g)}
 else if(d.rec!=null){R.rec=!R.rec;R.shown=20;loadList()}
 else if(d.h!=null){R.head=d.h;R.shown=20;if(R.list?.heads.length)loadList();else renderPane()}
 else if(d.p){openPost(+d.p)}
 else if(d.pintog!=null){R.pinOpen=!R.pinOpen;renderPane()}
 else if(d.nfold!=null){R.nfold=!R.nfold;renderRoom(true)}
 else if(d.more!=null){showMore()}
 else if(d.reload!=null){loadList({fresh:true})}
 else if(d.refresh!=null){refresh()}
 else if(d.gcancel!=null){gaskClose(null)}
 else if(d.glogin!=null){gaskClose('login')}
 else if(d.vote){vote(d.vote==='down')}
 else if(d.orig!=null){R.orig=!R.orig;R.rmenu=false;renderRoom(true)}
 else if(d.rmenu!=null){R.rmenu=!R.rmenu;renderRoom(true);if(d.url)native.open(d.url)}
 else if(d.rreload!=null){if(R.room)openPost(R.room.no,true)}
 else if(d.cmore!=null){moreComments()}
 else if(d.back!=null){R.room=null;R.roomSeq++;renderRoom();renderPane()}
 else if(d.filter!=null){R.filterOn=!R.filterOn;if(!R.filterOn)R.filter='';renderPane();$('#filter')?.focus()}
 else if(d.add!=null){const g=R.search.res[+d.add];if(g&&!gal(key(g))){D.gals.push(g);save();renderPane();loadLatest([g])}}
 else if(d.mephoto!=null){pickPhoto(u=>{D.me.photo=u;save();renderPane();renderRoom(true)})}
 else if(d.mephotodel!=null){delete D.me.photo;save();renderPane();renderRoom(true)}
 else if(d.gphoto){const k=d.gphoto;pickPhoto(u=>{D.photos[k]=u;save();R.ov='';renderPane();renderRoom(true)})}
 else if(d.gphotodel){delete D.photos[d.gphotodel];save();R.ov='';renderPane();renderRoom(true)}
 else if(d.fav){const i=D.favs.indexOf(d.fav);if(i<0){D.favs.push(d.fav);loadLatest([gal(d.fav)].filter(Boolean))}else D.favs.splice(i,1);save();R.ov='';renderPane()}
 else if(d.remove){D.gals=D.gals.filter(g=>key(g)!==d.remove);D.favs=D.favs.filter(k=>k!==d.remove);if(R.g===d.remove){R.g=null;R.list=null;R.room=null;renderRoom()}save();R.ov='';renderPane()}
 else if(d.open){const g=gal(d.open);native.open('https://gall.dcinside.com/'+(g.type==='minor'?'mgallery/':g.type==='mini'?'mini/':'')+'board/lists/?id='+g.id)}
 else if(d.url){native.open(d.url)}
 else if(d.write!=null){if(!gal(R.g))return;R.write={g:R.g,title:'',head:R.list?.heads[0]?.id??'',text:'',blocks:[],pending:[],menu:false,busy:false,err:''};renderRoom();$('#wtitle')?.focus()}
 else if(d.wcancel!=null){if(R.write.busy)return;for(const x of [...R.write.blocks,...R.write.pending])if(x.url)URL.revokeObjectURL(x.url);R.write=null;renderRoom()}
 else if(d.pub!=null){publish()}
 else if(d.del!=null){R.write.blocks.splice(+d.del,1);renderWrite()}
 else if(d.pdel!=null){R.write.pending.splice(+d.pdel,1);renderWrite()}
 else if(d.attach!=null){R.write.menu=!R.write.menu;renderWrite()}
 else if(d.pick){const i=$('#pick');i.accept=d.pick+'/*';i.click()}
 else if(d.cpanel!=null){R.cpanel=!R.cpanel;R.tpanel=false;R.con1=null;renderRoom(true);if(R.cpanel&&!R.cons.items)loadCons()}
 else if(d.tpanel!=null){R.tpanel=!R.tpanel;R.cpanel=false;renderRoom(true);$('#tcin')?.focus({preventScroll:true})}
 else if(d.con!=null){pickCon(+d.con,false)}
 else if(d.conpkg!=null){R.conPkg=d.conpkg;R.con1=null;renderRoom(true);if(R.ov==='con')renderPane()}
 else if(d.conshop!=null){native.official(DCCON_SHOP).then(()=>{R.cons.items=null;loadCons(true)})}
 else if(d.tbg){D.tbg=d.tbg;save();renderRoom(true)}
 else if(d.tfg){D.tfg=d.tfg;save();renderRoom(true)}
 else if(d.tuse){R.tcon=d.tuse;renderRoom(true)}
 else if(d.tclear!=null){D.trecent=[];save();renderRoom(true)}
 else if(d.tsend!=null){const t=R.tcon.trim();if(t)sendToRoom('txtcon',{text:t,bg:D.tbg,fg:D.tfg}).then(ok=>{if(ok){D.trecent=[t,...D.trecent.filter(x=>x!==t)].slice(0,6);save();R.tcon='';renderRoom(true)}})}
 else if(d.reply){R.reply=R.room.comments.find(c=>c.id===d.reply)||null;renderRoom(true);$('#cform textarea').focus()}
 else if(d.noreply!=null){R.reply=null;renderRoom(true)}
 else if(d.cdel){removeComment(d.cdel)}
 else if(d.postdel!=null){if(!R.ask){R.ask=true;R.menu='body';renderRoom(true)}else removePost()}
 else if(d.pedit!=null){const room=R.room;native.official(mModify(gal(room.g),room.no)).then(()=>{if(R.room===room)openPost(room.no,true)})}
 else if(d.login!=null){login().then(()=>renderPane())}
 else if(d.logout!=null){native.logout().then(()=>{R.user='';D.user='';save();R.cons.items=null;R.gallog={};renderPane();toast('로그아웃했습니다.')})}
});
/* 디시콘 고르기: 짧게 누르면 1개 등록, 꾹 눌러 하나를 고른 뒤 다른 것을 누르면 2개(더블콘) 등록 */
function pickCon(i,held){
 const C=R.cons.items;if(!C||!C[i])return;
 const redraw=()=>{renderRoom(true);if(R.ov==='con')renderPane()};
 if(!R.room){toast('디시콘은 채팅방 안에서 보낼 수 있습니다.');return}
 if(R.con1!=null){const a=C[R.con1];if(R.con1===i){R.con1=null;return redraw()}R.con1=null;sendToRoom('dccon',{items:[a,C[i]]});return}
 if(held){R.con1=i;return redraw()}
 sendToRoom('dccon',{items:[C[i]]});
}
document.addEventListener('input',e=>{const t=e.target;
 if(t.id==='filter'){R.filter=t.value.trim();const pos=t.selectionStart;renderPane();const n=$('#filter');n.focus();n.setSelectionRange(pos,pos)}
 else if(t.matches('#cform textarea'))t.form.querySelector('.send').classList.toggle('ok',!!t.value.trim()&&!R.sending);
 else if(t.id==='wtitle')R.write.title=t.value;
 else if(t.id==='wbody')R.write.text=t.value;
 else if(t.id==='tcin'){R.tcon=t.value;const p=$('#tcprev');p.textContent=t.value;p.style.cssText=tstyle(t.value,D.tbg,D.tfg)}});
const LIMIT={image:20*1024*1024,video:100*1024*1024};
document.addEventListener('change',e=>{
 if(e.target.id==='whead')R.write.head=e.target.value;
 else if(e.target.id==='pick'){for(const f of e.target.files){const video=f.type.startsWith('video');
   if(f.size>(video?LIMIT.video:LIMIT.image)){toast((video?'동영상은 100MB':'사진은 20MB')+'까지 올릴 수 있습니다: '+f.name);continue}
   R.write.pending.push({file:f,name:f.name,video,url:URL.createObjectURL(f)})}R.write.menu=false;R.write.err='';renderWrite()}
 else if(e.target.matches('.slot select')){const t=e.target.nextElementSibling;t.disabled=e.target.value!=='custom';if(!t.disabled)t.focus()}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
 if(f.id==='findf'){const S=R.search;S.q=$('#findq').value.trim();if(!S.q)return;S.busy=true;S.err='';renderPane();try{S.res=await dc.searchGalleries(S.q)}catch(x){S.err=x.message;S.res=null}S.busy=false;renderPane()}
 else if(f.id==='gform'){const nick=f.elements.gnick.value.trim(),pw=f.elements.gpw.value;if(!nick||pw.length<2){f.querySelector('.gerr').textContent='닉네임과 비밀번호(2자 이상)를 입력해 주세요.';return}D.guest={nick,pw};save();gaskClose('guest')}
 else if(f.id==='setf'){const el=f.elements;if(R.stab==='계정'){const nick=el.gnick.value.trim(),pw=el.gpw.value;D.guest=nick&&pw.length>=2?{nick,pw}:null;if((nick||pw)&&!D.guest){toast('닉네임과 비밀번호(2자 이상)를 모두 입력해 주세요.');return}}else if(R.stab==='프로필'){D.me.name=el.name.value.trim()||'ㅇㅇ';D.me.status=el.status.value.trim()}else D.rooms=D.rooms.map((r,i)=>({mode:el['m'+i].value,text:el['t'+i].value.trim()}));save();R.saved=true;renderPane();renderRoom(true)}
 else if(f.id==='cform'){const text=f.querySelector('textarea').value.trim();if(text&&await sendToRoom('comment',{text})){const t=$('#cform textarea');if(t){t.value='';t.form.querySelector('.send').classList.remove('ok')}}}
 else if(f.id==='wform')sendDraft()});
/* 뒤로 가기(안드로이드 뒤로 버튼, Esc): 열린 창을 하나씩 닫고, 닫을 것이 없으면 false를 돌려 앱이 종료 처리하게 합니다. */
window.yjBack=()=>{if(!$('#viewer').hidden){closeViewer();return true}
 if(!gask.hidden){gaskClose(null);return true}
 if(R.write){if(!R.write.busy){R.write=null;renderRoom()}return true}
 if(R.rmenu||R.orig){R.rmenu=R.orig=false;renderRoom(true);return true}
 if(R.cpanel||R.tpanel||R.menu!=null){R.cpanel=R.tpanel=false;R.menu=null;renderRoom(true);return true}
 if(R.ov){R.ov='';renderPane();return true}
 if(R.room){R.room=null;R.roomSeq++;renderRoom();renderPane();return true}if(R.view==='chats'){R.view='friends';renderPane();return true}return false};
/* ---------- 휴대폰 스크롤 손잡이 ---------- */
/* 휴대폰 브라우저의 스크롤 막대는 손가락으로 잡을 수 없어서, 오른쪽 끝에 잡고 끌 수 있는 손잡이를 따로 둡니다.
   목록을 움직이거나 건드리면 나타나고, 2초 동안 가만히 두면 사라집니다. PC는 원래 막대를 마우스로 끌 수 있어 쓰지 않습니다(app.css에서 숨김). */
const sth=document.createElement('div');sth.id='sthumb';sth.innerHTML='<i></i>';document.body.append(sth);
let sthId='',sthHide=0,sthGrab=null;
const sthBox=()=>{const s=sthId&&document.getElementById(sthId);if(!s||s.scrollHeight<=s.clientHeight+4)return null;
 const r=s.getBoundingClientRect(),h=Math.max(44,r.height*s.clientHeight/s.scrollHeight),max=s.scrollHeight-s.clientHeight;return {s,r,h,max}};
function sthShow(s){
 if(s)sthId=s.id;const b=sthBox();if(!b){sth.classList.remove('on');return}
 sth.style.height=b.h+'px';sth.style.top=b.r.top+(b.r.height-b.h)*b.s.scrollTop/b.max+'px';sth.classList.add('on');
 clearTimeout(sthHide);if(!sthGrab)sthHide=setTimeout(()=>sth.classList.remove('on'),2000);
}
document.addEventListener('scroll',e=>{const t=e.target;if(t.id&&t.classList&&t.classList.contains('scroll'))sthShow(t)},true);
document.addEventListener('touchstart',e=>{const s=e.target.closest&&e.target.closest('.scroll[id]');if(s)sthShow(s)},{passive:true});
sth.addEventListener('pointerdown',e=>{const b=sthBox();if(!b)return;e.preventDefault();sth.setPointerCapture(e.pointerId);sthGrab={off:e.clientY-sth.getBoundingClientRect().top};clearTimeout(sthHide);sth.classList.add('drag')});
sth.addEventListener('pointermove',e=>{if(!sthGrab)return;const b=sthBox();if(!b)return;b.s.scrollTop=Math.max(0,Math.min(1,(e.clientY-sthGrab.off-b.r.top)/(b.r.height-b.h)))*b.max});
const sthEnd=()=>{if(!sthGrab)return;sthGrab=null;sth.classList.remove('drag');sthShow()};
sth.addEventListener('pointerup',sthEnd);sth.addEventListener('pointercancel',sthEnd);

/* ---------- 새로고침 ---------- */
/* 지금 보이는 화면을 다시 읽습니다: 열려 있는 글, 글 목록, 친구 목록의 최근 글 순서로 봅니다. 디시가 막지 않도록 3초 안에는 다시 받지 않습니다. */
let refreshAt=0;
function refresh(){
 if(R.write||R.ov||Date.now()-refreshAt<3000)return false;refreshAt=Date.now();
 if(R.room)openPost(R.room.no,true);
 else if(R.view==='chats'){if(!gal(R.g))return false;loadList({fresh:true})}
 else{if(!D.gals.length)return false;for(const g of D.gals){const c=R.cache[key(g)+'|'];if(c)c.at=0}toast('최근 글 새로 읽는 중');loadLatest()}
 return true;
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')window.yjBack();
 else if(e.key==='F5'||(e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='r')){e.preventDefault();refresh()}});
/* 휴대폰: 목록이 맨 위일 때 아래로 당겼다 놓으면 새로고침합니다. */
const ptr=document.createElement('div');ptr.id='ptr';ptr.innerHTML=I.refresh;document.body.append(ptr);
let pull=null;
const ptrSet=(y,spin)=>{ptr.classList.toggle('turn',!!spin);ptr.classList.toggle('drag',!spin&&y>0);ptr.style.transform='translate(-50%,'+y+'px) rotate('+y*4+'deg)';ptr.style.opacity=y?Math.min(1,y/40):0};
document.addEventListener('touchstart',e=>{const s=e.target.closest('#fscroll,#cscroll,#rscroll');pull=s&&s.scrollTop<=0&&e.touches.length===1?{s,x:e.touches[0].clientX,y:e.touches[0].clientY,d:0}:null},{passive:true});
document.addEventListener('touchmove',e=>{if(!pull)return;const t=e.touches[0],dx=t.clientX-pull.x,dy=t.clientY-pull.y;
 if(!pull.d&&(dy<0||Math.abs(dx)>Math.abs(dy))||pull.s.scrollTop>0){pull=null;ptrSet(0);return}
 pull.d=Math.min(70,dy/2);ptrSet(pull.d)},{passive:true});
const pullEnd=()=>{if(!pull)return;const go=pull.d>=50;pull=null;if(go&&refresh()){ptrSet(46,true);setTimeout(()=>ptrSet(0),700)}else ptrSet(0)};
document.addEventListener('touchend',pullEnd);document.addEventListener('touchcancel',()=>{pull=null;ptrSet(0)});

/* 0.1.6~0.1.8은 친구 목록에 디시 흥한 갤러리 20개를 자동으로 넣었습니다. 그 기능을 없애면서, 그때 들어간 갤러리를 한 번 치웁니다.
   흥한 갤러리 순위에 있고, 즐겨찾기가 아니고, 한 번도 열어 본 적 없는 정식 갤러리만 지웁니다. 직접 추가해 쓰던 갤러리는 남습니다. */
async function unseedFriends(){
 if(!D.seeded||D.unseeded)return;
 try{const r=await native.http('https://json2.dcinside.com/json1/ranking_gallery.php?jsoncallback=cb',{headers:{Referer:'https://gall.dcinside.com/'}});
  const hot=new Set(JSON.parse(r.text.trim().replace(/^cb\(/,'').replace(/\)\s*;?$/,'')).map(x=>String(x.id||''))),used=Object.keys(D.seen);
  D.gals=D.gals.filter(g=>{const k=key(g);return !(g.type==='normal'&&hot.has(g.id)&&!D.favs.includes(k)&&D.top[k]==null&&k!==R.g&&!used.some(s=>s.startsWith(k+'/')))});
  D.unseeded=true;save();if(R.view==='friends'&&!R.ov)renderPane();
 }catch{}
}
renderPane();renderRoom();unseedFriends().then(()=>loadLatest()).then(checkUser);
