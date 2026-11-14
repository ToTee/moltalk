// 양지톡 화면. 디시 읽기 코어(dc.js)의 결과를 메신저 모양으로 보여 줍니다.
import {createDc} from '../core/dc.js';
import {script,mView,mList,mWrite,mModify,mGallog,LOGIN_URL,LOGIN_DONE} from '../core/drive.js';
import {I} from './icons.js';
import {androidNative} from './native-android.js';

const native=window.native||androidNative(window.YJ);
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
const userAv=n=>'<span class="av" style="background:'+hue(n)+'">'+I.sil+'</span>';

/* ---------- 저장되는 설정 ---------- */
const LS='yangjitalk-v1';
const D=Object.assign({
 gals:[{id:'dcbest',type:'normal',name:'실시간 베스트'},{id:'singlebungle1472',type:'minor',name:'싱글벙글 지구촌'},{id:'programming',type:'normal',name:'프로그래밍'}],
 favs:['normal:dcbest','minor:singlebungle1472'],me:{name:'ㅇㅇ',status:''},rooms:[],alias:{},aliasN:0,aliasOn:false,seen:{},top:{},tbg:'3b4890',tfg:'ffffff',trecent:[],watch:[],notis:[]
},JSON.parse(localStorage.getItem(LS)||'{}'));
while(D.rooms.length<10)D.rooms.push({mode:'random',text:''});
const save=()=>{const keys=Object.keys(D.seen);if(keys.length>3000)for(const k of keys.slice(0,keys.length-2000))delete D.seen[k];localStorage.setItem(LS,JSON.stringify(D))};
const key=g=>g.type+':'+g.id;
const gal=k=>D.gals.find(g=>key(g)===k);

/* ---------- 사람 이름으로 바꾸기 ---------- */
const SUR=[...'조안김고백권문서유황차윤'],GIV=['민수','영호','재일','은채','승우','순용','지현','동혁','선아','보람','준석','하늘'];
const STATS=['오늘도 화이팅','','Carpe diem','주말엔 등산','','Have a nice day :)','커피 없인 못 살아','','Stay hungry, stay foolish','연락은 문자로','','No pain, no gain','봄이 오면'];
const personName=n=>SUR[n%12]+GIV[(n*5+Math.floor(n/12))%12];
/* 갤러리마다 사람 이름과 문구를 처음 한 번만 정해 저장하고, 이후에는 계속 같은 것을 씁니다. */
function alias(g){const k=key(g);if(!D.alias[k]){D.alias[k]={name:personName(D.aliasN++),stat:STATS[Math.floor(Math.random()*STATS.length)]};save()}return D.alias[k]}
const gname=g=>D.aliasOn?alias(g).name:g.name;
const galAv=g=>D.aliasOn?userAv(alias(g).name):'<span class="av" style="background:'+hue(g.name)+'">'+esc([...g.name][0]||'?')+'</span>';
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
 gallog:{},user:'',userKnown:false,reply:null,menu:null,ask:false,cpanel:false,tpanel:false,cons:{items:null,busy:false,err:''},con1:null,tcon:'',write:null,sending:false,toBottom:false};
const who=x=>x.name+(x.ip?'('+x.ip+')':'');
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
  '<span class="ic deco" aria-hidden="true">'+I.more+'</span><span class="sp"></span>'+
  '<button class="ic'+(R.ov==='con'?' on':'')+'" data-ov="con" aria-label="디시콘">'+two(I.smile,I.conM)+'</button>'+
  '<button class="ic'+(R.ov==='noti'?' on':'')+'" data-ov="noti" aria-label="알림">'+two(I.bell,I.bellF)+(D.notis.some(n=>!n.read)?'<i class="dot" style="left:auto;right:-2px;top:-2px"></i>':'')+'</button>'+
  '<button class="ic'+(D.aliasOn?' on':'')+'" data-alias aria-pressed="'+D.aliasOn+'" aria-label="갤러리 이름을 사람 이름으로 바꾸기">'+two(I.sun,I.sunF)+'</button>'+
  '<button class="ic'+(R.ov==='set'?' on':'')+'" data-ov="set" aria-label="설정">'+I.cog+'</button>';
}

