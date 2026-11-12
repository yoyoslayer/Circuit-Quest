"""Original Circuit Crew geometry; reproducible in Blender 5.1, no external assets.

Pip is a small electrician: hard hat with a headlamp, orange work shirt, blue bib overalls,
tool belt, white mitts and brown boots. Everything is built here from primitives, then shaped:
tapered, cut flat, or peeled off another part as a thin shell, so clothes follow the body
they sit on (the overalls, belt, pockets, hair and lamp band are all shells).

Node names are grouped by prefix so the game's rig (src/render/pipRig.ts) can hang them on pivots:
  Head*    -> head            Helmet* -> hat spring (on the head)
  Torso*   -> torso (hips up)
  ArmL/R*  -> shoulder        ForeL/R*, GloveL/R* -> elbow
  LegL/R*  -> hip             ShinL/R*, BootL/R*  -> knee
Joint centres (Blender metres, z up): shoulder (+-.305, 0, 1.01), elbow (+-.335, 0, .845), hip (+-.15, 0, .60),
knee z .30, neck z 1.20, hat z 1.50. A ball of the same radius sits on both sides of each joint,
so a bend never opens a gap.
Blender is z-up with the face toward -y; glTF export turns that into y-up facing +z.
"""
import bpy, bmesh, math, os
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
out = os.path.abspath('public/models')
os.makedirs(out, exist_ok=True)

# ------------------------------------------------------------------ materials
def linear(hexcode):
    h = hexcode.lstrip('#')
    def ch(i):
        c = int(h[i:i + 2], 16) / 255
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return (ch(0), ch(2), ch(4))

def material(name, hexcode, emit=0.0):
    color = linear(hexcode)
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = .75
    if emit: b.inputs['Emission Color'].default_value = (*color, 1); b.inputs['Emission Strength'].default_value = emit
    return m

# The game picks its shader from these names: 'hat', 'gloves', 'boots' and 'eyes' are glossy, 'lens' glows.
denim = material('Pip overalls', '#3d7fd6'); trim = material('Pip overalls trim', '#2a5cad')
shirt = material('Pip shirt', '#ff9440'); shirt_dark = material('Pip shirt trim', '#e2702a')
yellow = material('Pip hard hat', '#ffcf4a'); gold = material('Pip buttons', '#ffc93c')
skin = material('Pip face', '#f6cda4'); skin_dark = material('Pip ear', '#e3a57c'); blush = material('Pip cheeks', '#f59a94')
hair = material('Pip hair', '#9a5a30'); ink = material('Pip eyes', '#1b2030'); white = material('Pip glint', '#ffffff')
mitt = material('Pip gloves', '#f7f2e6'); leather = material('Pip belt', '#8b5a2f'); pouch = material('Pip pouch', '#734523')
boot = material('Pip boots', '#7a4a29'); sole = material('Pip soles', '#262a3d')
cable = material('Pip cable coil', '#ffc629'); band = material('Pip lamp band', '#34405f'); lens = material('Pip lamp lens', '#fff0b8', 2.0)
mouth_dark = material('Pip mouth', '#5a2228'); tongue = material('Pip tongue', '#f0817f')

# ------------------------------------------------------------------ building blocks
parts = []
def only(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o

def finish(o, name, mat, keep_origin=False):
    """Names the part, bakes its scale and rotation into the mesh (so normals and outlines are true), shades it smooth."""
    o.name = name; o.data.name = name
    if mat is not None: o.data.materials.clear(); o.data.materials.append(mat)
    only(o); bpy.ops.object.transform_apply(location=not keep_origin, rotation=True, scale=True)
    for p in o.data.polygons: p.use_smooth = True
    if o not in parts: parts.append(o)
    return o

def sphere(name, loc, radii, mat, rot=(0, 0, 0), seg=32, rings=16, keep_origin=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc, rotation=rot)
    o = bpy.context.object; o.scale = radii if hasattr(radii, '__len__') else (radii,) * 3
    return finish(o, name, mat, keep_origin)

def aim(direction, axis=(0, 0, 1)):
    return Vector(axis).rotation_difference(Vector(direction).normalized()).to_euler()

def frustum(name, a, b, ra, rb, mat):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=ra, radius2=rb, depth=(b - a).length, location=(a + b) / 2, rotation=aim(b - a), end_fill_type='NOTHING')
    return finish(bpy.context.object, name, mat)

