// A recognizable low-poly crab at screensaver viewing distance.
// Built once; the timeline controls the returned claw pivots without reallocation.
export function createCrab({T,ball,rod,material}){
 const crab=new T.Group();
 const shell=material('#d75e3f'),accent=material('#a63a2e');
 const eyeWhite=material('#fff7db'),pupil=material('#24323c');
 const body=ball(.31,shell,0,.12,0,crab);
 body.scale.set(1.2,.57,.94);
 for(const side of [-1,1]){
  rod([side*.17,.17,.12],[side*.19,.49,.16],.045,accent,crab);
  ball(.105,eyeWhite,side*.19,.51,.18,crab);
  ball(.055,pupil,side*.19,.51,.27,crab);
  for(let i=0;i<3;i++){
   const z=-.21+i*.16;
   rod([side*.25,.07,z],[side*(.55+i*.03),-.05,z-.08],.036,accent,crab);
  }
 }
 const claws=[];
 for(const side of [-1,1]){
  const claw=new T.Group();
  claw.position.set(side*.24,.17,.19);crab.add(claw);
  rod([0,0,0],[side*.19,.035,.06],.075,accent,claw);
  ball(.15,shell,side*.26,.085,.10,claw);
  for(const forward of [-1,1])
   rod([side*.27,.08,.10],[side*.42,.08,.10+forward*.085],.045,shell,claw);
  claws.push(claw);
 }
 return {crab,claws};
}