/* ---------- 친구(갤러리 목록) ---------- */
function friendsHtml(){
 const row=g=>{const k=key(g),st=D.aliasOn?alias(g).stat:R.latest[k]?.title||'';
  return '<button class="row'+(k===R.g?' sel':'')+'" data-g="'+esc(k)+'" data-lp="gal">'+(R.updated[k]?'<i class="dot"></i>':'')+galAv(g)+'<span class="tx"><b>'+esc(gname(g))+'</b>'+(st?'<span class="st">'+esc(st)+'</span>':'')+'</span></button>'};
 const favs=D.favs.map(gal).filter(Boolean),upd=D.gals.filter(g=>R.updated[key(g)]),all=[...D.gals].sort((a,b)=>gname(a).localeCompare(gname(b),'ko'));
 return '<div class="head fr"><h2>친구</h2><button class="who m-only" data-ov="log" aria-label="내 프로필 열기"><span class="av" style="background:#8aa3b8">'+I.sil+'</span><span>'+esc(D.me.name)+'</span></button><button class="ib" data-ov="find" aria-label="갤러리 검색">'+I.search+'</button><button class="ib" data-ov="find" aria-label="갤러리 추가">'+I.plusGal+'</button>'+cogM+'</div>'+
  '<div class="scroll" id="fscroll">'+
  /* 휴대폰 친구 화면 맨 위의 광고 칸: 누르면 블카이브를 기기의 브라우저로 엽니다. */
  '<button class="adb m-only" data-url="https://blinkarea.synology.me/" aria-label="광고: 블카이브 열기"><span class="tx"><b>블랙핑크의 모든 기록, 블카이브</b><span>사진·영상·음원 기록을 한곳에서</span><i>지금 구경하기 ›</i></span><span class="logo"><b>블카이브</b><i>BLINK AREA</i></span><em>AD</em></button>'+
  '<div class="me"><span class="av" style="background:#8aa3b8">'+I.sil+'</span><span><b>'+esc(D.me.name)+'</b><span>'+esc(D.me.status)+'</span></span><button class="pill" data-ov="log">프로필</button></div>'+
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
 const rowHtml=p=>{const pi=pins.indexOf(p),n=unreadOf(p),author=who(p);
  const pv=p.notice?p.title:R.pv[R.g+'/'+p.id]||(p.hasVideo?'동영상을 보냈습니다.':p.hasImage?'사진을 보냈습니다.':author+' · 조회 '+p.views.toLocaleString());
  return '<button class="row post'+(R.room&&R.room.g===R.g&&R.room.no===p.id?' sel':'')+'" data-p="'+p.id+'">'+
   (p.notice?'<span class="av grid">'+[0,1,2,3].map(i=>'<i style="background:'+COLORS[(hash(p.id)+i)%COLORS.length]+'"></i>').join('')+'</span>':userAv(author))+
   '<span class="tx"><b><span class="t">'+esc(p.notice?noticeName(g,pi,p):p.title)+'</span><small>'+(p.notice?pins.length:p.comments)+'</small>'+(p.notice?I.pin:'')+'</b><span class="pv">'+esc(pv)+'</span></span>'+
   '<span class="rt">'+listTime(p.time)+(n?'<br><em>'+n+'</em>':'')+'</span></button>'};
 /* 처음에는 20개만 보여 주고, 아래로 스크롤하면 10개씩 더 보여 줍니다. 보이는 글만 본문 미리보기를 읽어 옵니다. */
 const shownPins=posts.filter(p=>p.notice),allRest=posts.filter(p=>!p.notice),rest=allRest.slice(0,R.shown);
 R.hidden=allRest.length-rest.length;
 const body=!L?(R.listErr?'<div class="empty">'+esc(R.listErr)+'<br><button class="pill" data-reload>다시 시도</button></div>':'<div class="spin">불러오는 중…</div>'):
  (R.pinOpen?shownPins:shownPins.slice(0,1)).map(rowHtml).join('')+(shownPins.length>1?'<button class="pintog" data-pintog aria-expanded="'+R.pinOpen+'" aria-label="'+(R.pinOpen?'공지 접기':'공지 '+(shownPins.length-1)+'개 더 보기')+'"></button>':'')+
  (rest.length?rest.map(rowHtml).join(''):'<div class="empty">이 탭에는 아직 글이 없습니다.</div>')+
  (R.hidden>0||(L.more&&!(plain&&R.head))?'<button class="more-row" data-more>'+(R.listBusy?'불러오는 중…':'이전 글 더 보기')+'</button>':'');
 return '<div class="head"><h2>채팅 <small>▼</small></h2><button class="ib'+(R.filterOn?' act':'')+'" data-filter aria-label="글 검색">'+I.search+'</button><button class="ib" data-write aria-label="글쓰기">'+I.write+'</button>'+cogM+'</div>'+
  (R.filterOn?'<div class="searchbar"><input id="filter" placeholder="불러온 글 제목에서 찾기" value="'+esc(R.filter)+'"></div>':'')+
  '<div class="chips" id="chips">'+tabs.map(t=>'<button class="chip'+(String(t.id)===String(R.head)?' on':'')+'" data-h="'+esc(t.id)+'">'+esc(t.name)+'</button>').join('')+
  '<button class="chip ico'+(R.pinOpen?' on':'')+'" data-pintog aria-pressed="'+R.pinOpen+'" aria-label="'+(R.pinOpen?'공지 접기':'공지 모두 보기')+'">'+I.listp+(!R.pinOpen&&pins.length>1?'<i class="cdot"></i>':'')+'</button></div>'+
  '<div class="scroll" id="cscroll">'+body+'</div>';
}

