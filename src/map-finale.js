// The map award plays once on the last hit. It never changes learning or certificate progress.
// Full screen, muted: the film carries burned-in captions, so the bottom of the picture stays free of controls.
// The 'map-finale' event tells adventure-app.js to play the finale song while this dialog is open (the village theme returns on close).
export function openMapFinale(host, source) {
 const doc=host.ownerDocument;
 if(!host.isConnected||doc.querySelector('.map-finale-dialog'))return;
 const dialog=doc.createElement('dialog');dialog.className='map-finale-dialog';
 dialog.setAttribute('aria-label','지도 모험 피날레');
 Object.assign(dialog.style,{position:'fixed',inset:'0',width:'100dvw',height:'100dvh',maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',border:'0',borderRadius:'0',background:'#000',color:'#fff',overflow:'hidden',zIndex:'999'});
 const video=doc.createElement('video');video.src=source;video.playsInline=true;video.muted=true;video.autoplay=true;video.preload='metadata';video.setAttribute('aria-label','지도 탐험 피날레 영상, 자막 포함');
 Object.assign(video.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',background:'#000'});
 const bar=doc.createElement('div');
 Object.assign(bar.style,{position:'absolute',inset:'0 0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'max(12px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 24px max(16px,env(safe-area-inset-left))',background:'linear-gradient(#081611c7,#08161166 70%,transparent)',textShadow:'0 2px 8px #000'});
 const title=doc.createElement('h2');title.textContent='모든 악당을 물리쳤어!';Object.assign(title.style,{margin:'0',fontSize:'clamp(16px,2vw,22px)',minWidth:'0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});
 const button=label=>{const b=doc.createElement('button');b.type='button';b.textContent=label;Object.assign(b.style,{minHeight:'48px',padding:'8px 18px',border:'1px solid #ffffff75',borderRadius:'999px',background:'#152b24e6',color:'#fff',font:'inherit',fontSize:'16px',whiteSpace:'nowrap',cursor:'pointer'});return b;};
 const toggle=button('일시정지'),close=button('지도로 돌아가기');
 const actions=doc.createElement('div');Object.assign(actions.style,{display:'flex',gap:'8px',flex:'none'});actions.append(toggle,close);
 bar.append(title,actions);
 const status=doc.createElement('p');status.hidden=true;status.role='status';
 Object.assign(status.style,{position:'absolute',top:'84px',left:'50%',transform:'translateX(-50%)',maxWidth:'85vw',margin:'0',padding:'8px 16px',borderRadius:'12px',background:'#10271edb',fontSize:'17px'});
 dialog.append(video,bar,status);doc.body.append(dialog);dialog.showModal();
 const announce=open=>doc.dispatchEvent(new CustomEvent('map-finale',{detail:{open}}));announce(true);
 const sync=()=>{toggle.textContent=video.ended?'다시 보기':video.paused?'재생':'일시정지';};
 for(const name of ['play','pause','ended'])video.addEventListener(name,sync);
 toggle.addEventListener('click',()=>{if(video.paused||video.ended)video.play().catch(()=>{});else video.pause();});
 close.addEventListener('click',()=>dialog.close());
 video.addEventListener('error',()=>{status.hidden=false;status.textContent='지금은 영상을 열 수 없어. 지도 퇴치 기록은 저장됐어.';});
 dialog.addEventListener('close',()=>{video.pause();dialog.remove();announce(false);},{once:true});
 video.play().catch(()=>sync());
 sync();
}
