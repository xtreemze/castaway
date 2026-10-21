// Deterministic facial expression and grasp intent derived from story time.
const pulse=(t,c,w)=>Math.max(0,1-Math.abs(t-c)/w);
export function expressionAt(kind,time){
 const t=Math.max(0,Math.min(30,time));
 const blink=Math.max(pulse(t,4.2,.13),pulse(t,10.3,.12),pulse(t,24.8,.15));
 const shock=(kind==='coconut'||kind==='depart'||kind==='alarm')?pulse(t,21,3):0;
 const focus=(kind==='fish'||kind==='build'||kind==='coconut')?Math.min(1,t/8)*(1-Math.min(1,Math.max(0,t-23)/4)):0;
 const gazeX=kind==='wave'?.25:kind==='coconut'?-.25:kind==='fish'?.2:0;
 const gazeY=kind==='coconut'&&t<12?.15:kind==='sleep'?-.2:0;
 const grasp=(kind==='coconut'||kind==='build'||kind==='raft')&&t>=12&&t<20?1:0;
 return {blink,shock,focus,gazeX,gazeY,grasp};
}
