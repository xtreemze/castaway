import {ISLAND,heightForRadius} from './world-terrain.mjs';

// A renderer-independent frustum fit for the complete miniature, including the
// intertidal shelf, elevated palm canopy and quay. It protects story payoffs on
// narrow portrait screens without changing the diorama camera's orbit angle.
const CROWN=[-1.4,4.8,-.7];
export const FRAME_TARGET=Object.freeze([0,1,0]);
export const STAGE_FRAME_POINTS=Object.freeze((()=>{
  const points=[];
  for(let i=0;i<64;i++){
    const angle=i*Math.PI*2/64;
    points.push(Object.freeze([
      ISLAND.radiusX*ISLAND.shelfRadius*Math.cos(angle),
      heightForRadius(ISLAND.shelfRadius),
      ISLAND.radiusZ*ISLAND.shelfRadius*Math.sin(angle),
    ]));
  }
  // Fronds fan radially from the bent top of the palm, above the beach.
  for(let i=0;i<24;i++){
    const angle=i*Math.PI*2/24;
    points.push(Object.freeze([
      CROWN[0]+3.35*Math.cos(angle),4.15,
      CROWN[2]+3.35*Math.sin(angle),
    ]));
  }
  points.push(Object.freeze([...CROWN.slice(0,1),5.4,CROWN[2]]));
  // Pier ends and the reading height of its payoff sign.
  for(const x of [2.8,5.85])for(const z of [.05,1.68]){
    points.push(Object.freeze([x,-.15,z]));
    points.push(Object.freeze([x,1.65,z]));
  }
  // Extra headroom for the airborne leaf and for actor expressions.
  points.push(Object.freeze([0,2.9,.2]));
  return points;
})());

function basis(direction){
  if(!Array.isArray(direction)||direction.length!==3||!direction.every(Number.isFinite))throw new TypeError('Finite camera direction required');
  const size=Math.hypot(...direction);
  if(!(size>1e-6))throw new RangeError('Nonzero camera direction required');
  const d=direction.map(v=>v/size);
  // Camera local right = world-up cross view vector; use a stable pole fallback.
  const right=[d[2],0,-d[0]];
  const rightSize=Math.hypot(...right);
  if(rightSize<1e-6)throw new RangeError('Camera must not be vertical');
  const r=right.map(v=>v/rightSize);
  const up=[
    d[1]*r[2]-d[2]*r[1],
    d[2]*r[0]-d[0]*r[2],
    d[0]*r[1]-d[1]*r[0],
  ];
  return {d,r,up};
}
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);

export function stageFitDistance(aspect,fovDegrees,direction,opts={}){
  if(!(Number.isFinite(aspect)&&aspect>0&&Number.isFinite(fovDegrees)&&fovDegrees>1&&fovDegrees<160))
    throw new RangeError('Valid aspect and vertical FOV required');
  const {d,r,up}=basis(direction);
  const tanHalf=Math.tan(fovDegrees*Math.PI/360);
  const marginX=opts.marginX??.9,marginY=opts.marginY??.73;
  if(marginX<=0||marginX>1||marginY<=0||marginY>1)
    throw new RangeError('Invalid frame margins');
  let distance=Math.max(0,opts.minDistance??0);
  for(const point of STAGE_FRAME_POINTS){
    const rel=point.map((v,i)=>v-FRAME_TARGET[i]);
    const depth=dot(rel,d);
    distance=Math.max(distance,
      depth+Math.abs(dot(rel,r))/(aspect*tanHalf*marginX),
      depth+Math.abs(dot(rel,up))/(tanHalf*marginY));
  }
  return distance+.05;
}

export function sampleStageProjection(aspect,fovDegrees,direction,distance){
  const {d,r,up}=basis(direction),tanHalf=Math.tan(fovDegrees*Math.PI/360);
  if(!(distance>0))throw new RangeError('Positive distance required');
  return STAGE_FRAME_POINTS.map(point=>{
    const rel=point.map((v,i)=>v-FRAME_TARGET[i]);
    const depth=distance-dot(rel,d);
    return [dot(rel,r)/(depth*tanHalf*aspect),dot(rel,up)/(depth*tanHalf)];
  });
}
