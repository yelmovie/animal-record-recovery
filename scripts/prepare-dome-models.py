"""Light copies of the animal models for the eco dome, where each animal is only ~100-200px on screen.

blender -b --python scripts/prepare-dome-models.py -- <project-root> [animal ...]
Reads assets/models/<id>.glb (the close-up observation models stay as they are) and writes
assets/models/dome/<id>.glb with fewer triangles and 512px WebP textures.
"""
import bpy
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]).resolve()
ANIMALS = ['frog', 'crab', 'duck', 'rabbit', 'butterfly', 'marine', 'camel', 'penguin']
TRIANGLES = 15000
TEXTURE = 512
out_dir = root / 'assets/models/dome'
out_dir.mkdir(parents=True, exist_ok=True)

for animal in args[1:] or ANIMALS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root / 'assets/models' / f'{animal}.glb'))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    before = sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons)
    ratio = min(1.0, TRIANGLES / max(before, 1))
    for obj in meshes:
        mod = obj.modifiers.new('dome_decimate', 'DECIMATE')
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for image in bpy.data.images:
        if image.size[0] > TEXTURE or image.size[1] > TEXTURE:
            w, h = image.size
            scale = TEXTURE / max(w, h)
            image.scale(max(1, round(w * scale)), max(1, round(h * scale)))
    after = sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons)
    target = out_dir / f'{animal}.glb'
    bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_image_format='WEBP',
                              export_image_quality=80, export_apply=True, export_animations=False)
    print(f'DOME {animal}: {before} -> {after} triangles, {target.stat().st_size // 1024} KB')