/* ---------- 겹쳐 뜨는 창(갤러리 찾기, 설정, 갤로그, 알림, 디시콘) ---------- */
function overlayHtml(){
 const x='<button class="ib" data-ov="" aria-label="닫기">✕</button>';
 if(R.ov==='find'){const S=R.search;
  return '<div class="ov"><div class="head"><h2>갤러리 추가</h2>'+x+'</div><form class="searchbar" id="findf"><input id="findq" placeholder="갤러리 이름 검색" maxlength="60" value="'+esc(S.q)+'"><button class="pill">검색</button></form><div class="scroll">'+
   (S.busy?'<div class="spin">찾는 중…</div>':S.err?'<div class="empty">'+esc(S.err)+'</div>':!S.res?'<div class="empty">보고 싶은 갤러리 이름을 검색해 친구로 추가하세요.</div>':!S.res.length?'<div class="empty">검색 결과가 없습니다.</div>':
    S.res.map((g,i)=>'<div class="row">'+'<span class="av" style="background:'+hue(g.name)+'">'+esc([...g.name][0]||'?')+'</span><span class="tx"><b>'+esc(g.name)+'</b><span class="st">'+({normal:'갤러리',minor:'마이너 갤러리',mini:'미니 갤러리'}[g.type])+' · '+esc(g.id)+'</span></span>'+(gal(key(g))?'<span class="st">추가됨</span>':'<button class="pill" data-add="'+i+'">추가</button>')+'</div>').join(''))+'</div></div>'}
 if(R.ov==='gmenu'){const g=gal(R.gmenu);if(!g)return '';const fav=D.favs.includes(R.gmenu);
  return '<div class="ov"><div class="head"><h2>'+esc(gname(g))+'</h2>'+x+'</div><div class="scroll setlist"><button class="row" data-fav="'+esc(R.gmenu)+'"><span class="tx"><b>'+(fav?'즐겨찾기 해제':'즐겨찾기 추가')+'</b></span></button><button class="row" data-open="'+esc(R.gmenu)+'"><span class="tx"><b>디시에서 열기</b></span></button><button class="row" data-remove="'+esc(R.gmenu)+'"><span class="tx"><b>친구 목록에서 삭제</b></span></button></div></div>'}
 if(R.ov==='set')return settingsHtml(x);
 if(R.ov==='log'){const cur=R.gallog[R.log];
  const list=!R.userKnown?'<div class="spin">로그인 상태 확인 중…</div>':!R.user?'<div class="empty">로그인하면 갤로그가 여기에 나옵니다.<br><button class="pill" data-login>로그인</button></div>':
   !cur||cur.busy?'<div class="spin">불러오는 중…</div>':cur.err?'<div class="empty">'+esc(cur.err)+'<br><button class="pill" data-log="'+R.log+'">다시 시도</button></div>':
   !cur.items.length?'<div class="empty">'+(R.log==='방명록'?'방명록이 비어 있습니다.':'표시할 '+R.log+'이 없습니다.')+'</div>':
   R.log==='방명록'?cur.items.map(v=>'<div class="row">'+userAv(v.name)+'<span class="tx"><b>'+esc(v.name)+'</b><span class="st">'+esc(v.text)+' · '+esc(v.date)+'</span></span></div>').join(''):
   cur.items.map((v,i)=>'<button class="row" data-glog="'+i+'"><span class="tx"><b>'+esc(v.title)+'</b><span class="st">'+esc(v.sub)+'</span></span></button>').join('');
  return '<div class="ov"><div class="cover">'+x+'<span class="av" style="background:#8aa3b8">'+I.sil+'</span><b>'+esc(D.me.name)+'</b><span>'+esc(D.me.status)+'</span></div>'+
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
  const sum={'프로필':D.me.name+(D.me.status?' · '+D.me.status:''),'공지 채팅방 이름':'직접 입력 '+custom+'개 · 랜덤 '+(D.rooms.length-custom)+'개','계정':!R.userKnown?'확인 중…':R.user?'로그인됨':'로그인하지 않음','정보':'양지톡 '+(native.version||'')};
  return '<div class="ov"><div class="head"><h2>설정</h2>'+x+'</div><div class="scroll setlist">'+TABS.map(t=>'<button class="row" data-stab="'+t+'"><span class="tx"><b>'+t+'</b><span class="st">'+esc(sum[t])+'</span></span>'+I.next+'</button>').join('')+'</div></div>'}
 const body=R.stab==='프로필'?'<label>이름<input name="name" maxlength="20" value="'+esc(D.me.name)+'"></label><label>상태메시지<input name="status" maxlength="40" value="'+esc(D.me.status)+'"></label><p>친구 화면 맨 위 내 프로필에 표시되는 문구입니다.</p>':
  R.stab==='공지 채팅방 이름'?D.rooms.map((r,i)=>'<div class="slot"><span>'+(i+1)+'</span><select name="m'+i+'" aria-label="공지 '+(i+1)+' 이름 방식"><option value="random"'+(r.mode==='random'?' selected':'')+'>랜덤 이름</option><option value="custom"'+(r.mode==='custom'?' selected':'')+'>직접 입력</option></select><input name="t'+i+'" maxlength="30" placeholder="예: 대학 동기 모임" aria-label="공지 '+(i+1)+' 이름" value="'+esc(r.text)+'"'+(r.mode==='custom'?'':' disabled')+'></div>').join('')+'<p>갤러리마다 위에서부터 1번째, 2번째 공지에 차례로 적용됩니다. 직접 입력 칸이 비어 있으면 랜덤 이름이 쓰입니다.</p>':
  R.stab==='계정'?'<p>'+(!R.userKnown?'로그인 상태를 확인하는 중입니다…':R.user?'로그인됨: '+esc(R.user):'로그인하지 않았습니다.')+'</p><p>로그인은 디시인사이드 공식 로그인 화면에서 직접 합니다. 양지톡은 비밀번호를 저장하지도, 볼 수도 없습니다.</p><div class="savebar">'+(R.user?'<button type="button" class="pill" data-logout>로그아웃</button>':'<button type="button" class="save" data-login>로그인</button>')+'</div>':
  '<p>양지톡 '+esc(native.version||'')+'</p><p>디시인사이드를 메신저 화면으로 보는 비공식 열람 앱입니다. 디시인사이드와 관련이 없으며, 게시물과 첨부물의 권리는 각 작성자에게 있습니다.</p>';
 return '<div class="ov"><div class="head"><button type="button" class="ib bk" data-stab="" aria-label="설정 목록으로">'+I.back+'</button><h2>'+R.stab+'</h2>'+x+'</div><form id="setf" class="setf">'+body+
  (R.stab==='정보'||R.stab==='계정'?'':'<div class="savebar"><span role="status">'+(R.saved?'저장했습니다.':'')+'</span><button class="save">확인</button></div>')+'</form></div>';
}

