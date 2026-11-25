import bpy
import os
import sys
import json
import math
import random
import types
from mathutils import Vector

ROOT = r'D:\Codex\3DSiteMap'
DATA_PATH = os.path.join(ROOT, 'data', 'map_data.json')
OSM_PATH = os.path.join(ROOT, 'data', 'tianan_cyberpark.osm')
SATELLITE_PATH = os.path.join(ROOT, 'assets', 'satellite.png')
OUT_BLEND = os.path.join(ROOT, 'output', 'tianan_cyberpark.blend')
OUT_GLB = os.path.join(ROOT, 'output', 'tianan_cyberpark.glb')
OUT_PREVIEW = os.path.join(ROOT, 'output', 'tianan_cyberpark_preview.png')

with open(DATA_PATH, 'r', encoding='utf-8') as f:
    DATA = json.load(f)

CENTER = DATA['meta']['center']
W = DATA['meta']['widthMeters']
H = DATA['meta']['heightMeters']
M_LON = 111320 * math.cos(math.radians(CENTER['lat']))
M_LAT = 110540

def project(coord):
    return ((coord[0] - CENTER['lon']) * M_LON, (coord[1] - CENTER['lat']) * M_LAT)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                try:
                    datablocks.remove(block)
                except Exception:
                    pass

def ensure_collection(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c

def move_to_collection(obj, collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)

def make_material(name, color, roughness=0.7, metallic=0.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    if bsdf is None:
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        out = nodes.get('Material Output') or nodes.new('ShaderNodeMaterialOutput')
        links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (*emission, 1.0)
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = (*emission, 1.0)
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = emission_strength
    mat.diffuse_color = (*color, 1.0)
    return mat

def add_satellite_plane(collection):
    img = bpy.data.images.load(SATELLITE_PATH, check_existing=True)
    mat = bpy.data.materials.new('Satellite_WorldImagery')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Linear'
    links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Emission Color' in bsdf.inputs:
        links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 0.16
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, -0.25))
    plane = bpy.context.object
    plane.name = 'Satellite_Imagery_Georeferenced'
    plane.scale = (W, H, 1)
    plane.data.materials.append(mat)
    move_to_collection(plane, collection)
    plane['extent_m'] = [W, H]
    plane['bbox_wgs84'] = [DATA['meta']['bbox']['west'], DATA['meta']['bbox']['south'], DATA['meta']['bbox']['east'], DATA['meta']['bbox']['north']]
    plane['source'] = 'Esri World Imagery'
    return plane

def add_road_mesh(collection):
    major_verts, major_faces = [], []
    local_verts, local_faces = [], []
    path_verts, path_faces = [], []
    widths = {
        'motorway':18,'motorway_link':10,'trunk':17,'trunk_link':9,
        'primary':14,'primary_link':8,'secondary':11,'secondary_link':7,
        'tertiary':9,'tertiary_link':6,'residential':6.2,'living_street':5.2,
        'unclassified':5.7,'service':4.1,'pedestrian':3.2,'footway':1.6,
        'cycleway':1.8,'path':1.35,'steps':1.4
    }
    def road_group(kind):
        if any(k in kind for k in ('motorway','trunk','primary','secondary','tertiary')):
            return 'major'
        if any(k in kind for k in ('footway','cycleway','path','steps','pedestrian')):
            return 'path'
        return 'local'
    for road in DATA['roads']:
        ring = road.get('rings', [[]])[0]
        if len(ring) < 2:
            continue
        kind = road.get('subtype') or ''
        grp = road_group(kind)
        verts, faces = (major_verts, major_faces) if grp == 'major' else ((path_verts, path_faces) if grp == 'path' else (local_verts, local_faces))
        width = widths.get(kind, 5.0)
        z = 1.0 + max(0, min(4, float(road.get('layer') or 0))) * 2.2
        for i in range(len(ring)-1):
            x1,y1 = project(ring[i]); x2,y2 = project(ring[i+1])
            dx,dy = x2-x1, y2-y1
            ln = math.hypot(dx,dy)
            if ln < 0.2:
                continue
            nx,ny = -dy/ln*width/2, dx/ln*width/2
            base = len(verts)
            verts.extend([(x1+nx,y1+ny,z),(x1-nx,y1-ny,z),(x2-nx,y2-ny,z),(x2+nx,y2+ny,z)])
            faces.append((base,base+1,base+2,base+3))
    mats = [
        make_material('Road_Major', (0.09,0.28,0.46), 0.55, 0.05, (0.05,0.28,0.44), 0.12),
        make_material('Road_Local', (0.16,0.20,0.24), 0.8, 0.0),
        make_material('Road_Path', (0.10,0.38,0.28), 0.85, 0.0)
    ]
    for name, verts, faces, mat in [('Roads_Major', major_verts, major_faces, mats[0]), ('Roads_Local', local_verts, local_faces, mats[1]), ('Roads_Path', path_verts, path_faces, mats[2])]:
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        collection.objects.link(obj)
        obj.data.materials.append(mat)
        obj['source'] = 'OpenStreetMap'
    return len(major_faces) + len(local_faces) + len(path_faces)

