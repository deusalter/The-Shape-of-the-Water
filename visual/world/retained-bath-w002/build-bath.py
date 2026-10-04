"""Editable faceless bath scene. Run with Blender 4.3+: blender -b --python this_file.

Original project geometry, no imported models, textures, facial portraits or AI runtime.
Coordinates in helpers use the game's Y-up convention. Export is glTF Y-up.
"""
import bpy, math, json, hashlib
from collections import deque
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
    'emmy': material('Emmy worn ochre coat', (0.46,0.36,0.23)),
    'ruth': material('Ruth dull green coat', (0.27,0.34,0.31)),
    'mirror': material('stylized dull mirror backing', (0.38,0.46,0.44),0.22),
    'street': material('wet street aggregate', (0.19,0.22,0.21)),
    'linen': material('laundry off white', (0.70,0.71,0.65)),
    'rubber': material('worn shoe rubber', (0.12,0.13,0.11)),
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

# W-002: authored architecture, original geometry, no measured forensic claim.
# Existing shell/pool and principal actor names remain stable. Game coordinates
# are Y-up, +Z faces the front street; Blender storage uses xyz() above.
GALLERY_HEIGHT=2.66
# Keep the entrance to the workshop clear: the first-night worktable was too
# close to the new doorway. Move its original props/legs together, narrow top.
for obj in bpy.data.objects:
    if obj.name.startswith('TableLeg') or obj.name in ['WorkshopTable','FoldedCloth','PlanSheet','LongWoodBox']:
        obj.location.x-=.2;obj.location.y+=2.8
bpy.data.objects['WorkshopTable'].dimensions.x=2.7
def wall(name,center,size,mat='plaster'):
    group=empty(name);group['cutawayWall']=True
    box(name+'_Surface',center,size,mat,group)
    return group
def railing(name,center,length,axis='x',height=GALLERY_HEIGHT):
    group=empty(name)
    for side in [-1,1]:
        at=(center[0]+side*length/2,height+.47,center[1]) if axis=='x' else (center[0],height+.47,center[1]+side*length/2)
        box(name+'_Post',at,(.065,.94,.065),'iron',group)
    for rise in [.27,.91]:
        size=(length,.055,.06) if axis=='x' else (.06,.055,length)
        box(name+'_Rail',(center[0],height+rise,center[1]),size,'iron',group)
    return group

# Enclosed workshop; its gallery ceiling and near walls can be hidden by the
# renderer for camera legibility. Door opening is physical, not a painted panel.
wall('WorkshopEastWall',(-5.15,1.24,-10.95),(.16,2.48,5.3))
wall('WorkshopSouthWallLeft',(-8.36,1.24,-8.3),(3.02,2.48,.16))
wall('WorkshopSouthWallRight',(-5.2,1.24,-8.3),(.1,2.48,.16))
wall('WorkshopDoorLintel',(-6.05,2.34,-8.3),(1.62,.28,.18))
for x in [-6.85,-5.25]:box('WorkshopDoorJamb',(x,1.09,-8.3),(.075,2.18,.2),'wood')
workshop_door=empty('WorkshopDoor',(-6.85,0,-8.3));workshop_door['swingRadians']=-math.pi/2
box('WorkshopDoorPanel',(.77,1.07,0),(1.54,2.14,.075),'wood',workshop_door)
workshop_door.rotation_euler.z=-math.pi/2
box('WorkshopSink',(-8.9,.92,-12.7),(1.2,.18,.58),'paper',bevel=.03)
box('WorkshopTap',(-8.9,1.19,-12.9),(.06,.4,.08),'brass')
box('WorkshopSupplyShelf',(-9.3,1.52,-11.3),(.55,.12,1.3),'wood')
box('WorkshopSocket',(-5.04,.95,-10.8),(.03,.12,.09),'paper')

