// 안드로이드 APK를 그래들 없이 만듭니다. 필요한 도구는 android-tools/ 아래에 둡니다(README 참고).
//   android-tools/build/android-15   빌드 도구 35 (aapt2, d8, zipalign, apksigner)
//   android-tools/platform/android-35 플랫폼 35 (android.jar)
//   android-tools/jdk/jdk-17*         JDK 17
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const tools=process.env.ANDROID_TOOLS_DIR||path.join(root,'android-tools');
const bt=path.join(tools,'build','android-15'),androidJar=path.join(tools,'platform','android-35','android.jar');
const jdk=path.join(tools,'jdk',fs.readdirSync(path.join(tools,'jdk')).find(n=>n.startsWith('jdk'))),jbin=path.join(jdk,'bin');
const env={...process.env,JAVA_HOME:jdk,PATH:jbin+path.delimiter+process.env.PATH};
const run=(file,args,opt={})=>execFileSync(file,args,{stdio:['ignore','pipe','inherit'],env,...opt}).toString();
const bat=(name,args)=>run('cmd.exe',['/c',path.join(bt,name+'.bat'),...args]);
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const out=path.join(root,'android','out'),work=path.join(out,'work');
fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});

// 1) 화면 묶음
run(process.execPath,[path.join(root,'tools','build.mjs')],{cwd:root});
const assets=path.join(work,'assets','app');fs.mkdirSync(assets,{recursive:true});
for(const f of ['index.html','app.css','app.bundle.js'])fs.copyFileSync(path.join(root,'app',f),path.join(assets,f));

// 2) 버전을 package.json과 맞춘 매니페스트
const [major,minor,patch]=pkg.version.split('.').map(Number),code=major*10000+minor*100+patch;
const manifest=path.join(work,'AndroidManifest.xml');
fs.writeFileSync(manifest,fs.readFileSync(path.join(root,'android','AndroidManifest.xml'),'utf8').replace(/android:versionCode="\d+"/,'android:versionCode="'+code+'"').replace(/android:versionName="[^"]*"/,'android:versionName="'+pkg.version+'"'));

// 3) 리소스 → 기본 APK
const resZip=path.join(work,'res.zip'),base=path.join(work,'base.apk');
run(path.join(bt,'aapt2.exe'),['compile','--dir',path.join(root,'android','res'),'-o',resZip]);
run(path.join(bt,'aapt2.exe'),['link','-o',base,'-I',androidJar,'--manifest',manifest,'--min-sdk-version','24','--target-sdk-version','35',resZip]);

// 4) 자바 → dex
const classes=path.join(work,'classes');fs.mkdirSync(classes);
const sources=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.java'))sources.push(p)}})(path.join(root,'android','src'));
run(path.join(jbin,'javac.exe'),['-encoding','UTF-8','-source','11','-target','11','-Xlint:-options','-classpath',androidJar,'-d',classes,...sources]);
const classFiles=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.class'))classFiles.push(p)}})(classes);
bat('d8',['--release','--lib',androidJar,'--min-api','24','--output',work,...classFiles]);

// 5) dex를 APK에 넣고 정렬·서명
const unsigned=path.join(work,'unsigned.apk');fs.copyFileSync(base,unsigned);
// 화면 파일은 jar 도구로 넣습니다(윈도우의 aapt2 -A는 경로 구분자를 \로 넣어 앱이 파일을 찾지 못합니다).
run(path.join(jbin,'jar.exe'),['uf',unsigned,'-C',work,'classes.dex','-C',work,'assets']);
const aligned=path.join(work,'aligned.apk');
run(path.join(bt,'zipalign.exe'),['-f','-p','4',unsigned,aligned]);
// 서명 키는 저장소에 올리지 않습니다. 없으면 이 PC 전용 개발 키를 새로 만듭니다(다른 키로 서명한 APK로는 덮어쓰기 설치가 안 됩니다).
const ks=process.env.YJ_KEYSTORE||path.join(root,'android','yangjitalk.keystore'),pass=process.env.YJ_KEYSTORE_PASS||'yangjitalk';
if(!fs.existsSync(ks))run(path.join(jbin,'keytool.exe'),['-genkeypair','-keystore',ks,'-storepass',pass,'-keypass',pass,'-alias','yangjitalk','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=YangjiTalk']);
const apk=path.join(out,'YangjiTalk-'+pkg.version+'.apk');
bat('apksigner',['sign','--ks',ks,'--ks-pass','pass:'+pass,'--key-pass','pass:'+pass,'--ks-key-alias','yangjitalk','--out',apk,aligned]);
console.log(bat('apksigner',['verify','--print-certs',apk]).split('\n').slice(0,2).join('\n'));
console.log('APK 생성:',apk,(fs.statSync(apk).size/1024/1024).toFixed(2)+'MB');
