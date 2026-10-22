import {seededRandom} from './narrative.js';
import {relationships} from './relationships.js';
/** One deterministic eligibility and scoring policy for both narrative families. */
export function selectEpisode(world, stories, catalog, previous=null) {
 const n=world.narrative, o=world.original;
 const flags=new Set(o.flags), recent=o.played.slice(-3), bonds=relationships(world);
 const candidates=[];
 for(let i=0;i<stories.length;i++){
  const kind=stories[i][2];
  if(i===6 && n.raftProgress<2 || i===9 && n.raftProgress<3)continue;
  candidates.push({family:'legacy',id:String(i),kind,mechanism:kind,
   visits:n.seen[i]||0,penalty:n.lastKinds.includes(kind)?.45:0});
 }
 for(const event of catalog){
  if(!event.requires.every(flag=>flags.has(flag)))continue;
  if(event.kind==='milestone' && o.flags.includes(event.effects[0]))continue;
  candidates.push({family:'original',id:event.id,kind:event.id,mechanism:event.mechanism,
   visits:o.counts?.[event.id]??o.played.filter(id=>id===event.id).length,
   penalty:(recent.includes(event.id)?1.5:0)+(o.lastMechanism===event.mechanism?.35:0)+(event.id==='crab-handshake'&&bonds.crab.encounters>=2?.25:0)});
 }
 const pool=candidates.filter(candidate=>!previous||candidate.family!==previous.family||candidate.id!==previous.id);
 if(!pool.length)return null;
 const random=seededRandom(`${n.seed}:${n.episode}:${o.episode}:${o.seed}`);
 let best=null,score=-Infinity;
 for(const candidate of pool){
  const value=random()-candidate.visits*.17-candidate.penalty;
  if(value>score){score=value;best=candidate}
 }
 return {family:best.family,id:best.id};
}
