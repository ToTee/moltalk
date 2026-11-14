/* 확인용: 실제 디시 영상 주소가 앱 화면의 영상 칸에서 재생되는지, 안 되면 어떤 오류인지 봅니다. */
(async()=>{const out={};const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='metadata';v.style.cssText='position:fixed;left:0;top:0;width:320px;z-index:99';
 const done=new Promise(r=>{v.addEventListener('loadeddata',()=>r('loadeddata'));v.addEventListener('error',()=>r('error'));setTimeout(()=>r('timeout'),15000)});
 v.src="https://dcm6.dcinside.co.kr/viewmovie.php?code=0d6139d2424ed307af3960b8abc0afff465c70b16622&key=ec45020edc19905c51f5071efd92b0f9c48142fcbda53e8edcfba0ba9f221a0a8cd00e11a69247ca0e31213a0814d173cbd9b95a65604675317a45e717a4354851b30c0db552c23f55&ss=4&type=mp4";document.body.appendChild(v);out.result=await done;
 out.err=v.error?v.error.code+' '+v.error.message:null;out.size=v.videoWidth+'x'+v.videoHeight;out.dur=v.duration;out.net=v.networkState;out.ready=v.readyState;
 try{await v.play();await new Promise(r=>setTimeout(r,1500));out.t=v.currentTime}catch(e){out.play=e.message}
 return JSON.stringify(out)})()