# North spectators' gallery plus west catwalk over the cabinet's actual pier.
gallery=empty('GalleryMainDeck');gallery['walkHeight']=GALLERY_HEIGHT
box('GalleryMainDeckSurface',(2.28,GALLERY_HEIGHT-.10,-10.95),(14.85,.2,5.3),'wood',gallery)
ceiling=empty('WorkshopCeiling');ceiling['cutawayRoof']=True;ceiling['walkHeight']=GALLERY_HEIGHT
box('WorkshopCeilingSurface',(-7.5,GALLERY_HEIGHT-.1,-10.95),(4.7,.2,5.3),'wood',ceiling)
catwalk=empty('GalleryWestCatwalk');catwalk['walkHeight']=GALLERY_HEIGHT
box('GalleryWestCatwalkSurface',(-7.4,GALLERY_HEIGHT-.1,-4.75),(4.5,.2,7.1),'wood',catwalk)
box('GalleryWestBeam',(-7.4,GALLERY_HEIGHT-.23,-1.65),(4.5,.26,.25),'concrete')
railing('GalleryFrontRailWest',(-2.25,-8.25),14.55)
railing('GalleryFrontRailEast',(8.4,-8.25),2.5)
railing('GalleryCatwalkInnerRail',(-5.1,-4.8),6.85,'z')
railing('GalleryCatwalkEndRail',(-7.4,-1.18),4.5)
bpy.data.objects['GalleryBench'].location=xyz((7.7,GALLERY_HEIGHT,-10.5))
for name in ['ProjectorTable','CameraBody','CameraLens']:
    bpy.data.objects[name].location.x+=2.2
    bpy.data.objects[name].location.z+=GALLERY_HEIGHT
    bpy.data.objects[name].location.y+=3.1
bpy.data.objects['Simon'].location=xyz((6.3,GALLERY_HEIGHT,-11.0))
bpy.data.objects['Ada'].location=xyz((-8.5,0,-10.1))

# Nineteen stairs are stated in the manuscript. The rise/run below are rough
# production units; they do not establish a surveyed architectural dimension.
stairs=empty('GalleryStairs');stairs['stepCount']=19;stairs['rise']=.14;stairs['run']=.29
for index in range(19):
    top=(index+1)*.14
    box(f'GalleryStep_{index+1:02d}',(6.3,top/2,-2.8-(index+.5)*.29),(1.5,top,.29),'wood',stairs)
    for x in [5.54,7.06]:
        box('StairRailPost',(x,top+.42,-2.8-(index+.5)*.29),(.045,.84,.045),'iron',stairs)
        if index<18:box('StairRailShort',(x,top+.85,-2.8-(index+1)*.29),(.055,.075,.32),'iron',stairs)

# Replace the closed decorative cabinet panel with a rigid hinge assembly. The
# mirror mount is on the INSIDE (-Z) face. Negative game Y yaw opens outward +Z.
for name in ['CabinetDoor','CabinetHandle']:
    bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
door=empty('CabinetDoor',(-.65,0,.59));door.parent=cabinet
door['closedYaw']=0.0;door['outwardYawSign']=-1;door['maxIllustrativeYaw']=1.30
box('CabinetDoorRigidBacking',(.65,1.16,0),(1.3,2.12,.075),'wood',door)
for x in [.06,1.24]:box('CabinetDoorSideFrame',(x,1.16,-.065),(.075,2.12,.055),'brass',door)
for y in [.14,2.18]:box('CabinetDoorCrossFrame',(.65,y,-.065),(1.3,.075,.055),'brass',door)
box('CabinetMirrorMount',(.65,1.16,-.10),(1.1,1.93,.018),'mirror',door)
box('CabinetDoorHandle',(1.12,1.12,.065),(.05,.16,.05),'brass',door)
box('CabinetLatch',(.63,1.93,.46),(.16,.08,.09),'brass',cabinet)
box('CabinetReleaseCable',(.43,1.52,.47),(.018,.72,.018),'brass',cabinet)
bpy.ops.mesh.primitive_torus_add(major_radius=.10,minor_radius=.012,major_segments=16,minor_segments=6,location=xyz((.43,1.13,.47)),rotation=(math.pi/2,0,0))
ring=bpy.context.object;ring.name='CabinetInsideBrassRing';ring.parent=cabinet;ring.data.materials.append(M['brass'])
box('CabinetShallowTray',(0,.14,-.05),(.86,.065,.63),'iron',cabinet)
box('CabinetTrayWater',(0,.177,-.05),(.80,.008,.57),'water',cabinet)
box('CabinetDaylightSlit',(0,1.7,-.585),(.52,.055,.012),'light',cabinet)
pier=empty('CabinetGalleryPier',(-6.25,0,-1.67))
box('CabinetGalleryPierShaft',(0,GALLERY_HEIGHT/2,0),(.46,GALLERY_HEIGHT,.46),'concrete',pier,bevel=.016)
box('CabinetOldFeltPad',(-.16,1.37,-.237),(.15,.22,.035),'cloth',pier)
# No accident dent/chip, fracture count or causal timing is generated as proof.

