import {persistentProps} from './world-props.js';
import {sampleOriginalPropStage,sampleSundialPebbles} from '../original-prop-stage.mjs';
import {heightAt} from '../world-terrain.mjs';
import {createSupplementaryOriginalMeshes} from '../original-prop-meshes.mjs';

// Permanent scenery is reconstructed from already-committed story flags.
// There is no second narrative state, physics simulation or incremental prop drift.
export function createPersistentStoryFixtures({T,scene,obj,ball,rod,m,white,wood,bark,leaf,leaf2}) {
  const group=new T.Group();
  group.name='committed-story-fixtures';
  scene.add(group);

  const propMeshes=createSupplementaryOriginalMeshes({
    T,obj,m,white,wood,bark,leaf,comedyProps:group,
  });
  const sign=propMeshes.sign;
  const signPose=sampleOriginalPropStage('pier-to-nowhere',30).sign;
  sign.position.set(...signPose.position);
  sign.rotation.set(...signPose.rotation);

  const stick=obj(new T.CylinderGeometry(.035,.045,.8,6),bark,
    .25,heightAt(.25,.4)+.40,.4,group);
  stick.name='committed-sundial-stick';
  const pebbleSamples=sampleSundialPebbles(30);
  const pebbles=pebbleSamples.map((sample,i)=>{
    const mesh=ball(.065,wood,...sample.position,group);
    mesh.name='committed-pebble-'+i;
    return mesh;
  });

  const bottlePose=sampleOriginalPropStage('return-to-sender',30).bottle;
  const bottle=obj(new T.CylinderGeometry(.085,.1,.37,7),
    new T.MeshStandardMaterial({color:'#8fc8b6',roughness:.42,metalness:.04,transparent:true,opacity:.8}),
    ...bottlePose.position,group);
  bottle.name='committed-message-bottle';

  // The recurring crab is not a new story event. Its visibility is a projection
  // of an existing relationship milestone; the original scene owns its animation.
  const crab=new T.Group();crab.name='committed-crab';group.add(crab);
  const crabX=1.95,crabZ=.72;
  crab.position.set(crabX,heightAt(crabX,crabZ)+.055,crabZ);
  ball(.18,m('#cf654a'),0,.06,0,crab);
  for(const side of [-1,1])for(let i=0;i<3;i++)
    rod([side*.1,.05,i*.09-.1],[side*.31,-.05,i*.14-.2],.025,m('#bf694b'),crab);
  const glove=obj(new T.BoxGeometry(.2,.055,.18),leaf2,0,.26,.04,crab);
  glove.name='committed-crab-glove';

  let previousOriginal=null,previousScene=null,previousCoconuts=-1,previousRaft=-1;
  function update(world,activeEventId=null) {
    const n=world?.narrative||{},o=world?.original||null;
    if(o===previousOriginal&&activeEventId===previousScene&&
       n.coconuts===previousCoconuts&&n.raftProgress===previousRaft)return;
    previousOriginal=o;previousScene=activeEventId;
    previousCoconuts=n.coconuts;previousRaft=n.raftProgress;
    const state=persistentProps(world);
    const sundial=state.sundial&&activeEventId!=='sundial';
    stick.visible=sundial;
    for(const item of pebbles)item.visible=sundial;
    sign.visible=state.pierSign&&activeEventId!=='pier-to-nowhere';
    bottle.visible=state.bottle&&activeEventId!=='return-to-sender';
    crab.visible=state.crab&&activeEventId!=='crab-handshake'&&activeEventId!=='return-to-sender';
    glove.visible=state.crabGlove;
    return state;
  }
  update({original:{flags:[]},narrative:{coconuts:0,raftProgress:0}});
  return {group,sign,stick,pebbles,bottle,crab,glove,update};
}
