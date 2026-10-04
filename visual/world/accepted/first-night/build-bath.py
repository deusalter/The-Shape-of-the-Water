"""Editable faceless bath scene. Run with Blender 4.3+: blender -b --python this_file.

Original project geometry, no imported models, textures, facial portraits or AI runtime.
Coordinates in helpers use the game's Y-up convention. Export is glTF Y-up.
"""
import bpy, math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablock in list(bpy.data.materials):
    bpy.data.materials.remove(datablock)

def material(name, color, roughness=0.85, emission=0):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1)
    value.use_nodes = True
    shader = value.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    if emission:
        shader.inputs['Emission Color'].default_value = (*color, 1)
        shader.inputs['Emission Strength'].default_value = emission
    return value

M = {
    'plaster': material('chalk plaster', (0.52,0.54,0.49)),
    'concrete': material('worn concrete', (0.30,0.34,0.32)),
    'tile': material('old grey green tile', (0.34,0.47,0.43)),
    'grout': material('dark grout', (0.22,0.30,0.28)),
    'water': material('still salt water', (0.07,0.22,0.21),0.2),
    'wood': material('dark used wood', (0.24,0.17,0.12)),
    'brass': material('dull brass', (0.45,0.35,0.15),0.55),
    'iron': material('blackened metal', (0.10,0.12,0.12)),
    'cloth': material('black cabinet cloth', (0.045,0.052,0.043)),
    'light': material('overcast window light', (0.72,0.77,0.69),0.9,0.5),
    'paper': material('warm paper', (0.68,0.65,0.53)),
    'skin': material('featureless chalk heads', (0.64,0.63,0.54)),
    'blaise': material('Blaise grey green', (0.29,0.36,0.31)),
    'ada': material('Ada indigo', (0.17,0.24,0.32)),
    'simon': material('Simon muted rust', (0.42,0.25,0.16)),
    'miriam': material('Miriam cream', (0.65,0.64,0.51)),
}