# Real west-wall opening and a service passage distinct from the front street.
west=bpy.data.objects['WestWall']
cutter=box('TemporaryServiceOpening',(-10,1.31,-5.95),(1.0,2.62,2.0),'iron')
mod=west.modifiers.new('actual service opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
bpy.context.view_layer.objects.active=west;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
for name in ['ServiceDoor','ServiceDoorHandle']:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
service=empty('ServiceDoor',(-10,0,-6.93));service['authoredTraversalOnly']=True
box('ServiceDoorPanel',(0,1.29,.96),(.075,2.58,1.92),'wood',service)
box('ServiceDoorHandle',(.09,1.13,1.66),(.12,.055,.16),'brass',service)
box('ServicePassageFloor',(-10.9,-.14,-5.95),(2.2,.28,2.4),'concrete')
wall('ServicePassageNorthWall',(-10.9,1.32,-7.18),(2.2,2.64,.14),'concrete')
wall('ServicePassageSouthWall',(-10.9,1.32,-4.72),(2.2,2.64,.14),'concrete')
box('ServicePassageRoof',(-10.9,2.68,-5.95),(2.2,.1,2.55),'concrete')
box('ServiceYardFloor',(-14.5,-.15,-6.6),(5.6,.3,11.8),'concrete')
wall('ServiceYardWestWall',(-17.35,1.45,-6.6),(.2,2.9,12.0),'concrete')
wall('ServiceYardNorthWall',(-14.5,1.45,-12.6),(5.6,2.9,.2),'concrete')
wall('ServiceYardSouthWall',(-14.5,1.45,-.6),(5.6,2.9,.2),'concrete')
for z in [-10.6,-8.8]:
    box('YardBin',(-16.7,.58,z),(.85,1.16,.85),'iron',bevel=.035)
    box('YardBinLid',(-16.7,1.21,z),(.94,.10,.94),'iron')
box('SidewaysBinBag',(-16.7,1.30,-10.6),(.62,.32,.55),'cloth',bevel=.05)

# Front door leads to pavement/street/laundry, with no direct line into the yard.
front=empty('FrontDoor',(-1.13,0,13.86));front['authoredTraversalOnly']=True
box('FrontDoorPanel',(1.13,1.35,0),(2.22,2.7,.09),'wood',front)
box('FrontDoorHandle',(2.0,1.12,-.08),(.055,.16,.055),'iron',front)
box('FrontPavement',(0,-.12,15.9),(22,.24,3.8),'concrete')
box('ExteriorStreet',(0,-.2,20.0),(30,.26,4.4),'street')
box('FarPavement',(0,-.12,23.3),(30,.24,2.2),'concrete')
box('FrontLowSill',(-2.6,.38,14.25),(2.0,.16,.65),'concrete')
wall('LaundryFacade',(0,2.0,25.0),(15,4,.25))
box('LaundryDoor',(0,1.24,24.83),(1.6,2.48,.07),'wood')
for x in [-5.7,-3.3,3.3,5.7]:box('LaundryWindow',(x,2.2,24.83),(1.8,1.8,.06),'light')
for x in [-5.5,5.5]:box('LaundryLinePost',(x,2.2,23.7),(.07,4.4,.07),'iron')
box('LaundryLine',(0,3.52,23.7),(11,.022,.022),'iron')
for x in [-4.5,-2.3,0,2.3,4.5]:
    laundry=empty('HangingOveralls',(x,2.7,23.7))
    box('OverallsBody',(0,.23,0),(.68,.61,.035),'linen',laundry)
    for side in [-1,1]:
        box('OverallsLeg',(side*.18,-.3,0),(.25,.64,.035),'linen',laundry)
        sleeve=box('OverallsSleeve',(side*.43,.22,0),(.2,.60,.035),'linen',laundry)
        sleeve.rotation_euler.y=side*.18

# Cutaway visibility must hide a wall's windows as well, not leave floating
# glass panes. Preserve the original world transforms when assigning parents.
for obj in list(bpy.data.objects):
    parent='NorthWall' if obj.name.startswith(('HighWindow','WindowMullion','WindowCrossbar')) else 'WestWall' if obj.name.startswith('WestHighWindow') else 'LaundryFacade' if obj.name.startswith(('LaundryWindow','LaundryDoor')) else None
    if parent:
        matrix=obj.matrix_world.copy();obj.parent=bpy.data.objects[parent];obj.matrix_world=matrix

# Story-only actors/props are original editable meshes parked below the floor.
# glTF extras identify them; root hides and stages only actually encountered items.
LIBRARY_Y=-24.0
def story_root(name,position=(0,LIBRARY_Y,0)):
    group=empty(name,position);group['encounterStaged']=True;group['initialVisibility']=False;group.hide_render=True
    return group
for name,cloth,width,height in [('Emmy','emmy',.56,1.79),('Ruth','ruth',.54,1.70)]:
    person=figure(name,(0,LIBRARY_Y,0),cloth,width,height);person['encounterStaged']=True;person['initialVisibility']=False;person.hide_render=True
    box(name+'_CanvasBag',(.43,.70,.1),(.3,.43,.2),'wood' if name=='Emmy' else 'cloth',person,bevel=.02)
def chair(name,position=(0,LIBRARY_Y,0),padded=False):
    group=story_root(name,position)
    box(name+'_Seat',(0,.53,0),(.55,.10,.56),'wood',group)
    for x in [-.22,.22]:
        for z in [-.22,.22]:box(name+'_Leg',(x,.25,z),(.065,.50,.065),'wood',group)
    for x in [-.22,.22]:box(name+'_BackPost',(x,.95,.24),(.065,.83,.065),'wood',group)
    box(name+'_Back',(0,1.1,.24),(.52,.35,.07),'wood',group)
    if padded:box(name+'_FoldedTowel',(0,1.12,.18),(.54,.40,.14),'paper',group)
    return group
chair('PropPaddedTestChair',padded=True);chair('PropSoundChair');chair('PropLooseChair')
cup=story_root('PropWaterCup')
bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.095,depth=.18,location=xyz((0,.10,0)))
obj=bpy.context.object;obj.name='WaterCupBody';obj.parent=cup;obj.data.materials.append(M['paper'])
for name in ['PropBenchShoe','PropFootballBoot']:
    shoe=story_root(name);box(name+'_Sole',(0,.035,.04),(.16,.07,.34),'rubber',shoe,bevel=.02);box(name+'_Upper',(0,.10,-.015),(.15,.14,.23),'cloth',shoe,bevel=.025)
    box(name+'_Tongue',(0,.19,-.02),(.07,.03,.12),'paper',shoe)