def join(name, objs, mat=None):
    for o in objs:
        if o in parts: parts.remove(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    return finish(bpy.context.object, name, mat)

def limb(name, a, b, ra, rb, mat):
    """A tapered tube with a ball at each end: one rigid segment between two joints."""
    return join(name, [sphere(name + 'a', a, ra, mat), sphere(name + 'b', b, rb, mat), frustum(name + 'c', a, b, ra, rb, mat)])

def modifier(o, kind, **settings):
    m = o.modifiers.new(kind, kind)
    for k, v in settings.items(): setattr(m, k, v)
    only(o); bpy.ops.object.modifier_apply(modifier=m.name)

def rounded(o, width, segments=3, angle=40):
    modifier(o, 'BEVEL', width=width, segments=segments, limit_method='ANGLE', angle_limit=math.radians(angle))
    modifier(o, 'WEIGHTED_NORMAL', keep_sharp=False)
    return o

def edit(o, fn):
    bm = bmesh.new(); bm.from_mesh(o.data); fn(bm); bm.normal_update(); bm.to_mesh(o.data); bm.free(); o.data.update()

def cut(bm, co, no, clear=False):
    """Slices the mesh with a plane; clear=True also drops the side the normal points to."""
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=co, plane_no=no, clear_outer=clear)

def fill(bm):
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)

def flat_cut(o, z, keep_above=True):
    """Cuts a closed part flat at height z and closes the hole."""
    edit(o, lambda bm: (cut(bm, (0, 0, z), (0, 0, -1 if keep_above else 1), True), fill(bm)))
    return o

def taper(o, zc, rz, k):
    """Widens the part below zc and narrows it above (k per unit of height, measured in rz)."""
    for v in o.data.vertices:
        f = 1 - k * (v.co.z - zc) / rz; v.co.x *= f; v.co.y *= f
    o.data.update(); return o

def shell(src, name, mat, thickness, planes, keep, bevel=None):
    """Peels a patch off `src` and gives it thickness: `planes` are cut lines, `keep(centre)` picks the faces."""
    me = src.data.copy(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    def carve(bm):
        for co, no in planes: cut(bm, co, no)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    edit(o, carve)
    modifier(o, 'SOLIDIFY', thickness=thickness, offset=1, use_rim=True, use_even_offset=True)
    finish(o, name, mat)
    return rounded(o, bevel if bevel is not None else thickness * .45)

def X(x): return ((x, 0, 0), (1, 0, 0))
def Y(y): return ((0, y, 0), (0, 1, 0))
def Z(z): return ((0, 0, z), (0, 0, 1))

def surface(src, x, z, front=True, lift=0.0):
    """The point on `src` straight in front of (or behind) x,z, and its outward normal."""
    bpy.context.view_layer.update()
    ok, loc, normal, _ = src.ray_cast(Vector((x, -2 if front else 2, z)), Vector((0, 1 if front else -1, 0)))
    assert ok, f'no surface at {x},{z} on {src.name}'
    return loc + normal * lift, normal

def around(src, angle, z, lift=0.0):
    """The point on `src` at height z in the compass direction `angle` (0 = straight behind, + toward his right), and its normal."""
    bpy.context.view_layer.update()
    d = Vector((math.sin(angle), math.cos(angle), 0))
    ok, loc, normal, _ = src.ray_cast(d * 2 + Vector((0, 0, z)), -d)
    assert ok, f'no surface at angle {angle},{z} on {src.name}'
    return loc + normal * lift, normal

def stud(name, src, x, z, radii, mat, front=True, lift=0.0, keep_origin=False):
    """A flattened blob lying on `src` at x,z (radii: across, out of the surface, up)."""
    p, n = surface(src, x, z, front, lift)
    return sphere(name, p, radii, mat, rot=aim(n, (0, -1, 0)), seg=24, rings=12, keep_origin=keep_origin)

# ------------------------------------------------------------------ torso
# A pear-shaped body in the shirt colour; the overalls are one shell peeled off it.
torso = taper(sphere('Torso', (0, 0, .88), (.3, .245, .36), shirt, seg=56, rings=32), .88, .36, .1)
WAIST, BIB, BACK = .875, 1.075, 1.02
def overalls(c):
    ax = abs(c.x)
    if c.z < WAIST: return True                                  # trousers
    if c.y < 0 and c.z < BIB and ax < .15: return True           # bib
    if c.y > 0 and c.z < BACK and ax < .15: return True          # back panel
    return .082 < ax < .15 and c.z >= BACK                       # straps, over the shoulders
shell(torso, 'TorsoOveralls', denim, .014, [Z(WAIST), Z(BIB), Z(BACK), X(.15), X(-.15), X(.082), X(-.082), Y(0)], overalls, bevel=.005)
shell(torso, 'TorsoBibPocket', trim, .022, [X(.075), X(-.075), Z(.915), Z(1.01), Y(0)], lambda c: c.y < 0 and abs(c.x) < .075 and .915 < c.z < 1.01, bevel=.006)
shell(torso, 'TorsoBackPocket', trim, .022, [X(.08), X(-.08), Z(.83), Z(.95), Y(0)], lambda c: c.y > 0 and abs(c.x) < .08 and .83 < c.z < .95, bevel=.006)
for s, n in [(-1, 'L'), (1, 'R')]:
    stud(f'TorsoButton{n}', torso, s * .115, 1.04, (.024, .012, .024), gold, lift=.016)
shell(torso, 'TorsoBelt', leather, .03, [Z(.685), Z(.755)], lambda c: .685 < c.z < .755, bevel=.008)
p, n = surface(torso, 0, .72, lift=.03)
bpy.ops.mesh.primitive_cube_add(location=p, rotation=aim(n, (0, -1, 0))); o = bpy.context.object; o.scale = (.05, .012, .042)
rounded(finish(o, 'TorsoBuckle', gold), .01)
# On the back of the belt, where the play camera looks: a tool pouch, and a coil of spare cable.
p, n = around(torso, .85, .665, lift=.05)
bpy.ops.mesh.primitive_cube_add(location=p, rotation=aim(n, (0, 1, 0))); o = bpy.context.object; o.scale = (.062, .036, .075)
rounded(finish(o, 'TorsoPouch', pouch), .02, 4)
bpy.ops.mesh.primitive_cube_add(location=p + n * .008 + Vector((0, 0, .05)), rotation=aim(n, (0, 1, 0))); o = bpy.context.object; o.scale = (.068, .042, .03)
rounded(finish(o, 'TorsoPouchFlap', leather), .016, 4)
p, n = around(torso, -.85, .63, lift=.04)
for i, (major, out_by) in enumerate([(.08, 0), (.07, .028)]):
    bpy.ops.mesh.primitive_torus_add(major_segments=40, minor_segments=14, major_radius=major, minor_radius=.02, location=p + n * out_by, rotation=aim(n))
    finish(bpy.context.object, f'TorsoCoil{i}', cable)
bpy.ops.mesh.primitive_cube_add(location=p + n * .03 + Vector((0, 0, .075)), rotation=aim(n, (0, 1, 0))); o = bpy.context.object; o.scale = (.02, .05, .022)
rounded(finish(o, 'TorsoCoilStrap', leather), .008, 3)
# Shirt collar where the head meets the body.
bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=14, major_radius=.135, minor_radius=.032, location=(0, -.005, 1.2))
o = bpy.context.object; o.scale = (1, .92, .8); finish(o, 'TorsoCollar', shirt_dark)

