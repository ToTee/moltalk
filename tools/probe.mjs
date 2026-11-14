// 디시 페이지 구조 확인용(읽기 전용). 사용: node tools/probe.mjs <list|view> <url>
import {parseHTML} from 'linkedom';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const [mode,url]=process.argv.slice(2);
const res=await fetch(url,{headers:{'User-Agent':UA,Referer:'https://gall.dcinside.com/'}});
const html=await res.text();
const {document}=parseHTML(html);
console.log('status',res.status,'bytes',html.length);
if(mode==='list'){
 const rows=[...document.querySelectorAll('tr.ub-content')];
 console.log('rows',rows.length);
 const types={};for(const r of rows){const t=r.getAttribute('data-type');types[t]=(types[t]||0)+1}
 console.log('data-type',types);
 for(const r of rows.filter(r=>r.getAttribute('data-type')==='icon_notice').slice(0,2).concat(rows.filter(r=>r.getAttribute('data-type')!=='icon_notice').slice(0,2)))console.log('\nROW',r.outerHTML.replace(/\s+/g,' ').slice(0,1500));
 const heads=[...document.querySelectorAll('[onclick*="listSearchHead"]')].map(n=>n.getAttribute('onclick')+' => '+n.textContent.trim());
 console.log('\nheads',heads.slice(0,20));
 console.log('title',document.querySelector('title')?.textContent);
}else{
 for(const s of ['.title_headtext','.title_subject','.gallview_head .gall_writer','.gallview_head .gall_date','.gall_count','.gall_comment'])console.log(s,'=>',document.querySelector(s)?.outerHTML.replace(/\s+/g,' ').slice(0,300));
 console.log('\nWRITE_DIV',document.querySelector('.write_div')?.innerHTML.replace(/\s+/g,' ').slice(0,2500));
 console.log('\ne_s_n_o',document.querySelector('input[name="e_s_n_o"]')?.getAttribute('value'));
}
