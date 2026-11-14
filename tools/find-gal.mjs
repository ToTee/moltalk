// 갤러리 이름으로 아이디를 찾습니다(읽기 전용, 이름 하나에 검색 한 번). 사용: node tools/find-gal.mjs 이름1 이름2 …
import {parseHTML} from 'linkedom';
import {createDc} from '../src/core/dc.js';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const http=async(url,{method='GET',headers={},body}={})=>{const r=await fetch(url,{method,body,headers:{'User-Agent':UA,...headers}});return {status:r.status,text:await r.text()}};
const dc=createDc({http,parse:h=>parseHTML(h).document});
for(const q of process.argv.slice(2)){
 try{const r=await dc.searchGalleries(q);console.log(q,'=>',JSON.stringify(r.filter(g=>g.name===q).concat(r.filter(g=>g.name!==q)).slice(0,4)))}catch(e){console.log(q,'실패',e.message)}
 await new Promise(r=>setTimeout(r,900));
}
