"""Original editable world rebuild. Blender CLI authoring, never GUI computer use.

Run: blender -b --python tools/blender/build-rebuild.py
Selected A: The Second Mouth. Bounded first supper room and orchard glimpse.
The helpers use game Y-up coordinates; Blender stores them as Z-up.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]

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

def export_scene(filename):
    directory=ROOT/'visual/rebuild'
    production=ROOT/'public/world/rebuild'
    directory.mkdir(parents=True,exist_ok=True)
    production.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/(filename+'.blend')))
    bpy.ops.export_scene.gltf(filepath=str(production/(filename+'.glb')),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False,export_extras=True)



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

def build_supper():
    clear_scene()
    M={
        'chalk':material('warm living chalk',(.65,.49,.44)),
        'edge':material('pink chalk edge',(.82,.63,.51)),
        'old':material('old hardened wood',(.30,.18,.13)),
        'floor':material('hardened floor grain',(.41,.29,.24)),
        'floor2':material('alternate floor grain',(.46,.32,.25)),
        'soft':material('new soft table wood',(.72,.35,.41)),
        'root':material('orchard sapwood',(.59,.38,.28)),
        'leaf':material('ochre orchard leaves',(.55,.50,.23)),
        'leaf2':material('copper orchard leaves',(.57,.31,.18)),
        'skin':material('all closed faceless heads and hands',(.73,.59,.44)),
        'blaise':material('Blaise dark blue green coat',(.16,.26,.28)),
        'dora':material('Dora faded terracotta dress',(.57,.28,.22)),
        'apron':material('Dora ordinary linen apron',(.80,.70,.55)),
        'noor':material('Noor warm indigo clothes',(.29,.28,.43)),
        'dark':material('dark shoes and trousers',(.10,.10,.12)),
        'cord':material('pale living cords',(.86,.71,.61)),
        'ceramic':material('cream ordinary ceramics',(.79,.68,.51)),
        'bread':material('bread crust',(.53,.30,.10)),
        'fruit':material('dark cherries',(.28,.055,.08)),
        'iron':material('small dark domestic iron',(.16,.14,.13)),
        'rug':material('woven rose cloth',(.39,.19,.22)),
        'country':material('old white country skin',(.73,.69,.57)),
        'under':material('new country underneath',(.56,.38,.40)),
        'glow':material('lamp warm shade',(.88,.57,.26),.8,.35),
    }
    room=group('SupperRoom')
    # An open camera-facing side is a production cutaway, not a missing wall clue.
    box('RoomBase',(0,-.22,0),(14,.4,12),M['old'],room,.07)
    for i in range(20):box('FloorPlank',(-6.65+i*.7,-.015,0),(.66,.08,11.9),M['floor2' if i%3==0 else 'floor'],room,.025)
    box('RearWallLeft',(-6,1.65,-5.9),(2,3.3,.28),M['chalk'],room,.1)
    box('RearWallRight',(6,1.65,-5.9),(2,3.3,.28),M['chalk'],room,.1)
    box('RearWallLow',(0,.30,-5.9),(10,.6,.28),M['chalk'],room,.09)
    box('WindowLintel',(0,3.55,-5.9),(10.3,.5,.4),M['edge'],room,.12)
    box('WindowSill',(0,.67,-5.85),(10.4,.2,.9),M['old'],room,.06)
    for x in [-5,5]:box('WindowWestJamb' if x<0 else 'OrchardOpening',(x,2.0,-5.9),(.23,2.7,.4),M['old'],room,.04)
    box('SideWall',(-7,1.65,-1.5),(.28,3.3,9),M['chalk'],room,.12)
    # The side opening is a visual gate; local bounds do not let the avatar leave this scene.
    box('SideDoorLeft',(6.9,1.3,3.8),(.22,2.6,1.1),M['chalk'],room,.07)
    box('SideDoorRight',(6.9,1.3,-1.4),(.22,2.6,4.1),M['chalk'],room,.07)
    box('SideDoorLintel',(6.9,2.7,1.8),(.3,.3,3.3),M['old'],room,.05)
    for x in [-6.65,6.65]:box('CutawaySide',(x,.19,4.8),(.18,.38,2.2),M['edge'],room,.04)
    # Two old surfaces flank the soft pink material exposed in their seam.
    table=group('SupperTable',(0,0,.6),room)
    box('TableOldNear',(0,.96,.56),(6.5,.23,.92),M['old'],table,.055)
    box('TableOldFar',(0,.96,-.56),(6.5,.23,.92),M['old'],table,.055)
    box('TableSoftSeam',(0,.94,0),(6.5,.18,.30),M['soft'],table,.08)
    for x in [-2.8,2.8]:
        for z in [-.69,.69]:box('TableLeg',(x,.43,z),(.18,.86,.18),M['old'],table,.025)
    # Visible grain gives ordinary old furniture more presence without printed clue text.
    for x in [-2.3,-.5,1.4,2.7]:box('TableGrain',(x,1.08,.57),(.022,.008,.68),M['floor'],table,0)
    chair('BlaiseChair',-3.15,2.0,M['old'],M['blaise'],room,0)
    chair('DoraChair',1.7,-1.0,M['old'],M['rug'],room,math.pi)
    chair('EmptyChairOne',-.9,-1.0,M['old'],M['rug'],room,math.pi)
    chair('EmptyChairTwo',-.7,2.05,M['old'],M['rug'],room,0)
    chair('EmptyChairThree',2.0,2.05,M['old'],M['rug'],room,0)
    cloth=box('TableCloth',(1.2,1.09,-.46),(1.75,.025,.65),M['apron'],room,.03)
    for x,z in [(-2.3,1.05),(-.5,1.05),(1.4,.2),(2.7,1.05)]:
        bowl('SupperPlate',(x,1.09,z),.26,M['ceramic'],room)
        rod('OrdinaryCutlery',(x+.32,1.10,z-.14),(x+.32,1.10,z+.17),.018,M['iron'],room)
    bowl('DoraBowl',(1.25,1.12,-.5),.32,M['ceramic'],room)
    for x,z in [(1.15,-.51),(1.32,-.43),(1.39,-.57)]:ellipse('Cherry',(x,1.20,z),(.05,.05,.05),M['fruit'],room)
    ellipse('BreadLoaf',(-.1,1.20,.24),(.48,.19,.24),M['bread'],room)
    # Ordinary pantry and soft rope; neither is a new game command.
    box('PantryShelf',(-6.5,1.45,-2.8),(.65,.12,3),M['old'],room,.04)
    for z in [-3.7,-2.8,-1.9]:bowl('PantryBowl',(-6.4,1.52,z),.26,M['ceramic'],room)
    box('BreadCupboard',(-6.5,.55,-2.8),(.8,1.0,3.0),M['old'],room,.06)
    rug=box('WovenFloorRug',(2.8,.05,3.95),(4.4,.025,1.2),M['rug'],room,.02)
    for x in [1.2,1.4,4.1,4.3]:box('RugStripe',(x,.067,3.95),(.08,.009,1.1),M['apron'],room,0)
    rope=group('SoftRope',(5.7,.12,3.25),room)
    for ring in range(4):
        points=[(.48*math.cos(i*math.tau/16),ring*.05,.36*math.sin(i*math.tau/16)) for i in range(17)]
        curved('SoftRopeCoil',points,.035,M['cord'],rope)
    # An ordinary blue-room painting above the later window-side transfer panel.
    painting=group('BlueRoomPainting',(5.87,1.95,-5.70),room)
    blue=material('ordinary painting blue room',(.18,.35,.41))
    box('PaintingFrame',(0,0,0),(1.42,1.05,.10),M['old'],painting,.025)
    box('PaintedBlueRoom',(0,0,.06),(1.24,.87,.015),blue,painting,.01)
    box('PaintedChairLeg',(.30,-.22,.08),(.055,.35,.015),M['old'],painting,0)
    box('PaintedChairSeat',(.24,-.03,.08),(.28,.035,.015),M['old'],painting,0)
    box('SupportTransferPanel',(5.87,.73,-5.65),(1.35,.65,.14),M['edge'],room,.08)
    box('TransferFold',(5.87,.80,-5.54),(.72,.43,.09),M['soft'],room,.07)
    # Open low panel and two distinct pale connection routes, not a magic register.
    panel=group('LowPanel',(-2.2,0,-5.55),room)
    box('PanelOpening',(0,.27,.07),(1.95,.45,.10),M['dark'],panel,.015)
    door=box('PanelOpenLeaf',(-1.03,.2,.48),(.06,.52,.75),M['old'],panel,.02);door.rotation_euler[2]=-.25
    curved('DirectCordP',[(-2.5,.25,-5.48),(-1.5,.28,-5.37),(0,.32,-5.5),(2.0,.45,-5.9)],.035,M['cord'],room)
    curved('BorrowedCordQ',[(-1.9,.20,-5.40),(-3.0,.17,-4.0),(-3.55,.12,-.3),(-3.25,.12,1.5)],.04,M['cord'],room)
    curved('ConnectionQ',[(-3.25,.12,1.5),(-3.18,.22,1.7),(-3.15,.31,1.82)],.04,M['cord'],room)
    curved('LooseQEnd',[(-3.25,.12,1.5),(-3.4,.09,1.9),(-3.3,.09,2.3)],.04,M['cord'],room)
    mouth=group('WoodenMouth',(-3.15,.31,1.82),room)
    box('WoodenMouthUpper',(0,.10,0),(.48,.11,.23),M['old'],mouth,.025)
    box('WoodenMouthLower',(0,-.10,0),(.46,.11,.23),M['old'],mouth,.025)
    box('WoodenMouthSlit',(0,0,-.01),(.39,.06,.18),M['dark'],mouth,.015)
    for x in [-.17,0,.17]:ellipse('MouthScrew',(x,.1,.125),(.017,.017,.01),M['iron'],mouth)
    wedge=box('ReleasedWedge',(-3.3,.15,2.45),(.34,.1,.12),M['old'],room,.018)
    wedge.name='ReleasedWedge'
    box('WedgeFreshEnd',(-3.48,.15,2.45),(.025,.11,.13),M['soft'],room,.01)
    box('SpeakingShelf',(6.55,2.82,1.9),(.6,.10,1.25),M['old'],room,.03)
    # Speaking piece is abstract slitted wood, never a facial character mesh.
    speaking=group('SpeakingPiece')
    box('SpeakingPieceBody',(0,.12,0),(.56,.24,.12),M['soft'],speaking,.045)
    box('SpeakingPieceSlit',(0,.12,.069),(.41,.025,.015),M['dark'],speaking,.008)
    # A moving-root tree is staged outside the local playable floor.
    tree=group('OrchardTree',(1.2,0,-7.35),room)
    curved('RootedTrunk',[(0,.2,0),(.40,1.4,0),(.12,3.0,-.1),(1.0,4.6,-.2)],.43,M['root'],tree)
    for points,radius in [([(.2,.3,0),(-1.1,.2,.65),(-2.1,.6,1.5)],.18),([(.3,.2,0),(1.6,.17,.9),(2.8,.3,.3)],.22),([(.6,2.5,0),(-.8,3.5,-.1),(-1.4,4.5,.2)],.18),([(.6,3.4,0),(1.9,4.1,.1),(2.6,4.3,.2)],.17)]:curved('OrchardBranch',points,radius,M['root'],tree)
    for x,y,z,scale in [(-1.2,4.5,.2,1.0),(-.5,5.0,-.1,1.3),(.8,5.3,-.2,1.15),(1.8,4.8,.2,1.05),(2.5,4.4,.1,.8)]:
        ellipse('OrchardCrown',(x,y,z),(scale,.36,scale*.65),M['leaf2' if x>1 else 'leaf'],tree)
    box('TreeSplit',(-.28,.88,.38),(.38,.65,.11),M['dark'],tree,.06)
    # Precisely the same skin material as Dora's visible hand. No real/copy color coding.
    hand=group('RootHand',(-.29,.89,.50),tree)
    box('RootHandPalm',(0,0,0),(.14,.18,.085),M['skin'],hand,.012)
    for x in [-.045,-.015,.015,.045]:box('RootHandFinger',(x,-.1,-.03),(.024,.13,.035),M['skin'],hand,.008)
    box('RootHandWrist',(0,.13,-.02),(.10,.11,.08),M['skin'],hand,.01)
    curved('RootSupportRope',[(1.2,.65,-6.8),(.85,.65,-5.65),(1.8,.67,-5.6),(2.0,.66,-6.25),(1.2,.65,-6.8)],.04,M['cord'],room)
    # Immense folded country is scenery beyond the window, never reachable by floor clicks.
    box('OldCountry',(0,-.65,-16),(52,.50,18),M['country'],room,.4)
    for index,x in enumerate([-19,-12,-4,5,14,22]):
        flap=box('CountryFold',(x,1.0+index%3,-21-index%2),(9,.4,7),M['country'],room,.25)
        flap.rotation_euler[0]=.35+index%3*.2;flap.rotation_euler[1]=(-1 if index%2 else 1)*.10
        box('CountryExposed',(x,-.33,-20),(8,.17,8),M['under'],room,.2)
    # Separate authored lower-passage location: no free traversal through an unmodelled stair.
    lower=group('LowerPassage')
    box('LowerFloor',(0,-.18,0),(9,.3,12),M['old'],lower,.1)
    for x in [-4.5,4.5]:box('LowerLowWall',(x,.55,0),(.22,1.1,12),M['chalk'],lower,.09)
    box('LowerRearWall',(0,1.35,-5.85),(9,2.7,.22),M['chalk'],lower,.08)
    for x in [-3.8,3.8]:
        for z in [-4.6,-1.0,3.4]:
            box('SupportUpright',(x,1.30,z),(.19,2.6,.19),M['old'],lower,.025)
    for z in [-4.6,-1.0,3.4]:box('OpenCeilingBeam',(0,2.55,z),(8,.2,.22),M['old'],lower,.03)
    cast=group('DoraPlaceCast',(0,0,-2.35),lower)
    # A drawing-style open cutaway exposes the underside from the elevated camera.
    # The omitted top-facing cover is a presentation device, not missing-piece evidence.
    for x in [-1.57,1.57]:box('OldDarkerCast',(x,2.35,0),(.26,.24,2.0),M['old'],cast,.06)
    box('OldCastBackEdge',(0,2.35,-.88),(3.4,.24,.24),M['old'],cast,.04)
    box('ExposedCastUnderside',(0,1.65,.55),(2.75,.90,.16),M['old'],cast,.04)
    for x in [-2.2,2.2]:box('BrightRoomTissue',(x,2.42,0),(.92,.30,2.3),M['soft'],cast,.12)
    for z in [-1.3,1.3]:box('BrightRoomTissue',(0,2.42,z),(4.5,.25,.6),M['soft'],cast,.09)
    box('CastRepairedNotch',(-.8,1.65,.65),(.20,.34,.06),M['floor'],cast,.02)
    box('CastNotchJoin',(-.8,1.65,.69),(.025,.30,.02),M['dark'],cast,.008)
    curved('LowerTraceP',[(-1.2,1.1,-3.8),(-1.0,1.6,-3.2),(-.5,2.25,-2.85)],.045,M['cord'],lower)
    curved('LowerTraceQ',[(1.7,.6,-.3),(1.1,1.3,-1.6),(.5,2.25,-2.0)],.045,M['cord'],lower)
    box('DryInspectionLedge',(2.1,1.18,-3.6),(3.6,.22,2.4),M['edge'],lower,.07)
    for x in [.65,3.55]:
        for z in [-4.5,-2.7]:box('LedgeLeg',(x,.55,z),(.12,1.1,.12),M['old'],lower,.02)
    niche=group('EmptyReturnNiche',(-2.9,0,2.7),lower)
    box('EmptyNicheBench',(0,.47,0),(1.7,.2,1.7),M['edge'],niche,.08)
    box('EmptyNicheBacking',(0,1.12,-.8),(1.9,1.5,.2),M['chalk'],niche,.09)
    box('EmptyTestSurface',(0,.61,0),(1.3,.08,1.15),M['soft'],niche,.04)
    bowl('TestCup',(-2.9,.67,2.7),.23,M['ceramic'],lower)
    curved('TestCupHandle',[(-2.70,.72,2.7),(-2.59,.76,2.7),(-2.57,.86,2.7),(-2.70,.84,2.7)],.025,M['ceramic'],lower)
    box('CupCharcoalMark',(-2.9,.83,2.92),(.10,.025,.015),M['dark'],lower,.005)
    for step in range(4):box('SideStairReference',(4.8+step*.42,.13+step*.25,4.2),(.5,.25,1.8),M['old'],lower,.02)
    box('LowerSideGate',(4.55,1.25,3.1),(.15,2.5,.15),M['old'],lower,.025)
    # No off-screen future characters are modelled in the bounded opening.
    blaise=figure('Blaise',M['blaise'],M['skin'],M['dark'],.49,1.9)
    box('Blaise_CoatHem',(0,.8,0),(.54,.35,.36),M['blaise'],blaise,.035)
    box('Blaise_Collar',(0,1.47,-.015),(.39,.16,.36),M['blaise'],blaise,.02)
    dora=figure('Dora',M['dora'],M['skin'],M['dark'],.60,1.54,seated=True)
    box('Dora_Apron',(0,.71,.19),(.43,.66,.035),M['apron'],dora,.02)
    # Hand is held above the table after exposure, and is hidden by initial explicit profile.
    dora_left=bpy.data.objects['Dora_LeftHand'];dora_left.location=xyz((-.25,1.1,.43))
    dora_arm=bpy.data.objects['Dora_LeftArm'];dora_arm.rotation_euler[0]=-.75;dora_arm.location=xyz((-.34,.92,.16))
    kneeling_dora=figure('DoraKneeling',M['dora'],M['skin'],M['dark'],.60,1.49,seated=True)
    box('DoraKneeling_Apron',(0,.71,.19),(.43,.66,.035),M['apron'],kneeling_dora,.02)
    standing_dora=figure('DoraStanding',M['dora'],M['skin'],M['dark'],.60,1.84)
    box('DoraStanding_Apron',(0,1.05,.19),(.43,.73,.035),M['apron'],standing_dora,.02)
    noor=figure('NoorPanel',M['noor'],M['skin'],M['dark'],.42,1.49,seated=True)
    noor.rotation_euler[1]=.12
    figure('NoorWindow',M['noor'],M['skin'],M['dark'],.42,1.85,posture=.09)
    figure('NoorLower',M['noor'],M['skin'],M['dark'],.42,1.85,posture=.025)
    # Preview camera matches the elevated oblique following presentation; no supplied game art.
    bpy.context.scene.world.color=(.19,.16,.18)
    bpy.ops.object.camera_add(location=xyz((15,19,24)))
    camera=bpy.context.object;camera.name='OpeningObliqueReference'
    camera.rotation_euler=(Vector(xyz((0,1,-1)))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=25;bpy.context.scene.camera=camera
    for name,position,energy,size,color in [('WindowDaylight',(0,11,-7),1800,12,(1,.78,.62)),('RoomFill',(2,9,7),1000,10,(.85,.78,1))]:
        bpy.ops.object.light_add(type='AREA',location=xyz(position));light=bpy.context.object;light.name=name;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.data.color=color
        light.rotation_euler=(Vector(xyz((0,0,0)))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.scene.render.engine='BLENDER_EEVEE_NEXT'
    bpy.context.scene.render.resolution_x=1440;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
    # Editable initial-passage staging for the .blend opening reference.
    blaise.location=xyz((-3.15,0,2.55));dora.location=xyz((1.7,0,-1.0));dora.rotation_euler[2]=math.pi
    noor.location=xyz((-2.4,0,-4.65));bpy.data.objects['NoorWindow'].hide_render=True
    speaking.location=xyz((6.2,2.9,2.0))
    dora_left.hide_render=True;wedge.hide_render=True;bpy.data.objects['WedgeFreshEnd'].hide_render=True
    bpy.data.objects['RootSupportRope'].hide_render=True;bpy.data.objects['TransferFold'].hide_render=True
    bpy.data.objects['LooseQEnd'].hide_render=True;bpy.data.objects['NoorLower'].hide_render=True
    kneeling_dora.hide_render=True
    for object in kneeling_dora.children_recursive:object.hide_render=True
    standing_dora.hide_render=True
    for object in standing_dora.children_recursive:object.hide_render=True
    for object in lower.children_recursive:object.hide_render=True
    # Export node visibility is controlled by explicit encountered scene profiles in the runtime.
    export_scene('second-mouth-supper')
    if '--no-preview' in sys.argv:
        print('REBUILD_ASSET_COMPLETE',len(bpy.data.objects),'original objects; stills skipped by explicit CLI flag')
        return
    bpy.context.scene.render.filepath=str(ROOT/'visual/rebuild/opening-reference.png')
    bpy.ops.render.render(write_still=True)
    for object in room.children_recursive:object.hide_render=True
    for object in lower.children_recursive:object.hide_render=False
    bpy.data.objects['CupCharcoalMark'].hide_render=True
    for name in ['Dora','NoorPanel','NoorWindow','SpeakingPiece']:
        bpy.data.objects[name].hide_render=True
        for object in bpy.data.objects[name].children_recursive:object.hide_render=True
    for object in bpy.data.objects['NoorLower'].children_recursive:object.hide_render=False
    bpy.data.objects['NoorLower'].hide_render=False;bpy.data.objects['NoorLower'].location=xyz((.9,0,-1.3))
    blaise.location=xyz((2.8,0,4.1))
    bpy.context.scene.render.filepath=str(ROOT/'visual/rebuild/lower-reference.png')
    bpy.ops.render.render(write_still=True)
    print('REBUILD_ASSET_COMPLETE',len(bpy.data.objects),'original objects')

if __name__=='__main__':
    build_supper()