# ------------------------------------------------------------------ head
head = taper(sphere('Head', (0, -.01, 1.44), (.3, .275, .27), skin, seg=56, rings=32), 1.44, .27, .05)
for s, n in [(-1, 'L'), (1, 'R')]:
    sphere(f'HeadEar{n}', (s * .295, .0, 1.425), (.045, .055, .068), skin)
    sphere(f'HeadEarIn{n}', (s * .322, -.012, 1.425), (.022, .03, .04), skin_dark, seg=20, rings=10)
    # Eyes keep their own origin: the rig squashes them about it to blink.
    stud(f'HeadEye{n}', head, s * .108, 1.446, (.046, .02, .062), ink, lift=-.004, keep_origin=True)
    stud(f'HeadGlint{n}', head, s * .108 + .016, 1.474, (.016, .008, .019), white, lift=.012, keep_origin=True)
    stud(f'HeadGlintLow{n}', head, s * .108 - .014, 1.422, (.008, .005, .009), white, lift=.013, keep_origin=True)
    stud(f'HeadCheek{n}', head, s * .185, 1.375, (.046, .008, .03), blush, lift=.001)
stud('HeadNose', head, 0, 1.405, (.038, .03, .032), skin, lift=.008)
# Smile: the lower half of a ring with rounded ends, lying on the face. The rig scales it about its origin.
p, nrm = surface(head, 0, 1.345, lift=.002)
bpy.ops.mesh.primitive_torus_add(major_segments=40, minor_segments=12, major_radius=.05, minor_radius=.0095, location=(0, 0, 0), rotation=(math.pi / 2, 0, 0))
smile = finish(bpy.context.object, 'HeadMouthArc', ink)
edit(smile, lambda bm: (cut(bm, (0, 0, -.012), (0, 0, 1), True), fill(bm)))
ends = [sphere(f'HeadMouthEnd{i}', (x, 0, -.012), .0115, ink, seg=16, rings=8) for i, x in enumerate((-.0486, .0486))]
smile = join('HeadMouth', [smile] + ends, ink)
smile.location = p + Vector((0, 0, .03)); smile.rotation_euler = aim(nrm, (0, -1, 0))
only(smile); bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
# The open mouth for jumps and slingshots (the rig shows one or the other).
p, nrm = surface(head, 0, 1.335, lift=-.002)
gape = sphere('HeadMouthOpenA', (0, 0, 0), (.034, .014, .042), mouth_dark, seg=24, rings=12)
lick = sphere('HeadMouthOpenB', (0, -.006, -.02), (.022, .01, .017), tongue, seg=16, rings=8)
bpy.ops.object.select_all(action='DESELECT'); gape.select_set(True); lick.select_set(True); bpy.context.view_layer.objects.active = gape; bpy.ops.object.join()
parts.remove(lick); gape.name = 'HeadMouthOpen'; gape.location = p; gape.rotation_euler = aim(nrm, (0, -1, 0))
only(gape); bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
# Hair: a cap over the back and sides, below the hat, and a swept fringe under the brim.
HAIR_CO, HAIR_NO = Vector((0, -.07, 1.475)), Vector((0, .56, .83)).normalized()
shell(head, 'HeadHair', hair, .02, [(HAIR_CO, HAIR_NO)], lambda c: (c - HAIR_CO).dot(HAIR_NO) > 0, bevel=.009)
for i, (x, z, roll) in enumerate([(-.13, 1.553, .5), (-.035, 1.538, .22), (.07, 1.546, -.12), (.16, 1.562, -.5)]):
    p, nrm = surface(head, x, z, lift=.004)
    e = aim(nrm, (0, -1, 0))
    sphere(f'HeadFringe{i}', p, (.066, .02, .042), hair, rot=(e.x, roll, e.z), seg=20, rings=10)

