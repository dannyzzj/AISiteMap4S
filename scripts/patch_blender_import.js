import fs from 'fs';
let p='scripts/build_blender_scene.py';
let s=fs.readFileSync(p,'utf8');
s=s.replace("import random\n", "import random\nimport types\n");
s=s.replace("    op = io_import_osm.IMPORTGIS_OT_osm_file()\n    op.filepath = OSM_PATH\n    op.featureType = {'way'}\n    op.filterTags = set()\n    op.useElevObj = False\n    op.separate = False\n    op.buildingsExtrusion = True\n    op.defaultHeight = 24.0\n    op.levelHeight = 3.2\n    op.randomHeightThreshold = 2\n    op.build(bpy.context, result, dst_crs)\n", "    op = types.SimpleNamespace(\n        filepath=OSM_PATH,\n        featureType={'way'},\n        filterTags=set(),\n        useElevObj=False,\n        separate=False,\n        buildingsExtrusion=True,\n        defaultHeight=24.0,\n        levelHeight=3.2,\n        randomHeightThreshold=2,\n    )\n    io_import_osm.OSM_IMPORT.build(op, bpy.context, result, dst_crs)\n");
fs.writeFileSync(p,s);