bearer=story_root('PropExteriorBearer')
box('ExteriorLongWood',(0,.055,0),(.14,.11,1.8),'wood',bearer)
box('ExteriorBurnedEnd',(0,.113,.70),(.14,.006,.23),'cloth',bearer)
box('ExteriorPencilSideMark',(.073,.06,.45),(.006,.07,.008),'iron',bearer)
short=story_root('PropInteriorBearer');box('InteriorShortWood',(0,.055,0),(.14,.11,1.35),'wood',short)
parcel=story_root('PropWrappedGlass');box('WrappedGlass',(0,1.0,0),(1.12,1.95,.10),'paper',parcel,bevel=.015)
for y in [.42,1.5]:box('ParcelTape',(0,y,.056),(1.14,.09,.012),'cloth',parcel)
binding=story_root('PropBindingTest')
box('TestCordFront',(0,1.1,.69),(1.65,.035,.035),'iron',binding)
box('TestCordBack',(0,1.1,-.67),(1.65,.035,.035),'iron',binding)
for x in [-.80,.80]:box('TestCordSide',(x,1.1,0),(.035,.035,1.38),'iron',binding)

# Named anchors are machine-readable render staging, never evidence acquisition.
anchors={
 'arrival':[0,0,10.5],'bench':[5.6,0,3],'workshop':[-6.25,0,-10.0],
 'workshopDoorway':[-6.05,0,-7.60],
 'arrivalAdaApproach':[-3.5,0,8.4],
 'cabinet':[-5.1,0,-2.0],'gallery':[5.8,GALLERY_HEIGHT,-10.4],
 'gathering':[1.8,0,8],'waterChairs':[5.45,0,6.8],
 'frontInterior':[0,0,12.4],'frontThreshold':[0,0,14.0],
 'frontExterior':[0,0,15.15],'exteriorSill':[-2.6,.47,14.25],
 'laundryWaiting':[0,0,23.0],'serviceInterior':[-8.9,0,-5.95],
 'serviceThreshold':[-10,0,-5.95],'yard':[-13.25,0,-5.95],
 'miriamBench':[7.4,0,3],'miriamEntrance':[.95,0,12.5],
 'miriamStanding':[6.6,0,3],
 'adaWorkshop':[-8.5,0,-10.1],'simonGallery':[6.3,GALLERY_HEIGHT,-11.0],
 'emmyWorkshop':[-7.25,0,-10.1],'ruthFront':[1.5,0,11.8],
 'testChair':[-5.92,0,-2.32],'cabinetPier':[-6.25,0,-1.67],
}
for name,position in anchors.items():empty('Anchor_'+name,position)['stagingAnchor']=name

