// Timeline-only animation samples: no mutable time accumulation, no renderer coupling.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function crabHandshakeAt(seconds){
 const t=clamp(seconds/30)*30;
 const arrival=ease((t-1)/5);
 const greeting=ease((t-6)/5);
 const transfer=ease((t-19)/1.5);
 const exit=ease((t-21)/7);
 const bow=ease((t-26)/1.5)*(1-ease((t-29)/1));
 return {
  crabX:2.5-1.65*arrival+2.8*exit,
  crabZ:.7+.08*Math.sin(t*10)*arrival*(1-exit),
  crabYaw:.3*transfer,
  crabVisible:t<29,
  gloveX:transfer?(.42*(1-transfer)+(2.5-1.65*arrival+2.8*exit)*transfer):.42,
  gloveY:1.22*(1-transfer)+(.4+.14*Math.sin(t*10))*transfer,
  gloveZ:.5*(1-transfer)+.7*transfer,
  gloveAngle:transfer*.22*Math.sin(t*10),
  castawayBow:.18*greeting*(1-ease((t-11)/2))+.22*bow,
  extendedHand:greeting*(1-ease((t-22)/3)),
  shock:ease((t-20.5)/.8)*(1-ease((t-26)/1.5))
 };
}