def xyz(p): return (p[0], -p[2], p[1])
def box(name, center, size, mat, parent=None, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(center))
    obj=bpy.context.object;obj.name=name
    obj.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if parent: obj.parent=parent
    obj.data.materials.append(M[mat])
    if bevel:
        mod=obj.modifiers.new('small cut edges','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def empty(name, position=(0,0,0)):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);obj.location=xyz(position);return obj

# The building is a cutaway so the elevated following camera keeps the player visible.
floor=box('BathFloor',(0,-0.18,0),(20,0.3,28),'tile')
cutter=box('TemporaryPoolCut',(0,-0.5,-1),(8,3,13),'iron')
modifier=floor.modifiers.new('actual pool opening','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
bpy.context.view_layer.objects.active=floor;bpy.ops.object.modifier_apply(modifier=modifier.name);bpy.data.objects.remove(cutter,do_unlink=True)
box('NorthWall',(0,2.25,-14),(20,4.5,0.3),'plaster')
box('WestWall',(-10,2.25,0),(0.3,4.5,28),'plaster')
box('EastCutawayWall',(10,0.36,0),(0.3,0.72,28),'concrete')
box('EntranceCutawayLeft',(-6,0.36,14),(8,0.72,0.3),'concrete')
box('EntranceCutawayRight',(6,0.36,14),(8,0.72,0.3),'concrete')
for x in range(-9,10):
    for start,end in ([(-14,-7.5),(5.5,14)] if abs(x)<4 else [(-14,14)]):box('FloorJointX',(x,0.001,(start+end)/2),(0.018,0.006,end-start),'grout')
for z in range(-13,14):
    for start,end in ([(-10,-4),(4,10)] if -7.5<z<5.5 else [(-10,10)]):box('FloorJointZ',((start+end)/2,0.004,z),(end-start,0.006,0.018),'grout')
box('PoolBottom',(0,-1.45,-1),(8,0.1,13),'iron')
box('PoolWater',(0,-0.42,-1),(7.85,0.025,12.85),'water')
for x in [-4,4]:box('PoolBasinWall',(x,-0.65,-1),(0.12,1.4,13),'tile')
for z in [-7.5,5.5]:box('PoolBasinWall',(0,-0.65,z),(8,1.4,0.12),'tile')
for x in [-4,4]: box('PoolRim',(x,0.16,-1),(0.3,0.32,13.3),'paper',bevel=0.035)
for z in [-7.5,5.5]: box('PoolRim',(0,0.16,z),(8.3,0.32,0.3),'paper',bevel=0.035)
for x in [-7.4,-3.7,0,3.7,7.4]:
    box('HighWindow',(x,3.25,-13.78),(2.5,1.65,0.05),'light')
    box('WindowMullion',(x,3.25,-13.72),(0.075,1.7,0.07),'iron')
    box('WindowCrossbar',(x,3.25,-13.70),(2.6,0.07,0.07),'iron')
for z in [-9,-2,5]:
    box('WestHighWindow',(-9.78,3.3,z),(0.05,1.65,3),'light')
for x in [-8.6,8.6]:
    for z in [-11,-4,4,11]: box('ConcretePier',(x,1.8,z),(0.38,3.6,0.38),'concrete',bevel=0.025)

def bench(name, position, length=3):
    group=empty(name,position)
    box(name+'Seat',(0,0.58,0),(0.64,0.16,length),'wood',group,0.025)
    for z in [-length/2+0.3,length/2-0.3]: box(name+'Leg',(0,0.26,z),(0.44,0.52,0.17),'iron',group)
    box(name+'Back',(0.31,1.03,0),(0.12,0.64,length),'wood',group,0.02)
    return group
bench('MiriamBench',(7.7,0,3),4)
bench('GalleryBench',(7.7,0,-9),4)
box('WorkshopTable',(-7.2,0.9,-9),(3.2,0.18,1.4),'wood',bevel=0.03)
for x in [-8.5,-5.9]:
    for z in [-9.5,-8.5]:box('TableLeg',(x,0.42,z),(0.12,0.84,0.12),'iron')
box('FoldedCloth',(-7.8,1.03,-9),(0.5,0.09,0.55),'paper')
box('PlanSheet',(-6.4,1.01,-8.9),(0.6,0.013,0.4),'paper')
box('LongWoodBox',(-7.2,0.25,-9),(2.3,0.4,0.65),'wood')

cabinet=empty('Cabinet',(-6.5,0,-3.4))
box('CabinetBack',(0,1.16,-0.52),(1.45,2.3,0.11),'cloth',cabinet)
for x in [-0.69,0.69]:box('CabinetSide',(x,1.16,0),(0.11,2.3,1.08),'cloth',cabinet)
box('CabinetTop',(0,2.29,0),(1.45,0.13,1.12),'wood',cabinet)
box('CabinetDoor',(0,1.16,0.55),(1.3,2.12,0.09),'wood',cabinet)
# No generated marks, damage, accident timing or missing pieces are visual evidence.
box('CabinetHandle',(-0.43,1.12,0.63),(0.05,0.16,0.05),'brass',cabinet)
box('ProjectorTable',(6.4,0.88,-9),(1.6,0.16,0.95),'wood')
box('CameraBody',(6.4,1.11,-9),(0.32,0.3,0.22),'iron')
box('CameraLens',(6.4,1.11,-8.83),(0.14,0.14,0.16),'iron')
box('ServiceDoor',(-9.79,1.3,-10),(0.08,2.6,1.6),'wood')
box('ServiceDoorHandle',(-9.70,1.15,-9.45),(0.1,0.07,0.18),'brass')
for x in [-1.2,1.2]:box('EntranceJamb',(x,1.4,13.8),(0.12,2.8,0.22),'iron')
box('EntranceLintel',(0,2.8,13.8),(2.5,0.13,0.22),'iron')
box('AdaBucket',(-2.5,0.27,8.5),(0.58,0.54,0.58),'iron',bevel=0.035)

def figure(name,position,cloth,width=0.47,height=1.8,lean=0):
    group=empty(name,position)
    # Heads are closed blocks without eyes, mouths, noses, hair or face textures.
    head=box(name+'_Head',(0,height-0.23,0),(width*0.64,0.43,0.33),'skin',group,0.025)
    torso=box(name+'_Torso',(0,1.03,0),(width,0.66,0.3),cloth,group,0.035)
    torso.rotation_euler[1]=lean
    for side in [-1,1]:
        box(name+('_LeftLeg' if side<0 else '_RightLeg'),(side*width*0.23,0.39,0),(width*0.32,0.73,0.24),'iron',group,0.012)
        arm=box(name+('_LeftArm' if side<0 else '_RightArm'),(side*(width*0.5+0.085),1.0,0),(0.14,0.66,0.2),cloth,group,0.012)
        arm.rotation_euler[1]=side*0.04
    return group

figure('Blaise',(0,0,10.5),'blaise',0.5,1.84)
figure('Ada',(-7.2,0,-6.5),'ada',0.61,1.7,-0.03)
figure('Simon',(6.2,0,-8),'simon',0.4,1.92,0.035)
miriam=figure('Miriam',(6.6,0,3),'miriam',0.52,1.78)
# Current first-night figure is standing beside the bench. Seated encounter staging is applied by the renderer.

bpy.context.scene.world.color=(0.15,0.17,0.16)
bpy.ops.object.camera_add(location=xyz((19,20,24)))
camera=bpy.context.object;camera.name='ElevatedFollowingCameraReference'
from mathutils import Vector
direction=Vector(xyz((0,0,0)))-camera.location
camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=30;bpy.context.scene.camera=camera
bpy.context.scene.render.resolution_x=1440;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
world=ROOT/'visual/world';world.mkdir(parents=True,exist_ok=True)
production=ROOT/'public/world';production.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(world/'bath-faceless.blend'))
bpy.ops.export_scene.gltf(filepath=str(production/'bath-faceless.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
print('BATH_ASSET_COMPLETE',len(bpy.data.objects),'objects')
