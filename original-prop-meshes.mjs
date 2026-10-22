// Renderer-only geometry; story state and prop ownership are sampled elsewhere.
export function createSupplementaryOriginalMeshes({T,obj,m,white,wood,bark,leaf,comedyProps}) {
  const hat=new T.Group();hat.name='story-hat';comedyProps.add(hat);
  obj(new T.CylinderGeometry(.36,.38,.055,12),leaf,0,.025,0,hat);
  obj(new T.CylinderGeometry(.19,.24,.24,10),bark,0,.165,0,hat);
  obj(new T.CylinderGeometry(.246,.246,.045,10),leaf,0,.1,0,hat);

  const paper=new T.Group();paper.name='story-sos-letter';comedyProps.add(paper);
  obj(new T.BoxGeometry(.25,.012,.18),white,0,0,0,paper);
  const fold=obj(new T.BoxGeometry(.015,.014,.18),m('#d4c6a7'),0,.01,0,paper);
  fold.castShadow=false;

  const cork=new T.Group();cork.name='story-bottle-cork';comedyProps.add(cork);
  obj(new T.CylinderGeometry(.073,.055,.12,9),bark,0,0,0,cork);

  const sign=new T.Group();sign.name='story-quay-sign';comedyProps.add(sign);
  obj(new T.CylinderGeometry(.037,.053,.58,7),wood,0,.29,0,sign);
  obj(new T.BoxGeometry(.92,.48,.09),bark,0,.69,0,sign);
  // Canvas text is original, generated at runtime and readable from the stage.
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(ctx) {
    ctx.fillStyle='#eed8ab';ctx.fillRect(0,0,512,256);
    ctx.strokeStyle='#8a5d39';ctx.lineWidth=20;ctx.strokeRect(10,10,492,236);
    ctx.fillStyle='#4c3729';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 94px system-ui';ctx.fillText('OPEN',256,98);
    ctx.font='bold 62px system-ui';ctx.fillText('TOMORROW',256,187);
  }
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  const label=obj(new T.PlaneGeometry(.84,.4),
    new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,transparent:false}),0,.69,.051,sign);
  label.castShadow=false;
  // Visibility is completely owned by the event sampler.
  for(const item of [hat,paper,cork,sign])item.visible=false;
  return {hat,paper,cork,sign};
}
