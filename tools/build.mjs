// 화면 스크립트를 하나로 묶습니다. 윈도우와 안드로이드가 같은 app/ 폴더를 씁니다.
import {build} from 'esbuild';
await build({entryPoints:['src/ui/app.js'],bundle:true,format:'iife',target:'chrome100',outfile:'app/app.bundle.js',legalComments:'none'});
console.log('app/app.bundle.js 생성');
