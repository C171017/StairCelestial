"""Sanctuary's four native Blender sculptures, with portable glTF materials.

Run in Blender's Python console: exec(open(__file__).read()).  This creates a
new scene and leaves all pre-existing scenes and objects untouched.
"""
import bpy
import math
import os
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
import bmesh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/models/sanctuary')
os.makedirs(OUT, exist_ok=True)
scene = bpy.data.scenes.new('Sanctuary • Project sculptures')
bpy.context.window.scene = scene
scene.render.engine = 'BLENDER_EEVEE'
scene.world = bpy.data.worlds.new('Sanctuary • Pearl studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.68,.78,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45

def mat(name, rgb, metallic=0, rough=.25):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=rough
    p.inputs['Coat Weight'].default_value=.3
    p.inputs['Coat Roughness'].default_value=.18
    return m

pearl=mat('Sanctuary_PearlCeramic',(.88,.865,.80),.12,.22)
porcelain=mat('Sanctuary_Porcelain',(.965,.973,.98),.07,.18)
gold=mat('Sanctuary_ChampagneBrass',(.71,.49,.23),.84,.22)
brightgold=mat('Sanctuary_PolishedGold',(.83,.64,.36),.9,.15)
silver=mat('Sanctuary_Silver',(.64,.76,.83),.88,.2)
ink=mat('Sanctuary_Vinyl',(.018,.037,.065),.25,.25)
groove=mat('Sanctuary_RecordGrooves',(.036,.063,.093),.4,.27)
blue=mat('Sanctuary_AzureEnamel',(.075,.3,.47),.24,.19)
sage=mat('Sanctuary_SeaGlass',(.45,.68,.64),.25,.23)

assets={}; current=[]; col=None
def begin(name):
    global current,col
    current=[];assets[name]=current
    col=bpy.data.collections.new('Sanctuary_'+name);scene.collection.children.link(col)
def add(o,name,m):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o)
    if m:o.data.materials.append(m)
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    current.append(o);return o
def activate(o):
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def box(name,loc,size,m,bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=bevel;b.segments=4
    n=o.modifiers.new('Weighted studio normals','WEIGHTED_NORMAL');n.keep_sharp=True
    return add(o,name,m)
def cyl(name,loc,radius,depth,m,vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;b=o.modifiers.new('Machined edge','BEVEL');b.width=min(.017,depth/5);b.segments=3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return add(o,name,m)
def sphere(name,loc,radius,m,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=radius,location=loc)
    return add(bpy.context.object,name,m)
def torus(name,loc,major,minor,m,rot=(0,0,0),segments=64,minor_segments=8):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=minor_segments,location=loc,major_radius=major,minor_radius=minor,rotation=rot)
    return add(bpy.context.object,name,m)
def curve(name,pts,radius,m,res=12):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=res;d.bevel_depth=radius;d.bevel_resolution=3
    s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
    for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,d);col.objects.link(o);d.materials.append(m);current.append(o);return o
def link(name,a,b,r,m):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)*.5,r,(b-a).length,m,20)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def mesh(name,verts,faces,m):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);col.objects.link(o);d.materials.append(m)
    for p in d.polygons:p.use_smooth=True
    current.append(o);return o

# MUSIC — precise industrial design with a readable record silhouette.
begin('music')
box('Music_PorcelainBody',(0,0,.24),(2.5,1.9,.38),pearl,.16)
box('Music_ChampagneInlay',(0,0,.145),(2.45,1.86,.055),gold,.11)
for x in [-.9,.9]:
    for y in [-.63,.63]:cyl('Music_IsolationFoot',(x,y,.06),.14,.12,ink,32)
cyl('Music_PolishedPlatter',(-.29,0,.466),.82,.09,silver,96)
cyl('Music_Vinyl',(-.29,0,.528),.79,.036,ink,96)
for r in [.31,.35,.4,.445,.49,.535,.58,.625,.67,.715,.76]:
    torus('Music_ConcentricGroove',(-.29,0,.548),r,.0025,groove,segments=96,minor_segments=4)
cyl('Music_CenterLabel',(-.29,0,.55),.225,.008,pearl,64)
torus('Music_LabelFoil',(-.29,0,.557),.179,.0035,gold,segments=64,minor_segments=4)
cyl('Music_Spindle',(-.29,0,.58),.035,.068,silver,32)
cyl('Music_TonearmMount',(.89,.51,.49),.15,.16,gold,48)
cyl('Music_TonearmGimbal',(.89,.51,.64),.085,.15,silver,32)
curve('Music_Tonearm',[(.89,.60,.68),(.89,.33,.69),(.61,-.03,.64),(.46,-.33,.60)],.035,brightgold)
box('Music_Cartridge',(.43,-.39,.588),(.12,.24,.07),ink,.025)
box('Music_Stylus',(.43,-.48,.55),(.015,.06,.04),silver,.006)
o=cyl('Music_Counterweight',(.89,.67,.69),.086,.19,ink,48);o.rotation_euler[0]=math.pi/2
cyl('Music_PowerSwitch',(1,-.7,.451),.083,.036,gold,40)
sphere('Music_StatusLight',(.82,-.71,.448),.021,sage,16,8)

