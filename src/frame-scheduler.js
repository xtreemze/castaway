/**
 * One pending render callback per active scene; no polling while the page is hidden.
 * This is environment-independent and works with worker rAF or setTimeout fallback.
 */
export function createFrameScheduler({request,cancel,render,onResume=()=>{}}) {
  if(typeof request!=='function'||typeof cancel!=='function'||typeof render!=='function')
    throw new TypeError('Frame scheduler requires request, cancel, and render');
  let pending=null,visible=true,disposed=false,started=false;
  const tick=timestamp=>{
    pending=null;
    if(disposed||!visible)return;
    // Reserve exactly one next frame before painting, matching the former loop.
    pending=request(tick);
    render(timestamp);
  };
  const start=()=>{
    if(!started&&!disposed){
      started=true;
      if(visible&&pending===null)pending=request(tick);
    }
  };
  const setVisible=value=>{
    if(disposed)return;
    const next=Boolean(value);
    if(next===visible)return;
    visible=next;
    if(!visible){
      if(pending!==null)cancel(pending);
      pending=null;
    }else{
      onResume();
      if(started&&pending===null)pending=request(tick);
    }
  };
  const dispose=()=>{
    if(disposed)return;
    disposed=true;
    if(pending!==null)cancel(pending);
    pending=null;
  };
  return {start,setVisible,dispose};
}
