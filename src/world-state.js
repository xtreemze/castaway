import {advanceChapter} from './chapters.js';
// Versioned canonical persistence for both scene families.
// Legacy keys are read only for migration; all subsequent writes use one snapshot.
export const STORY_KEY = 'castaway-world-v2';
export const defaultNarrative = () => ({day:1,hope:70,failures:0,coconuts:0,raftProgress:0,seen:{},lastKinds:[],lastEvent:0,seed:0xCA57A,episode:0});
export const defaultOriginal = () => ({seed:0xC457A,played:[],counts:{},flags:[],lastMechanism:null,episode:0});
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = (value,fallback,min=0) => Number.isSafeInteger(value)&&value>=min ? value : fallback;
export function normalizeWorld(value, legacyNarrative, legacyOriginal) {
  const snapshot=object(value);
  const legacy=object(legacyNarrative), original=object(legacyOriginal);
  const n={...defaultNarrative(),...object(snapshot.narrative ?? legacy)};
  n.day=integer(n.day,1,1);n.episode=integer(n.episode,0);n.seed=integer(n.seed,0xCA57A);
  n.raftProgress=integer(n.raftProgress,0);n.coconuts=integer(n.coconuts,0);
  n.seen=object(n.seen);n.lastKinds=Array.isArray(n.lastKinds)?n.lastKinds.slice(-3):[];
  const o={...defaultOriginal(),...object(snapshot.original ?? original)};
  o.episode=integer(o.episode,0);o.seed=integer(o.seed,0xC457A);
  o.played=Array.isArray(o.played)?o.played.slice(-40):[];
  if(!snapshot.original?.counts&&!original.counts&&!o.counts?.['crab-handshake']){
    // Legacy saves retain only the most recent 40 events; earlier counts cannot be recovered.
    o.counts=Object.fromEntries([...new Set(o.played)].map(id=>[id,o.played.filter(v=>v===id).length]));
  } else o.counts=Object.fromEntries(Object.entries(object(o.counts)).filter(([,v])=>Number.isSafeInteger(v)&&v>=0));
  o.flags=Array.isArray(o.flags)?[...new Set(o.flags)]:[];
  const current=object(snapshot.current);
  return {version:2,chapter:integer(snapshot.chapter,0),narrative:n,original:o,current:{
    family:current.family==='original'||current.family==='legacy'?current.family:null,
    id:typeof current.id==='string'?current.id:null,
    elapsed:Number.isFinite(current.elapsed)?Math.min(30,Math.max(0,current.elapsed)):0,
  }};
}
export function loadWorld(storage) {
  const read=key=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
  return normalizeWorld(read(STORY_KEY),read('castaway-story-v1'),read('castaway-original-story-v1'));
}
export function saveWorld(storage,world) {
  const result=normalizeWorld(world);
  try{storage.setItem(STORY_KEY,JSON.stringify(result));return true}catch{return false}
}
export function completeEpisode(world,family,id,advance) {
  const next=normalizeWorld(world);
  if(next.current.family!==family||next.current.id!==id)return next;
  if(advance)advance(next);
  next.narrative.day++;
  next.chapter=advanceChapter(next).chapter;
  next.current={family:null,id:null,elapsed:0};
  return next;
}
export function interruptEpisode(world) {
  const next=normalizeWorld(world);
  next.current={family:null,id:null,elapsed:0};
  return next;
}
