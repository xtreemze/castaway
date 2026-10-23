import { startScene } from './scene-runtime.js';

let scene;
self.onmessage = ({data}) => {
  try {
    if(data.type === 'init') {
      scene = startScene({
        canvas:data.canvas,
        width:data.width,
        height:data.height,
        pixelRatio:data.pixelRatio,
        initialStoryState:data.initialStoryState,
        initialNarrativeState:data.initialNarrativeState,
        preview:data.preview,
        emit:message=>self.postMessage(message),
      });
      self.postMessage({type:'ready'});
    } else {
      scene?.handle(data);
    }
  } catch(error) {
    self.postMessage({type:'fatal',message:String(error?.message||error)});
  }
};