function renderPane(){
 const keep={f:$('#fscroll')?.scrollTop||0,c:$('#cscroll')?.scrollTop||0,ch:$('#chips')?.scrollLeft||0,fv:$('#pane .favs')?.scrollLeft||0};
 $('#pane').innerHTML=(R.view==='friends'?friendsHtml():chatsHtml())+overlayHtml();
 if($('#fscroll'))$('#fscroll').scrollTop=keep.f;if($('#cscroll'))$('#cscroll').scrollTop=keep.c;if($('#chips'))$('#chips').scrollLeft=keep.ch;if($('#pane .favs'))$('#pane .favs').scrollLeft=keep.fv;
 renderRail();previews();
}
/* 화면에 나온 글의 본문 첫 부분을 읽어 미리보기 줄에 채웁니다. 한 번에 둘씩만 요청하고, 읽은 본문은 글을 열 때 다시 씁니다. */
/* 디시는 요청이 잦으면 한동안 막기 때문에, 미리보기는 한 번에 하나씩 간격을 두고 읽고, 읽은 것은 기기에 저장해 다시 읽지 않습니다. 막히면 1분 쉽니다. */
const pvBusy=new Set(),PVLS='yangjitalk-pv';
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
   R.pv[k]=t?t.v.replace(/\s+/g,' ').slice(0,120):post.blocks.some(b=>b.t==='video'||b.t==='embed')?'동영상을 보냈습니다.':post.blocks.length?'사진을 보냈습니다.':'';
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
const bub=(t,q='')=>'<div class="bub">'+q+linkify(t)+(t.length>280||t.split('\n').length>8?'<div class="more" aria-hidden="true"><span>전체보기</span>'+I.next+'</div>':'')+'</div>';
const conVideo=(src,alt)=>'<video class="dcon1" autoplay loop muted playsinline src="'+esc(src)+'" aria-label="'+esc(alt||'디시콘')+'"></video>';
/* 디시콘 주소는 그림일 수도 영상일 수도 있습니다. 그림으로 못 읽으면 영상으로 한 번 바꿔 봅니다. */
document.addEventListener('error',e=>{const n=e.target;if(n.tagName==='IMG'&&n.classList.contains('dcon1')&&n.isConnected)n.outerHTML=conVideo(n.src,n.alt)},true);
function blockHtml(b,q=''){
 if(b.t==='text')return bub(b.v,q);
 if(b.t==='img')return '<img class="media" loading="lazy" src="'+esc(b.src)+'" alt="'+esc(b.alt||'본문 사진')+'" data-zoom>';
 if(b.t==='txtcon')return '<div class="tcon" style="'+tstyle(b.v,b.bg,b.fg)+'">'+esc(b.v)+'</div>';
 if(b.t==='dccon')return b.video?conVideo(b.src,b.alt):'<img class="dcon1" loading="lazy" src="'+esc(b.src)+'" alt="'+esc(b.alt||'디시콘')+'">';
 if(b.t==='video')return '<video class="media" controls preload="none" src="'+esc(b.src)+'"'+(b.poster?' poster="'+esc(b.poster)+'"':'')+'></video>';
 return '<button class="embed" data-url="'+esc(b.src)+'">동영상·외부 콘텐츠 열기</button>';
}
function renderRoom(keep){
 if(R.write)return renderWrite();
 const el=$('#room'),r=R.room;
 if(!r){el.innerHTML='';$('#app').classList.remove('in-room');return}
 const g=gal(r.g),p=r.post,meta=r.meta,top=keep?$('#rscroll')?.scrollTop||0:0,draft=keep?$('#room textarea')?.value||'':'';
 el.className='room';$('#app').classList.add('in-room');
 const title=meta.notice?noticeName(g,r.pinIdx,meta):meta.title,author=who(p||meta);
 let h='';
 if(p){
  const merged=[];for(const b of p.blocks){const l=merged[merged.length-1];if(b.t==='text'&&l&&l.t==='text')l.v+='\n'+b.v;else merged.push({...b})}
  const msgs=merged.map(b=>({w:author,b,d:parseTime(p.time)}));
  msgs.push({sys:'댓글 '+(r.total??p.commentCount)+'개'});
  const byId=new Map((r.comments||[]).map(c=>[c.id,c]));
  for(const c of r.comments||[]){const par=c.parentId&&byId.get(c.parentId);
   const q=par?'<div class="q"><b>'+esc(who(par))+'에게 답장</b><span>'+esc(par.blocks.map(b=>b.t==='text'?b.v:b.t==='dccon'?'(디시콘)':'(사진)').join(' '))+'</span></div>':'';
   c.blocks.forEach((b,i)=>msgs.push({w:who(c),b,d:parseTime(c.time),q:i===0?q:'',mine:c.mine,c,lastBlock:i===c.blocks.length-1,isAuthor:!!p.uid&&c.uid===p.uid||(!p.uid&&!c.uid&&c.ip&&c.ip===p.ip&&c.name===p.name)}))}
  /* 꾹 누르면 나오는 버튼: 댓글은 답장(+내 댓글이거나 내 글이면 삭제), 내가 쓴 글의 본문은 수정·삭제 */
  const myPost=!!R.user&&p.uid===R.user;
  let day='';
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
    '<div class="m'+(first?' first':'')+'"><div class="avc">'+(first?userAv(m.w):'')+'</div><div class="col">'+(first?'<div class="nm">'+esc(m.w)+(i<merged.length||m.isAuthor?'<i>글쓴이</i>':'')+'</div>':'')+ln+'</div></div>';
  });
  if(r.cerr)h+='<div class="sys err"><span>'+esc(r.cerr)+'</span></div>';
  else if(!r.comments)h+='<div class="sys"><span>댓글 불러오는 중…</span></div>';
  else if(r.total>r.comments.length&&!r.noMore)h+='<div class="sys"><button data-cmore>'+(r.cbusy?'불러오는 중…':'댓글 더 보기')+'</button></div>';
 }else h=r.err?'<div class="sys err"><span>'+esc(r.err)+'</span></div><div class="sys"><button data-rreload>다시 시도</button></div>':'<div class="sys"><span>불러오는 중…</span></div>';
 const people=p?new Set([author,...(r.comments||[]).map(who)]).size:1;
 el.innerHTML='<div class="rhead"><button class="ib back" data-back aria-label="목록으로">'+I.back+'</button>'+userAv(author)+'<span class="tt"><b>'+esc(title)+'</b><span>'+esc(gname(g))+' · 참여 '+people+'명</span></span>'+
  '<button class="ib" data-rreload aria-label="새로고침">'+I.refresh+'</button><button class="ib" data-url="'+esc(postUrl(g,r.no))+'" aria-label="디시에서 열기">'+I.menu+'</button></div>'+
  (R.nfold?'<button class="nmini" data-nfold aria-label="공지 펼치기">'+I.horn+'</button>':'<div class="notice">'+I.horn+'<span class="tx"><div>'+((p||meta).head?'['+esc((p||meta).head)+'] ':'')+esc(meta.title)+'</div><div>'+esc(author)+' · 조회 '+((p||meta).views||0).toLocaleString()+' · 추천 '+((p||meta).up||0)+'</div></span><button class="nbtn" data-nfold aria-label="공지 접기">'+I.up+'</button></div>')+
  '<div class="scroll" id="rscroll"><div class="msgs">'+h+'</div></div>'+
  (R.cpanel?'<div class="cpanel">'+consHtml()+'</div>':'')+(R.tpanel?txtconHtml():'')+
  (R.reply?'<div class="replybar"><span>'+esc(who(R.reply))+'에게 답장</span><button class="ib" data-noreply aria-label="답장 취소">✕</button></div>':'')+
  '<form class="inp" id="cform"><textarea placeholder="메시지 입력" aria-label="댓글 입력" maxlength="200">'+esc(draft)+'</textarea><div class="bar"><button type="button" class="ib" data-url="'+esc(mView(g,r.no))+'" aria-label="디시 화면에서 열기">'+I.plus+'</button><button type="button" class="ib'+(R.cpanel?' act':'')+'" data-cpanel aria-expanded="'+R.cpanel+'" aria-label="디시콘">'+I.smile+'</button><button type="button" class="ib'+(R.tpanel?' act':'')+'" data-tpanel aria-expanded="'+R.tpanel+'" aria-label="글자콘">'+I.file+'</button><span></span><button class="send'+(draft.trim()&&!R.sending?' ok':'')+'"'+(R.sending?' disabled':'')+'>'+(R.sending?'보내는 중…':'전송')+'</button></div></form>';
 const sc=$('#rscroll');if(R.toBottom){sc.scrollTop=sc.scrollHeight;R.toBottom=false}else sc.scrollTop=top;
}
const postUrl=(g,no)=>'https://gall.dcinside.com/'+(g.type==='minor'?'mgallery/':g.type==='mini'?'mini/':'')+'board/view/?id='+g.id+'&no='+no;

