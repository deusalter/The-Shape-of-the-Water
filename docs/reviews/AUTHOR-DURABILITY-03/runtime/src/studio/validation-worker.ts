import { validateContentV2 } from '../engine/evidence-v2';

self.onmessage=(event:MessageEvent<{generation:number;content:unknown}>)=>{
  try{self.postMessage({generation:event.data.generation,result:validateContentV2(event.data.content)});}
  catch{self.postMessage({generation:event.data.generation,result:{ok:false,errors:['Validation stopped because this project could not be processed.']}});}
};