# ------------------------------------------------------------------ hard hat
RIM = 1.54
dome = flat_cut(sphere('Helmet', (0, .0, RIM - .01), (.33, .32, .258), yellow, seg=48, rings=24), RIM)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=.362, depth=.03, location=(0, 0, RIM))
brim = finish(bpy.context.object, 'HelmetBrim', yellow)
for v in brim.data.vertices:                                   # a longer peak at the front
    v.co.y *= 1.14 if v.co.y < 0 else .97
rounded(brim, .013, 4)
flat_cut(sphere('HelmetRidge', (0, 0, RIM - .01), (.042, .325, .266), yellow, seg=32, rings=32), RIM)
shell(dome, 'HelmetBand', band, .006, [Z(RIM + .05), Z(RIM + .088)], lambda c: RIM + .05 < c.z < RIM + .088, bevel=.0025)
p, nrm = surface(dome, 0, RIM + .085)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.06, depth=.06, location=p + nrm * .018, rotation=aim(nrm))
rounded(finish(bpy.context.object, 'HelmetLamp', band), .012, 3)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.043, depth=.02, location=p + nrm * .05, rotation=aim(nrm))
rounded(finish(bpy.context.object, 'HelmetLens', lens), .006, 2)

# ------------------------------------------------------------------ arms and legs
for s, n in [(-1, 'L'), (1, 'R')]:
    limb(f'Arm{n}', (s * .305, 0, 1.01), (s * .335, 0, .845), .092, .08, shirt)
    limb(f'Fore{n}', (s * .335, 0, .845), (s * .345, -.01, .74), .08, .077, shirt)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=.092, depth=.055, location=(s * .345, -.012, .728))
    rounded(finish(bpy.context.object, f'Fore{n}Cuff', mitt), .024, 4)
    sphere(f'Glove{n}', (s * .347, -.02, .645), (.1, .113, .106), mitt)
    sphere(f'Glove{n}Thumb', (s * .291, -.095, .67), (.045, .045, .064), mitt, rot=(.45, 0, -s * .55), seg=24, rings=12)

    limb(f'Leg{n}', (s * .15, 0, .6), (s * .15, 0, .3), .132, .122, denim)
    limb(f'Shin{n}', (s * .15, 0, .3), (s * .15, 0, .2), .122, .127, denim)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=.142, depth=.07, location=(s * .15, 0, .215))
    rounded(finish(bpy.context.object, f'Shin{n}Cuff', trim), .03, 4)
    upper = flat_cut(sphere(f'Boot{n}a', (s * .15, -.075, .13), (.146, .225, .15), boot), .04)
    ankle = sphere(f'Boot{n}b', (s * .15, .0, .16), (.13, .135, .1), boot)
    join(f'Boot{n}', [upper, ankle], boot)
    tread = sphere(f'Boot{n}Sole', (s * .15, -.077, .13), (.158, .24, .15), sole)
    edit(tread, lambda bm: (cut(bm, (0, 0, .066), (0, 0, 1), True), fill(bm), cut(bm, (0, 0, .0), (0, 0, -1), True), fill(bm)))
    rounded(tread, .014, 3, 30)

root = bpy.data.objects.new('Pip', None); bpy.context.collection.objects.link(root)
for o in parts: o.parent = root
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'pip.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(out, 'pip.glb'), export_format='GLB')
print('Created original Pip source and GLB:', out, len(parts), 'parts', sum(len(o.data.polygons) for o in parts), 'faces')
