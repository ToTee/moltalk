// 화면에 최소한의 기능만 건넵니다: 디시 요청 보내기, 외부 브라우저로 열기.
const {contextBridge,ipcRenderer}=require('electron');
const version=(process.argv.find(a=>a.startsWith('--yj-version='))||'').slice(13);
contextBridge.exposeInMainWorld('native',{
 platform:'windows',version,
 http:(url,opt)=>ipcRenderer.invoke('http',url,opt),
 open:url=>ipcRenderer.invoke('open',url),
 drive:(url,code,opt)=>ipcRenderer.invoke('drive',url,code,opt),
 official:(url,opt)=>ipcRenderer.invoke('official',url,opt),
 logout:()=>ipcRenderer.invoke('logout'),
 /* 설정(친구·즐겨찾기·사진) 사본: 브라우저 저장소가 지워졌을 때 되살리는 용도 */
 backup:ipcRenderer.sendSync('backup-load'),
 backupSave:json=>ipcRenderer.send('backup-save',json)
});