/* ---------- 디시콘·글자콘 창 ---------- */
const TBG=['3b4890','b4b4e1','f5e1f0','d2f0e6','ffffff','333333'],TFG=['ffffff','333333'];
function tstyle(t,bg,fg){const n=[...String(t)].length;return 'background:#'+bg+';color:#'+fg+';font-size:'+(n<=2?44:n<=4?30:n<=8?22:n<=12?18:15)+'px'}
function consHtml(){
 const C=R.cons;
 if(C.busy)return '<div class="spin">디시콘 불러오는 중…</div>';
 if(C.err)return '<p class="hint">'+esc(C.err)+'</p>';
 if(!C.items)return '';
 if(!C.items.length)return '<p class="hint">'+esc(C.note||(R.user?'사용할 수 있는 디시콘이 없습니다.':'디시콘은 로그인 후 사용할 수 있습니다.'))+'</p>';
 return '<div class="cons">'+C.items.map((c,i)=>'<button class="con'+(i===R.con1?' sel':'')+'" data-con="'+i+'" data-lp="con" aria-label="'+esc(c.alt||'디시콘')+'"><img loading="lazy" src="'+esc(c.src)+'" alt=""></button>').join('')+'</div>'+
  '<p class="hint">'+(R.con1!=null?'하나를 골랐습니다. 다른 디시콘을 누르면 2개가 좌우로 함께 올라갑니다.':'누르면 1개 등록 · 꾹 누른 뒤 다른 디시콘을 누르면 더블콘')+'</p>';
}
function txtconHtml(){
 return '<div class="cpanel tpanel"><div class="tcon" id="tcprev" style="'+tstyle(R.tcon,D.tbg,D.tfg)+'">'+esc(R.tcon)+'</div>'+
  '<div class="tcolors"><span>배경색</span>'+TBG.map(c=>'<button type="button" class="sw'+(c===D.tbg?' on':'')+'" data-tbg="'+c+'" style="background:#'+c+'" aria-label="배경색 '+c+'" aria-pressed="'+(c===D.tbg)+'"></button>').join('')+'<i></i><span>글자색</span>'+TFG.map(c=>'<button type="button" class="sw'+(c===D.tfg?' on':'')+'" data-tfg="'+c+'" style="background:#'+c+'" aria-label="글자색 '+c+'" aria-pressed="'+(c===D.tfg)+'"></button>').join('')+'</div>'+
  (D.trecent.length?'<div class="trecent">'+D.trecent.map(t=>'<button type="button" data-tuse="'+esc(t)+'">'+esc(t)+'</button>').join('')+'<button type="button" class="tclr" data-tclear>삭제</button></div>':'')+
  '<div class="trow"><input id="tcin" maxlength="20" placeholder="글자콘 내용 입력 (최대 20자)" aria-label="글자콘 내용" value="'+esc(R.tcon)+'"><button type="button" class="pub" data-tsend>등록</button></div></div>';
}
async function loadCons(){
 const g=gal(R.room?.g||R.g)||D.gals[0],no=R.room?.no||R.latest[key(g)]?.id,C=R.cons;if(!g||!no||C.busy)return;
 C.busy=true;C.err='';renderRoom(true);if(R.ov==='con')renderPane();
 const r=await drive('dcconList',{},mView(g,no));
 C.busy=false;if(r.error){C.err=r.error;C.items=null}else{C.items=r.items;C.note=r.note;if(r.user!=null){R.user=r.user;R.userKnown=true}}
 renderRoom(true);if(R.ov==='con')renderPane();
}