bpy.context.scene.world.use_nodes=True
background=bpy.context.scene.world.node_tree.nodes.get('Background')
background.inputs['Color'].default_value=(.18,.21,.19,1);background.inputs['Strength'].default_value=.55
bpy.ops.object.light_add(type='SUN',location=(0,0,14))
sun=bpy.context.object;sun.name='ProductionInspectionSun';sun.data.energy=2.0;sun.rotation_euler=(math.radians(28),math.radians(-15),math.radians(-34))
bpy.ops.object.camera_add(location=xyz((25,29,39)))
camera=bpy.context.object;camera.name='ElevatedFollowingCameraReference'
from mathutils import Vector
direction=Vector(xyz((-2,0,4)))-camera.location
camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=43;bpy.context.scene.camera=camera
bpy.context.scene.render.resolution_x=1440;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
bpy.context.scene.render.engine='BLENDER_EEVEE_NEXT'
bpy.context.preferences.filepaths.save_version=0
world=ROOT/'visual/world';world.mkdir(parents=True,exist_ok=True)
production=ROOT/'public/world';production.mkdir(parents=True,exist_ok=True)
def bounds(minX,maxX,minZ,maxZ):return dict(minX=minX,maxX=maxX,minZ=minZ,maxZ=maxZ)
spatial={
 'schemaVersion':2,'assetId':'bath-expanded-w002',
 'coordinates':{'axes':'Y-up, +Z front street, -X service yard','units':'rough production units; not measured forensic dimensions','blenderMap':'(x,y,z) game -> (x,-z,y) Blender'},
 'anchors':{name:{'x':p[0],'y':p[1],'z':p[2],'layer':'gallery' if p[1]==GALLERY_HEIGHT else 'exterior' if name in ['frontExterior','exteriorSill','laundryWaiting'] else 'yard' if name=='yard' else 'ground'} for name,p in anchors.items()},
 'surfaces':[
  {'id':'bath-ground','layer':'ground','height':0,**bounds(-9.35,9.35,-13.3,13.0)},
  {'id':'gallery-north','layer':'gallery','height':GALLERY_HEIGHT,**bounds(-9.4,9.35,-13.2,-8.55)},
  {'id':'gallery-west','layer':'gallery','height':GALLERY_HEIGHT,**bounds(-9.35,-5.45,-8.55,-1.5)},
  {'id':'front-pavement','layer':'exterior','height':0,**bounds(-10.6,10.6,14.15,17.8)},
  {'id':'street','layer':'exterior','height':-.07,**bounds(-14.6,14.6,17.8,22.2)},
  {'id':'laundry-pavement','layer':'exterior','height':0,**bounds(-14.6,14.6,22.2,24.2)},
  {'id':'service-passage','layer':'yard','height':0,**bounds(-11.85,-9.85,-7.0,-4.9)},
  {'id':'service-yard','layer':'yard','height':0,**bounds(-17.0,-11.85,-12.25,-.95)},
 ],
 'stairs':{'root':'GalleryStairs','fromLayer':'ground','toLayer':'gallery','axis':'z','bottomZ':-2.8,'topZ':-8.31,'bottomY':0,'topY':GALLERY_HEIGHT,'stepCount':19,'stepRise':.14,'stepRun':.29,'bottomLanding':{'x':6.3,'y':0,'z':-2.55},'topLanding':{'x':6.3,'y':GALLERY_HEIGHT,'z':-8.65},'lateralEntry':'railings block side entry; connect only at top/bottom landings',**bounds(5.55,7.05,-8.31,-2.8)},
 'doorGates':[
  {'id':'front','root':'FrontDoor','axis':'z','coordinate':14,'opening':[-1.1,1.1],'fromLayer':'ground','toLayer':'exterior','traversal':'offered authored action only; no free walking experiment'},
  {'id':'service','root':'ServiceDoor','axis':'x','coordinate':-10,'opening':[-6.87,-5.03],'fromLayer':'ground','toLayer':'yard','traversal':'offered authored action only; no free walking experiment'},
 ],
 'groundSolids':[
  {'id':'pool',**bounds(-4.45,4.45,-7.95,5.95)},
  {'id':'cabinet-body',**bounds(-7.55,-5.45,-4.25,-2.45)},
  {'id':'cabinet-pier',**bounds(-6.68,-5.82,-2.10,-1.24)},
  {'id':'worktable',**bounds(-8.99,-5.81,-12.74,-10.86)},
  {'id':'workshop-sink',**bounds(-9.74,-8.06,-13.23,-12.17)},
  {'id':'workshop-shelf',**bounds(-9.82,-8.78,-12.19,-10.41)},
  {'id':'workshop-east-wall',**bounds(-5.42,-4.88,-13.7,-8.25)},
  {'id':'workshop-front-left',**bounds(-10,-6.98,-8.57,-8.03)},
  {'id':'workshop-front-right',**bounds(-5.30,-4.93,-8.57,-8.03)},
  {'id':'workshop-open-door',**bounds(-7.13,-6.57,-8.58,-6.48)},
  {'id':'spectators-bench',**bounds(7.02,8.45,.45,5.55)},
  {'id':'arrival-bucket',**bounds(-3.03,-1.97,7.97,9.03)},
  *[{'id':f'concrete-pier-{x}-{z}',**bounds(x-.43,x+.43,z-.43,z+.43)} for x in [-8.6,8.6] for z in [-11,-4,4,11]],
 ],
 'gallerySolids':[
  {'id':'gallery-bench',**bounds(7.02,8.45,-13.05,-7.95)},
  {'id':'recording-table',**bounds(7.56,9.64,-12.82,-11.38)},
  *[{'id':f'concrete-pier-{x}-{z}',**bounds(x-.43,x+.43,z-.43,z+.43)} for x in [-8.6,8.6] for z in [-11,-4,4,11]],
 ],
 'exteriorSolids':[],
 'yardSolids':[{'id':f'yard-bin-{z}',**bounds(-17.365,-16.035,z-.665,z+.665)} for z in [-10.6,-8.8]],
 'cutawayRoots':{'outerWalls':['WestWall','NorthWall'],'workshopWalls':['WorkshopEastWall','WorkshopSouthWallLeft','WorkshopSouthWallRight','WorkshopDoorLintel'],'roofs':['WorkshopCeiling','GalleryWestCatwalk','ServicePassageRoof'],'yardWalls':['ServiceYardWestWall','ServiceYardNorthWall','ServiceYardSouthWall'],'streetWalls':['LaundryFacade'],'note':'hide near/facing geometry for the elevated follow camera; hidden geometry is not a clue'},
 'cabinet':{'root':'Cabinet','doorRoot':'CabinetDoor','hinge':{'x':-7.15,'y':0,'z':-2.81},'doorWidth':1.3,'outwardAxis':'+Z','yawSign':-1,'pierRoot':'CabinetGalleryPier','pier':anchors['cabinetPier'],'testChair':anchors['testChair'],'chairBeforePier':True,'mirrorFace':'inside, -Z when closed','note':'symbolic apparatus, no optical/impact simulation or measured dimension evidence'},
 'actors':{'roots':['Blaise','Ada','Simon','Miriam','Emmy','Ruth'],'parkedInitially':['Emmy','Ruth'],'miriamClone':'clone exact Miriam geometry/materials only when current player encounters co-presence; no separate exterior model or original/copy palette'},
 'stagedProps':{
  'PropPaddedTestChair':{'anchor':'testChair','yaw':.55},
  'PropSoundChair':{'anchor':'miriamEntrance','yaw':math.pi},
  'PropLooseChair':{'anchor':'waterChairs','yaw':0},
  'PropWaterCup':{'x':6.6,'y':.7,'z':3},
  'PropBenchShoe':{'x':7.4,'y':0,'z':3.6},
  'PropFootballBoot':{'anchor':'frontInterior','yaw':0},
  'PropExteriorBearer':{'anchor':'exteriorSill','yaw':0},
  'PropInteriorBearer':{'x':-9.3,'y':0,'z':-5.2,'yaw':0},
  'PropWrappedGlass':{'anchor':'serviceInterior','yaw':math.pi/2},
  'PropBindingTest':{'x':-6.5,'y':0,'z':-3.4},
 },
 'visibilityRule':'staged actor/prop extras are hints for the renderer; root must hide until encountered; movement never acquires sources or NPC knowledge',
}

