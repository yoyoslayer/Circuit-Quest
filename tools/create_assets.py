"""Original Circuit Crew geometry; reproducible in Blender 5.1, no external assets.

Pip is built from smooth primitives (48x24 spheres, 48-sided cylinders). Node names are
grouped by prefix so the game's rig can hang them on pivots:
  Head*/Helmet*  -> head (Helmet* also on the hat spring)
  Torso*         -> torso (hips up)
  ArmL*/GloveL*, ArmR*/GloveR*  -> shoulders
  LegL*/BootL*, LegR*/BootR*    -> hips
Blender is z-up with the face toward -y; glTF export turns that into y-up facing +z.
"""
import bpy, math, os
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
out=os.path.abspath('public/models')
os.makedirs(out,exist_ok=True)
def material(name,color,emit=0.0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.75
    if emit:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
    return m
blue=material('Pip workwear',(0.09,.37,.66));navy=material('Pip trim',(.05,.19,.4));yellow=material('Pip hard hat',(.98,.64,.12))
skin=material('Pip face',(.9,.59,.36));blush=material('Pip cheeks',(.95,.45,.45));ink=material('Pip boots and eyes',(.055,.07,.13))
white=material('Pip gloves',(.92,.89,.78));brown=material('Pip belt',(.35,.2,.1));grey=material('Pip soles',(.35,.37,.42))
steel=material('Pip wrench',(.6,.63,.68));lens=material('Pip lamp lens',(1,.93,.6),2.0)
parts=[]
def smooth(o):
    for p in o.data.polygons:p.use_smooth=True
    return o
def sphere(name,loc,scale,mat,rot=(0,0,0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);parts.append(smooth(o));return o
def cylinder(name,loc,radius,depth,mat,rot=(0,0,0),scale=(1,1,1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);parts.append(smooth(o));return o
def torus(name,loc,major,minor,mat,rot=(0,0,0),scale=(1,1,1)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=16,major_radius=major,minor_radius=minor,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);parts.append(smooth(o));return o
def cube(name,loc,scale,mat,rot=(0,0,0),bevel=.25):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    mod=o.modifiers.new('bevel','BEVEL');mod.width=bevel;mod.segments=4;mod.limit_method='NONE'
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier='bevel');parts.append(smooth(o));return o

# Torso: rounded body, overall straps, belt with buckle and wrench, bolt badge.
sphere('Torso',(0,0,.87),(.34,.25,.42),blue)
for s,n in [(-1,'L'),(1,'R')]:cube(f'TorsoStrap{n}',(s*.14,-.215,1.02),(.035,.012,.2),navy,rot=(-.12,0,s*.08),bevel=.01)
torus('TorsoBelt',(0,0,.66),.315,.035,brown,scale=(1,.76,1))
cube('TorsoBuckle',(0,-.245,.66),(.055,.02,.042),yellow,bevel=.012)
cube('TorsoPocket',(.13,-.235,.86),(.07,.015,.06),navy,rot=(-.2,0,0),bevel=.015)
cylinder('TorsoBadge',(-.13,-.24,1.0),.045,.02,yellow,rot=(math.pi/2-.2,0,0))
cylinder('TorsoWrench',(.3,-.12,.62),.018,.24,steel,rot=(.3,.2,0));torus('TorsoWrenchHead',(.33,-.13,.75),.035,.012,steel,rot=(math.pi/2,0,0))
# Head: face, nose, ears, eyes with glints, cheeks, smile.
sphere('Head',(0,-.015,1.4),(.29,.26,.27),skin)
sphere('HeadNose',(0,-.27,1.37),(.045,.04,.04),skin)
for s,n in [(-1,'L'),(1,'R')]:
    sphere(f'HeadEar{n}',(s*.285,-.01,1.39),(.04,.05,.065),skin)
    sphere(f'HeadEye{n}',(s*.1,-.245,1.44),(.035,.022,.048),ink)
    sphere(f'HeadGlint{n}',(s*.1+.012,-.262,1.46),(.011,.008,.013),white)
    sphere(f'HeadCheek{n}',(s*.17,-.215,1.35),(.045,.015,.028),blush)
torus('HeadMouth',(0,-.255,1.315),.035,.009,ink,rot=(math.pi/2,0,0),scale=(1,1,.55))
# Hard hat: dome, brim, ridge, lamp with a glowing lens.
sphere('Helmet',(0,0,1.59),(.32,.29,.17),yellow)
cylinder('HelmetBrim',(0,-.06,1.52),.36,.04,yellow,scale=(1,.97,1))
cube('HelmetRidge',(0,0,1.72),(.035,.24,.035),yellow,bevel=.02)
cylinder('HelmetLamp',(0,-.29,1.62),.06,.06,ink,rot=(math.pi/2-.3,0,0))
cylinder('HelmetLens',(0,-.325,1.63),.045,.02,lens,rot=(math.pi/2-.3,0,0))
for s,n in [(-1,'L'),(1,'R')]:
    # Legs with rolled cuffs; boots with soles and toe caps.
    sphere(f'Leg{n}',(s*.17,0,.4),(.12,.12,.27),blue)
    torus(f'Leg{n}Cuff',(s*.17,0,.25),.1,.035,navy)
    sphere(f'Boot{n}',(s*.17,-.075,.18),(.14,.23,.16),ink)
    cube(f'Boot{n}Sole',(s*.17,-.08,.045),(.13,.21,.03),grey,bevel=.03)
    sphere(f'Boot{n}Toe',(s*.17,-.24,.14),(.1,.07,.08),grey)
    # Arms with cuffs; mitten gloves with a thumb.
    sphere(f'Arm{n}',(s*.39,0,.88),(.11,.12,.27),blue)
    torus(f'Arm{n}Cuff',(s*.41,-.02,.73),.09,.03,navy)
    sphere(f'Glove{n}',(s*.42,-.03,.64),(.13,.14,.14),white)
    sphere(f'Glove{n}Thumb',(s*.36,-.12,.68),(.05,.05,.07),white,rot=(.4,0,-s*.5))
root=bpy.data.objects.new('Pip',None);bpy.context.collection.objects.link(root)
for o in parts:o.parent=root
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'pip.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'pip.glb'),export_format='GLB')
print('Created original Pip source and GLB:',out,len(parts),'parts')
