"""Prepare repaired, lightweight scanner models from the original textured meshes.

blender --background --factory-startup --python scripts/prepare-scanner-models.py -- [bat rabbit sparrow]
"""
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import bmesh
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'assets/models'
CONFIG = {
    'bat': ('source/20261112/bat.glb', 56000, .13, .86),
    'rabbit': ('rabbit.glb', 56000, .12, .88),
    'sparrow': ('source/20261112/sparrow.glb', 56000, .22, .86),
}


def repair_surface(mesh, animal):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    coords = [v.co for v in bm.verts]
    span = max(max(p[i] for p in coords) - min(p[i] for p in coords) for i in range(3))
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=span * .000015)
    bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=span * .000004)

    # Close small, isolated tears. Keep open silhouettes and the gaps between wing fingers.
    remaining = {edge for edge in bm.edges if edge.is_boundary}
    holes = []
    while remaining:
        seed = remaining.pop()
        ring, stack = [seed], list(seed.verts)
        ring_verts = set()
        while stack:
            vert = stack.pop()
            if vert in ring_verts:
                continue
            ring_verts.add(vert)
            for edge in vert.link_edges:
                if edge in remaining:
                    remaining.remove(edge)
                    ring.append(edge)
                    stack.append(edge.other_vert(vert))
        if len(ring) == len(ring_verts) and 3 <= len(ring) <= 72:
            extent = max(max(v.co[i] for v in ring_verts) - min(v.co[i] for v in ring_verts) for i in range(3))
            if extent < span * .048:
                holes.extend(ring)
    if holes:
        patched = bmesh.ops.holes_fill(bm, edges=holes, sides=72)['faces']
        if patched:
            bmesh.ops.triangulate(bm, faces=patched)
    else:
        patched = []

    # Tone down fine spikes more on the torso than on the silhouette.
    coords = [v.co for v in bm.verts]
    x_half = max(abs(p.x) for p in coords)
    for _ in range(8 if animal == 'bat' else 5):
        updates = []
        for vert in bm.verts:
            if not vert.link_edges or vert.is_boundary:
                continue
            x = abs(vert.co.x) / x_half
            if animal == 'bat':
                weight = .72 if x < .30 and vert.co.z < .44 else .19
            elif animal == 'sparrow':
                weight = .52 if x < .37 else .22
            else:
                weight = .53
            neighbors = [edge.other_vert(vert).co for edge in vert.link_edges]
            avg = sum(neighbors, Vector()) / len(neighbors)
            updates.append((vert, vert.co.lerp(avg, weight)))
        for vert, co in updates:
            vert.co = co
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    for face in bm.faces:
        face.smooth = True
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate(clean_customdata=False)
    mesh.update()
    return len(patched)


def image_node(shader, socket):
    node = shader.inputs[socket].links[0].from_node
    return node.inputs['Color'].links[0].from_node if node.type == 'NORMAL_MAP' else node


def eye_glints(pixels):
    # UVs measured on the eyes of the source model in the scanner's front view.
    # Paint subtle highlights directly on the texture so they follow the eye surface.
    h, w, _ = pixels.shape
    for u, v in ((.390, .759), (.247, .739)):
        cx, cy = round(u * (w - 1)), round((1 - v) * (h - 1))
        radius = 11
        left, right = max(0, cx - radius), min(w, cx + radius + 1)
        bottom, top = max(0, cy - radius), min(h, cy + radius + 1)
        patch = pixels[bottom:top, left:right, :3]
        yy, xx = np.ogrid[bottom:top, left:right]
        d = ((xx - cx) / 3.7) ** 2 + ((yy - cy) / 3.0) ** 2
        strength = .58 * np.exp(-d / 2) + .06 * np.exp(-d / 8)
        patch[:] = patch + strength[..., None] * (np.array([.72, .63, .51]) - patch)


def smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def fur_mask(mesh, animal, h, w):
    # Project a soft body-only mask into the existing UV atlas. This keeps the
    # eyes, paws and the thin silhouettes of wings and ears on their original paint.
    positions = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get('co', positions)
    positions = positions.reshape(-1, 3)
    low, high = positions.min(axis=0), positions.max(axis=0)
    x = abs(2 * (positions[:, 0] - low[0]) / (high[0] - low[0]) - 1)
    height = (positions[:, 2] - low[2]) / (high[2] - low[2])
    if animal == 'bat':
        weights = (1 - smoothstep(.20, .32, x)) * smoothstep(.17, .28, height)
        weights *= 1 - smoothstep(.61, .73, height)
    elif animal == 'sparrow':
        weights = (1 - smoothstep(.28, .49, x)) * smoothstep(.19, .34, height)
        weights *= 1 - smoothstep(.64, .78, height)
    else:
        weights = smoothstep(.10, .26, height) * (1 - smoothstep(.67, .81, height))

    mesh.calc_loop_triangles()
    uv = mesh.uv_layers.active.uv
    mask = np.zeros((h, w), dtype=np.float32)
    for tri in mesh.loop_triangles:
        a, b, c = weights[list(tri.vertices)]
        if max(a, b, c) < .01:
            continue
        (x0, y0), (x1, y1), (x2, y2) = [
            (uv[i].vector.x * w - .5, uv[i].vector.y * h - .5) for i in tri.loops
        ]
        xmin = max(0, int(np.ceil(min(x0, x1, x2))))
        xmax = min(w - 1, int(np.floor(max(x0, x1, x2))))
        ymin = max(0, int(np.ceil(min(y0, y1, y2))))
        ymax = min(h - 1, int(np.floor(max(y0, y1, y2))))
        if xmax < xmin or ymax < ymin:
            continue
        det = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(det) < 1e-8:
            continue
        yy, xx = np.ogrid[ymin:ymax + 1, xmin:xmax + 1]
        p = ((y1 - y2) * (xx - x2) + (x2 - x1) * (yy - y2)) / det
        q = ((y2 - y0) * (xx - x2) + (x0 - x2) * (yy - y2)) / det
        r = 1 - p - q
        dst = mask[ymin:ymax + 1, xmin:xmax + 1]
        np.maximum(dst, np.where((p >= -.001) & (q >= -.001) & (r >= -.001),
                                 a * p + b * q + c * r, 0), out=dst)
    return mask[..., None]


def blur(values, steps):
    for step in steps:
        for axis in (0, 1):
            values = (2 * values + np.roll(values, -step, axis) + np.roll(values, step, axis)) * .25
    return values


def soften_fur(mesh, animal, rgb):
    mask = fur_mask(mesh, animal, *rgb.shape[:2])
    # Average nearby colors only within the painted body. Mix back a portion of
    # the original high-frequency fur so the material does not become flat.
    local = blur(rgb * mask, (1, 2, 4)) / np.maximum(blur(mask, (1, 2, 4)), .002)
    mask *= {'bat': .52, 'rabbit': .36, 'sparrow': .32}[animal]
    rgb[:] += mask * (local - rgb)


def finish_material(obj, animal, normal_strength, roughness):
    for material in obj.data.materials:
        material.name = f'{animal.title()} surface'
        nodes = material.node_tree.nodes
        shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
        for name, value in [('Metallic', 0.0), ('Roughness', roughness)]:
            socket = shader.inputs[name]
            for link in list(socket.links):
                material.node_tree.links.remove(link)
            socket.default_value = value
        shader.inputs['Normal'].links[0].from_node.inputs['Strength'].default_value = normal_strength

        color_limit = 1792 if animal in ('bat', 'rabbit') else 1536
        for channel, limit in [('Base Color', color_limit), ('Normal', 768)]:
            node = image_node(shader, channel)
            image = node.image
            w, h = image.size
            scale = min(1, limit / max(w, h))
            if scale < 1:
                image.scale(round(w * scale), round(h * scale))
            if channel != 'Base Color':
                continue
            w, h = image.size
            pixels = np.empty(w * h * 4, dtype=np.float32)
            image.pixels.foreach_get(pixels)
            pixels = pixels.reshape(h, w, 4)
            rgb = pixels[:, :, :3]
            rgb[:] += .16 * (blur(rgb, (1,)) - rgb)
            soften_fur(obj.data, animal, rgb)
            if animal == 'bat':
                # Lift deep creases in the baked albedo before painting the eye catchlights.
                luminance = rgb.mean(axis=2, keepdims=True)
                rgb[:] += .02 * np.clip((luminance - .07) / .17, 0, 1) * (1 - rgb) ** 3
                eye_glints(pixels)
            image.pixels.foreach_set(pixels.ravel())
            image.update()
            image.pack()


