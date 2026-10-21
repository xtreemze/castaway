// Deterministic, renderer-independent pose sampler. Angles in radians.
export const BEATS=[0,5,12,20,25,30];
export const TRACKS={
 coconut:[[0,0,0,0,0],[5,-.3,.35,-.65,-.65],[12,.32,-.22,-1.3,-.6],[20,-.45,.38,1.1,-.15],[25,.12,-.1,.2,.2],[30,0,0,0,0]],
 fish:[[0,0,0,0,0],[5,.3,-.35,-.7,-.15],[12,-.25,.15,-1.2,-.2],[20,.4,-.35,.1,1.2],[25,.1,0,0,0],[30,0,0,0,0]],
 wave:[[0,0,0,0,0],[5,-.1,-.2,.1,-1.5],[12,-.25,.3,.1,-2.9],[20,.3,-.3,.1,-.2],[25,0,0,0,-.1],[30,0,0,0,0]],
 build:[[0,0,0,0,0],[5,.4,-.3,-.7,-.7],[12,.65,-.1,-1.4,-1.3],[20,-.2,.3,.1,.2],[25,.15,0,-.2,-.2],[30,0,0,0,0]],
 raft:[[0,0,0,0,0],[5,.2,-.25,-.4,-.4],[12,.4,.1,-1.1,-1.1],[20,-.4,.4,.4,.4],[25,.1,0,0,0],[30,0,0,0,0]],
 depart:[[0,0,0,0,0],[5,-.15,-.35,-.5,-.5],[12,-.3,.1,-1.8,-1.8],[20,.65,.5,1.1,1.1],[25,.25,.1,.2,.2],[30,0,0,0,0]],
 alarm:[[0,0,0,0,0],[5,-.3,-.3,-.6,-.6],[12,-.6,.5,-2,-2],[20,.45,-.2,1.4,1.4],[25,.1,0,.2,.2],[30,0,0,0,0]]
};
const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
export function samplePose(kind,time){const track=TRACKS[kind];if(!track)return [0,0,0,0];const t=Math.max(0,Math.min(30,time));for(let i=1;i<track.length;i++){const b=track[i];if(t<=b[0]){const a=track[i-1],f=ease((t-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>v+(b[j+1]-v)*f)}}return track.at(-1).slice(1)}
export function beatAt(time){return Math.max(0,Math.min(4,(time>=30?5:BEATS.findIndex((end,i)=>i>0&&time<end))-1))}