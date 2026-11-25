const fs=require('fs'); let html=fs.readFileSync('index.html','utf8');
const interaction = `
    .metric {
      pointer-events: auto; cursor: pointer; transform-origin: center;
      transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease, filter .25s ease, color .25s ease;
      outline: none;
    }
    .metric:hover {
      background: rgba(17, 44, 61, 0.94);
      border-color: rgba(103, 232, 255, 0.52);
      box-shadow: 0 16px 52px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(103, 232, 255, 0.12);
      transform: translateY(-2px) scale(1.025);
    }
    .metric:active {
      background: rgba(7, 25, 38, 0.98);
      transform: translateY(0) scale(0.965);
      transition-duration: .12s;
    }
    .metric.metric-selected {
      border-color: rgba(143, 255, 200, 0.92);
      box-shadow: 0 0 0 2px rgba(143, 255, 200, 0.22), 0 16px 48px rgba(0, 0, 0, 0.42);
    }
    .metric.metric-clicked { animation: metricTap .26s ease; }
    .metric:focus-visible { outline: 2px solid #67e8ff; outline-offset: 3px; }
    @keyframes metricTap {
      0% { transform: scale(0.965); }
      55% { transform: scale(1.035); }
      100% { transform: scale(1); }
    }
`;
html=html.replace(/(\.metric span \{[^\r\n]*\}\r?\n)(\s*\.metric\.metric-alert \{)/, (_,a,b)=>a+interaction+b);
const light = `
    .metric.metric-alert:hover { filter: brightness(1.08) saturate(1.08); }
    .metric.metric-alert.metric-selected { box-shadow: 0 0 0 2px rgba(255, 238, 213, 0.34), 0 16px 48px rgba(255, 74, 45, 0.46); }
    body.light-ui {
      --ink: #0a2a3d;
      --muted: #4d6877;
      --panel: rgba(243, 250, 253, 0.88);
      --panel-border: rgba(25, 93, 124, 0.22);
      --shadow: 0 18px 60px rgba(24, 59, 77, 0.22);
    }
    body.light-ui .title-wrap h1 { color: #082b40; text-shadow: 0 2px 18px rgba(255, 255, 255, 0.75); }
    body.light-ui .title-wrap p { color: #416978; }
    body.light-ui .toolbar button { color: #17445b; background: rgba(255, 255, 255, 0.42); }
    body.light-ui .toolbar button:hover { background: rgba(31, 138, 170, 0.13); border-color: rgba(31, 138, 170, 0.34); color: #092c40; }
    body.light-ui .toolbar button.active { background: rgba(31, 138, 170, 0.18); border-color: rgba(31, 138, 170, 0.5); color: #06293b; }
    body.light-ui .info-panel { color: #09293b; }
    body.light-ui .info-panel .detail { color: #496776; }
    body.light-ui .info-panel .detail strong { color: #0b3146; }
    body.light-ui .source-note { color: #5d7887; }
    body.light-ui .source-note a { color: #17789a; }
    body.light-ui .compass { background: rgba(246, 252, 255, 0.58); border-color: rgba(31, 138, 170, 0.26); color: #466879; }
    body.light-ui .hover-card { background: rgba(244, 251, 255, 0.96); border-color: rgba(31, 138, 170, 0.3); }
    body.light-ui .hover-card b { color: #09293b; }
    body.light-ui .metric:not(.metric-alert) { background: rgba(246, 252, 255, 0.92); color: #0b3044; }
    body.light-ui .metric:not(.metric-alert) b { color: #007e9e; }
    body.light-ui .metric:not(.metric-alert) span { color: #4a6877; }
    body.light-ui .metric:not(.metric-alert):hover { background: rgba(255, 255, 255, 0.99); border-color: rgba(31, 138, 170, 0.44); }
    body.light-ui .metric:not(.metric-alert):active { background: rgba(219, 239, 246, 0.98); }
    body.light-ui .metric.metric-alert,
    body.light-ui .metric.metric-alert:hover { background: linear-gradient(145deg, rgba(255, 104, 72, 0.96), rgba(173, 38, 34, 0.92)); }
    body.light-ui .metric.metric-alert b,
    body.light-ui .metric.metric-alert span { color: #fff8ee; }
`;
html=html.replace(/(\.metric\.metric-alert span \{ color: #fff0e6; \}\r?\n)/, (_,a)=>a+light);
fs.writeFileSync('index.html',html);
