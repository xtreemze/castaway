// Camera blocking is authored in world-space and shared by worker and fallback.
export const WIDE_SHOT=Object.freeze({position:[12,9,17],focus:[0,1,0]});
export const CRAB_LANDSCAPE_SHOT=Object.freeze({position:[4.8,3.6,7.1],focus:[.85,1.1,.45]});
export const CRAB_PORTRAIT_SHOT=Object.freeze({position:[6.8,4.4,11.5],focus:[1.05,1,.55]});
export function cameraShot(sceneId,aspectRatio){
 if(sceneId!=='crab-handshake')return WIDE_SHOT;
 return Number.isFinite(aspectRatio)&&aspectRatio<.75?CRAB_PORTRAIT_SHOT:CRAB_LANDSCAPE_SHOT;
}
export function framingEase(dt){
 return 1-Math.exp(-Math.max(0,Math.min(.05,dt))*1.8);
}