def add_boundary(collection):
    ring = DATA.get('parkBoundary') or []
    if len(ring) < 2:
        return
    verts = [(project(c)[0], project(c)[1], 3.0) for c in ring]
    edges = [(i, i+1) for i in range(len(verts)-1)] + [(len(verts)-1, 0)]
    mesh = bpy.data.meshes.new('Tianan_Cyber_Park_Boundary')
    mesh.from_pydata(verts, edges, [])
    mesh.update()
    obj = bpy.data.objects.new('Tianan_Cyber_Park_Boundary', mesh)
    collection.objects.link(obj)
    mat = make_material('Boundary_Cyan', (0.05,0.75,1.0), 0.35, 0.0, (0.05,0.8,1.0), 1.5)
    obj.data.materials.append(mat)
    obj['source'] = 'OpenStreetMap way/1305353889'

def style_imported_gis(import_collection):
    building_mat = make_material('GIS_Building', (0.38,0.53,0.64), 0.72, 0.12)
    area_mat = make_material('GIS_Landuse', (0.22,0.40,0.30), 0.9, 0.0)
    road_mat = make_material('GIS_Road_Centerline', (0.18,0.55,0.78), 0.5, 0.0)
    rail_mat = make_material('GIS_Rail', (0.42,0.43,0.45), 0.6, 0.2)
    for obj in list(import_collection.objects):
        if obj.type != 'MESH':
            continue
        if obj.name.startswith('Areas'):
            obj.name = 'BlenderGIS_OSM_Areas'
            obj.data.materials.clear()
            obj.data.materials.append(building_mat)
            obj.data.materials.append(area_mat)
            groups = {g.name: g.index for g in obj.vertex_groups}
            bidx = groups.get('Tag:building', -1)
            for poly in obj.data.polygons:
                is_building = False
                if bidx >= 0:
                    for vi in poly.vertices:
                        if any(g.group == bidx for g in obj.data.vertices[vi].groups):
                            is_building = True
                            break
                poly.material_index = 0 if is_building else 1
            obj['imported_by'] = 'BlenderGIS 2.2.15'
            obj['source'] = 'OpenStreetMap via BlenderGIS'
        elif obj.name.startswith('Ways'):
            obj.name = 'BlenderGIS_OSM_Road_Centerlines'
            obj.data.materials.append(road_mat)
            obj['imported_by'] = 'BlenderGIS 2.2.15'
            obj['source'] = 'OpenStreetMap via BlenderGIS'
            obj.hide_render = True

def add_lighting_and_camera():
    scene = bpy.context.scene
    world = bpy.data.worlds.new('Tianan_World') if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.025, 0.065, 0.10, 1.0)
        bg.inputs['Strength'].default_value = 0.65
    bpy.ops.object.light_add(type='SUN', location=(-400, -300, 700))
    sun = bpy.context.object
    sun.name = 'Sun_Key'
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(24), math.radians(-28), math.radians(-35))
    bpy.ops.object.light_add(type='AREA', location=(420, 250, 420))
    fill = bpy.context.object
    fill.name = 'Sky_Fill'
    fill.data.energy = 900
    fill.data.shape = 'DISK'
    fill.data.size = 500
    fill.rotation_euler = (math.radians(28), math.radians(12), math.radians(145))
    bpy.ops.object.camera_add(location=(W*0.47, -H*0.58, max(W,H)*0.54))
    cam = bpy.context.object
    cam.name = '3D_Map_Camera'
    cam.data.lens = 52
    target = Vector((0, 25, 10))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    return cam

