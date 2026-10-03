"""Six pearl-ceramic thresholds. Run with Blender MCP or Blender's Python.

Creates an independent scene, preserves existing scenes, and exports each rig
at the origin before arranging all six in an inspection studio.
"""
import bpy
import bmesh
import math
import os
import json
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/models/doors')
with open(os.path.join(ROOT, 'src/lib/doorPalette.json')) as f:
    PALETTE = json.load(f)
os.makedirs(OUT, exist_ok=True)
scene = bpy.data.scenes.new('Sanctuary • Six thresholds')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.world = bpy.data.worlds.new('Thresholds • Pearl atmosphere')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.60,.72,.82,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .65

def material(name, color, transmission=0, metallic=0, rough=.16):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    for key, value in {'Base Color':(*color,1), 'Metallic':metallic,
                       'Roughness':rough, 'Transmission Weight':transmission,
                       'IOR':1.46, 'Coat Weight':.4, 'Coat Roughness':.1}.items():
        p.inputs[key].default_value = value
    return m

def linear_color(hex_color):
    rgb = [int(hex_color[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in rgb)

gold = material('Door_Champagne', linear_color(PALETTE['gold']), metallic=1, rough=.27)
inner_light = material('Door_WarmInnerLight', linear_color(PALETTE['light']), rough=.45)
inner_light.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (*linear_color(PALETTE['light']),1)
inner_light.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 2.5
pearl = material('Door_StudioPearl', (.81,.86,.86), rough=.3)
assets = {}
collection = None
root = None

def add(obj, name, mat=None, parent=None):
    obj.name = name
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
    assets[root.name].append(obj)
    return obj

def mesh(name, verts, faces, mat, parent, bevel=.018):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    add(obj, name, mat, parent)
    if bevel:
        mod = obj.modifiers.new('Soft cast edges', 'BEVEL')
        mod.width = bevel; mod.segments = 3
        mod = obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    return obj

def outline(points, steps=10, angular=False):
    if angular:
        return points
    sampled = []
    n = len(points)
    for i in range(n):
        p0,p1,p2,p3 = [Vector(points[j % n]) for j in (i-1,i,i+1,i+2)]
        for j in range(steps):
            t = j/steps
            q = .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
            sampled.append(tuple(q))
    return sampled

def inset(points, sx, sy, cy):
    return [(x*sx, cy+(z-cy)*sy) for x,z in points]

def ring(points, inside, mat, name='Fixed_GlassFrame', depth=.13, bevel=.045):
    n=len(points)
    verts=[(x,y,z) for y in (-depth,depth) for loop in (points,inside) for x,z in loop]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    obj=mesh(name,verts,faces,mat,root,bevel)
    for polygon in obj.data.polygons:
        polygon.use_smooth = n > 20
    obj.modifiers['Soft cast edges'].segments=5
    return obj

def frame_details(points, inside):
    # Both faces are finished: randomized doors can be approached from either side.
    def between(t):
        return [(x+(ix-x)*t,z+(iz-z)*t) for (x,z),(ix,iz) in zip(points,inside)]
    # Pull the liner slightly into the aperture, avoiding coincident inner walls
    # with the ceramic (which otherwise shimmer as the camera moves).
    cy=(min(z for _,z in inside)+max(z for _,z in inside))/2
    ring(between(.80), inset(inside,.989,.994,cy), gold, 'Fixed_ChampagneReveal', .134, .006)
    for side,suffix in [(-1,'Front'),(1,'Back')]:
        line('Fixed_InnerLight_'+suffix,[(x,side*.141,z) for x,z in between(.89)],.005,inner_light,root,True)

def slab(points, mat, pivot):
    n=len(points);depth=.045
    verts=[(x,y,z) for y in (-depth,depth) for x,z in points]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    obj=mesh('Moving_GlassLeaf',verts,faces,mat,pivot,.022)
    obj['door_role']='leaf'
    return obj

def line(name, points, radius, mat, parent, cyclic=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D'
    data.bevel_depth=radius;data.bevel_resolution=2;data.resolution_u=1
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    spline.use_cyclic_u=cyclic
    obj=bpy.data.objects.new(name,data);collection.objects.link(obj)
    return add(obj,name,mat,parent)

def left_at(points, z):
    intersections=[]
    for i,(x1,z1) in enumerate(points):
        x2,z2=points[(i+1)%len(points)]
        if min(z1,z2)<=z<max(z1,z2):
            intersections.append(x1+(x2-x1)*(z-z1)/(z2-z1))
    return min(intersections) if intersections else min(x for x,_ in points)

studies = [
    dict(id='melt', color=(.64,.84,.82), points=[(-.72,.12),(.53,.12),(.72,.48),(.58,1.30),(.96,2.54),(.64,3.22),(-.10,3.40),(-.63,2.95),(-.83,2.10),(-.60,1.12)], handle=(.48,1.40)),
    dict(id='seed', color=(.76,.84,.60), points=[(-.25,.12),(.55,.48),(.95,1.25),(1.04,2.14),(.70,3.52),(-.06,3.08),(-.76,2.40),(-.95,1.58),(-.73,.70)], handle=(.50,1.46)),
    dict(id='fault', color=(.66,.76,.90), points=[(-.94,.12),(.60,.12),(1.01,1.09),(.59,1.39),(1.02,3.40),(-.20,3.10),(-1.01,2.43),(-.69,1.39),(-1.02,.92)], handle=(.41,1.95), angular=True),
    dict(id='hourglass', color=(.83,.69,.85), points=[(-.87,.12),(.60,.12),(1.01,.46),(.65,1.12),(.17,1.62),(.36,2.10),(.80,2.72),(.43,3.28),(-.22,3.39),(-.94,2.98),(-.54,2.23),(-.30,1.61),(-.78,.94)], handle=(.18,2.28)),
    dict(id='cloud', color=(.86,.78,.62), points=[(-.91,.15),(.33,.12),(.77,.48),(1.26,.91),(1.32,1.50),(.93,1.84),(1.02,2.42),(.54,2.85),(-.02,2.65),(-.58,2.94),(-1.14,2.62),(-1.12,2.13),(-1.47,1.70),(-1.30,1.04),(-.91,.78)], handle=(.87,1.31)),
    dict(id='orbit', color=(.66,.81,.90), points=[(-.47,.14),(.39,.24),(1.08,.88),(1.23,1.84),(.82,2.65),(.08,3.14),(-.67,3.03),(-1.20,2.34),(-1.31,1.40),(-.99,.65)], handle=(.81,1.55), center_pivot=True),
]
report={}
for spec in studies:
    name=spec['id']
    collection=bpy.data.collections.new('Threshold_'+name);scene.collection.children.link(collection)
    root=bpy.data.objects.new(name+'_Root',None);collection.objects.link(root)
    root['study']=name;assets[root.name]=[root]
    points=outline(spec['points'],angular=spec.get('angular',False))
    bottom=min(z for _,z in points)
    points=[(x,z-bottom+.055) for x,z in points]
    height=max(z for _,z in points);cy=height/2
    inner=inset(points,.85,.91,cy)
    leaf=inset(inner,.957,.973,cy)
    frame=material('Door_'+name+'_PearlCeramic',linear_color(PALETTE['doors'][name]['color']),rough=.25)
    frame.node_tree.nodes['Principled BSDF'].inputs['Coat Weight'].default_value=.85
    frame.node_tree.nodes['Principled BSDF'].inputs['Coat Roughness'].default_value=.14
    pane=material('Door_'+name+'_LeafGlass',(1,1,1),1,rough=.055)
    ring(points,inner,frame)
    frame_details(points,inner)
    pivot=bpy.data.objects.new('DoorPivot',None);collection.objects.link(pivot)
    pivot.location=(0 if spec.get('center_pivot') else min(x for x,_ in inner)-.035,0,cy)
    bpy.context.view_layer.update()
    add(pivot,'DoorPivot',parent=root);pivot['door_role']='pivot'
    slab(leaf,pane,pivot)
    line('Moving_PolishedEdge',[(x,-.048,z) for x,z in leaf],.009,pane,pivot,True)
    # The leaf retains an invisible animation pivot; no exposed hinge hardware.
    hx,hz=spec['handle']
    line('Moving_Pull',[(hx,-.06,hz-.14),(hx+.045,-.17,hz-.09),(hx+.05,-.18,hz+.13),(hx+.02,-.06,hz+.19)],.024,gold,pivot)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for o in assets[root.name]:o.select_set(True)
    bpy.context.view_layer.objects.active=root
    path=os.path.join(OUT,name+'.glb')
    bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,use_active_scene=True,
        export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    report[name]={'bytes':os.path.getsize(path),'height':round(height,3),'objects':len(assets[root.name]),'pivot':list(pivot.location)}

# An irregular studio constellation, with different depths and facing directions.
studio_poses = [
    ((-5.0,-.6,3.8),-.63), ((-1.7,-1.0,2.5),2.65),
    ((1.5,.8,4.9),.91), ((4.9,0,2.8),-2.38),
    ((-3.6,.6,.2),.47), ((2.5,-.6,.6),-1.12),
]
for objects,(location,yaw) in zip(assets.values(),studio_poses):
    objects[0].location=location
    objects[0].rotation_euler.z=yaw

def area(name,loc,energy,size,color,target=(0,0,3.5)):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='RECTANGLE';d.size=size;d.size_y=size*2;d.color=color
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Threshold_Key',(-5,-6,9),1700,6,(1,.95,.84))
area('Threshold_Fill',(7,-3,6),1200,5,(.73,.87,1))
area('Threshold_Rim',(0,4,8),2200,5,(1,1,1))
d=bpy.data.cameras.new('Threshold_Camera');camera=bpy.data.objects.new('Threshold_Camera',d);scene.collection.objects.link(camera)
camera.location=(.2,-25,9);target=Vector((0,0,3.9));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
d.type='ORTHO';d.ortho_scale=13.8;scene.camera=camera
scene.render.resolution_x=1500;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'door-studies.png')
scene.view_settings.view_transform='AgX'
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender/door-studies.blend'))
with open(os.path.join(OUT,'manifest.json'),'w') as f:json.dump(report,f,indent=2)
result={'exports':report,'source':bpy.data.filepath,'preserved_scenes':[s.name for s in bpy.data.scenes if s!=scene]}
