const fs=require('fs'); let html=fs.readFileSync('index.html','utf8');
html=html.replace('position: fixed; z-index: 5; top: 24px; right: 25px; display: flex; gap: 9px; align-items: center;', 'position: fixed; z-index: 5; top: 78px; right: 25px; display: flex; gap: 9px; align-items: center;');
const envCss=`
    .env-status {
      position: fixed; z-index: 5; top: 20px; right: 25px;
      display: flex; align-items: center; gap: 12px;
      max-width: min(590px, calc(100vw - 48px)); padding: 9px 13px;
      border-radius: 14px; background: var(--panel); border: 1px solid var(--panel-border);
      box-shadow: var(--shadow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      color: var(--muted); pointer-events: none;
    }
    .env-datetime { display: flex; flex-direction: column; gap: 1px; min-width: 132px; }
    .env-date { color: var(--muted); font-size: 10px; letter-spacing: .06em; white-space: nowrap; }
    .env-clock { color: var(--ink); font-size: 15px; font-weight: 700; letter-spacing: .045em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .status-divider { width: 1px; height: 28px; background: rgba(145, 203, 228, 0.20); flex: 0 0 auto; }
    .env-weather { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .weather-icon { font-size: 17px; line-height: 1; filter: drop-shadow(0 0 8px rgba(255, 218, 128, 0.25)); }
    .weather-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .hko-label { color: var(--accent); font-size: 9px; letter-spacing: .12em; white-space: nowrap; }
    #weatherText { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 11px; }
    #weatherText strong { color: var(--ink); font-size: 12px; }
    body.light-ui .env-clock { color: #082b40; }
    body.light-ui .env-date { color: #4d6877; }
    body.light-ui #weatherText { color: #4a6877; }
    body.light-ui #weatherText strong { color: #0b3146; }
    body.light-ui .status-divider { background: rgba(31, 138, 170, 0.22); }
`;
html=html.replace(/(\s*\.metric-row \{[\s\S]*?\n    \})/, (m)=>m+envCss);
html=html.replace('      .metric-row { top: 16px; right: 16px; }', '      .env-status { top: 64px; left: 16px; right: 16px; max-width: none; }\n      .env-weather { flex: 1; }\n      #weatherText { max-width: none; }\n      .metric-row { top: 122px; right: 16px; }');
const status=`  <section class="env-status" aria-label="当前日期时间与香港天文台天气">
    <div class="env-datetime">
      <span id="currentDate" class="env-date">载入日期…</span>
      <strong id="currentClock" class="env-clock">--:--:--</strong>
    </div>
    <span class="status-divider" aria-hidden="true"></span>
    <div class="env-weather">
      <span id="weatherIcon" class="weather-icon" aria-hidden="true">⛅</span>
      <div class="weather-copy">
        <span id="hkoLabel" class="hko-label">香港天文台 · 今日天气</span>
        <span id="weatherText">天气数据载入中…</span>
      </div>
    </div>
  </section>

`;
html=html.replace('  <div class="metric-row" aria-label="数据概览">', status+'  <div class="metric-row" aria-label="数据概览">');
fs.writeFileSync('index.html',html);
