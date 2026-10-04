"""Original editable first country locations for The Second Mouth.

Blender 4.3.2 CLI. No imported models, portraits, reference-game assets or GUI use.
Run: blender -b --python tools/blender/build-country.py
Use -- --no-preview to export without the three source-derived stills.
Coordinates in helpers follow game Y-up; Blender stores Z-up.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]

def xyz(point):
    return (point[0], -point[2], point[1])

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)

def material(name, color, roughness=.85, emission=0):
    result=bpy.data.materials.new(name)
    result.diffuse_color=(*color,1)
    result.use_nodes=True
    shader=result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Roughness'].default_value=roughness
    if emission:
        shader.inputs['Emission Color'].default_value=(*color,1)
        shader.inputs['Emission Strength'].default_value=emission
    return result

def group(name, position=(0,0,0), parent=None):
    result=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(result)
    result.location=xyz(position)
    if parent:
        result.parent=parent
    return result

def box(name, center, size, mat, parent=None, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(center))
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    if parent:
        obj.parent=parent
    if bevel:
        mod=obj.modifiers.new('authored edge cut','BEVEL')
        mod.width=bevel
        mod.segments=1
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def rod(name, start, end, radius, mat, parent=None):
    a,b=Vector(xyz(start)),Vector(xyz(end))
    bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=radius,depth=(b-a).length,location=(a+b)/2)
    obj=bpy.context.object
    obj.name=name
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    obj.data.materials.append(mat)
    if parent:
        obj.parent=parent
    return obj

def figure(name, clothes, head, dark, width=.5, height=1.9, posture=0, seated=False):
    """Closed faceless blocks; proportion, cloth and posture carry identity."""
    person=group(name)
    legs=.84 if not seated else .44
    chest_y=legs+.34
    torso=box(name+'_Torso',(0,chest_y,0),(width,.64,.32),clothes,person,.03)
    torso.rotation_euler[1]=posture
    box(name+'_Head',(0,height-.23,.025),(width*.67,.43,.34),head,person,.025)
    for side,label in [(-1,'Left'),(1,'Right')]:
        if seated:
            box(name+'_'+label+'Thigh',(side*width*.23,.53,.22),(width*.3,.20,.58),dark,person)
            box(name+'_'+label+'Leg',(side*width*.23,.25,.48),(width*.3,.48,.22),dark,person)
        else:
            box(name+'_'+label+'Leg',(side*width*.23,.42,0),(width*.3,.8,.24),dark,person)
        box(name+'_'+label+'Shoe',(side*width*.23,.07,.09),(width*.35,.14,.36),dark,person)
        arm=box(name+'_'+label+'Arm',(side*(width*.5+.08),chest_y-.04,.03),(.13,.68,.20),clothes,person)
        arm.rotation_euler[1]=side*.035+posture
        box(name+'_'+label+'Hand',(side*(width*.5+.08),chest_y-.43,.04),(.12,.15,.16),head,person)
    person['character_style']='faceless; no eyes, mouth, nose or facial texture'
    return person

def ellipse(name, center, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=xyz(center))
    obj=bpy.context.object;obj.name=name;obj.scale=(scale[0],scale[2],scale[1]);obj.data.materials.append(mat)
    if parent: obj.parent=parent
    for poly in obj.data.polygons: poly.use_smooth=True
    return obj

def curved(name, points, radius, mat, parent=None):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=10
    curve.bevel_depth=radius;curve.bevel_resolution=2;curve.resolution_u=8
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for control,point in zip(spline.bezier_points,points):
        control.co=xyz(point);control.handle_left_type='AUTO';control.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    if parent: obj.parent=parent
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj.select_set(False)
    return obj

def chair(name,x,z,mat,cloth,parent,yaw=0):
    root=group(name,(x,0,z),parent);root.rotation_euler[2]=yaw
    box(name+'_Seat',(0,.58,0),(.62,.13,.62),mat,root,.045)
    for side in [-1,1]:
        for forward in [-1,1]: box(name+'_Leg',(side*.23,.26,forward*.23),(.085,.52,.085),mat,root)
    for side in [-1,1]:box(name+'_BackPost',(side*.23,1.03,-.23),(.07,.85,.07),mat,root)
    box(name+'_Back',(0,1.25,-.23),(.59,.34,.10),cloth,root,.04)
    return root

def bowl(name,center,radius,mat,parent):
    # Open, ordinary household vessel, not a solid sphere masquerading as a bowl.
    verts=[];faces=[];segments=16
    rings=[(.18,.0),(.64,.06),(.88,.19),(1,.28),(.92,.28),(.75,.14),(.45,.08),(.10,.07)]
    for r,y in rings:
        for i in range(segments):
            a=i*math.tau/segments;verts.append(xyz((center[0]+math.cos(a)*r*radius,center[1]+y*radius*2,center[2]+math.sin(a)*r*radius)))
    for ring in range(len(rings)-1):
        for i in range(segments):
            a=ring*segments+i;b=ring*segments+(i+1)%segments;c=(ring+1)*segments+(i+1)%segments;d=(ring+1)*segments+i;faces.append((a,b,c,d))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.parent=parent
    for face in mesh.polygons:face.use_smooth=True
    return obj

def leaf_sheet(name,center,radii,mat,parent,hole=.0,roof=False):
    vertices=[];faces=[];segments=32;rings=7
    for j in range(rings):
        r=hole+(1-hole)*j/(rings-1)
        for i in range(segments):
            a=i*math.tau/segments;x=math.cos(a)*r*radii[0];z=math.sin(a)*r*radii[1]
            y=(.16*(1-r*r)+.055*math.cos(a*2)*r) if not roof else (.48*(1-r*r)-.10*abs(x)/radii[0])
            vertices.append(xyz((center[0]+x,center[1]+y,center[2]+z)))
    for j in range(rings-1):
        for i in range(segments):
            # Camera-facing cover is omitted for a readable production cutaway.
            midpoint=math.sin((i+.5)*math.tau/segments)*(hole+(1-hole)*(j+.5)/(rings-1))*radii[1]
            if roof and midpoint>.8:continue
            faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.parent=parent
    for face in mesh.polygons:face.use_smooth=True
    if not roof:
        modifier=obj.modifiers.new('soft leaf thickness','SOLIDIFY');modifier.thickness=.055
        bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.modifier_apply(modifier=modifier.name);obj.select_set(False)
    return obj

def domestic_table(name,position,width,depth,mat,parent):
    root=group(name,position,parent)
    box(name+'_Top',(0,.90,0),(width,.18,depth),mat,root,.045)
    for x in [-width/2+.16,width/2-.16]:
        for z in [-depth/2+.13,depth/2-.13]:box(name+'_Leg',(x,.43,z),(.12,.86,.12),mat,root,.02)
    return root

def floor_panel(M):
    root=group('SourceFloorPanel')
    panel=box('FloorSourceBoard',(0,0,0),(4.8,.15,3.2),M['old'],root,.025)
    cutter=box('TemporarySquareCut',(-.55,0,.15),(1.40,1,1.0),M['dark'],root,0)
    modifier=panel.modifiers.new('missing acquired square','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
    bpy.context.view_layer.objects.active=panel;bpy.ops.object.modifier_apply(modifier=modifier.name)
    # The SAME panel has a painted front on its underside; inspection turns the reverse upward.
    paint=box('SourcePaintedSky',(0,-.082,0),(4.65,.012,3.08),M['skyPaint'],root,.005)
    modifier=paint.modifiers.new('same missing acquired square','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
    bpy.context.view_layer.objects.active=paint;bpy.ops.object.modifier_apply(modifier=modifier.name)
    for x,z,width in [(-1.6,-.65,1.1),(.8,-.7,1.2),(1.65,.35,.8)]:
        box('SourcePaintedMountain',(x,-.097,z),(width,.014,.65),M['mountainPaint'],root,.01)
    bpy.data.objects.remove(cutter,do_unlink=True)
    # Old repair/groove and finite saw overrun, with no luminescent clue overlay.
    box('SourceOldRepair',(-1.64,.083,.15),(.32,.025,1.12),M['wood2'],root,.01)
    box('SourceChairGroove',(-1.47,.099,.14),(.045,.01,.84),M['dark'],root,.005)
    box('SourceSawOverrun',(.19,.085,.68),(.04,.02,.38),M['dark'],root,.004)
    return root

def build_orchard(M):
    area=group('OrchardWedding')
    box('OrchardGround',(0,-.23,0),(19,.4,17),M['earth'],area,.3)
    for x,z,s in [(-5.8,3.4,1.4),(-4.0,-1.7,1.1),(1.4,5.1,1.2),(6.8,-2.0,1.5),(-7,-4,1.0)]:
        ellipse('OldSkinStone',(x,-.02,z),(s,.17,s*.65),M['stone'],area)
    for x,z in [(-3,2),(0,-1),(4,3.5)]:
        box('WeddingFlatStones',(x,.025,z),(3.7,.08,2.3),M['stone'],area,.18)
    table=domestic_table('CakeTable',(-3,0,2),3.0,1.25,M['old'],area)
    second=domestic_table('RainTable',(0,0,-1),3.0,1.25,M['old'],area)
    third=domestic_table('FarTable',(4,0,3.5),3.0,1.25,M['old'],area)
    for index,(x,z) in enumerate([(-4.2,3.25),(-1.8,3.25),(-1.2,.15),(1.2,.15),(2.8,4.75),(5.2,4.75)]):
        chair('WeddingChair'+str(index),x,z,M['old'],M['linen'],area)
    # Forty original simple cakes with pink icing flowers, an ordinary task rather than a clue count.
    for index in range(40):
        x=-4.1+(index%10)*.245;z=1.60+(index//10)*.24
        cake=ellipse('PeelCake',(x,1.055,z),(.09,.07,.085),M['cake'],area)
        ellipse('CakeIcing',(x,1.11,z),(.092,.019,.087),M['icing'],area)
        for petal in range(5):
            angle=petal*math.tau/5;ellipse('PinkCakeFlower',(x+math.cos(angle)*.027,1.135,z+math.sin(angle)*.027),(.019,.008,.018),M['pink'],area)
    dress=group('YellowDress',(.7,.99,-1),area)
    box('DressFoldOne',(0,.05,0),(1.25,.055,.66),M['yellow'],dress,.07)
    box('DressFoldTwo',(-.28,.09,.07),(.60,.08,.60),M['yellow'],dress,.05)
    curved('UnpickedDressHem',[(-.60,.065,-.24),(-.20,.08,-.30),(.30,.07,-.20),(.58,.065,-.24)],.012,M['thread'],dress)
    # Single large leaf canopy, with a true central opening and explicit camera-facing cutaway.
    leaf_sheet('WeddingLeafRoof',(0,3.65,-1.3),(6.6,3.8),M['leaf'],area,.11,True)
    for x in [-5.5,5.5]:
        curved('LeafRoofStem',[(x,0,-3.8),(x,1.6,-3.8),(x*.8,3.5,-2.8)],.14,M['root'],area)
    for x in [-5,-3,0,3,5]:curved('RoofVein',[(x,3.6,-3.5),(x*.5,4.0,-2.5),(0,4.13,-1.3)],.035,M['leafEdge'],area)
    bowl('OverflowBowl',(0,.0,-1.3),.35,M['ceramic'],area)
    ellipse('RainPuddle',(0,.017,-1.3),(1.7,.014,.8),M['water'],area)
    trough=group('RainTrough',(-5.3,.08,-4.35),area)
    box('TroughBottom',(0,.02,0),(3.1,.10,.78),M['old'],trough,.03)
    for z in [-.40,.40]:box('TroughRim',(0,.17,z),(3.3,.28,.10),M['old'],trough,.035)
    box('TroughWater',(0,.09,0),(2.95,.025,.66),M['water'],trough,.01)
    curved('RainDitch',[(-4,.02,-3.9),(-5.7,.01,-2.6),(-7.7,.01,-1.7)],.14,M['wetEarth'],area)
    strip=group('RainStrip',(-5.25,.25,-4.25),area)
    leaf_sheet('RainStripSurface',(0,0,0),(1.15,.42),M['paleTissue'],strip)
    curved('ActiveStripToRoot',[(-5.3,.35,-4.3),(-5.8,.5,-4.5),(-6.05,.82,-4.9)],.09,M['paleTissue'],area)
    root=group('DoraRoot')
    curved('DoraRootTrunk',[(0,.18,0),(.32,.75,.05),(.16,1.8,-.25)],.28,M['root'],root)
    for points in [[(0,.18,0),(-1.0,.11,.65),(-1.8,.15,1.1)],[(.1,.2,.1),(.9,.13,.6),(1.5,.05,.3)]]:curved('DoraRootBranch',points,.13,M['root'],root)
    box('RootHandSeat',(-.18,.78,.25),(.25,.46,.12),M['dark'],root,.045)
    box('DoraRootPalm',(-.18,.79,.34),(.14,.18,.085),M['skin'],root,.012)
    for x in [-.045,-.015,.015,.045]:box('DoraRootFinger',(-.18+x,.67,.33),(.024,.13,.035),M['skin'],root,.008)
    box('RootSpeakingPiece',(.08,1.0,.32),(.46,.22,.13),M['pink'],root,.035)
    box('RootSpeakingSlit',(.08,1.0,.394),(.33,.022,.01),M['dark'],root,.006)
    # Altered branch cradle remains a physical object; tracing paper is a separate model.
    cradle=group('BranchCradle')
    for x in [-.55,.55]:box('CradleSide',(x,.33,0),(.10,.60,1.35),M['old'],cradle,.025)
    box('CradleCrosspiece',(0,.58,0),(1.25,.12,.32),M['old'],cradle,.015)
    for x in [-.38,.38]:rod('BroadCradleLoop',(x,.25,-.4),(x,.56,.38),.035,M['linen'],cradle)
    curved('NarrowCradleSling',[(-.18,.6,-.12),(-.18,.55,.30),(.18,.55,.30),(.18,.6,-.12)],.025,M['linen'],cradle)
    box('CradleFreshGroove',(0,.65,0),(.40,.012,.035),M['wood2'],cradle,.005)
    box('CradleOlderGroove',(0,.65,-.12),(.78,.01,.025),M['dark'],cradle,.005)
    rubbing=group('CradleRubbing')
    box('CakeWrappingRubbing',(0,.02,0),(.78,.025,.62),M['paper'],rubbing,.012)
    for z in [-.08,.08]:box('RubbingGrooveMark',(0,.038,z),(.40,.008,.016),M['charcoal'],rubbing,0)
    for i,(x,z) in enumerate([(-6.5,-6),(-4,-6),(0,-1.3),(3,-4.8),(5.1,-2.2)]):
        for j in range(3):rod('LocalRain', (x+j*.08,3.0+j*.10,z), (x+j*.08,2.3+j*.1,z),.007,M['rain'],area)
    # Country beyond is only a bounded scenery glimpse, never a free traversable larger map.
    box('OrchardCountryBehind',(0,-.8,-13),(34,.4,12),M['under'],area,.3)
    for x in [-12,-5,3,11]:
        fold=box('DistantCountryPeel',(x,2.7,-14),(8,.35,5),M['stone'],area,.25);fold.rotation_euler[0]=.4
    parcel=group('WrappedCakes')
    box('CakeParcel',(0,.11,0),(.52,.22,.4),M['paper'],parcel,.035)
    box('CakeParcelTie',(0,.23,0),(.04,.02,.43),M['linen'],parcel,.006)
    return area

def build_theatre(M):
    area=group('DryTheatre')
    box('DryRoomBase',(0,-.25,0),(16,.44,15),M['stone'],area,.18)
    for x in range(-7,8):box('TheatreFloorBoard',(x,.0,0),(.94,.075,13.6),M['wood2'] if x%3 else M['old'],area,.02)
    box('TheatreBackWall',(0,2,-6.8),(15,4,.25),M['chalk'],area,.12)
    box('TheatreLeftWall',(-7.7,1.35,-1.3),(.22,2.7,11),M['chalk'],area,.08)
    box('OldRoomDoorFrame',(-5.8,1.35,-6.5),(1.6,2.7,.20),M['dark'],area,.045)
    box('OldRoomDoorOpening',(-5.8,1.25,-6.37),(1.4,2.4,.06),M['under'],area,.015)
    # Three shed-room fragments carry deliberately interrupted painted mountains.
    for index,x in enumerate([-4.2,4.2]):
        panel=box('PaintedMountainPanel',(x,1.65,-5.9),(2.4,2.8,.13),M['plaster'],area,.025)
        box('PaintedSky',(x,2.30,-5.81),(2.15,1.1,.02),M['skyPaint'],area,.01)
        mountain=box('PaintedMountain',(x,1.56,-5.78),(1.6,.76,.025),M['mountainPaint'],area,.012);mountain.rotation_euler[2]=(-1 if index%2 else 1)*.24
        box('UnpaintedPlasterGap',(x+.95,1.8,-5.76),(.22,.45,.035),M['chalk'],area,.015)
    box('PerformancePlatform',(0,.03,-3.0),(7,.13,3.1),M['old'],area,.04)
    chair('StormPerformanceChair',0,-2.8,M['old'],M['linen'],area)
    # Stage tray/seeds are ordinary props, not a voice or storm recording.
    tray=group('StormTray',(2.2,.98,-2.2),area)
    box('StormTrayBase',(0,0,0),(.85,.045,.54),M['wood2'],tray,.02)
    for z in [-.26,.26]:box('TrayRim',(0,.05,z),(.88,.07,.04),M['old'],tray,.01)
    for i in range(45):ellipse('RehearsedSeed',(-1.5+(i%9)*.35,.072,-1.5+(i//9)*.22),(.025,.021,.035),M['seed'],area)
    for name,x,z in [('LeftTrestle',-2.0,1.8),('RightTrestle',2.0,1.8)]:
        box(name,(x,.61,z),(.17,1.2,1.7),M['old'],area,.025)
        box(name+'Foot',(x,.08,z),(.65,.12,1.9),M['old'],area,.02)
    for x in [-5.5,-4.0]:domestic_table('PaintTable',(x,0,3.7),1.2,.75,M['old'],area)
    bowl('BrushWash',(-5.5,.99,3.7),.23,M['ceramic'],area)
    for x in [-5.65,-5.4]:rod('OrdinaryBrush',(x,1.0,3.55),(x,1.27,3.88),.016,M['old'],area)
    box('CurtainDoorLeft',(7.1,1.15,4.9),(.2,2.3,1.4),M['chalk'],area,.05)
    box('CurtainDoorRight',(7.1,1.15,1.8),(.2,2.3,1.4),M['chalk'],area,.05)
    cloth=box('EntranceCurtain',(7.08,1.4,3.35),(.045,2.6,1.1),M['linen'],area,.025);cloth.rotation_euler[2]=-.12
    picture=group('CountryBluePicture')
    box('PictureFrame',(0,.45,0),(1.30,.95,.10),M['old'],picture,.025)
    box('PictureBlueRoom',(0,.45,.06),(1.14,.79,.015),M['skyPaint'],picture,.01)
    box('PictureChairLeg',(.26,.26,.08),(.05,.32,.015),M['old'],picture,0)
    box('PictureChairEdge',(.19,.45,.08),(.24,.03,.015),M['old'],picture,0)
    pipe=group('SplitPipe')
    rod('SplitPipeLong',(0,0,0),(0,.43,0),.035,M['old'],pipe)
    rod('SplitPipeShort',(.10,0,0),(.10,.28,0),.035,M['old'],pipe)
    box('PipeJoin',(.05,.06,0),(.17,.05,.07),M['wood2'],pipe,.01)
    tracing=group('FloorTracing')
    box('FloorTracingPaper',(0,0,0),(1.0,.025,.78),M['paper'],tracing,.01)
    for x in [-.27,.27]:box('TracingSquareSide',(x,.02,0),(.012,.008,.39),M['charcoal'],tracing,0)
    for z in [-.20,.20]:box('TracingSquareSide',(0,.02,z),(.54,.008,.012),M['charcoal'],tracing,0)
    lamp=group('CountryLamp')
    box('LampBase',(0,.05,0),(.24,.09,.24),M['old'],lamp,.015)
    box('LampTop',(0,.48,0),(.27,.055,.27),M['old'],lamp,.015)
    for x,z in [(-.1,-.1),(-.1,.1),(.1,-.1),(.1,.1)]:rod('LampUpright',(x,.08,z),(x,.47,z),.016,M['old'],lamp)
    ellipse('LampPaleGlass',(0,.27,0),(.08,.18,.08),M['ceramic'],lamp)
    floor_panel(M)
    blocks=group('PanelLowBlocks')
    for x in [-1.8,1.8]:box('PanelSupportBlock',(x,.12,0),(.4,.24,1.2),M['old'],blocks,.025)
    # Hollow and overturned doorway fragments beyond the bounded local room.
    for x in [-11,-8,9]:
        box('ShedCountryFloor',(x,-.28,-11),(5,.24,7),M['plaster'],area,.2)
        box('ShedCountryFormerWall',(x,1,-12),(5,2,.15),M['chalk'],area,.1)
    return area

def build_house(M):
    area=group('LowHouse')
    box('HouseStep',(2.2,-.12,6.35),(3.2,.15,1.3),M['old'],area,.08)
    box('HouseOverhang',(2.2,2.95,5.8),(3.4,.18,1.5),M['leafEdge'],area,.08)
    box('LowHouseFloor',(0,-.23,0),(12,.40,12),M['wood2'],area,.14)
    for x in [-5.8,5.8]:box('HouseLowSide',(x,.35,0),(.22,.7,11.6),M['chalk'],area,.07)
    box('HouseBackWall',(0,1.4,-5.75),(11.6,2.8,.25),M['chalk'],area,.08)
    box('HouseWestWindowLow',(-5.75,.53,-2.4),(.22,1.06,3.0),M['chalk'],area,.06)
    box('HouseWindowSill',(-5.65,1.13,-2.4),(.65,.17,3.2),M['old'],area,.03)
    for z in [-4.0,-.8]:box('HouseWindowJamb',(-5.75,1.9,z),(.20,1.7,.13),M['old'],area,.025)
    frame=box('OpenHouseWindow',(-5.9,1.8,-2.4),(.10,1.35,2.85),M['old'],area,.04);frame.rotation_euler[2]=-.20
    box('HouseDoorPostLeft',(1.1,1.30,5.62),(.18,2.6,.2),M['old'],area,.025)
    box('HouseDoorPostRight',(3.3,1.30,5.62),(.18,2.6,.2),M['old'],area,.025)
    door=box('SlowHouseDoor',(3.7,1.25,5.3),(1.8,2.5,.12),M['old'],area,.04);door.rotation_euler[2]=-.65
    box('DoorWornKick',(3.8,.27,5.25),(.38,.10,.02),M['wood2'],area,.01)
    # Two roof profiles remain over the rear strip; forward covers omitted as a production cutaway.
    for width,y,z in [(12,3.05,-4.5),(8.4,3.78,-4.3)]:
        roof=box('SettledRoof',(0,y,z),(width,.22,2.9),M['leafEdge'],area,.12);roof.rotation_euler[0]=.07
    for z in [-4.1,-3.7]:box('RoofGapShoe',(.8,3.35,z),(.20,.16,.43),M['dark'],area,.03)
    leaf=group('OpenFloorLeaf',(-1.6,.01,-.85),area)
    leaf_sheet('OpenLeafSurface',(0,0,0),(2.75,2.2),M['paleTissue'],leaf)
    curved('LeafToWindowEdge',[(-4.1,.10,-1.2),(-4.8,.23,-2),(-5.55,.61,-2.4)],.13,M['paleTissue'],area)
    mound=ellipse('LeafReturnMound',(-1.6,.24,-.85),(.57,.26,.45),M['paleTissue'],area)
    for index in range(3):bowl('DryingDish',(-5.5,1.25+index*.07,-1.4),.26-index*.025,M['ceramic'],area)
    bowl('LooseFlakeDish',(-5.53,1.22,-2.6),.22,M['ceramic'],area)
    box('LooseFlakeOutsideReach',(-5.53,1.26,-2.6),(.10,.015,.06),M['flake'],area,.01)
    box('ReturnedLeafFlake',(-3.9,.16,-1.25),(.10,.015,.06),M['flake'],area,.01)
    chair('EmilWornChair',-2.8,2.3,M['old'],M['wood2'],area)
    chair('EmilChosenChair',-.7,2.3,M['old'],M['linen'],area)
    table=domestic_table('EmilSmallTable',(2.4,0,1.0),2.2,1.5,M['old'],area)
    bowl('EmilMealBowl',(2.3,.99,1.0),.25,M['ceramic'],area)
    ellipse('BurntFruitJar',(2.7,1.14,.63),(.13,.22,.13),M['fruit'],area)
    drawing=group('EmilSupportDrawing',parent=area)
    box('SupportDrawing',(1.9,1.0,1.25),(.65,.017,.58),M['paper'],drawing,.01)
    for x in [1.75,1.9,2.05]:curved('DrawingSupportLine',[(x,1.013,1.5),(x,1.013,1.27),(1.9,1.013,1.1)],.007,M['charcoal'],drawing)
    rod('CrossedHandDrawing',(2.1,1.012,1.40),(2.28,1.012,1.25),.007,M['charcoal'],drawing)
    rod('CrossedHandDrawing',(2.1,1.012,1.25),(2.28,1.012,1.40),.007,M['charcoal'],drawing)
    box('EmilCupboard',(5.0,.67,-2.9),(1.1,1.3,2.2),M['old'],area,.045)
    # Current outside relation runs from the active window-plant roots toward the wrist.
    plant=group('WindowPlant',(-6.2,0,-2.4),area)
    bowl('PlantPot',(0,.24,0),.34,M['old'],plant)
    curved('ThickPlantRoots',[(0,.5,0),(.35,.95,0),(.58,1.22,0)],.11,M['root'],plant)
    curved('PlantStem',[(0,.45,0),(.07,1.6,0),(-.20,2.5,.05)],.035,M['leafEdge'],plant)
    for i,(x,y,z) in enumerate([(-.25,1.15,.02),(.23,1.65,0),(-.30,2.1,0),(-.2,2.45,.05)]):
        leaf_sheet('PlantLeaf',(x,y,z),(.30,.13),M['leaf'],plant)
        if i>1:ellipse('PalePlantFlower',(x,y+.1,z),(.055,.075,.055),M['flake'],plant)
    curved('EmilOutsideBand',[(-5.62,1.05,-2.4),(-4.2,.32,-1.7),(-1.20,.72,2.2)],.055,M['paleTissue'],area)
    strips=group('ReneCleanStrips')
    for i in range(3):curved('CleanFlexibleStrip',[(-.24+i*.21,0,-.30),(-.16+i*.21,.06,0),(-.22+i*.21,.04,.30)],.045,M['paleTissue'],strips)
    account=group('WrittenAccount')
    box('CheckedAccountPaper',(0,0,0),(.7,.017,.5),M['paper'],account,.01)
    for index in range(4):box('AccountLine',(0,.015,-.15+index*.09),(.50,.006,.01),M['charcoal'],account,0)
    return area

def make_figures(M):
    blaise=figure('Blaise',M['blaise'],M['skin'],M['dark'],.49,1.9)
    box('Blaise_CoatHem',(0,.8,0),(.54,.35,.36),M['blaise'],blaise,.035)
    box('Blaise_Collar',(0,1.47,-.015),(.39,.16,.36),M['blaise'],blaise,.02)
    alma=figure('Alma',M['alma'],M['skin'],M['dark'],.47,1.75,posture=-.045)
    box('Alma_WorkApron',(0,1.03,.18),(.36,.60,.035),M['linen'],alma,.015)
    basil=figure('Basil',M['basil'],M['skin'],M['dark'],.63,1.95,posture=.02)
    dora=figure('TableDora',M['dora'],M['skin'],M['dark'],.60,1.84)
    box('TableDora_Apron',(0,1.05,.19),(.43,.73,.035),M['linen'],dora,.02)
    emil=figure('Emil',M['emil'],M['skin'],M['dark'],.52,1.54,seated=True)
    figure('ReneSeated',M['rene'],M['skin'],M['dark'],.44,1.54,seated=True)
    figure('EmilAtWindow',M['emil'],M['skin'],M['dark'],.52,1.78,posture=.07)
    rene=figure('Rene',M['rene'],M['skin'],M['dark'],.44,1.92,posture=.035)
    return blaise

def build_country():
    clear_scene()
    M={
        'old':material('ordinary old dark wood',(.30,.18,.13)),
        'wood2':material('lighter hardened wood',(.46,.32,.25)),
        'chalk':material('dry warm chalk walls',(.68,.58,.47)),
        'plaster':material('shed room plaster',(.64,.62,.50)),
        'stone':material('old pale country skin',(.73,.69,.57)),
        'under':material('exposed country surface',(.51,.36,.38)),
        'earth':material('orchard wet ground',(.35,.30,.20)),
        'wetEarth':material('ordinary rain ditch',(.20,.21,.15)),
        'leaf':material('large orchard leaf',(.32,.42,.19)),
        'leafEdge':material('hardened leaf edge',(.40,.38,.20)),
        'root':material('root sapwood',(.59,.38,.28)),
        'paleTissue':material('local pale responsive tissue',(.77,.64,.48)),
        'skin':material('closed faceless heads and hands',(.73,.59,.44)),
        'blaise':material('Blaise dark blue green coat',(.16,.26,.28)),
        'dora':material('Dora faded terracotta dress',(.57,.28,.22)),
        'alma':material('Alma grey olive working clothes',(.36,.39,.27)),
        'basil':material('Basil worn dark ochre coat',(.45,.31,.14)),
        'emil':material('Emil faded blue shirt',(.29,.36,.41)),
        'rene':material('Rene ordinary muted brown green',(.27,.29,.22)),
        'dark':material('ordinary dark shoes and openings',(.10,.10,.12)),
        'linen':material('ordinary warm linen',(.80,.70,.55)),
        'yellow':material('unfinished yellow wedding dress',(.74,.55,.16)),
        'thread':material('dress seam thread',(.37,.28,.12)),
        'ceramic':material('cream ordinary ceramic',(.79,.68,.51)),
        'cake':material('peel cake crumb',(.58,.34,.11)),
        'icing':material('brittle pale icing',(.92,.83,.64)),
        'pink':material('pink flowers and slitted wooden tissue',(.72,.35,.41)),
        'water':material('ordinary rain water',(.23,.38,.36),.25),
        'rain':material('local falling rain',(.51,.62,.60),.35),
        'paper':material('ordinary tracing and wrapping paper',(.84,.77,.59)),
        'charcoal':material('ordinary charcoal marks',(.18,.16,.15)),
        'skyPaint':material('blue room and stage painted sky',(.18,.35,.41)),
        'mountainPaint':material('stage painted mountains',(.25,.30,.33)),
        'seed':material('ordinary stage seeds',(.42,.26,.14)),
        'fruit':material('burnt fruit preserve jar',(.17,.095,.07)),
        'flake':material('pale leaf flake and flowers',(.88,.80,.63)),
    }
    areas=[build_orchard(M),build_theatre(M),build_house(M)]
    blaise=make_figures(M)
    # Batch decorative families only: editable meshes remain, authored roots are retained.
    for prefix in ['PeelCake','CakeIcing','PinkCakeFlower','LocalRain','RehearsedSeed','TheatreFloorBoard']:
        objects=[obj for obj in bpy.data.objects if obj.type=='MESH' and obj.name.startswith(prefix)]
        if len(objects)>1:
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:obj.select_set(True)
            bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=prefix+'Batch'
    model_roots=[obj for obj in bpy.data.objects if obj.parent is None and obj.type=='EMPTY' and obj not in areas]
    bpy.context.scene.world.color=(.15,.16,.14)
    bpy.ops.object.camera_add(location=xyz((18,20,26)))
    camera=bpy.context.object;camera.name='CountryFollowingCameraReference'
    camera.rotation_euler=(Vector(xyz((0,1,0)))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=25;bpy.context.scene.camera=camera
    for name,position,energy,size,color in [('CountryDaylight',(-2,13,-6),2100,12,(1,.84,.65)),('CountryFill',(2,10,9),1100,12,(.83,.85,1))]:
        bpy.ops.object.light_add(type='AREA',location=xyz(position));light=bpy.context.object;light.name=name;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.data.color=color
        light.rotation_euler=(Vector(xyz((0,0,0)))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.scene.render.engine='BLENDER_EEVEE_NEXT'
    bpy.context.scene.render.resolution_x=1440;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
    # Initial orchard reference. Export includes roots needed by exact future profile visibility.
    for area in areas[1:]:
        for obj in area.children_recursive:obj.hide_render=True
    placements={'Blaise':(-5,0,2.8),'Alma':(-1.8,0,1.2),'DoraRoot':(-5.9,0,-4.9),'BranchCradle':(4,1.02,3.4),'CradleRubbing':(5.3,.01,5),'TableDora':(2,0,-1),'Basil':(1,0,-2.3),'SourceFloorPanel':(0,1.1,1.8),'CountryBluePicture':(3.2,0,-1.6),'SplitPipe':(2.0,1.0,-2.0),'FloorTracing':(-4.5,1.0,3.7),'Emil':(-.7,0,2.3),'EmilAtWindow':(-5.1,0,-2.0),'Rene':(2.5,0,3.8),'ReneCleanStrips':(1.9,.6,2.5)}
    for name,position in placements.items():bpy.data.objects[name].location=xyz(position)
    hidden=['Basil','TableDora','SourceFloorPanel','CountryBluePicture','SplitPipe','FloorTracing','Emil','EmilAtWindow','Rene','ReneCleanStrips','CradleRubbing']
    for obj in model_roots:
        obj.hide_render=obj.name not in ['Blaise','Alma','DoraRoot','BranchCradle']
        for child in obj.children_recursive:child.hide_render=obj.hide_render
    directory=ROOT/'visual/country';production=ROOT/'public/world/country'
    directory.mkdir(parents=True,exist_ok=True);production.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/'first-country-locations.blend'))
    bpy.ops.export_scene.gltf(filepath=str(production/'first-country-locations.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
    if '--no-preview' not in sys.argv:
        for area,filename,models in [(areas[0],'orchard-reference',{'Blaise':(-5,0,2.8),'Alma':(-1.8,0,1.2),'DoraRoot':(-5.9,0,-4.9),'BranchCradle':(4,1.02,3.4)}),(areas[1],'theatre-reference',{'Blaise':(3.5,0,3.0),'Basil':(1,0,-2.3),'TableDora':(3,0,-1.2),'SourceFloorPanel':(0,1.1,1.8),'CountryBluePicture':(3.2,0,-1.6),'SplitPipe':(2,1.0,-2)}),(areas[2],'house-reference',{'Blaise':(1.0,0,3.2),'Emil':(-.7,0,2.3)})]:
            for candidate in areas:
                for obj in candidate.children_recursive:obj.hide_render=candidate!=area
            for obj in model_roots:
                obj.hide_render=obj.name not in models
                for child in obj.children_recursive:child.hide_render=obj.hide_render
            for name,position in models.items():bpy.data.objects[name].location=xyz(position)
            bpy.context.scene.render.filepath=str(directory/(filename+'.png'));bpy.ops.render.render(write_still=True)
    print('COUNTRY_ASSET_COMPLETE',len(bpy.data.objects),'original objects')

if __name__=='__main__':build_country()