def add_text_label(name, text, location, size=45, color=(0.8,0.96,1.0,1.0)):
    curve = bpy.data.curves.new(name, type='FONT')
    curve.body = text
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.extrude = 0.6
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    mat = make_material(name + '_Material', color[:3], 0.4, 0.0, color[:3], 0.6)
    obj.data.materials.append(mat)
    return obj

def main():
    os.makedirs(os.path.join(ROOT, 'output'), exist_ok=True)
    reset_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.length_unit = 'METERS'
    scene.name = 'Tianan Cyber Park - Shenzhen'
    bpy.ops.preferences.addon_enable(module='BlenderGIS')
    from BlenderGIS.geoscene import GeoScene
    from BlenderGIS.operators import io_import_osm
    from BlenderGIS.operators.lib.osm import overpy
    from BlenderGIS.core.proj import reprojPt, utm

    gis_collection = ensure_collection('BlenderGIS Import')
    scene.collection.children.unlink(gis_collection)
    bpy.context.scene.collection.children.link(gis_collection)
    # BlenderGIS build() puts merged objects in the scene root; move them after import.

    api = overpy.Overpass()
    result = api.parse_xml(OSM_PATH)
    bounds = result.bounds
    lon = (bounds['minlon'] + bounds['maxlon']) / 2
    lat = (bounds['minlat'] + bounds['maxlat']) / 2
    dst_crs = utm.lonlat_to_epsg(lon, lat)
    geoscn = GeoScene(scene)
    geoscn.crs = dst_crs
    ox, oy = reprojPt(4326, dst_crs, lon, lat)
    geoscn.setOriginPrj(ox, oy)

    op = types.SimpleNamespace(
        filepath=OSM_PATH,
        featureType={'way'},
        filterTags=set(),
        useElevObj=False,
        separate=False,
        buildingsExtrusion=True,
        defaultHeight=24.0,
        levelHeight=3.2,
        randomHeightThreshold=2,
    )
    io_import_osm.OSM_IMPORT.build(op, bpy.context, result, dst_crs)

    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and obj.name in ('Areas','Ways'):
            move_to_collection(obj, gis_collection)
    style_imported_gis(gis_collection)

    presentation = ensure_collection('3D Map Presentation')
    add_satellite_plane(presentation)
    road_faces = add_road_mesh(presentation)
    add_boundary(presentation)
    cam = add_lighting_and_camera()

    label = add_text_label('Park_Name_Label', "TIAN'AN CYBER PARK", (0, 20, 150), 46)
    label.rotation_euler = (math.radians(70), 0, 0)

    scene['location'] = DATA['meta']['location']
    scene['location_en'] = DATA['meta']['locationEn']
    scene['gis_crs'] = dst_crs
    scene['gis_origin_utm'] = [ox, oy]
    scene['gis_building_count'] = DATA['meta']['buildingCount']
    scene['gis_road_count'] = DATA['meta']['roadCount']
    scene['gis_extent_m'] = [W, H]
    scene['workflow'] = 'OSM data imported with BlenderGIS; satellite basemap aligned to georeferenced extent; exported to GLB and HTML.'

    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = OUT_PREVIEW
    scene.render.film_transparent = False
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass

    # Pack the satellite texture into the blend so the result remains portable.
    try:
        bpy.ops.file.pack_all()
    except Exception as exc:
        print('PACK_WARNING', repr(exc))

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    print('SAVED_BLEND', OUT_BLEND)
    bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=False, export_apply=True, export_yup=True)
    print('SAVED_GLB', OUT_GLB)

    if os.environ.get('BLENDER_RENDER_PREVIEW') == '1':
        try:
            bpy.ops.render.render(write_still=True)
            print('SAVED_PREVIEW', OUT_PREVIEW)
        except Exception as exc:
            print('RENDER_WARNING', repr(exc))
    else:
        print('PREVIEW_SKIPPED', 'Set BLENDER_RENDER_PREVIEW=1 to render a preview.')

    print('OBJECT_COUNTS', {t: sum(1 for o in scene.objects if o.type == t) for t in ('MESH','LIGHT','CAMERA','FONT')})
    print('ROAD_FACE_COUNT', road_faces)
    print('BLENDERGIS_OBJECTS', [(o.name, o.type, len(o.data.vertices) if o.type == 'MESH' else 0) for o in gis_collection.objects])

if __name__ == '__main__':
    main()

