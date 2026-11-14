// 디시 모바일 웹 화면 구조 확인용(읽기 전용). 사용: node tools/probe-m.mjs <url> <정규식...>
const UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const [url,...pats]=process.argv.slice(2);
// 노드 내장 fetch가 이 서버 응답에서 죽는 문제가 있어 curl로 받습니다.
import {execFileSync} from 'node:child_process';
const html=execFileSync('curl.exe',['-sL','--compressed','-A',UA,'-e','https://m.dcinside.com/',url],{maxBuffer:64*1024*1024}).toString('utf8');
console.log('bytes',html.length);
for(const p of pats){const re=new RegExp(p,'g');let m,n=0;console.log('\n== '+p);while((m=re.exec(html))&&n++<8){const a=Math.max(0,m.index-150),b=Math.min(html.length,m.index+m[0].length+350);console.log('…'+html.slice(a,b).replace(/\s+/g,' ')+'…\n')}}
