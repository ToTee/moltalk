// 실제 디시를 상대로 읽기 코어를 확인합니다(읽기 전용). 사용: node tools/live.mjs [갤러리id] [normal|minor|mini]
import {parseHTML} from 'linkedom';
import {createDc} from '../src/core/dc.js';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const jar=new Map();
async function http(url,{method='GET',headers={},body}={}){
 const res=await fetch(url,{method,body,headers:{'User-Agent':UA,...(jar.size?{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}:{}),...headers}});
 for(const c of res.headers.getSetCookie?.()||[]){const [kv]=c.split(';'),i=kv.indexOf('=');if(i>0)jar.set(kv.slice(0,i).trim(),kv.slice(i+1))}
 return {status:res.status,text:await res.text()};
}
const dc=createDc({http,parse:html=>parseHTML(html).document});
const g={id:process.argv[2]||'singlebungle1472',type:process.argv[3]||'minor'};
const found=await dc.searchGalleries('고양이');
console.log('검색 "고양이":',found.length,'개',found.slice(0,3));
const list=await dc.listPosts(g);
console.log('\n갤러리:',list.name,'| 글',list.posts.length,'| 공지',list.posts.filter(p=>p.notice).length,'| 말머리',list.heads.map(h=>h.id+':'+h.name).join(', '));
console.log('첫 일반 글:',list.posts.find(p=>!p.notice));
if(list.heads[1]){const h=await dc.listPosts(g,{head:list.heads[1].id});console.log('\n말머리 "'+list.heads[1].name+'" 글:',h.posts.filter(p=>!p.notice).slice(0,3).map(p=>'['+p.head+'] '+p.title))}
const target=list.posts.find(p=>!p.notice&&p.comments>2)||list.posts.find(p=>!p.notice);
const post=await dc.readPost(g,target.id);
console.log('\n본문:',{...post,blocks:post.blocks.map(b=>b.t==='text'?b.v.slice(0,40):b.t),token:post.token?'(있음)':'(없음)'});
const cm=await dc.readComments(g,target.id,post.token);
console.log('\n댓글:',cm.total,'개 중',cm.comments.length,'개 읽음');
for(const c of cm.comments.slice(0,6))console.log(' ',c.parentId?'└':'·',c.name+(c.ip?'('+c.ip+')':''),'|',c.blocks.map(b=>b.t==='text'?b.v.slice(0,30):'['+b.t+']').join(' '),'|',c.time);
