"""Inspect actual W-002 GLB and retained first-night geometry without a browser."""
from pathlib import Path
import hashlib,json,struct

ROOT=Path(__file__).resolve().parents[2]
def glb(path):
    data=path.read_bytes();magic,version,length=struct.unpack_from('<III',data)
    assert magic==0x46546c67 and version==2 and length==len(data)
    offset=12;document=None;binary=None
    while offset<len(data):
        size,kind=struct.unpack_from('<II',data,offset);chunk=data[offset+8:offset+8+size];offset+=8+size
        if kind==0x4e4f534a:document=json.loads(chunk)
        elif kind==0x004e4942:binary=chunk
    assert document is not None and binary is not None
    return document,binary
def accessor(document,binary,index):
    value=document['accessors'][index];view=document['bufferViews'][value['bufferView']]
    code,size={5121:('B',1),5123:('H',2),5125:('I',4),5126:('f',4)}[value['componentType']]
    count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[value['type']]
    start=view.get('byteOffset',0)+value.get('byteOffset',0);stride=view.get('byteStride',count*size)
    return [struct.unpack_from('<'+code*count,binary,start+i*stride) for i in range(value['count'])]
def figure(document,binary,name):
    root=next(node for node in document['nodes'] if node.get('name')==name)
    result={}
    for index in root['children']:
        node=document['nodes'][index];mesh=document['meshes'][node['mesh']]
        result[node['name']]={'transform':{key:node[key] for key in ['translation','rotation','scale'] if key in node},'primitives':[
            {'attributes':{key:accessor(document,binary,value) for key,value in primitive['attributes'].items()},'indices':accessor(document,binary,primitive['indices']),'material':document['materials'][primitive['material']]}
            for primitive in mesh['primitives']]}
    return result

current_path=ROOT/'public/world/bath-faceless.glb'
current,binary=glb(current_path)
baseline,old_binary=glb(ROOT/'visual/world/accepted/first-night/bath-faceless.glb')
names={node.get('name') for node in current['nodes']}
for name in ['Blaise','Ada','Simon','Miriam','Emmy','Ruth','WorkshopCeiling','GalleryStairs','CabinetDoor','CabinetGalleryPier','FrontDoor','ServiceDoor']:
    assert name in names,name
assert sum(node.get('name')=='Miriam' for node in current['nodes'])==1
assert not current.get('images') and not current.get('textures')
old,new=figure(baseline,old_binary,'Miriam'),figure(current,binary,'Miriam')
assert old==new,'Miriam geometry/materials/local transforms changed from the baseline'
spatial=json.loads((ROOT/'public/world/bath-spatial.json').read_text())
for name in ['Emmy','Ruth',*spatial['stagedProps']]:
    node=next(node for node in current['nodes'] if node.get('name')==name)
    assert node.get('extras',{}).get('initialVisibility') is False,name
    assert node.get('extras',{}).get('encounterStaged') is True,name
    assert node['translation'][1]==-24,name
digest=hashlib.sha256(json.dumps(new,sort_keys=True,separators=(',',':')).encode()).hexdigest()
report={'status':'PASS','scope':'actual glTF structure/accessors/materials; no browser or physics claim','glbSha256':hashlib.sha256(current_path.read_bytes()).hexdigest(),'nodes':len(current['nodes']),'meshes':len(current['meshes']),'images':len(current.get('images',[])),'singleMiriamBase':True,'miriamMatchesFirstNightGeometryMaterialsTransforms':True,'miriamGeometryDigest':digest,'stagedOnlyRootCount':2+len(spatial['stagedProps']),'allStagedRootsParkedAndFlagged':True}
(ROOT/'visual/world/W-002-GLB-INSPECTION.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