# Executed production checks. These check the authored coarse coordinate contract
# and model structure; root still owns actual renderer/navigation browser tests.
def inside(point,rect):return rect['minX']<=point[0]<=rect['maxX'] and rect['minZ']<=point[1]<=rect['maxZ']
def free(point,layer):
    return any(inside(point,surface) for surface in spatial['surfaces'] if surface['layer']==layer) and not any(inside(point,solid) for solid in spatial[layer+'Solids'])
def route(start,goal,layer):
    snap=lambda p:(round(p[0]*4)/4,round(p[1]*4)/4)
    start,goal=snap(start),snap(goal);queue=deque([start]);seen={start}
    if not free(start,layer) or not free(goal,layer):return False
    while queue and len(seen)<=10000:
        point=queue.popleft()
        if point==goal:return True
        for dx,dz in [(0,.25),(.25,0),(0,-.25),(-.25,0)]:
            target=(point[0]+dx,point[1]+dz)
            if target not in seen and free(target,layer):seen.add(target);queue.append(target)
    return False
players=['arrival','arrivalAdaApproach','bench','workshop','workshopDoorway','cabinet','gallery','gathering','waterChairs','frontInterior','frontExterior','laundryWaiting','serviceInterior','yard']
actors=['adaWorkshop','simonGallery','miriamStanding','emmyWorkshop','ruthFront']
origins={'ground':anchors['arrival'],'gallery':anchors['gallery'],'exterior':anchors['frontExterior'],'yard':anchors['yard']}
checks=[]
for name in players+actors:
    p=anchors[name];layer=spatial['anchors'][name]['layer'];point=(p[0],p[2])
    clear=free(point,layer)
    # Actor-foot corners use a 0.24-unit half footprint. Obstacles already carry
    # a conservative player clearance, so this also checks extra standing room.
    if name in actors:clear=clear and all(free((p[0]+dx,p[2]+dz),layer) for dx in [-.24,.24] for dz in [-.24,.24])
    reachable=route((origins[layer][0],origins[layer][2]),point,layer)
    checks.append({'anchor':name,'layer':layer,'clear':clear,'reachableOnLayer':reachable})
    if not clear or not reachable:raise RuntimeError(f'Staging anchor {name} is blocked or disconnected on {layer}')
