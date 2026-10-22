import {solveTwoBone} from './rig-kinematics.mjs';

// Object3D articulation keeps authoring code-only and low-poly.
// Exposed handles intentionally preserve the earlier animation sampler interface.
export function createCastawayRig({T,scene,obj,ball,rod,m,skin,hair,shirt,shorts,white}) {
  const actor=new T.Group();actor.name='castaway-root';actor.position.set(0,.10,.2);scene.add(actor);
  const pelvis=new T.Group();pelvis.name='pelvis';actor.add(pelvis);
  const torso=new T.Group();torso.name='spine-chest';torso.position.y=1.15;pelvis.add(torso);
  obj(new T.CylinderGeometry(.29,.36,.8,8),shirt,0,0,0,torso);
  const neck=new T.Group();neck.name='neck';neck.position.y=.6;torso.add(neck);
  const head=new T.Group();head.name='head';head.position.y=.05;neck.add(head);
  ball(.30,skin,0,0,0,head);ball(.29,hair,0,.16,-.07,head);
  const beard=new T.Group();beard.name='beard';head.add(beard);
  ball(.26,hair,0,-.18,.15,beard);
  const eyes=[],pupils=[],brows=[];
  for(const s of [-1,1]) {
    eyes.push(ball(.047,white,s*.13,.04,.282,head));
    pupils.push(ball(.023,m('#18261f'),s*.13,.04,.321,head));
    brows.push(obj(new T.BoxGeometry(.15,.028,.04),hair,s*.13,.145,.29,head));
    ball(.14,hair,s*.22,-.02,-.12,head);
  }
  const nose=obj(new T.ConeGeometry(.105,.18,6),skin,0,-.05,.31,head);
  nose.rotation.x=Math.PI/2;
  const mouth=new T.Group();mouth.name='mouth';mouth.position.set(0,-.21,.284);head.add(mouth);
  const lip=obj(new T.BoxGeometry(.16,.025,.03),m('#593728'),0,0,0,mouth);
  obj(new T.CylinderGeometry(.36,.34,.32,8),shorts,0,.85,0,pelvis);
  const arms=[],hands=[],legs=[],elbows=[],knees=[],ankles=[];
  const ARM_UPPER=.30, ARM_LOWER=.31, LEG_UPPER=.33, LEG_LOWER=.33;
  for(const s of [-1,1]) {
    const arm=new T.Group();arm.name=s<0?'shoulder-left':'shoulder-right';
    arm.position.set(s*.33,.3,0);torso.add(arm);
    rod([0,0,0],[0,-ARM_UPPER,0],.11,skin,arm);
    const elbow=new T.Group();elbow.name=s<0?'elbow-left':'elbow-right';
    elbow.position.set(0,-ARM_UPPER,0);arm.add(elbow);
    ball(.113,skin,0,0,0,elbow);
    rod([0,0,0],[0,-ARM_LOWER,0],.095,skin,elbow);
    const hand=new T.Group();hand.name=s<0?'wrist-left':'wrist-right';
    hand.position.set(0,-ARM_LOWER,0);elbow.add(hand);
    ball(.105,skin,0,0,0,hand);
    for(let j=0;j<3;j++) {
      const finger=obj(new T.CapsuleGeometry(.027,.11,3,5),skin,(j-1)*.063,-.065,.072,hand);
      finger.userData.finger=true;
    }
    arms.push(arm);hands.push(hand);elbows.push(elbow);
    const leg=new T.Group();leg.name=s<0?'hip-left':'hip-right';
    leg.position.set(s*.18,.78,0);pelvis.add(leg);
    rod([0,0,0],[0,-LEG_UPPER,0],.125,skin,leg);
    const knee=new T.Group();knee.name=s<0?'knee-left':'knee-right';
    knee.position.set(0,-LEG_UPPER,0);leg.add(knee);
    ball(.122,skin,0,0,0,knee);
    rod([0,0,0],[0,-LEG_LOWER,0],.10,skin,knee);
    const ankle=new T.Group();ankle.name=s<0?'ankle-left':'ankle-right';
    ankle.position.set(0,-LEG_LOWER,0);knee.add(ankle);
    obj(new T.BoxGeometry(.2,.12,.34),skin,0,-.03,.13,ankle);
    legs.push(leg);knees.push(knee);ankles.push(ankle);
  }
  const socket=(name)=>actor.getObjectByName(name);
  const up=new T.Vector3(0,-1,0);
  function applyHandIK(kind,time,goal,overrideWeight=null) {
    const explicit=overrideWeight!==null;
    if(!explicit&&(!['coconut','build','raft'].includes(kind)||time<12||time>=20))return null;
    const amount=explicit?(Number.isFinite(overrideWeight)?Math.max(0,Math.min(1,overrideWeight)):0)
      :Math.min(1,(time-12)/.6,(20-time)/.6);
    if(amount<=0)return null;
    const arm=arms[1],elbow=elbows[1];
    actor.updateWorldMatrix(true,true);
    const root=arm.getWorldPosition(new T.Vector3());
    const target=new T.Vector3(...goal);
    const pole=root.clone().add(new T.Vector3(.65,-.15,.35));
    const solution=solveTwoBone(root.toArray(),target.toArray(),pole.toArray(),ARM_UPPER,ARM_LOWER);
    const rootSpace=arm.parent;
    const elbowLocal=rootSpace.worldToLocal(new T.Vector3(...solution.elbow));
    const shoulderLocal=rootSpace.worldToLocal(root.clone());
    const aim=elbowLocal.sub(shoulderLocal).normalize();
    const shoulderGoal=new T.Quaternion().setFromUnitVectors(up,aim);
    arm.quaternion.slerp(shoulderGoal,amount);
    arm.updateWorldMatrix(true,true);
    const wristLocal=arm.worldToLocal(new T.Vector3(...solution.wrist));
    const forearmAim=wristLocal.sub(elbow.position).normalize();
    const elbowGoal=new T.Quaternion().setFromUnitVectors(up,forearmAim);
    elbow.quaternion.slerp(elbowGoal,amount);
    return solution;
  }
  function secondaryRigMotion(time,shock=0) {
    beard.rotation.x=.08*Math.sin(time*1.3-.5)+shock*.09;
    beard.rotation.z=.065*Math.sin(time*.89-1.1);
    mouth.scale.y=1+Math.max(0,shock)*2.4;
  }
  return {actor,pelvis,torso,neck,head,beard,mouth,eyes,pupils,brows,
    arms,hands,legs,elbows,knees,ankles,socket,applyHandIK,secondaryRigMotion};
}
