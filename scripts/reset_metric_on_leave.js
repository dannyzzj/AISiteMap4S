const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
const old=`  metricCards.forEach((card) => {
    card.addEventListener('click', () => activateMetricCard(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateMetricCard(card);
      }
    });
  });
`;
const neu=`  function clearMetricSelection(card) {
    if (selectedMetricCard !== card) return;
    selectedMetricCard = null;
    card.classList.remove('metric-selected');
    card.setAttribute('aria-pressed', 'false');
    restoreOverview();
  }

  metricCards.forEach((card) => {
    card.addEventListener('click', () => activateMetricCard(card));
    card.addEventListener('mouseleave', () => clearMetricSelection(card));
    card.addEventListener('blur', () => clearMetricSelection(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateMetricCard(card);
      }
    });
  });
`;
if(!app.includes(old)) throw new Error('metric listeners block not found');
app=app.replace(old,neu); fs.writeFileSync('app.js',app);
