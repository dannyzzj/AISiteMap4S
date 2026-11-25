const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
const old=`  document.getElementById('infoTitle').textContent = D.meta.location;
  document.getElementById('infoDetail').innerHTML = \`拖拽旋转 · 滚轮缩放 · 右键平移<br>场景含 <strong>\${D.meta.buildingCount}</strong> 个建筑体块、<strong>\${D.meta.roadCount}</strong> 条道路；卫星实景覆盖约 <strong>\${(W * H / 1000000).toFixed(2)} km²</strong>。\`;

  setLighting('day');
`;
const neu=`  document.getElementById('infoTitle').textContent = D.meta.location;
  const overviewEyebrow = infoEyebrow.textContent;
  const overviewTitle = infoTitle.textContent;
  const overviewDetail = \`拖拽旋转 · 滚轮缩放 · 右键平移<br>场景含 <strong>\${D.meta.buildingCount}</strong> 个建筑体块、<strong>\${D.meta.roadCount}</strong> 条道路；卫星实景覆盖约 <strong>\${(W * H / 1000000).toFixed(2)} km²</strong>。\`;
  infoDetail.innerHTML = overviewDetail;

  const metricCards = Array.from(document.querySelectorAll('.metric[data-metric]'));
  let selectedMetricCard = null;

  function restoreOverview() {
    infoEyebrow.textContent = overviewEyebrow;
    infoTitle.textContent = overviewTitle;
    infoDetail.innerHTML = overviewDetail;
  }

  function activateMetricCard(card) {
    const isSame = selectedMetricCard === card;
    metricCards.forEach((item) => {
      item.classList.remove('metric-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    if (isSame) {
      selectedMetricCard = null;
      restoreOverview();
    } else {
      selectedMetricCard = card;
      card.classList.add('metric-selected');
      card.setAttribute('aria-pressed', 'true');
      const value = card.querySelector('b')?.textContent?.trim() || '';
      const label = card.querySelector('span')?.textContent?.trim() || '';
      infoEyebrow.textContent = '指标详情';
      infoTitle.textContent = label;
      infoDetail.innerHTML = \`当前数值 <strong>\${escapeHtml(value)}</strong><br>点击同一卡片可取消选中并返回园区总览。\`;
    }
    card.classList.remove('metric-clicked');
    void card.offsetWidth;
    card.classList.add('metric-clicked');
    setTimeout(() => card.classList.remove('metric-clicked'), 280);
    const value = card.querySelector('b')?.textContent?.trim() || '';
    const label = card.querySelector('span')?.textContent?.trim() || '';
    window.dispatchEvent(new CustomEvent('metriccardclick', { detail: { metric: card.dataset.metric, label, value } }));
  }

  metricCards.forEach((card) => {
    card.addEventListener('click', () => activateMetricCard(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateMetricCard(card);
      }
    });
  });

  const themeButton = document.getElementById('btnTheme');
  const themeLabel = document.getElementById('themeLabel');
  function setUiTheme(theme, persist = true) {
    const light = theme === 'light';
    document.body.classList.toggle('light-ui', light);
    themeButton.classList.toggle('active', light);
    themeButton.setAttribute('aria-pressed', String(light));
    themeLabel.textContent = light ? '深色' : '亮色';
    if (persist) {
      try { localStorage.setItem('tianan-ui-theme', light ? 'light' : 'dark'); } catch (error) {}
    }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('tianan-ui-theme') || 'dark'; } catch (error) {}
  setUiTheme(savedTheme, false);
  themeButton.addEventListener('click', () => {
    setUiTheme(document.body.classList.contains('light-ui') ? 'dark' : 'light');
  });

  setLighting('day');
`;
if(!app.includes(old)) throw new Error('target metric block not found');
app=app.replace(old,neu);fs.writeFileSync('app.js',app);