# JAZZ — a continuous hollow saxophone bell, modeled in a single smooth shell.
begin('jazz')
# The centerline is sampled as a cubic Bézier curve with radii interpolated.
controls=[((-.27,0,2.03),.086),((-.32,0,1.56),.1),((-.34,0,.75),.13),((-.29,0,.35),.16),((.00,0,.20),.19),((.35,0,.39),.22),((.46,0,.75),.27),((.52,0,1.10),.43)]
def catmull(p0,p1,p2,p3,t):
    return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
samples=[]
for i in range(len(controls)-1):
    p0=Vector(controls[max(0,i-1)][0]);p1=Vector(controls[i][0]);p2=Vector(controls[i+1][0]);p3=Vector(controls[min(len(controls)-1,i+2)][0])
    for s in range(10):
        t=s/10;pos=catmull(p0,p1,p2,p3,t);rad=controls[i][1]*(1-t)+controls[i+1][1]*t;samples.append((pos,rad))
samples.append((Vector(controls[-1][0]),controls[-1][1]))
verts=[];faces=[];n=32
for side in range(2):
    for i,(pos,r) in enumerate(samples):
        tangent=samples[min(i+1,len(samples)-1)][0]-samples[max(i-1,0)][0];tangent.normalize()
        across=Vector((0,1,0));right=tangent.cross(across).normalized()
        r=max(.02,r-(.024 if side else 0))
        for j in range(n):
            a=j*2*math.pi/n;v=pos+(math.cos(a)*across+math.sin(a)*right)*r;verts.append(tuple(v))
    off=side*len(samples)*n
    for i in range(len(samples)-1):
        for j in range(n):
            f=(off+i*n+j,off+i*n+(j+1)%n,off+(i+1)*n+(j+1)%n,off+(i+1)*n+j)
            faces.append(tuple(reversed(f)) if side else f)
off=len(samples)*n
for i in [0,len(samples)-1]:
    for j in range(n):faces.append((i*n+j,i*n+(j+1)%n,off+i*n+(j+1)%n,off+i*n+j))
mesh('Jazz_ContinuousBell',verts,faces,gold)
end,t=samples[-1];lip=torus('Jazz_RolledBellRim',end,.418,.022,brightgold,segments=64)
lip.rotation_euler=(samples[-1][0]-samples[-2][0]).to_track_quat('Z','Y').to_euler()
curve('Jazz_SwanNeck',[(-.27,0,2.01),(-.18,0,2.22),(.04,0,2.27),(.19,0,2.20)],.07,brightgold)
o=box('Jazz_EboniteMouthpiece',(.24,0,2.15),(.30,.12,.12),ink,.045);o.rotation_euler[1]=.4
curve('Jazz_KeySpine',[(-.43,-.125,.66),(-.43,-.12,1.14),(-.4,-.09,1.7)],.018,silver)
for i,z in enumerate([.73,.94,1.16,1.38,1.59]):
    x=-.32+.035*(z-1)
    o=cyl('Jazz_PearlKey',(x,-.139,z),.073,.022,porcelain,32);o.rotation_euler[0]=math.pi/2
    link('Jazz_KeyBridge',(x-.12,-.13,z+.03),(x,-.14,z),.012,silver)
for z in [.82,1.25,1.7]:
    o=torus('Jazz_BodyCollar',(-.32,0,z),.113,.012,brightgold,segments=40)

# ATLAS — cartographic object, ivory continents on an azure enamel globe.
begin('atlas')
C=Vector((0,0,1.3));R=.84
sphere('Atlas_AzureGlobe',C,R,blue,64,32)
def geo(lon,lat,r=R+.009):
    a,b=math.radians(lon),math.radians(lat);return C+Vector((math.cos(b)*math.sin(a),-math.cos(b)*math.cos(a),math.sin(b)))*r