def project_bat_back(obj):
    # The original rear of the wing membrane is almost planar. Decimation can
    # merge it into broad triangles that cross original UV islands.
    scene = bpy.context.scene
    bounds = [obj.matrix_world @ Vector(point) for point in obj.bound_box]
    low = Vector([min(p[i] for p in bounds) for i in range(3)])
    high = Vector([max(p[i] for p in bounds) for i in range(3)])
    center = (low + high) / 2
    width = (high.x - low.x) * 1.09
    height = width * 1024 / 1536

    camera = bpy.data.objects.new('Bat rear projection', bpy.data.cameras.new('Bat rear projection'))
    scene.collection.objects.link(camera)
    camera.location = (center.x, high.y + 3, center.z)
    camera.rotation_euler = Vector((0, -1, 0)).to_track_quat('-Z', 'Y').to_euler()
    right = camera.rotation_euler.to_matrix() @ Vector((1, 0, 0))
    up = camera.rotation_euler.to_matrix() @ Vector((0, 1, 0))
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = width
    scene.camera = camera

    material = obj.data.materials[0]
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    output = next(node for node in nodes if node.type == 'OUTPUT_MATERIAL')
    albedo = shader.inputs['Base Color'].links[0].from_socket
    emission = nodes.new('ShaderNodeEmission')
    links.new(albedo, emission.inputs['Color'])
    links.new(emission.outputs[0], output.inputs['Surface'])

    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 4
    scene.render.resolution_x, scene.render.resolution_y = 1536, 1024
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    with TemporaryDirectory(prefix='bat-back-') as folder:
        scene.render.filepath = str(Path(folder) / 'back.png')
        bpy.ops.render.render(write_still=True)
        texture = bpy.data.images.load(scene.render.filepath, check_existing=False)
        texture.name = 'Bat rear albedo'
        w, h = texture.size
        pixels = np.empty(w * h * 4, dtype=np.float32)
        texture.pixels.foreach_get(pixels)
        pixels = pixels.reshape(h, w, 4)
        # Pad the edge colors for bilinear filtering and small silhouette changes.
        rgb = pixels[..., :3]
        valid = pixels[..., 3:4] >= .98
        for _ in range(12):
            samples = np.zeros_like(rgb)
            count = np.zeros_like(pixels[..., :1])
            for axis in (0, 1):
                for step in (-1, 1):
                    samples += np.roll(rgb * valid, step, axis)
                    count += np.roll(valid, step, axis)
            adjacent = (~valid) & (count > 0)
            np.copyto(rgb, samples / np.maximum(count, 1), where=adjacent)
            valid |= adjacent
        pixels[..., 3] = 1
        texture.pixels.foreach_set(pixels.ravel())
        texture.update()
        texture.pack()
    links.new(shader.outputs[0], output.inputs['Surface'])
    nodes.remove(emission)
    bpy.data.objects.remove(camera, do_unlink=True)
    return texture, center, right, up, width, height, high.y


def apply_bat_back(obj, projection):
    texture, center, right, up, width, height, rear_depth = projection
    material = obj.data.materials[0].copy()
    material.name = 'Bat rear surface'
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    rear_color = nodes.new('ShaderNodeTexImage')
    rear_color.image = texture
    rear_color.extension = 'EXTEND'
    links.new(rear_color.outputs['Color'], shader.inputs['Base Color'])
    for link in list(shader.inputs['Normal'].links):
        links.remove(link)
    obj.data.materials.append(material)
    uv = obj.data.uv_layers.active.uv
    positions = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    world_normal = obj.matrix_world.to_3x3().inverted().transposed()
    rear_faces = 0
    for polygon in obj.data.polygons:
        # Repaint the near-planar rear only. Keep the wrapped UVs on the face,
        # ears and front of the wings, even where the membrane is very thin.
        if (world_normal @ polygon.normal).normalized().y < .35:
            continue
        if min(positions[i].y for i in polygon.vertices) < rear_depth - .075:
            continue
        polygon.material_index = len(obj.data.materials) - 1
        rear_faces += 1
        for loop, vertex in zip(polygon.loop_indices, polygon.vertices):
            offset = positions[vertex] - center
            uv[loop].vector = (.5 + offset.dot(right) / width, .5 + offset.dot(up) / height)
    if not rear_faces:
        raise ValueError('Could not find the bat rear faces for projection')
    print(f'Bat rear texture projected onto {rear_faces:,} faces', flush=True)


def convert(animal):
    relative, budget, normal, roughness = CONFIG[animal]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / relative), merge_vertices=True)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if len(meshes) != 1:
        raise ValueError(f'Expected one textured mesh for {animal}')
    obj = meshes[0]
    obj.name = animal.title()
    bpy.context.view_layer.objects.active = obj
    before = len(obj.data.polygons)
    back_projection = project_bat_back(obj) if animal == 'bat' else None
    reduction = obj.modifiers.new('Preserve the silhouette', 'DECIMATE')
    reduction.ratio = min(1, budget / before)
    reduction.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=reduction.name)
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    patches = repair_surface(obj.data, animal)
    finish_material(obj, animal, normal, roughness)
    if back_projection:
        apply_bat_back(obj, back_projection)
    target = MODELS / 'scan' / f'{animal}.glb'
    temp = target.with_suffix('.pending.glb')
    bpy.ops.export_scene.gltf(filepath=str(temp), export_format='GLB', export_image_format='WEBP',
                              export_image_quality=85, export_apply=True, export_animations=False)
    temp.replace(target)
    print(f'{animal}: {before:,} -> {len(obj.data.polygons):,} triangles; '
          f'{patches} repair faces; {target.stat().st_size:,} bytes', flush=True)


for animal in sys.argv[sys.argv.index('--') + 1:] or CONFIG:
    convert(animal)