for name,root in [('arrival','Blaise'),('adaWorkshop','Ada'),('simonGallery','Simon'),('miriamStanding','Miriam')]:
    actual=bpy.data.objects[root].location;expected=xyz(anchors[name])
    if any(abs(actual[i]-expected[i])>1e-5 for i in range(3)):raise RuntimeError(f'{root} actual mesh placement differs from checked anchor')
for layer in ['ground','gallery']:
    landing=spatial['stairs']['bottomLanding' if layer=='ground' else 'topLanding']
    if not free((landing['x'],landing['z']),layer):raise RuntimeError('Blocked stair landing')
hinge=spatial['cabinet']['hinge'];chair_at=anchors['testChair']
def swing_hit(theta,kind):
    for step in range(131):
        along=step*.01;x=hinge['x']+along*math.cos(theta);z=hinge['z']+along*math.sin(theta)
        if kind=='pier':
            if abs(x+6.25)<=.23 and abs(z+1.67)<=.23:return True
        else:
            dx=x-chair_at[0];dz=z-chair_at[2];local_x=dx*math.cos(.55)-dz*math.sin(.55);local_z=dx*math.sin(.55)+dz*math.cos(.55)
            if abs(local_x)<=.275 and abs(local_z)<=.28:return True
    return False
contacts={kind:next((step*.001 for step in range(1301) if swing_hit(step*.001,kind)),None) for kind in ['chair','pier']}
if contacts['chair'] is None or contacts['pier'] is None or contacts['chair']>=contacts['pier']:raise RuntimeError('Illustrative chair does not interrupt outward swing before pier')
if len([obj for obj in bpy.data.objects if obj.name=='Miriam'])!=1:raise RuntimeError('Miriam must have exactly one base geometry root')
audit={'status':'PASS','scope':'coarse production geometry; no browser, physics or forensic calibration claim','navigationGridStep':.25,'checks':checks,'stairsLandingClear':True,'cabinetProxySwing':contacts,'seatedException':'miriamBench intentionally overlaps spectators bench; structural/prop anchors are not player positions','singleMiriamBase':True}
(world/'W-002-CLEARANCE.json').write_text(json.dumps(audit,indent=2)+'\n')
(production/'bath-spatial.json').write_text(json.dumps(spatial,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(world/'bath-faceless.blend'))
bpy.ops.export_scene.gltf(filepath=str(production/'bath-faceless.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
record={'producer':'Blender Python, not GUI','blenderVersion':bpy.app.version_string,'objects':len(bpy.data.objects),'meshes':sum(o.type=='MESH' for o in bpy.data.objects),'materials':len(bpy.data.materials),'files':{}}
for name,path in [('source',ROOT/'tools/blender/build-bath.py'),('blend',world/'bath-faceless.blend'),('glb',production/'bath-faceless.glb'),('spatial',production/'bath-spatial.json')]:
    data=path.read_bytes();record['files'][name]={'path':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(world/'W-002-BUILD.json').write_text(json.dumps(record,indent=2)+'\n')

# Asset review render, never claimed as browser or hardware acceptance.
for name in ['WestWall','NorthWall','WorkshopCeiling','GalleryWestCatwalk','ServicePassageRoof','LaundryFacade']:
    root=bpy.data.objects[name]
    for obj in [root,*root.children_recursive]:obj.hide_render=True
bpy.context.scene.render.filepath=str(world/'expanded-overview.png')
bpy.ops.render.render(write_still=True)
print('BATH_ASSET_COMPLETE',json.dumps(record))
