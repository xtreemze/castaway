// Original event concepts inspired by classic wordless physical comedy.
// Historical scenes are research references in issue #1, not animations to reproduce.
export const COMEDY_MECHANISMS = Object.freeze(['reversal','status-inversion','anticlimax','escalation','misunderstanding','dignity','self-sabotage','disproportion']);
export const EVENTS = Object.freeze([
  {
    id:'portable-shade',title:'The Portable Shade',kind:'gag',origin:'original',mechanism:'reversal',
    durationSec:30,actors:['castaway'],props:['palm-leaf','hat'],requires:[],effects:['shade_attempted'],
    phases:[
      'The sun is bright and the castaway squints.',
      'He painstakingly fastens a broad leaf above his hat.',
      'He stands proudly beneath his invention.',
      'A gentle breeze turns the leaf behind his head.',
      'He follows the shadow in a very slow circle.',
      'He gives up, sits in the shadow of the actual palm.'
    ],
    animation:{anticipation:1.4,impact:0.2,hold:1.5,secondary:'leaf lag and beard settling'},
    sound:['soft leaf rustle','hat tap','one gentle gust'],
    accessibilitySummary:'He makes a portable sunshade, but wind spins its shade behind him.'
  },
  {
    id:'crab-handshake',title:'Diplomatic Relations',kind:'gag',origin:'original',mechanism:'status-inversion',
    durationSec:30,actors:['castaway','crab'],props:['leaf glove'],requires:[],effects:['crab_met'],
    phases:[
      'A crab emerges from the sand beside the quay.',
      'The castaway adjusts his leaf glove and bows.',
      'He extends his hand with grand ceremony.',
      'The crab takes the glove and walks away wearing it.',
      'The castaway holds his bare hand out, stunned.',
      'He bows again as the crab disappears.'
    ],
    animation:{anticipation:1.6,impact:0,hold:2.1,secondary:'delayed eyes then beard follow'},
    sound:['crab footsteps','tiny fabric slip'],
    accessibilitySummary:'A crab takes his glove rather than accepting his formal handshake.'
  },
  {
    id:'sundial',title:'The Perfect Timepiece',kind:'gag',origin:'original',mechanism:'anticlimax',
    durationSec:30,actors:['castaway'],props:['driftwood','pebbles','palm'],requires:[],effects:['sundial_built'],
    phases:[
      'The castaway notices the slow afternoon sun.',
      'He aligns pebbles meticulously around a driftwood marker.',
      'He measures a shadow with scholarly satisfaction.',
      'A palm frond tilts and creates a second, bigger shadow.',
      'He compares the two, confused.',
      'He puts his marker aside and takes a nap.'
    ],
    animation:{anticipation:1.2,impact:0,hold:1.7,secondary:'palm swaying and thoughtful head tilt'},
    sound:['pebbles clicking','palm rustle','sigh'],
    accessibilitySummary:'His carefully calibrated sundial becomes useless when a palm frond moves.'
  },
  {
    id:'return-to-sender',title:'Return to Sender',kind:'gag',origin:'original',mechanism:'misunderstanding',
    durationSec:30,actors:['castaway','crab'],props:['bottle','paper','cork'],requires:['crab_met'],effects:['bottle_sent'],
    phases:['He writes a carefully folded distress note.','He seals it in a bottle.','He launches the bottle into the outgoing current.','The bottle washes immediately onto the opposite side of the quay.','A crab carries it back to his feet.','He accepts the delivery with a formal nod.'],
    animation:{anticipation:1.3,impact:0.2,hold:1.8,secondary:'bottle bobbing'},sound:['cork pop','surf swish','crab footsteps'],
    accessibilitySummary:'A distress bottle washes back and a crab dutifully returns it.'
  },
  {
    id:'pier-to-nowhere',title:'The Magnificent Pier',kind:'milestone',origin:'original',mechanism:'anticlimax',
    durationSec:30,actors:['castaway'],props:['planks','quay','sign'],requires:[],effects:['pier_inspected'],
    phases:['He studies the quay with great seriousness.','He sets the final plank and checks its alignment.','He proudly marches to the end.','The tide slips outward, leaving his pier above bare sand.','He looks from the dry pier to the distant water.','He puts out a tiny sign reading OPEN TOMORROW.'],
    animation:{anticipation:1.4,impact:0,hold:2,secondary:'gentle retreating water'},sound:['wood click','tide ebb','wood sign tap'],
    accessibilitySummary:'He completes a pier, only for the tide to retreat beyond it.'
  }
]);
export function validateCatalog(events=EVENTS){
  const ids=new Set(),errors=[];
  for(const event of events){
    if(!event.id||ids.has(event.id))errors.push('Duplicate or missing ID: '+event.id);
    ids.add(event.id);
    if(!COMEDY_MECHANISMS.includes(event.mechanism))errors.push('Unknown mechanism: '+event.id);
    if(event.origin!=='original')errors.push('Only original production events allowed: '+event.id);
    if(event.durationSec!==30)errors.push('Episode must be 30 seconds: '+event.id);
    if(!Array.isArray(event.phases)||event.phases.length!==6||event.phases.some(v=>!v))errors.push('Missing causal beat: '+event.id);
    if(!event.accessibilitySummary)errors.push('Missing accessible synopsis: '+event.id);
  }
  for(const event of events)for(const req of event.requires){
    if(!events.some(e=>e.effects.includes(req)))errors.push('Unknown prerequisite '+req+' for '+event.id);
  }
  return errors;
}
if(validateCatalog().length)throw new Error(validateCatalog().join('\n'));
