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
  /* 움직이는 디시콘은 본문에 영상으로 들어가고, 주소가 src 대신 data-src에만 있는 경우가 있습니다. */
  if(tag==='video'){const con=/dccon/.test(c.getAttribute('class')||''),src=abs(c.getAttribute('src')||c.querySelector('source')?.getAttribute('src')||c.getAttribute('data-src')||'');if(/^https:\/\//.test(src)){flush();out.push(con?{t:'dccon',src,video:true,alt:c.getAttribute('title')||''}:{t:'video',src,poster:abs(c.getAttribute('poster')||'')})}continue}
  if(tag==='iframe'||tag==='embed'){const src=abs(c.getAttribute('src')||'');if(src){flush();out.push({t:'embed',src})}continue}
  const cls=c.getAttribute('class')||'';
  if(/txtdccon/.test(cls)){const v=c.textContent.trim(),inner=c.querySelector('[class*="ctxt_"]');if(v){flush();out.push({t:'txtcon',v,bg:(cls.match(/cbg_([0-9a-f]{6})/i)||[])[1]||'3b4890',fg:((inner?.getAttribute('class')||'').match(/ctxt_([0-9a-f]{6})/i)||[])[1]||'ffffff'})}continue}
  const block=/^(p|div|li|tr|h[1-6]|blockquote|ul|ol|table)$/.test(tag);
  if(block&&buf&&!buf.endsWith('\n'))buf+='\n';
  walk(c);
  if(block&&buf&&!buf.endsWith('\n'))buf+='\n';
 }};
 walk(root);flush();return out;
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
  commentCount:num(text('.gallview_head .gall_comment')),blocks,token:doc.querySelector('input[name="e_s_n_o"]')?.getAttribute('value')||''};
}

export function parseComments(data,parse){
 if(!data||typeof data!=='object'||!('comments' in data))throw Error('댓글 응답 형식이 바뀌었습니다.');
 const out=[];
 for(const c of data.comments||[]){
  const id=String(c.no??'');if(!/^[1-9]\d*$/.test(id)||out.some(x=>x.id===id))continue;/* 번호 0은 광고 줄 */
  const deleted=String(c.is_delete)==='1'||c.del_yn==='Y',parentId=/^[1-9]\d*$/.test(String(c.c_no??''))?String(c.c_no):null;
  const root=parse('<div id="m">'+(c.memo||'')+'</div>').querySelector('#m');
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
  async listPosts(g,{page=1,head=''}={}){if(head!==''&&!/^\d{1,6}$/.test(String(head)))throw Error('잘못된 말머리입니다.');return parseList(parse(await get(boardUrl(g,'lists')+'&page='+Math.max(1,page|0)+(head!==''?'&search_head='+head:''))))},
  async readPost(g,no){if(!/^\d+$/.test(String(no)))throw Error('잘못된 글 번호입니다.');return parseView(parse(await get(boardUrl(g,'view')+'&no='+no)),no)},
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
