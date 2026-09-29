"""Original Circuit Crew geometry; reproducible in Blender 5.1, no external assets."""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
out=os.path.abspath('public/models')
os.makedirs(out,exist_ok=True)
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1)
    m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.8
    return m
blue=material('Pip • workwear',(0.09,.37,.66));yellow=material('Pip • hard hat',(.98,.64,.12))
skin=material('Pip • face',(.9,.59,.36));ink=material('Pip • boots and eyes',(.055,.07,.13));white=material('Pip • gloves',(.92,.89,.78))
def sphere(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
root=bpy.data.objects.new('Pip',None);bpy.context.collection.objects.link(root)
parts=[]
parts.append(sphere('Torso',(0,0,.87),(.34,.24,.42),blue))
parts.append(sphere('Head',(0,-.015,1.4),(.29,.26,.27),skin))
parts.append(sphere('Helmet',(0,0,1.59),(.32,.29,.16),yellow))
parts.append(sphere('Helmet brim',(0,-.06,1.52),(.36,.35,.035),yellow))
for s in [-1,1]:
    parts.append(sphere('Boot.L' if s<0 else 'Boot.R',(s*.17,-.075,.18),(.14,.23,.16),ink))
    parts.append(sphere('Leg.L' if s<0 else 'Leg.R',(s*.17,0,.4),(.12,.12,.27),blue))
    parts.append(sphere('Arm.L' if s<0 else 'Arm.R',(s*.39,0,.88),(.11,.12,.27),blue))
    parts.append(sphere('Glove.L' if s<0 else 'Glove.R',(s*.42,-.03,.64),(.13,.14,.14),white))
    parts.append(sphere('Eye',(s*.10,-.252,1.43),(.035,.025,.045),ink))
for o in parts:o.parent=root
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'pip.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'pip.glb'),export_format='GLB')
print('Created original Pip source and GLB:',out)
