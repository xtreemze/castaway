// AudioWorklet: generate filtered low-frequency noise on the audio rendering thread.
// No streaming samples or periodic sound synthesis are performed by the DOM thread.
class OceanNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.previous = [0,0];
  }
  process(_inputs, outputs) {
    const output=outputs[0];
    if (!output) return true;
    for(let channel=0;channel<output.length;channel++) {
      const samples=output[channel];
      let previous=this.previous[channel]||0;
      for(let i=0;i<samples.length;i++) {
        previous=previous*.985+(Math.random()*2-1)*.015;
        samples[i]=previous;
      }
      this.previous[channel]=previous;
    }
    return true;
  }
}
registerProcessor('castaway-ocean-noise',OceanNoiseProcessor);