/* ---------- 로그인과 쓰기 ---------- */
async function drive(name,args,url,opt){try{return await native.drive(url,script(name,args),opt)||{error:'응답이 없습니다.'}}catch(e){return {error:e.message}}}
async function checkUser(){const r=await drive('state',{},mList({id:'dcbest',type:'normal'}));if(!r.error){R.user=r.user||'';R.userKnown=true}if(R.ov==='set'||R.ov==='log')renderPane();if(R.ov==='log'&&R.user&&!R.gallog[R.log])loadGallog();return R.user}
async function login(){await native.official(LOGIN_URL,{closeOn:LOGIN_DONE});R.cons.items=null;R.gallog={};await checkUser();if(R.user)toast('로그인했습니다.');return !!R.user}
/* 로그인이 필요하면 로그인 창을 띄운 뒤 한 번 더 시도하고, 보안 문자가 필요하면 디시 화면을 그대로 보여 줍니다. */
async function withAuth(name,args,url,opt){
 let r=await drive(name,args,url,opt);
 if(r.need==='login'){toast('로그인이 필요해 디시 로그인 화면을 엽니다.');if(await login())r=await drive(name,args,url,opt);else return {error:'로그인하지 않았습니다.'}}
 if(r.need==='captcha'){toast('보안 문자 입력이 필요해 디시 화면을 엽니다.');await native.official(url);return {manual:true,error:'디시 화면에서 직접 마무리해 주세요. 처리됐는지는 새로고침하면 보입니다.'}}
 if(r.need)return {error:'로그인이 필요합니다.'};
 return r;
}
async function sendToRoom(name,args){
 const room=R.room;if(!room||R.sending)return false;
 R.sending=true;renderRoom(true);
 const r=await withAuth(name,{...args,parentNo:R.reply?.id||''},mView(gal(room.g),room.no));
 R.sending=false;if(R.room!==room)return false;
 /* 보안 문자 때문에 디시 화면에서 직접 보낸 경우: 보냈는지 알 수 없으므로 쓰던 글은 지우지 않고 방만 새로 읽습니다. */
 if(r.manual){await openPost(room.no,true);return false}
 if(!r.ok){toast(r.error||'보내지 못했습니다.');renderRoom(true);return false}
 R.reply=null;R.toBottom=true;await openPost(room.no,true);return true;
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
function watch(gk,no,title,count,mine){
 const old=D.watch.find(w=>w.g===gk&&w.no===no);
 if(old){old.count=count;old.mine=old.mine||mine}else{D.watch.unshift({g:gk,no,title,count,mine});D.watch.length=Math.min(D.watch.length,20)}
 save();
}
let polling=false;
async function poll(){
 if(polling||!R.user)return;polling=true;
 for(const w of D.watch.slice(0,5)){const g=gal(w.g);if(!g)continue;if(Date.now()<pvPause)break;
  try{await new Promise(r=>setTimeout(r,1500));const post=await dc.readPost(g,w.no);await new Promise(r=>setTimeout(r,1500));const cm=await dc.readComments(g,w.no,post.token,1);
   if(cm.total>w.count){const mineIds=new Set(cm.comments.filter(c=>c.mine).map(c=>c.id));
    for(const c of cm.comments.filter(c=>!c.mine&&!c.deleted).slice(-(cm.total-w.count))){const toMe=c.parentId&&mineIds.has(c.parentId);if(!w.mine&&!toMe)continue;
     D.notis.unshift({g:w.g,no:w.no,id:g.id,mini:g.type==='mini',title:w.title,who:who(c),head:who(c)+(toMe?'님이 답글을 남겼습니다':'님이 댓글을 남겼습니다'),text:c.blocks.map(b=>b.t==='text'?b.v:b.t==='img'?'(사진)':'(디시콘)').join(' ').slice(0,100),read:false})}
    D.notis.length=Math.min(D.notis.length,50);w.count=cm.total;save();renderRail();if(R.ov==='noti')renderPane()}
  }catch(e){if(e.code==='BUSY')break}}
 polling=false;
}
setTimeout(poll,90000);setInterval(poll,600000);

/* ---------- 글쓰기 화면 ---------- */
function renderWrite(){
 const el=$('#room'),w=R.write,g=gal(w.g),heads=R.list?.heads||[];
 el.className='room';$('#app').classList.add('in-room');
 const blk=x=>typeof x==='string'?bub(x):x.video?'<video class="media" src="'+x.url+'" controls aria-label="'+esc(x.name)+'"></video>':'<img class="media" src="'+x.url+'" alt="'+esc(x.name)+'">';
 el.innerHTML='<div class="rhead"><button class="ib back" data-wcancel aria-label="글쓰기 닫기">'+I.back+'</button>'+userAv(D.me.name)+'<span class="tt"><b>새 글</b><span>'+esc(gname(g))+'에 올리기</span></span><button class="pub" data-pub'+(w.busy?' disabled':'')+'>'+(w.busy?'등록 중…':'등록')+'</button></div>'+
  '<div class="wtitle"><label for="wtitle">제목</label>'+(heads.length?'<select id="whead" aria-label="말머리">'+heads.map(h=>'<option value="'+esc(h.id)+'"'+(String(h.id)===String(w.head)?' selected':'')+'>'+esc(h.name)+'</option>').join('')+'</select>':'')+'<input id="wtitle" maxlength="40" placeholder="제목 입력" aria-label="제목" value="'+esc(w.title)+'"></div>'+
  '<div class="scroll" id="wscroll"><div class="msgs">'+(w.blocks.length?'<div class="m first"><div class="avc">'+userAv(D.me.name)+'</div><div class="col"><div class="nm">'+esc(D.me.name)+'<i>글쓴이</i></div>'+
   w.blocks.map((x,i)=>'<div class="ln blk">'+blk(x)+'<button class="del" data-del="'+i+'" aria-label="이 말풍선 삭제">✕</button></div>').join('')+'</div></div>':'<div class="sys"><span>아래에 쓰고 전송하면 본문에 들어갑니다</span></div>')+
  (w.err?'<div class="sys err" role="alert"><span>'+esc(w.err)+'</span></div>':'')+'</div></div>'+
  '<form class="inp" id="wform"><label class="wlab" for="wbody">본문</label><textarea id="wbody" placeholder="본문 입력">'+esc(w.text)+'</textarea>'+
  (w.pending.length?'<div class="pend">'+w.pending.map((x,i)=>'<span class="pthumb">'+(x.video?'<video src="'+x.url+'" muted aria-label="'+esc(x.name)+'"></video>':'<img src="'+x.url+'" alt="'+esc(x.name)+'">')+'<button type="button" class="del" data-pdel="'+i+'" aria-label="첨부 취소">✕</button></span>').join('')+'</div>':'')+
  (w.menu?'<div class="amenu"><button type="button" data-pick="image">사진</button><button type="button" data-pick="video">동영상</button></div>':'')+
  '<div class="bar"><button type="button" class="ib" data-attach aria-expanded="'+!!w.menu+'" aria-label="사진·동영상 첨부">'+I.plus+'</button><span></span><button class="send ok">전송</button></div><input type="file" id="pick" multiple hidden></form>';
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
 w.busy=true;w.err='';renderWrite();
 try{
  const blocks=[];for(const x of w.blocks)blocks.push(typeof x==='string'?{t:'text',v:x}:{t:x.video?'video':'img',name:x.name,type:x.file.type,b64:await b64(x.file)});
  const g=gal(w.g),r=await withAuth('write',{title:w.title.trim(),head:w.head,blocks},mWrite(g),{timeout:300000});
  if(R.write!==w)return;
  if(r.navigated||r.ok){for(const x of w.blocks)if(x.url)URL.revokeObjectURL(x.url);R.write=null;toast('글을 올렸습니다.');renderRoom();delete R.cache[w.g+'|'];if(R.g===w.g){R.head='';loadList({fresh:true})}return}
  w.err=r.error||'글을 올리지 못했습니다.';
 }catch(e){w.err=e.message}
 w.busy=false;if(R.write===w)renderWrite();
}

/* ---------- 불러오기 ---------- */
async function loadList({append=false,fresh=false}={}){
 const g=gal(R.g);if(!g)return;const seq=++R.seq,head=R.list&&!R.list.heads.length?'':R.head;
 const ck=R.g+'|'+head,c=R.cache[ck];
 if(!append&&!fresh&&c&&Date.now()-c.at<60000){R.list=c.list;R.listErr='';R.listBusy=false;renderPane();return}
 if(!append){R.list=null;R.listErr=''}R.listBusy=true;renderPane();
 try{const page=append?R.list.page+1:1,res=await dc.listPosts(g,{page,head});if(seq!==R.seq)return;
  if(append){const ids=new Set(R.list.posts.map(p=>p.id)),add=res.posts.filter(p=>!p.notice&&!ids.has(p.id));R.list.posts.push(...add);R.list.page=page;R.list.more=add.length>0}
  else{
   /* 말머리 탭에서도 공지는 맨 위에 남도록, 전체 목록에서 본 공지를 앞에 붙입니다. */
   if(head){const ids=new Set(res.posts.map(p=>p.id)),pins=(R.cache[R.g+'|']?.list.posts||[]).filter(p=>p.notice&&!ids.has(p.id));res.posts.unshift(...pins)}
   R.list={posts:res.posts,heads:res.heads.length?res.heads:R.list?.heads||[],page:1,more:res.posts.some(p=>!p.notice)}}
  if(!head){const t=res.posts.find(p=>!p.notice);if(t&&!append){R.latest[R.g]={id:t.id,title:t.title};D.top[R.g]=t.id;delete R.updated[R.g];save()}}
  if(res.name&&g.name!==res.name&&/^[A-Za-z0-9_]+$/.test(g.name)){g.name=res.name;save()}
  R.cache[ck]={list:R.list,at:Date.now()};
 }catch(e){if(seq!==R.seq)return;if(append){moreHold=Date.now()+15000;toast(e.message)}else R.listErr=e.message}
 R.listBusy=false;renderPane();
}
async function openGallery(k){R.g=k;R.head='';R.shown=20;R.view='chats';R.ov='';R.filter='';R.filterOn=false;R.pinOpen=false;R.list=null;await loadList()}
async function openPost(no,fresh,given){
 /* 지금 목록에서 연 글이면 현재 갤러리, 열려 있던 방을 다시 읽는 것이면 그 방의 갤러리를 씁니다(방을 연 뒤 다른 갤러리로 옮겼을 수 있습니다). */
 const inList=given||R.list?.posts.find(p=>p.id===no),meta=inList||R.room?.meta;if(!meta)return;
 const gk=inList?R.g:R.room.g,pins=(gk===R.g&&R.list?.posts||[]).filter(p=>p.notice),seq=++R.roomSeq,g=gal(gk);if(!g)return;
 R.room={g:gk,no,meta,pinIdx:Math.max(0,pins.indexOf(meta)),post:null,comments:null,total:null,cpage:1};
 renderRoom(fresh);renderPane();
 try{const c=R.pc[gk+'/'+no],post=!fresh&&c&&Date.now()-c.at<120000?c.post:await dc.readPost(g,no);if(seq!==R.roomSeq)return;R.room.post=post;renderRoom(fresh);
  try{const cm=await dc.readComments(g,no,post.token,1);if(seq!==R.roomSeq)return;R.room.comments=cm.comments;R.room.total=cm.total;
   meta.comments=Math.max(meta.comments,cm.total);D.seen[gk+'/'+no]=meta.comments;
   /* 내 글이거나 내가 댓글을 단 글은 알림 대상으로 기억해 둡니다. */
   const mine=!!R.user&&post.uid===R.user;
   if(mine||cm.comments.some(c=>c.mine)||D.watch.some(w=>w.g===gk&&w.no===no))watch(gk,no,post.title,cm.total,mine);else save()}
  catch(e){if(seq!==R.roomSeq)return;R.room.cerr=e.message}
 }catch(e){if(seq!==R.roomSeq)return;R.room.err=e.message}
 renderRoom(true);renderPane();
}
async function moreComments(){
 const r=R.room;if(!r||r.cbusy)return;r.cbusy=true;renderRoom(true);
 try{const cm=await dc.readComments(gal(r.g),r.no,r.post.token,r.cpage+1),ids=new Set(r.comments.map(c=>c.id)),add=cm.comments.filter(c=>!ids.has(c.id));
  if(add.length){r.comments.push(...add);r.cpage++}else r.noMore=true}catch(e){toast(e.message)}
 r.cbusy=false;if(R.room===r)renderRoom(true);
}
/* 친구 목록의 "최근 글" 문구와 새 글 표시를 채웁니다. 하나씩 요청하고, 1분 안에 읽은 갤러리는 건너뛰며, 막히면 멈춥니다. */
const latestQ=[];let latestRun=false;
/* 최근 글과 새 글 표시는 즐겨찾기만 확인합니다(친구 목록 전체를 읽으면 요청이 너무 많아집니다). */
async function loadLatest(list=D.favs.map(gal).filter(Boolean)){
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
 if(e.target.closest('#viewer')){$('#viewer').hidden=true;return}
 const z=e.target.closest('[data-zoom]');if(z){$('#viewer').innerHTML='<img src="'+esc(z.src)+'" alt="">';$('#viewer').hidden=false;return}
 if(R.menu!=null&&!e.target.closest('[data-reply],[data-cdel],[data-postdel],[data-pedit]')){R.menu=null;R.ask=false;renderRoom(true)}
 const a=e.target.closest('a[data-url]');if(a){e.preventDefault();native.open(a.dataset.url);return}
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
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
 else if(d.h!=null){R.head=d.h;R.shown=20;if(R.list?.heads.length)loadList();else renderPane()}
 else if(d.p){openPost(+d.p)}
 else if(d.pintog!=null){R.pinOpen=!R.pinOpen;renderPane()}
 else if(d.nfold!=null){R.nfold=!R.nfold;renderRoom(true)}
 else if(d.more!=null){showMore()}
 else if(d.reload!=null){loadList({fresh:true})}
 else if(d.rreload!=null){if(R.room)openPost(R.room.no,true)}
 else if(d.cmore!=null){moreComments()}
 else if(d.back!=null){R.room=null;R.roomSeq++;renderRoom();renderPane()}
 else if(d.filter!=null){R.filterOn=!R.filterOn;if(!R.filterOn)R.filter='';renderPane();$('#filter')?.focus()}
 else if(d.add!=null){const g=R.search.res[+d.add];if(g&&!gal(key(g))){D.gals.push(g);save();renderPane();loadLatest([g])}}
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
 else if(d.logout!=null){native.logout().then(()=>{R.user='';R.cons.items=null;R.gallog={};renderPane();toast('로그아웃했습니다.')})}
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
 else if(f.id==='setf'){const el=f.elements;if(R.stab==='프로필'){D.me.name=el.name.value.trim()||'ㅇㅇ';D.me.status=el.status.value.trim()}else D.rooms=D.rooms.map((r,i)=>({mode:el['m'+i].value,text:el['t'+i].value.trim()}));save();R.saved=true;renderPane();renderRoom(true)}
 else if(f.id==='cform'){const text=f.querySelector('textarea').value.trim();if(text&&await sendToRoom('comment',{text})){const t=$('#cform textarea');if(t){t.value='';t.form.querySelector('.send').classList.remove('ok')}}}
 else if(f.id==='wform')sendDraft()});
