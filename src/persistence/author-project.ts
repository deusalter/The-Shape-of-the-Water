import { checkedProject, type AuthorProject } from '../studio/project';
import { validateContentV2, type ContentV2 } from '../engine/evidence-v2';
import { isObject } from '../engine/validate';

function checked(value:unknown):{project:AuthorProject;lastValid:ContentV2}{
  if(!isObject(value)||Object.keys(value).length!==2)throw Error('Malformed author draft envelope.');
  const project=checkedProject(value.project),valid=validateContentV2(value.lastValid);
  if(!valid.ok||valid.value.id!==project.content.id)throw Error('The saved last-valid preview failed validation or belongs to another project.');
  return {project,lastValid:valid.value};
}
export class AuthorProjectStore {
  constructor(private readonly factory:IDBFactory|undefined=globalThis.indexedDB,private readonly name='literary-detective-author-projects-v2'){}
  private open():Promise<IDBDatabase>{if(!this.factory)return Promise.reject(new DOMException('Storage unavailable','NotSupportedError'));return new Promise((resolve,reject)=>{const request=this.factory!.open(this.name,1);request.onupgradeneeded=()=>request.result.createObjectStore('projects');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new DOMException('Author storage blocked','InvalidStateError'));});}
  async save(project:AuthorProject,lastValid:ContentV2){const value=checked({project,lastValid}),db=await this.open();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(value,project.content.id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  async load(id:string){const db=await this.open();try{const raw=await new Promise<unknown>((resolve,reject)=>{const request=db.transaction('projects').objectStore('projects').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});if(raw===undefined)return;const value=checked(raw);if(value.project.content.id!==id)throw Error('Author project identity mismatch.');return value;}finally{db.close();}}
}