continents=[
 [(-168,65),(-135,72),(-105,68),(-78,55),(-60,48),(-80,25),(-91,18),(-108,29),(-124,48),(-153,57)],
 [(-80,10),(-59,7),(-36,-7),(-46,-26),(-65,-54),(-74,-35),(-79,-12)],
 [(-17,33),(6,37),(30,31),(45,13),(38,-17),(20,-35),(9,-29),(-4,-1),(-16,11)],
 [(-11,36),(-4,56),(28,71),(60,64),(82,75),(135,66),(173,56),(141,35),(122,10),(105,-4),(84,8),(64,24),(39,34)],
 [(112,-12),(132,-10),(154,-27),(147,-39),(122,-35),(113,-23)],
 [(-55,59),(-25,65),(-35,82),(-60,80)],
 [(44,-13),(50,-16),(48,-25),(44,-22)]
]
for ci,poly in enumerate(continents):
    # Small spherical triangles keep raised land close to the sphere.
    vv=[];ff=[]
    triangles=tessellate_polygon([[Vector((p[0],p[1],0)) for p in poly]])
    for triangle in triangles:
        A,B,D=[Vector(poly[index]) for index in triangle]
        for a in range(12):
            for b in range(12-a):
                coords=[A+(B-A)*(a/12)+(D-A)*(b/12),A+(B-A)*((a+1)/12)+(D-A)*(b/12),A+(B-A)*(a/12)+(D-A)*((b+1)/12)]
                idx=len(vv);vv.extend(tuple(geo(*p,R+.012)) for p in coords);ff.append((idx,idx+1,idx+2))
                if a+b<11:
                    p=A+(B-A)*((a+1)/12)+(D-A)*((b+1)/12);vv.append(tuple(geo(*p,R+.012)));ff.append((idx+1,idx+3,idx+2))
    land=mesh('Atlas_PearlContinent_'+str(ci),vv,ff,porcelain)
    bm=bmesh.new();bm.from_mesh(land.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(land.data);bm.free()
for lat in [-45,0,45]:
    torus('Atlas_Latitude',C+Vector((0,0,R*math.sin(math.radians(lat)))),R*math.cos(math.radians(lat)),.005,silver,segments=96,minor_segments=4)
o=torus('Atlas_MeridianGimbal',C,1.025,.036,brightgold,(math.pi/2,.32,0),segments=96)
link('Atlas_Axis',(-.335,0,.29),(.335,0,2.31),.024,silver)
curve('Atlas_Cradle',[(-.34,0,.28),(-.25,0,.18),(0,0,.15)],.055,gold)
cyl('Atlas_PearlBase',(0,0,.055),.42,.11,pearl)
torus('Atlas_BaseTrim',(0,0,.061),.41,.009,gold)

# NETWORK — open, balanced constellation with a distinct circular silhouette.
begin('network')
nodes=[(-.94,0,.55),(-.88,.13,1.45),(-.43,.05,2.12),(.36,.1,2.25),(.97,.0,1.68),(1.04,-.05,.77),(.48,.08,.22),(-.26,0,.12),(-.19,-.18,1.14),(.35,.38,1.45),(.19,-.33,.69)]
edges=[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,0),(8,0),(8,1),(8,2),(8,9),(8,10),(9,3),(9,4),(9,5),(10,5),(10,6),(10,7)]
for i,(a,b) in enumerate(edges):link('Network_Connection_'+str(i),nodes[a],nodes[b],.016,gold)
for i,p in enumerate(nodes):
    r=.123 if i<8 else .185
    sphere('Network_Peer_'+str(i),p,r,porcelain if i%3 else sage,24,16)
    torus('Network_NodeBand_'+str(i),p,r*.995,.011,brightgold,rot=(math.pi/2,0,0),segments=40,minor_segments=6)

# Bake modifier results and join by material to keep draw calls modest, while
# retaining semantic material names for browser overrides.
report={}
for key,objects in assets.items():
    for o in objects:
        activate(o)
        if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
        for mod in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.update()
    points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
    lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
    shift=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
    factor=min(1,2.5/max(hi.x-lo.x,hi.y-lo.y,hi.z-lo.z))
    for o in objects:o.location=(o.location+shift)*factor;o.scale*=factor
    by_material={}
    for o in objects:by_material.setdefault(o.data.materials[0].name,[]).append(o)
    merged=[]
    for material,group in by_material.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
        obj=bpy.context.object;obj.name=key+'_'+material
        scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');merged.append(obj)
    assets[key]=merged
    bpy.ops.object.select_all(action='DESELECT')
    for o in merged:o.select_set(True)
    bpy.context.view_layer.objects.active=merged[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,key+'.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
    report[key]={'dimensions_xyz':list((hi-lo)*factor),'meshes':len(merged),'vertices':sum(len(o.data.vertices) for o in merged),'bytes':os.path.getsize(os.path.join(OUT,key+'.glb'))}

# A source-file-only studio layout makes all four assets immediately inspectable.
for key,offset in zip(assets,[(-4.9,0,0),(-1.65,0,0),(1.65,0,0),(4.8,0,0)]):
    for o in assets[key]:o.location+=Vector(offset)
begin('studio')
box('Studio_Ground',(0,0,-.11),(200,200,.2),porcelain,.04)
def area(name,loc,energy,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
area('Studio_Key',(-3,-5,7),1700,7,(1,.9,.76))
area('Studio_Fill',(4,-2,5),1300,6,(.73,.85,1))
area('Studio_Rim',(0,4,6),2100,5,(1,.96,.88))
d=bpy.data.cameras.new('Studio_Camera');camera=bpy.data.objects.new('Studio_Camera',d);scene.collection.objects.link(camera)
camera.location=(4,-15,9);camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=13.2;scene.camera=camera
scene.render.resolution_x=1600;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'studio-preview.png')
scene.view_settings.view_transform='AgX'
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender/sanctuary-assets.blend'))
result={'exports':report,'source':bpy.data.filepath,'preserved_other_scenes':[s.name for s in bpy.data.scenes if s!=scene]}
