// 디시인사이드 읽기 코어. 실행 환경(일렉트론, 안드로이드 웹뷰, 노드 테스트)과 무관하게 동작하도록
// 네트워크(http)와 HTML 해석(parse)을 밖에서 받아 씁니다.
//   http(url, {method, headers, body}) -> Promise<{status, text}>   쿠키와 User-Agent는 플랫폼이 처리
//   parse(html) -> Document
const BASE='https://gall.dcinside.com';
const num=s=>Number(String(s??'').replace(/[^\d]/g,''))||0;
const abs=u=>!u?'':u.startsWith('//')?'https:'+u:u.startsWith('/')?BASE+u:u;
const GTYPE={normal:'G',minor:'M',mini:'MI'};

export function boardUrl(g,action){
 if(!/^[A-Za-z0-9_]{1,80}$/.test(g.id||''))throw Error('올바른 갤러리가 아닙니다.');
 if(!GTYPE[g.type])throw Error('지원하지 않는 갤러리 종류입니다.');
 return BASE+'/'+(g.type==='minor'?'mgallery/':g.type==='mini'?'mini/':'')+'board/'+action+'/?id='+g.id;
}

// 본문에 올린 동영상의 재생 창 주소
const MOVIE=/^https:\/\/gall\.dcinside\.com\/board\/movie\/movie_view\?no=\d+$/;
/* 본문에 넣은 유튜브 영상(쇼츠 포함)의 주소에서 영상 번호(11자)를 꺼냅니다. 유튜브 주소가 아니면 빈 글자입니다. */
export const ytId=src=>(String(src||'').match(/^https?:\/\/(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed|v|shorts)\/|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/)||[])[1]||'';
/* 유튜브 영상 자리: 미리 보기 그림과 재생 단추. 누르면 앱이 그 자리에서 유튜브 재생기를 엽니다. */
export const ytButton=id=>'<button class="ytb" data-yt="'+id+'" aria-label="유튜브 영상 재생"><img loading="lazy" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt=""><i>▶</i></button>';
/* 재생 창 화면에서 실제 영상 주소와 미리 보기 그림 주소를 꺼냅니다. */
export function parseMovie(doc){
 const v=doc.querySelector('video#dc_mv')||doc.querySelector('video'),src=abs(v?.querySelector('source')?.getAttribute('src')||v?.getAttribute('src')||''),poster=abs(v?.getAttribute('poster')||'');
 if(!/^https:\/\//.test(src))throw Error('동영상 주소를 찾지 못했습니다.');
 return {src,poster:/^https:\/\//.test(poster)?poster:''};
}

// 본문·댓글 HTML을 화면에 나온 순서 그대로 글/사진/영상 블록으로 나눕니다.
export function toBlocks(root){
 const out=[];let buf='';
 const flush=()=>{const t=buf.replace(/[ \t\u00a0\u200b]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();if(t)out.push({t:'text',v:t});buf=''};
 const walk=node=>{for(const c of node.childNodes){
  if(c.nodeType===3){buf+=c.textContent;continue}
  if(c.nodeType!==1)continue;
  const tag=c.tagName.toLowerCase();
  if(tag==='script'||tag==='style')continue;
  if(tag==='br'){buf+='\n';continue}
  if(tag==='img'){const src=abs(c.getAttribute('data-original')||c.getAttribute('data-src')||c.getAttribute('src')||'');if(/^https:\/\//.test(src)){flush();out.push({t:/dccon/.test(c.getAttribute('class')||'')?'dccon':'img',src,alt:c.getAttribute('alt')||c.getAttribute('title')||''})}continue}
  /* 움직이는 디시콘은 영상(mp4) 태그로 들어오지만, data-src에 같은 그림의 움직이는 그림(gif) 주소가 함께 있습니다.
     기기에 따라 영상이 재생되지 않을 수 있어 그림 주소를 먼저 쓰고, 영상 주소는 그림을 못 읽을 때만 씁니다. */
  if(tag==='video'){const con=/dccon/.test(c.getAttribute('class')||''),file=abs(c.getAttribute('src')||c.querySelector('source')?.getAttribute('src')||''),pic=abs(c.getAttribute('data-src')||''),ok=u=>/^https:\/\//.test(u);
   if(con){if(ok(pic)||ok(file)){flush();out.push(ok(pic)?{t:'dccon',src:pic,mp4:ok(file)&&file!==pic?file:'',alt:c.getAttribute('title')||''}:{t:'dccon',src:file,video:true,alt:c.getAttribute('title')||''})}}
   /* 본문 움짤도 같습니다: 움직이는 그림 주소(data-src)가 있으면 그림으로 보여 줍니다. 그림은 재생 단추 없이 바로 움직이고, 휴대폰에서도 빠짐없이 나옵니다. */
   else if(ok(pic)){flush();out.push({t:'img',src:pic,alt:'움짤'})}
   else if(ok(file)){flush();out.push({t:'video',src:file,poster:abs(c.getAttribute('poster')||'')})}
   continue}
  /* 트위터(X) 글: 본문에는 주소만 든 빈 칸으로 들어옵니다. 주소를 글자로 꺼내 누를 수 있게 합니다. */
  {const xu=c.getAttribute('data-x-url')||'';if(/^https:\/\//.test(xu)){if(buf&&!buf.endsWith('\n'))buf+='\n';buf+=xu+'\n';continue}}
  /* 본문에 올린 동영상은 디시의 재생 창(movie_view) 주소로 들어옵니다. 앱 안에서 틀 수 있게 따로 표시합니다. */
  if(tag==='iframe'||tag==='embed'){const src=abs(c.getAttribute('src')||'');const yt=ytId(src);if(yt){flush();out.push({t:'yt',id:yt,src})}else if(src){flush();out.push({t:MOVIE.test(src)?'movie':'embed',src})}continue}
  const cls=c.getAttribute('class')||'';
  /* 글자콘은 본문·댓글 화면에 따라 이름표가 다릅니다(txtdccon, 댓글 응답에서는 coment_dccon_txt). 둘 다 글자콘으로 읽습니다. */
  if(/txtdccon|coment_dccon_txt/.test(cls)){const v=c.textContent.trim(),inner=c.querySelector('[class*="ctxt_"]');if(v){flush();out.push({t:'txtcon',v,bg:(cls.match(/cbg_([0-9a-f]{6})/i)||[])[1]||'3b4890',fg:((inner?.getAttribute('class')||'').match(/ctxt_([0-9a-f]{6})/i)||[])[1]||'ffffff'})}continue}
  /* 링크: 보이는 글자에 주소가 없으면 주소를 뒤에 붙여, 화면에서 누를 수 있게 합니다. */
  if(tag==='a'){const href=abs(c.getAttribute('href')||''),before=buf.length;walk(c);if(/^https?:\/\//.test(href)&&!/https?:\/\//.test(buf.slice(before)))buf+=(buf.length>before?' ':'')+href+' ';continue}
  const block=/^(p|div|li|tr|h[1-6]|blockquote|ul|ol|table)$/.test(tag);
  if(block&&buf&&!buf.endsWith('\n'))buf+='\n';
  walk(c);
  if(block&&buf&&!buf.endsWith('\n'))buf+='\n';
 }};
 walk(root);flush();return out;
}

// 본문을 글쓴이가 꾸민 모양 그대로 보여 주기 위한 HTML을 만듭니다("원본 보기" 화면용).
// 허용한 태그와 꾸밈만 다시 써서 내보냅니다: 스크립트·이벤트 속성·class·id는 버리고, 화면을 덮을 수 있는 배치(position 등)와 url()이 든 꾸밈도 버립니다.
const HTML_TAGS=/^(div|p|span|b|strong|i|em|u|s|strike|del|hr|h[1-6]|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|blockquote|font|center|pre|sub|sup|small|big)$/;
const hesc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* 꾸밈은 글자·색·여백·테두리·크기처럼 모양만 바꾸는 속성만 남깁니다. 값에 든 함수는 색과 계산(rgb, hsl, calc)만 받아, 바깥 주소를 불러오는 꾸밈이 남지 않게 합니다. */
const STYLE_PROP=/^(color|background(-color)?|font(-size|-weight|-style|-family)?|text-(align|decoration|indent)|line-height|letter-spacing|margin(-(top|right|bottom|left))?|padding(-(top|right|bottom|left))?|border(-(top|right|bottom|left))?(-(width|style|color))?|border-(radius|collapse|spacing)|(min-|max-)?(width|height)|display|vertical-align|white-space|word-break|float|clear|overflow|opacity|box-sizing|list-style(-type)?|table-layout)$/;
const cleanStyle=s=>String(s||'').split(';').map(x=>x.trim()).filter(x=>{const i=x.indexOf(':');if(i<1)return false;const v=x.slice(i+1);
 return STYLE_PROP.test(x.slice(0,i).trim().toLowerCase())&&!/[\\@<>]/.test(v)&&!v.replace(/\b(rgba?|hsla?|calc)\(/gi,'').includes('(')}).join(';');
export function toHtml(root){
 let out='';
 const attrs=c=>{let a='';const st=cleanStyle(c.getAttribute('style'));if(st)a+=' style="'+hesc(st)+'"';
  for(const k of ['align','color','size','width','height','colspan','rowspan','bgcolor','border','cellpadding','cellspacing']){const v=c.getAttribute(k);if(v&&/^[#\w%.\- ]{1,30}$/.test(v))a+=' '+k+'="'+hesc(v)+'"'}
  return a};
 const ok=u=>/^https:\/\//.test(u);
 const walk=node=>{for(const c of node.childNodes){
  if(c.nodeType===3){out+=hesc(c.textContent);continue}
  if(c.nodeType!==1)continue;
  const tag=c.tagName.toLowerCase();
  if(tag==='script'||tag==='style')continue;
  if(tag==='br'){out+='<br>';continue}
  if(tag==='img'){const src=abs(c.getAttribute('data-original')||c.getAttribute('data-src')||c.getAttribute('src')||'');if(ok(src))out+='<img loading="lazy" src="'+hesc(src)+'" alt="'+hesc(c.getAttribute('alt')||'본문 사진')+'"'+attrs(c)+' data-zoom>';continue}
  if(tag==='video'){const file=abs(c.getAttribute('src')||c.querySelector('source')?.getAttribute('src')||''),pic=abs(c.getAttribute('data-src')||''),poster=abs(c.getAttribute('poster')||'');
   if(ok(pic))out+='<img loading="lazy" src="'+hesc(pic)+'" alt="'+hesc(c.getAttribute('title')||(/dccon/.test(c.getAttribute('class')||'')?'디시콘':'움짤'))+'"'+(/dccon/.test(c.getAttribute('class')||'')?'':' data-zoom')+'>';
   else if(ok(file))out+='<video class="gifv" loop muted playsinline preload="metadata" src="'+hesc(file)+'"'+(ok(poster)?' poster="'+hesc(poster)+'"':'')+'></video>';
   continue}
  if(tag==='iframe'||tag==='embed'){const src=abs(c.getAttribute('src')||'');const yt=ytId(src);if(yt)out+=ytButton(yt);else if(MOVIE.test(src))out+='<button class="embed movie" data-movie="'+hesc(src)+'">▶ 동영상 재생</button>';else if(/^https?:\/\//.test(src))out+='<button class="embed" data-url="'+hesc(src)+'">동영상·외부 콘텐츠 열기</button>';continue}
  {const xu=c.getAttribute('data-x-url')||'';if(ok(xu)){out+='<p><a href="'+hesc(xu)+'" data-url="'+hesc(xu)+'">'+hesc(xu)+'</a></p>';continue}}
  if(tag==='a'){const href=abs(c.getAttribute('href')||''),link=/^https?:\/\//.test(href);out+=link?'<a href="'+hesc(href)+'" data-url="'+hesc(href)+'"'+attrs(c)+'>':'<span'+attrs(c)+'>';walk(c);out+=link?'</a>':'</span>';continue}
  if(HTML_TAGS.test(tag)){if(tag==='hr'){out+='<hr'+attrs(c)+'>';continue}out+='<'+tag+attrs(c)+'>';walk(c);out+='</'+tag+'>';continue}
  walk(c);
 }};
 walk(root);return out;
}

function writer(node){return {name:node?.getAttribute('data-nick')||'ㅇㅇ',uid:node?.getAttribute('data-uid')||'',ip:node?.getAttribute('data-ip')||''}}

export function parseList(doc){
 const posts=[];
 for(const row of doc.querySelectorAll('tr.ub-content[data-no]')){
  const id=num(row.getAttribute('data-no')),flag=row.getAttribute('data-type')||'';
  const link=[...row.querySelectorAll('.gall_tit a')].find(a=>!/reply_numbox/.test(a.getAttribute('class')||'')&&/\/view\//.test(a.getAttribute('href')||''));
  if(!id||!link)continue;
  const subject=row.querySelector('.gall_subject'),date=row.querySelector('.gall_date');
  let head='';if(subject){const inner=subject.querySelector('.subject_inner');head=(inner?inner.textContent:subject.textContent).trim()}
  posts.push({id,notice:flag==='icon_notice',head,title:link.textContent.trim(),...writer(row.querySelector('.gall_writer')),
   time:date?.getAttribute('title')||date?.textContent.trim()||'',views:num(row.querySelector('.gall_count')?.textContent),up:num(row.querySelector('.gall_recommend')?.textContent),
   comments:num(row.querySelector('.reply_num')?.textContent),hasImage:/pic|img/.test(flag),hasVideo:/movie/.test(flag),best:/recom/.test(flag)});
 }
 if(!posts.length&&!doc.querySelector('.gall_list'))throw Error('게시글 목록을 읽지 못했습니다. 접근 제한이거나 페이지 구조가 바뀌었을 수 있습니다.');
 const heads=[];
 for(const n of doc.querySelectorAll('[onclick*="listSearchHead"]')){const m=(n.getAttribute('onclick')||'').match(/listSearchHead\(\s*['"]?(\d{1,6})/),name=n.textContent.trim();if(m&&name&&!heads.some(h=>h.id===m[1]))heads.push({id:m[1],name})}
 const name=(doc.querySelector('title')?.textContent||'').split(' - ')[0].replace(/\s*(마이너|미니|인물)?\s*갤러리$/,'').trim();
 return {posts,heads,name};
}

export function parseView(doc,no){
 const text=s=>doc.querySelector(s)?.textContent.trim()||'';
 const title=text('.title_subject');
 if(!title)throw Error('삭제되었거나 접근할 수 없는 게시글입니다.');
 const root=doc.querySelector('.write_div'),date=doc.querySelector('.gallview_head .gall_date'),blocks=root?toBlocks(root):[];
 /* 공식 앱이 본문 끝에 붙이는 꼬리말은 숨깁니다. */
 const tail=blocks[blocks.length-1];
 if(tail?.t==='text'){tail.v=tail.v.replace(/\n?\s*-\s*dc\s+(official\s+)?app\s*$/i,'').trim();if(!tail.v)blocks.pop()}
 return {id:Number(no),title,head:text('.title_headtext').replace(/^\[|\]$/g,''),...writer(doc.querySelector('.gallview_head .gall_writer')),
  time:date?.getAttribute('title')||date?.textContent.trim()||'',views:num(text('.gallview_head .gall_count')),up:num(text('#recommend_view_up_'+no)),down:num(text('#recommend_view_down_'+no)),
  commentCount:num(text('.gallview_head .gall_comment')),blocks,html:root?toHtml(root):'',token:doc.querySelector('input[name="e_s_n_o"]')?.getAttribute('value')||''};
}

export function parseComments(data,parse){
 if(!data||typeof data!=='object'||!('comments' in data))throw Error('댓글 응답 형식이 바뀌었습니다.');
 const out=[];
 for(const c of data.comments||[]){
  const id=String(c.no??'');if(!/^[1-9]\d*$/.test(id)||out.some(x=>x.id===id))continue;/* 번호 0은 광고 줄 */
  const deleted=String(c.is_delete)==='1'||c.del_yn==='Y',parentId=/^[1-9]\d*$/.test(String(c.c_no??''))?String(c.c_no):null;
  /* 더블콘(디시콘 두 개)은 두 번째 그림이 첫 번째 그림 태그 안에 붙은 채로 옵니다(…"img class=…). 그대로 읽으면 첫 번째만 나오므로 둘로 갈라 줍니다. */
  const memo=String(c.memo||''),fixed=/written_dccon/.test(memo)?memo.replace(/"img class=/g,'"><img class='):memo;
  const root=parse('<div id="m">'+fixed+'</div>').querySelector('#m');
  out.push({id,parentId,name:deleted?'삭제된 댓글':c.name||'ㅇㅇ',uid:String(c.user_id||''),ip:String(c.ip||''),time:deleted?'':String(c.reg_date||''),
   blocks:deleted?[{t:'text',v:'(삭제된 댓글)'}]:toBlocks(root),deleted,mine:c.my_cmt==='Y'});
 }
 return {total:num(data.total_cnt),comments:out};
}

export function parseGallerySearch(doc){
 const out=[];
 for(const a of doc.querySelectorAll('a.gallname_txt')){try{
  const u=new URL(a.getAttribute('href'),BASE),id=u.searchParams.get('id');
  if(u.hostname!=='gall.dcinside.com'||!id||out.some(g=>g.id===id))continue;
  out.push({id,name:a.textContent.replace(/[ⓜⓝⓟ]/g,'').trim(),type:u.pathname.includes('mgallery')?'minor':u.pathname.includes('mini')?'mini':'normal'});
 }catch{}}
 return out;
}

export function createDc({http,parse}){
 // 요청이 잦으면 디시가 한동안 빈 응답을 돌려줍니다. 이때는 code:'BUSY' 오류로 알려 호출한 쪽이 잠시 쉬게 합니다.
 const busy=()=>Object.assign(Error('디시가 잠시 요청을 막았습니다. 조금 뒤에 다시 시도해 주세요.'),{code:'BUSY'});
 const get=async url=>{const r=await http(url,{headers:{Referer:BASE+'/'}});if(r.status===429||r.status===403||(r.status===200&&!r.text.trim()))throw busy();if(r.status!==200)throw Error('디시에서 요청을 거절했습니다 ('+r.status+').');return r.text};
 return {
  async searchGalleries(q){q=String(q||'').trim();if(!q||q.length>60)throw Error('검색어를 1~60자로 입력해 주세요.');return parseGallerySearch(parse(await get('https://search.dcinside.com/gallery/q/'+encodeURIComponent(q))))},
  /* rec: 개념글만 봅니다(디시 목록의 "개념글" 탭과 같은 주소). */
  async listPosts(g,{page=1,head='',rec=false}={}){if(head!==''&&!/^\d{1,6}$/.test(String(head)))throw Error('잘못된 말머리입니다.');return parseList(parse(await get(boardUrl(g,'lists')+'&page='+Math.max(1,page|0)+(head!==''?'&search_head='+head:'')+(rec?'&exception_mode=recommend':''))))},
  async readPost(g,no){if(!/^\d+$/.test(String(no)))throw Error('잘못된 글 번호입니다.');return parseView(parse(await get(boardUrl(g,'view')+'&no='+no)),no)},
  /* 본문 동영상: 재생 단추를 눌렀을 때만 재생 창 화면을 한 번 읽습니다. */
  async readMovie(url){if(!MOVIE.test(String(url)))throw Error('잘못된 동영상 주소입니다.');return parseMovie(parse(await get(url)))},
  async readComments(g,no,token,page=1){
   const r=await http(BASE+'/board/comment/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest',Referer:boardUrl(g,'view')+'&no='+no},
    body:new URLSearchParams({id:g.id,no:String(no),cmt_id:g.id,cmt_no:String(no),e_s_n_o:token,comment_page:String(page),sort:'D',prevCnt:'0',_GALLTYPE_:GTYPE[g.type]}).toString()});
   if(r.status===429||r.status===403||(r.status===200&&!r.text.trim()))throw busy();
   if(r.status!==200)throw Error('댓글을 불러오지 못했습니다 ('+r.status+').');
   let data;try{data=JSON.parse(r.text)}catch{throw Error('댓글 응답을 해석하지 못했습니다.')}
   return parseComments(data,parse);
  }
 };
}
