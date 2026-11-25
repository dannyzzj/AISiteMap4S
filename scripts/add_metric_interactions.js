const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace("      --shadow: 0 20px 70px rgba(0, 0, 0, 0.34);\n", "      --shadow: 0 20px 70px rgba(0, 0, 0, 0.34);\n      --metric-hover: rgba(17, 44, 61, 0.94);\n      --metric-active: rgba(7, 25, 38, 0.98);\n");
html=html.replace(
"    .metric span { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; letter-spacing: .1em; }\n",
`    .metric span { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; letter-spacing: .1em; }
    .metric {
      pointer-events: auto; cursor: pointer; transform-origin: center;
      transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease, filter .25s ease, color .25s ease;
      outline: none;
    }
    .metric:hover {
      background: var(--metric-hover);
      border-color: rgba(103, 232, 255, 0.52);
      box-shadow: 0 16px 52px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(103, 232, 255, 0.12);
      transform: translateY(-2px) scale(1.025);
    }
    .metric:active {
      background: var(--metric-active);
      transform: translateY(0) scale(0.965);
      transition-duration: .12s;
    }
    .metric.metric-selected {
      border-color: rgba(143, 255, 200, 0.92);
      box-shadow: 0 0 0 2px rgba(143, 255, 200, 0.22), 0 16px 48px rgba(0, 0, 0, 0.42);
    }
    .metric.metric-clicked { animation: metricTap .26s ease; }
    .metric:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    @keyframes metricTap {
      0% { transform: scale(0.965); }
      55% { transform: scale(1.035); }
      100% { transform: scale(1); }
    }
` );
html=html.replace(
"    .metric.metric-alert span { color: #fff0e6; }\n",
`    .metric.metric-alert span { color: #fff0e6; }
    .metric.metric-alert:hover { filter: brightness(1.08) saturate(1.08); }
    .metric.metric-alert.metric-selected { box-shadow: 0 0 0 2px rgba(255, 238, 213, 0.34), 0 16px 48px rgba(255, 74, 45, 0.46); }
    body.light-ui {
      --ink: #0a2a3d;
      --muted: #4d6877;
      --panel: rgba(243, 250, 253, 0.88);
      --panel-border: rgba(25, 93, 124, 0.22);
      --shadow: 0 18px 60px rgba(24, 59, 77, 0.22);
      --metric-hover: rgba(255, 255, 255, 0.98);
      --metric-active: rgba(220, 239, 246, 0.98);
    }
    body.light-ui .title-wrap h1 { color: #082b40; text-shadow: 0 2px 18px rgba(255, 255, 255, 0.75); }
    body.light-ui .title-wrap p { color: #416978; }
    body.light-ui .toolbar button { color: #17445b; background: rgba(255, 255, 255, 0.42); }
    body.light-ui .toolbar button:hover { background: rgba(31, 138, 170, 0.13); border-color: rgba(31, 138, 170, 0.34); color: #092c40; }
    body.light-ui .toolbar button.active { background: rgba(31, 138, 170, 0.18); border-color: rgba(31, 138, 170, 0.5); color: #06293b; }
    body.light-ui .info-panel,
    body.light-ui .metric { color: #09293b; }
    body.light-ui .info-panel .detail { color: #496776; }
    body.light-ui .source-note { color: #5d7887; }
    body.light-ui .compass { background: rgba(246, 252, 255, 0.58); border-color: rgba(31, 138, 170, 0.26); color: #466879; }
    body.light-ui .hover-card { background: rgba(244, 251, 255, 0.96); border-color: rgba(31, 138, 170, 0.3); }
    body.light-ui .hover-card b { color: #09293b; }
` );
html=html.replace('<div class="metric"><b id="metricBuildings">--</b><span>出席</span></div>', '<div class="metric" data-metric="buildings" role="button" tabindex="0" aria-pressed="false"><b id="metricBuildings">--</b><span>出席</span></div>');
html=html.replace('<div class="metric"><b id="metricRoads">--</b><span>在场</span></div>', '<div class="metric" data-metric="roads" role="button" tabindex="0" aria-pressed="false"><b id="metricRoads">--</b><span>在场</span></div>');
html=html.replace('<div class="metric" id="metricAreaCard"><b id="metricArea">2</b><span>超时未出</span></div>', '<div class="metric" id="metricAreaCard" data-metric="timeout" role="button" tabindex="0" aria-pressed="false"><b id="metricArea">2</b><span>超时未出</span></div>');
const themeButton = `    <button id="btnTheme" type="button" aria-label="切换界面亮色或暗色主题">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span id="themeLabel">亮色</span>
    </button>
`;
html=html.replace('    <button id="btnReset" type="button" aria-label="重置视角">', themeButton + '    <button id="btnReset" type="button" aria-label="重置视角">');
fs.writeFileSync('index.html',html);
