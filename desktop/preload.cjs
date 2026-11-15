// 화면에 최소한의 기능만 건넵니다: 디시 요청 보내기, 외부 브라우저로 열기.
const {contextBridge,ipcRenderer}=require('electron');
const version=(process.argv.find(a=>a.startsWith('--yj-version='))||'').slice(13);
contextBridge.exposeInMainWorld('native',{
 platform:process.platform==='darwin'?'mac':'windows',version,
 http:(url,opt)=>ipcRenderer.invoke('http',url,opt),
 open:url=>ipcRenderer.invoke('open',url),
 drive:(url,code,opt)=>ipcRenderer.invoke('drive',url,code,opt),
 /* 사진·동영상 올리기 진행 상황(JSON 문자열)을 받습니다. */
 onProgress:cb=>{ipcRenderer.on('drive-progress',(e,json)=>cb(json))},
 official:(url,opt)=>ipcRenderer.invoke('official',url,opt),
 logout:()=>ipcRenderer.invoke('logout'),
 /* 새 댓글 알림을 윈도우 알림으로 띄우고, 그 알림을 눌렀을 때 화면에 알려 줍니다. */
 notify:(title,body)=>ipcRenderer.send('notify',title,body),
 onNotify:cb=>{ipcRenderer.on('notify-click',()=>cb())},
 /* 설정(친구·즐겨찾기·사진) 사본: 브라우저 저장소가 지워졌을 때 되살리는 용도 */
 backup:ipcRenderer.sendSync('backup-load'),
 backupSave:json=>ipcRenderer.send('backup-save',json)
});
