// 확인용(읽기 전용): 갤러리를 이름으로 찾아 제목에 글자가 들어간 글의 디시콘 주소가 무엇을 돌려주는지 봅니다.
// 사용: node tools/t-conprobe.mjs <갤러리 이름> <제목 일부>
import {parseHTML} from 'linkedom';
import {createDc} from '../src/core/dc.js';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const http=async(url,opt={})=>{await wait(800);const r=await fetch(url,{method:opt.method||'GET',headers:{'User-Agent':UA,Referer:'https://gall.dcinside.com/',...(opt.headers||{})},body:opt.body});const text=await r.text();
 for(const m of text.matchAll(/<video[\s\S]{0,900}/g))if(/dccon/.test(m[0]))console.log('RAW',m[0].replace(/\s+/g,' ').slice(0,900));
 return {status:r.status,text}};
const dc=createDc({http,parse:html=>parseHTML(html).document});
const [gname,part]=process.argv.slice(2);
const found=await dc.searchGalleries(gname),g=found.find(x=>x.name===gname)||found[0];
console.log('gallery',JSON.stringify(g));
const list=await dc.listPosts(g),p=list.posts.find(x=>x.title.includes(part));
if(!p){console.log('글 없음',list.posts.slice(0,8).map(x=>x.title));process.exit(0)}
const post=await dc.readPost(g,p.id),cm=await dc.readComments(g,p.id,post.token,1);
const cons=[...post.blocks,...cm.comments.flatMap(c=>c.blocks)].filter(b=>b.t==='dccon');
for(const b of cons){await wait(600);
 const r=await fetch(b.src,{headers:{'User-Agent':UA,Referer:'https://gall.dcinside.com/'}}),buf=Buffer.from(await r.arrayBuffer());
 console.log(JSON.stringify({video:!!b.video,status:r.status,type:r.headers.get('content-type'),len:buf.length,magic:buf.subarray(0,12).toString('latin1').replace(/[^\x20-\x7e]/g,'.'),src:b.src.slice(0,70)}));
}