/* 뒤로 가기(안드로이드 뒤로 버튼, Esc): 열린 창을 하나씩 닫고, 닫을 것이 없으면 false를 돌려 앱이 종료 처리하게 합니다. */
window.yjBack=()=>{if(!$('#viewer').hidden){$('#viewer').hidden=true;return true}
 if(R.write){if(!R.write.busy){R.write=null;renderRoom()}return true}
 if(R.cpanel||R.tpanel||R.menu!=null){R.cpanel=R.tpanel=false;R.menu=null;renderRoom(true);return true}
 if(R.ov){R.ov='';renderPane();return true}
 if(R.room){R.room=null;R.roomSeq++;renderRoom();renderPane();return true}if(R.view==='chats'){R.view='friends';renderPane();return true}return false};
document.addEventListener('keydown',e=>{if(e.key==='Escape')window.yjBack()});

/* 처음 한 번, 친구 목록이 비어 보이지 않게 디시의 흥한 갤러리 순위에서 20개를 채워 넣습니다. 이후에는 다시 넣지 않으며, 지운 갤러리가 되살아나지 않습니다. */
async function seedFriends(){
 if(D.seeded)return;
 try{const r=await native.http('https://json2.dcinside.com/json1/ranking_gallery.php?jsoncallback=cb',{headers:{Referer:'https://gall.dcinside.com/'}});
  const list=JSON.parse(r.text.trim().replace(/^cb\(/,'').replace(/\)\s*;?$/,''));let n=0;
  for(const x of list){if(n>=20)break;const g={id:String(x.id||''),type:'normal',name:String(x.ko_name||'').trim()};if(!/^[A-Za-z0-9_]{1,80}$/.test(g.id)||!g.name||gal(key(g)))continue;D.gals.push(g);n++}
  D.seeded=true;save();if(R.view==='friends'&&!R.ov)renderPane();
 }catch{}
}
renderPane();renderRoom();seedFriends();loadLatest().then(checkUser);
