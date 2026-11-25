const fs=require('fs'); let html=fs.readFileSync('index.html','utf8');
const css=`
    .toolbar {
      position: fixed; z-index: 6; left: 24px; bottom: 24px; display: flex; flex-wrap: wrap; gap: 8px;
      max-width: min(680px, calc(100vw - 48px)); padding: 8px; border-radius: 17px;
      background: var(--panel); border: 1px solid var(--panel-border); backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px); box-shadow: var(--shadow);
    }
    .toolbar button {
      appearance: none; border: 1px solid transparent; border-radius: 11px; padding: 9px 12px;
      background: rgba(255,255,255,.045); color: #cfeaf5; font: inherit; font-size: 12px; cursor: pointer;
      transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
      display: inline-flex; gap: 7px; align-items: center;
    }
    .toolbar button:hover { background: rgba(103,232,255,.12); border-color: rgba(103,232,255,.28); color: #fff; }
    .toolbar button:active { transform: translateY(1px); }
    .toolbar button.active { background: rgba(103,232,255,.18); border-color: rgba(103,232,255,.52); color: #fff; }
    .toolbar svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.8; }
    .info-panel {
      position: fixed; z-index: 5; right: 24px; bottom: 24px; width: min(330px, calc(100vw - 48px));
      padding: 16px 17px 14px; border-radius: 18px; background: var(--panel); border: 1px solid var(--panel-border);
      backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: var(--shadow);
      transition: opacity .22s ease, transform .22s ease;
    }
    .eyebrow { color: var(--accent); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
    .info-panel h2 { margin: 7px 0 4px; font-size: 18px; letter-spacing: .02em; }
    .info-panel .detail { min-height: 44px; color: #a9c5d2; font-size: 12px; line-height: 1.65; }
    .info-panel .detail strong { color: #eefcff; font-weight: 600; }
    .legend { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 11px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.08); }
    .legend-item { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 11px; }
    .swatch { width: 9px; height: 9px; border-radius: 3px; box-shadow: 0 0 10px currentColor; }
    .source-note { margin-top: 11px; color: #688497; font-size: 9px; line-height: 1.55; }
    .source-note a { color: #8ccfe8; text-decoration: none; }
    .hover-card {
      position: fixed; z-index: 10; pointer-events: none; opacity: 0; transform: translate(-50%, -118%);
      min-width: 150px; padding: 10px 12px; border-radius: 11px; background: rgba(4, 17, 29, .93);
      border: 1px solid rgba(103,232,255,.28); box-shadow: 0 12px 40px rgba(0,0,0,.35);
      transition: opacity .1s ease; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    }
    .hover-card.visible { opacity: 1; }
    .hover-card b { display: block; font-size: 12px; color: #fff; }
    .hover-card span { display: block; margin-top: 4px; font-size: 10px; color: var(--muted); }
    .loading {
      position: fixed; z-index: 30; inset: 0; display: grid; place-items: center;
      background: radial-gradient(circle at 50% 45%, #102b3d 0%, #07131f 52%, #040a11 100%);
      transition: opacity .6s ease, visibility .6s ease;
    }
    .loading.hidden { opacity: 0; visibility: hidden; }
    .loading-inner { text-align: center; width: min(360px, 80vw); }
    .loader-ring {
      width: 52px; height: 52px; margin: 0 auto 20px; border-radius: 50%;
      border: 1px solid rgba(103,232,255,.16); border-top-color: var(--accent); border-right-color: var(--accent-2);
      animation: spin 1.1s linear infinite; box-shadow: 0 0 30px rgba(103,232,255,.12);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading h2 { margin: 0; font-size: 18px; letter-spacing: .08em; }
    .loading p { margin: 9px 0 0; color: var(--muted); font-size: 11px; letter-spacing: .04em; }
    .loading-progress { height: 3px; width: 100%; margin-top: 20px; overflow: hidden; border-radius: 10px; background: rgba(255,255,255,.08); }
    .loading-progress::after { content: ""; display: block; width: 46%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, transparent, var(--accent), var(--accent-2), transparent); animation: scan 1.2s ease-in-out infinite; }
    @keyframes scan { from { transform: translateX(-100%); } to { transform: translateX(320%); } }
    .error-box { display: none; margin-top: 15px; padding: 12px; border-radius: 10px; color: #ffb4b4; background: rgba(255,105,105,.1); border: 1px solid rgba(255,105,105,.25); font-size: 11px; text-align: left; }
`;
html=html.replace(/\n    body\.light-ui \{/, css+'\n    body.light-ui {');
fs.writeFileSync('index.html',html);
