const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
const old=`  const metricAreaCard = document.getElementById('metricAreaCard');
  const metricAreaValue = Number(document.getElementById('metricArea').textContent);
  metricAreaCard.classList.toggle('metric-alert', Number.isFinite(metricAreaValue) && metricAreaValue > 0);
`;
const neu=`  const metricAreaCard = document.getElementById('metricAreaCard');
  const metricAreaElement = document.getElementById('metricArea');
  const syncTimeoutAlert = () => {
    const value = Number(metricAreaElement.textContent);
    metricAreaCard.classList.toggle('metric-alert', Number.isFinite(value) && value > 0);
  };
  new MutationObserver(syncTimeoutAlert).observe(metricAreaElement, { childList: true, characterData: true, subtree: true });
  syncTimeoutAlert();
`;
if(!app.includes(old)) throw new Error('alert block not found');
app=app.replace(old,neu);fs.writeFileSync('app.js',app);
