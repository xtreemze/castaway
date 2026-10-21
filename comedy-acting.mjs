// Deterministic pose layer for wordless physical comedy.
// Outputs additive offsets; the existing body rig remains the authority.
const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
const pulse=(t,a,b)=>ease((t-a)/1.2)*(1-ease((t-b)/0.8));
export function comedyPose(id,t){
  const prep=pulse(t,6,19),payoff=pulse(t,19,24),aftermath=pulse(t,24,29);
  switch(id){
    case 'portable-shade':return {lean:-.09*prep+.2*payoff,headRoll:.35*payoff-.2*aftermath,lookUp:-.22*prep+.16*payoff,arm:-1.05*prep+.45*aftermath,bodyTurn:.5*payoff};
    case 'crab-handshake':return {lean:-.12*prep+.16*aftermath,headRoll:-.26*payoff,lookUp:.3*payoff,arm:-1.25*prep+.3*payoff,bodyTurn:0};
    case 'sundial':return {lean:.32*prep-.08*aftermath,headRoll:.22*payoff,lookUp:-.2*prep+.22*payoff,arm:-.7*prep,bodyTurn:0};
    case 'return-to-sender':return {lean:.28*prep-.1*aftermath,headRoll:.3*payoff,lookUp:.13*payoff,arm:-1.1*prep+.5*payoff,bodyTurn:0};
    case 'pier-to-nowhere':return {lean:-.12*prep+.18*payoff,headRoll:-.25*payoff,lookUp:.16*payoff,arm:-.45*prep,bodyTurn:0};
    default:return {lean:0,headRoll:0,lookUp:0,arm:0,bodyTurn:0};
  }
}
export function comedySound(id,beat){
  if(beat!==2&&beat!==3&&beat!==4)return null;
  const base={'portable-shade':280,'crab-handshake':410,'sundial':330,'return-to-sender':480,'pier-to-nowhere':220}[id];
  return base?base*(beat===3?.65:beat===4?.45:1):null;
}
