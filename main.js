import { init as initNumaEssentialOps } from './numaEssentialOps.js';

document.addEventListener('DOMContentLoaded', () => {
  const mathPanel = document.getElementById('math-panel');

 mathPanel.style.display = 'flex';
mathPanel.style.alignItems = 'center';
mathPanel.style.justifyContent = 'center';
mathPanel.style.minHeight = '100vh';


  const topbar = document.createElement('div');
  topbar.id = 'math-topbar';
  topbar.className = 'math-topbar';

  const area = document.createElement('div');
  area.id = 'math-exercise-area';
  area.className = 'math-exercise-area';

  mathPanel.appendChild(topbar);
  mathPanel.appendChild(area);

  const modulesList = ['NUMA'];
  

  initNumaEssentialOps(area);
});
