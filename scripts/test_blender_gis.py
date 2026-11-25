import bpy
import addon_utils
print('BLENDER_VERSION', bpy.app.version_string)
try:
    bpy.ops.preferences.addon_enable(module='BlenderGIS')
    print('BLENDERGIS_ENABLED', 'BlenderGIS' in bpy.context.preferences.addons)
except Exception as e:
    print('BLENDERGIS_ENABLE_ERROR', repr(e))
print('IMPORTGIS_OSM_FILE', hasattr(bpy.ops.importgis, 'osm_file'))
print('IMPORTGIS_GEORASTER', hasattr(bpy.ops.importgis, 'georaster'))
