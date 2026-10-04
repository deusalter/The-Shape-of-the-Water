import { createGameV2, exportPortableV2, validateStateV2, type ContentV2, type GameStateV2, type LegacySeedV2, type ReplayContextV2 } from '../engine/evidence-v2';
import { CheckpointStore, type SaveResult } from './checkpoint-store';
import { retainedLegacyExport } from './store';

/** V2 uses the same transactional recovery and branch logic as the legacy player. */
export class EvidenceStore extends CheckpointStore<ContentV2,GameStateV2> {
  private readonly context: ReplayContextV2 | undefined;
  constructor(factory:IDBFactory|undefined=globalThis.indexedDB,name='literary-detective-v1',context?:ReplayContextV2){
    const installed=context ? structuredClone(context) : undefined;
    super({schemaVersion:2,engineVersion:2,validateState:(content,value)=>validateStateV2(content,value,installed),exportPortable:exportPortableV2,retainedExport:retainedLegacyExport},factory,name);
    this.context=installed;
  }
  /** Call after showing the reviewed compatibility mapping; the source slot stays intact. */
  async migrate(content:ContentV2,seed:LegacySeedV2,expectedCommit:number):Promise<SaveResult>{
    try{return await this.save(content,createGameV2(content,seed,this.context),expectedCommit,{archiveCurrent:true,origin:'migration'});}
    catch{return {ok:false,code:'invalid',message:'The saved run could not be migrated with the installed compatibility mapping. The original run is unchanged.'};}
  }
}
