// 소개글용 화면 사진: window.name 대신 아래 MODE 줄을 바꿔 가며 씁니다(pc-alias, pc-room, m-friends, m-chats). 읽기만 합니다.
(async()=>{
 const MODE='__MODE__',wait=ms=>new Promise(r=>setTimeout(r,ms));
 if(MODE.startsWith('m-'))for(const r of document.styleSheets[0].cssRules)if(r.media)r.media.mediaText=/coarse/.test(r.media.mediaText)?'all':'not all';
 if(MODE==='pc-friends'){const T=['오늘 점심 뭐 먹지','이거 나만 몰랐음?','키보드 새로 샀는데 타건감 좋다'];document.querySelectorAll('#fscroll .row .st').forEach((n,i)=>n.textContent=T[i%T.length]);return MODE}
 if(MODE==='pc-alias'){
  /* 사람 이름 바꾸기를 화면에서만 켜고, 저장된 설정은 그대로 되돌립니다. */
  const keep=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
  document.querySelector('#rail .deco').click();await wait(300);
  for(const k in keep)localStorage.setItem(k,keep[k]);
  return 'alias on (화면만)';
 }
 if(MODE==='pc-room'||MODE==='m-chats'||MODE==='probe'){
  const g=[...document.querySelectorAll('.row[data-g]')].find(n=>n.getClientRects().length&&/프로그래밍/.test(n.textContent));if(!g)return '갤러리 없음';
  g.click();
  const rows=()=>[...document.querySelectorAll('#cscroll .row.post[data-p]')];
  for(let i=0;i<30&&!rows().length;i++)await wait(500);
  if(!rows().length)return '목록 비어 있음';
  /* 소개글에 남의 글과 닉네임이 실리지 않도록, 화면에 보이는 글자만 예시 문구로 바꿉니다(저장되는 것은 없습니다). */
  const S=[['오늘 점심 뭐 먹지','어제는 국밥 먹었는데 오늘은 진짜 모르겠음',4],['퇴근하고 뭐 하냐 다들','나는 그냥 누워서 유튜브 봄',7],['키보드 새로 샀는데 타건감 좋다','갈축인데 생각보다 조용함',2],['주말에 비 온다던데','우산 챙겨야 하나',0],['이거 나만 몰랐음?','단축키 하나로 되는 거였네',12],['커피 하루에 몇 잔 마심','세 잔 넘으면 잠이 안 옴',5],['월요일 벌써 싫다','아직 토요일인데',3],['노트북 추천 좀','가벼운 걸로 찾는 중',9]];
  if(MODE==='m-chats'){await wait(1500);rows().filter(r=>!r.querySelector('.grid')).forEach((r,i)=>{const s=S[i%S.length];r.querySelector('.t').textContent=s[0];r.querySelector('.pv').textContent=s[1];const n=r.querySelector('small');if(n)n.textContent=s[2]})}
  if(MODE==='pc-room'){rows()[Math.min(3,rows().length-1)].click();await wait(5000);
   const sil=document.querySelector('#room .msgs .av').innerHTML,av=c=>'<div class="avc"><span class="av" style="background:'+c+'">'+sil+'</span></div>';
   const msg=(c,n,w,lines,t)=>'<div class="m first">'+av(c)+'<div class="col"><div class="nm">'+n+(w?'<i>글쓴이</i>':'')+'</div>'+lines.map((x,i)=>'<div class="ln"><div class="bub">'+x+'</div>'+(i===lines.length-1?'<span class="tm">'+t+'</span>':'')+'</div>').join('')+'</div></div>';
   document.querySelector('#room .rhead .tt b').textContent=S[0][0];document.querySelector('#room .rhead .tt span').textContent='프로그래밍 · 참여 4명';
   const nd=document.querySelectorAll('#room .notice .tx div');nd[0].textContent=S[0][0];nd[1].textContent='ㅇㅇ · 조회 128 · 추천 3';
   document.querySelector('#room .rhead .av').style.background='#8ec7a2';
   document.querySelector('#room .msgs').innerHTML='<div class="sys"><span>2026년 11월 14일 토요일</span></div>'+msg('#8ec7a2','ㅇㅇ',1,['오늘 점심 뭐 먹지','어제는 국밥 먹었는데<br>오늘은 진짜 모르겠음'],'오후 12:04')+'<div class="sys"><span>댓글 3개</span></div>'+msg('#e9a9a0','점심고민',0,['제육 ㄱ'],'오후 12:06')+msg('#a9b8ea','ㅇㅇ',0,['돈까스 어떰','근처에 새로 생긴 데 괜찮더라'],'오후 12:07')+msg('#e5be7e','국밥러',0,['국밥은 이틀 연속 먹어도 됨'],'오후 12:11')}
  if(MODE==='probe'){const r=rows()[3].outerHTML;rows()[3].click();await wait(5000);return r+'\n=====\n'+document.querySelector('#room .notice').outerHTML+'\n=====\n'+document.querySelector('#room .msgs').innerHTML}
  return MODE+' rows='+rows().length;
 }
 return MODE;
})()
