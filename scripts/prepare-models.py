"""Blender background conversion. Originals stay in assets/models/source/20261018.

blender -b --python scripts/prepare-models.py -- <project-root> [animal ...]
Preserves UVs, normals and PBR textures; no remeshing or texture rebaking.
"""
import bpy
import sys
import json
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]).resolve()
models = {
    'frog': ('Meshy_AI_Emerald_Marsh_Frog_1018084948_texture.glb', 100000),
    'crab': ('Meshy_AI_Copper_Crab_1018085005_texture.glb', 120000),
    'rabbit': ('Meshy_AI_Curious_Brown_Rabbit_1018085258_texture.glb', 150000),
    'marine': ('Meshy_AI_Silverfin_Glide_1018085024_texture.glb', 60000),
}
for animal in args[1:] or models:
    filename, budget = models[animal]
    source = root / 'assets/models/source/20261018' / filename
    output = root / 'assets/models' / (animal + '.glb')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    before = sum(len(p.vertices) - 2 for obj in meshes for p in obj.data.polygons)
    for obj in meshes:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        if before > budget:
            modifier = obj.modifiers.new('Web detail budget', 'DECIMATE')
            modifier.ratio = budget / before
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        for face in obj.data.polygons:
            face.use_smooth = True
    for img in bpy.data.images:
        width, height = img.size
        if max(width, height) > 2048:
            scale = 2048 / max(width, height)
            img.scale(round(width * scale), round(height * scale))
            img.pack()
    bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB',
        export_apply=True, export_image_format='WEBP', export_image_quality=92)
    after = sum(len(p.vertices) - 2 for obj in meshes for p in obj.data.polygons)
    report = {'animal': animal, 'source': filename, 'sourceBytes': source.stat().st_size,
        'runtimeBytes': output.stat().st_size, 'trianglesBefore': before,
        'trianglesAfter': after, 'textureLimit': 2048, 'textureQuality': 92}
    (root / 'assets/models/source/20261018' / (animal + '-conversion.json')).write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('MODEL_READY', json.dumps(report), flush=True)
