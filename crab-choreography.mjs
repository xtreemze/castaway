const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
export function crabBlocking(time){
 const t=Math.max(0,Math.min(30,time));
 const emerge=ease((t-1)/4),approach=ease((t-12)/6),escape=ease((t-20)/5);
 const crabX=mix(1.5,.55,approach)+2.3*escape;
 const crabZ=.7+.04*Math.sin(t*7)*emerge*(1-escape);
 const contact=ease((t-18.6)/1.2);
 const handX=.35+.2*ease((t-12)/5);
 const handY=mix(1.16,.32,ease((t-12)/6));
 return {
  crabX,crabZ,crabScale:emerge*(1-ease((t-28)/2)),
  gloveX:mix(handX,crabX,contact),gloveY:mix(handY,.34,contact),
  gloveZ:mix(.35,crabZ,contact),gloveAngle:contact*.25*Math.sin(t*7),
  handBend:ease((t-10)/8)*(1-ease((t-22)/4)),
  handReach:ease((t-12)/6)*(1-ease((t-23)/4)),
  recognition:ease((t-22.5)/1.2)*(1-ease((t-28)/2)),
  bow:ease((t-6)/2)*(1-ease((t-10)/2))+.5*ease((t-28)/1)*(1-ease((t-29)/1)),
  contact
 };
}
