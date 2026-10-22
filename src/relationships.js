/** Stable social consequences derived from committed history, not transient meshes. */
export function relationships(world) {
 const flags=new Set(world?.original?.flags??[]);
 const played=world?.original?.played??[];
 const crabEncounters=played.filter(id=>id==='crab-handshake'||id==='return-to-sender').length;
 return {
  crab:{met:flags.has('crab_met'),encounters:crabEncounters,trust:Math.min(3,crabEncounters),
   keepsGlove:flags.has('crab_met'),deliveredMessage:flags.has('bottle_sent')},
  island:{attachment:Math.min(5,Math.floor((world?.narrative?.episode??0)/8)),
   constructedShelter:flags.has('shade_attempted'),hasSundial:flags.has('sundial_built')},
 };
}
