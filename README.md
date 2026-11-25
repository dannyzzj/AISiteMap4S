# 天安数码城 · 3D 园区地图

## 直接查看

双击根目录中的：

- `天安数码城_3D地图.html`：**单文件离线版**，Three.js、地图数据与卫星影像均已内嵌，无需联网。
- `启动天安数码城3D地图.bat`：用默认浏览器打开上面的单文件。

页面支持：拖拽旋转、滚轮缩放、右键平移、俯视/透视切换、自动旋转、建筑/道路/标注/实景图层开关，以及建筑悬停和点击信息。

## Blender 导出文件

- `output/tianan_cyberpark.blend`：Blender 工程，包含 BlenderGIS 导入的 OSM 建筑与道路、卫星底图、道路铺面、园区边界、灯光和相机。
- `output/tianan_cyberpark.glb`：可直接用于其他 Web 3D 引擎或三维查看器的 GLB 场景。
- `output/tianan_cyberpark_web_preview.png`：网页端渲染预览。

## 数据与坐标

- 范围：`114.0218, 22.5298` 至 `114.0308, 22.5395`（WGS84）
- 园区边界：OpenStreetMap `way/1305353889`（天安数码城）
- 建筑：74 个 OSM 建筑体块
- 道路：189 条 OSM 道路
- 场景投影：UTM Zone 50N / `EPSG:32650`
- 建筑高度：优先使用 OSM `height`；其次按 `building:levels × 3.2 m + 1.2 m`；缺失时按建筑类型估算。仅用于三维可视化，不作为工程测量依据。

## 数据来源

- 建筑、道路、边界：© OpenStreetMap contributors，ODbL
- 卫星影像：Esri World Imagery，© Esri, Maxar, Earthstar Geographics and the GIS User Community

## 生产文件

- `data/tianan_cyberpark.geojson`：原始 OSM GeoJSON
- `data/tianan_cyberpark.osm`：供 BlenderGIS 导入的 OSM XML
- `blender_user_scripts/addons/BlenderGIS`：本地 BlenderGIS 插件
- `scripts/build_data.js`：数据整理与 OSM XML 生成
- `scripts/build_blender_scene.py`：BlenderGIS 导入、场景生成及 BLEND/GLB 导出
- `scripts/build_single_html.js`：生成单文件离线 HTML
- `index.html`、`app.js`、`assets/`、`data/map_data.js`：模块化网页版本









指标卡片支持 0.25 秒平滑过渡的悬停、按下、点击选中反馈，并在点击时派发 metriccardclick 自定义事件；工具栏提供暗色/亮色界面主题切换。



白天按钮恢复为原始基础光照；黑夜按钮保留暗色星空、距离雾和窗户/道路/边界/顶部指示灯效果。




页面右上角显示当前系统日期时间和今日天气，天气优先通过香港天文台开放数据 API（rhrread + flw）实时获取；网络不可用时显示 HKO 缓存信息。三张指标卡片位于日期天气状态条下方。

