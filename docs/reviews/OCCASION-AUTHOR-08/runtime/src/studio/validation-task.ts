import type { ContentV2 } from '../engine/evidence-v2';
import type { Validation } from '../engine/types';

export interface ValidationWorker {onmessage:((event:MessageEvent)=>void)|null;onerror:((event:Event)=>void)|null;postMessage(value:unknown):void;terminate():void}
export class ValidationTask {
  private generation=0;
  private active:ValidationWorker|undefined;
  constructor(private readonly makeWorker:()=>ValidationWorker){}
  run(content:unknown,complete:(result:Validation<ContentV2>)=>void):number{
    this.cancel();const generation=this.generation,worker=this.makeWorker();this.active=worker;
    worker.onmessage=event=>{if(this.active!==worker||this.generation!==generation||event.data.generation!==generation)return;this.active=undefined;worker.terminate();complete(event.data.result);};
    worker.onerror=()=>{if(this.active!==worker||this.generation!==generation)return;this.active=undefined;worker.terminate();complete({ok:false,errors:['Validation worker failed. Your draft is unchanged.']});};
    worker.postMessage({generation,content});return generation;
  }
  cancel():void{this.generation++;this.active?.terminate();this.active=undefined;}
}
