const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
const marker="  document.getElementById('metricBuildings').textContent = D.meta.buildingCount;\n";
const code=`  const currentDate = document.getElementById('currentDate');
  const currentClock = document.getElementById('currentClock');
  const weatherIcon = document.getElementById('weatherIcon');
  const weatherText = document.getElementById('weatherText');
  const hkoLabel = document.getElementById('hkoLabel');
  const envStatus = document.querySelector('.env-status');

  const HKO_FALLBACK = {
    temperature: 21,
    humidity: 70,
    summary: '多云，有一两阵微雨',
    updateTime: '2026-11-19T16:02:00+08:00',
    cached: true
  };

  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  });
  const clockFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });

  function updateSystemClock() {
    const now = new Date();
    currentDate.textContent = dateFormatter.format(now);
    currentClock.textContent = clockFormatter.format(now);
  }

  function weatherSymbol(summary) {
    if (/雷/.test(summary)) return '⛈️';
    if (/雨/.test(summary)) return '🌧️';
    if (/晴/.test(summary)) return '☀️';
    if (/云|阴/.test(summary)) return '⛅';
    return '🌤️';
  }

  function paintHKOWeather(data, cached = false) {
    const temp = Number.isFinite(Number(data.temperature)) ? Math.round(Number(data.temperature)) : '--';
    const humidity = Number.isFinite(Number(data.humidity)) ? Math.round(Number(data.humidity)) : '--';
    const summary = data.summary || '天气预告暂不可用';
    weatherIcon.textContent = weatherSymbol(summary);
    weatherText.innerHTML = \`<strong>\${temp}°C</strong> · 湿度 \${humidity}% · \${escapeHtml(summary)}\`;
    const updated = data.updateTime ? new Date(data.updateTime) : new Date();
    weatherText.title = \`香港天文台｜更新于 \${updated.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}\`;
    hkoLabel.textContent = cached ? '香港天文台 · 缓存天气' : '香港天文台 · 今日天气';
    envStatus.dataset.weatherSource = cached ? 'hko-cache' : 'hko-live';
  }

  async function loadHKOWeather() {
    const base = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php';
    try {
      const [rhrResponse, forecastResponse] = await Promise.all([
        fetch(base + '?dataType=rhrread&lang=sc', { cache: 'no-store' }),
        fetch(base + '?dataType=flw&lang=sc', { cache: 'no-store' })
      ]);
      if (!rhrResponse.ok || !forecastResponse.ok) throw new Error('HKO request failed');
      const [rhr, forecast] = await Promise.all([rhrResponse.json(), forecastResponse.json()]);
      const tempRows = rhr.temperature?.data || [];
      const tempRow = tempRows.find((row) => row.place === '香港天文台') || tempRows[0] || {};
      const humidityRows = rhr.humidity?.data || [];
      const humidityRow = humidityRows.find((row) => row.place === '香港天文台') || humidityRows[0] || {};
      const summary = String(forecast.forecastDesc || forecast.generalSituation || '').split(/[。！？]/)[0];
      paintHKOWeather({
        temperature: tempRow.value,
        humidity: humidityRow.value,
        summary: summary || '天气预告暂不可用',
        updateTime: rhr.updateTime || forecast.updateTime
      }, false);
    } catch (error) {
      paintHKOWeather(HKO_FALLBACK, true);
    }
  }

  updateSystemClock();
  setInterval(updateSystemClock, 1000);
  paintHKOWeather(HKO_FALLBACK, true);
  loadHKOWeather();
  setInterval(loadHKOWeather, 10 * 60 * 1000);

`;
if(!app.includes(marker)) throw new Error('metric assignment marker not found');
app=app.replace(marker,code+marker); fs.writeFileSync('app.js',app);
