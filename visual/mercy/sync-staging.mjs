import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sourcePath='tools/mercy/staging-v7.json';const staging=JSON.parse(await readFile(sourcePath,'utf8'));
const files=[...new Set(staging.scenes.map(stage=>stage.sourceFile))];const modules=new Map(await Promise.all(files.map(async file=>[file,JSON.parse(await readFile(file,'utf8'))])));
const sceneById=new Map([...modules.values()].flatMap(module=>module.scenes.map(scene=>[scene.id,scene])));
const locations=new Set(['palace','theatre','edge','west-road','rain-stage','square','patron','market','outside-theatre','late-square','late-theatre']);
const scenes=staging.scenes.map(stage=>{if(!locations.has(stage.location))throw new Error(`Unimplemented Mercy location ${stage.location}`);const scene=sceneById.get(stage.sceneId);if(!scene)throw new Error(`Missing ${stage.sceneId}`);return {...stage,choiceIds:scene.choices.map(choice=>choice.id),variantIds:scene.variants?.map(variant=>variant.id)??[]};});
const output={status:staging.status,source:sourcePath,sourceSha256:createHash('sha256').update(await readFile(sourcePath)).digest('hex'),contentSha256:staging.contentSha256??null,scenes};
await writeFile('src/world/mercy/staging.json',JSON.stringify(output,null,2)+'\n');console.log(`Pinned ${scenes.length} exact Mercy scene stages.`);
