import { renderExercises } from './NumaRender.js';
import { createSpinner } from './numaSpinners.js';

const speedLabels = ['1H', '2H', '3H', '4H', '5H', '6H'];

let termContainer = null;
let configWrapper = null;
let leftColumn = null;
let numberGrid = null;
let statsBox = null;
let runButton = null;
let pokerButton = null;
let cfgContainer = null;
let bottomRowRef = null;
let buttonRowRef = null;
let spinners = { start: null, end: null, chain: null };
let fuguesSpeed = localStorage.getItem('fuguesSpeed') || '1H';
let pokerDataPromise = null;
let pokerSelection = { outs: [], types: [] };
let pokerActive = false;
let modeButtons = new Map();
let speedButtons = [];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function mirrorExpression(expr) {
  const tokens = expr.split(/([+\-×÷])/).map(t => t.trim()).filter(Boolean);
  const values = [];
  const ops = [];
  tokens.forEach((token, idx) => {
    if (idx % 2 === 0) values.push(token);
    else ops.push(token);
  });
  values.reverse();
  ops.reverse();
  let result = values[0];
  for (let i = 0; i < ops.length; i++) {
    const val = values[i + 1];
    if (val === undefined) break;
    result += ` ${ops[i]} ${val}`;
  }
  return result;
}

function evaluateExpression(expr) {
  const jsExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
  try {
    const value = Function(`"use strict";return (${jsExpr});`)();
    return Number.isFinite(value) ? value : null;
  } catch (err) {
    console.error('Error evaluando expresión', expr, err);
    return null;
  }
}

function formatNumeric(value) {
  if (value === null || value === undefined) return '';
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.0+$/,'').replace(/0+$/,'');
}

function calc(current, op, operand) {
  switch (op) {
    case '+': return current + operand;
    case '-': return current - operand;
    case '×': return current * operand;
    case '÷': return operand === 0 ? null : current / operand;
    default: return null;
  }
}

function getActiveOperations() {
  if (!leftColumn) return [];
  return Array.from(leftColumn.querySelectorAll('button.numa-btn.active')).map(btn => btn.dataset.op);
}

function getSelectedNumbers() {
  if (!numberGrid) return [];
  return Array.from(numberGrid.querySelectorAll('button.numa-num-btn.active')).map(btn => Number(btn.textContent));
}

function getModes() {
  return Array.from(modeButtons.entries())
    .filter(([, btn]) => btn.classList.contains('active'))
    .map(([mode]) => mode);
}

function clampChain(value) {
  if (Number.isNaN(value) || value < 2) return 2;
  return Math.min(value, 4);
}

function readSpinners() {
  const start = Math.max(1, Number(spinners.start.value) || 1);
  const end = Math.max(start, Number(spinners.end.value) || start);
  const chain = clampChain(Number(spinners.chain.value) || 2);
  spinners.start.value = String(start);
  spinners.end.value = String(end);
  spinners.chain.value = String(chain);
  return { start, end, chain };
}

function enforceChainRules() {
  const { chain } = readSpinners();
  const randomBtn = modeButtons.get('Random');
  const surgesBtn = modeButtons.get('Surges');

  if (chain >= 3) {
    if (surgesBtn) {
      surgesBtn.classList.remove('active');
      surgesBtn.disabled = true;
      surgesBtn.classList.add('disabled');
    }
    if (randomBtn) {
      randomBtn.classList.add('active');
      randomBtn.disabled = true;
      randomBtn.classList.add('disabled');
    }
  } else {
    if (surgesBtn) {
      surgesBtn.disabled = false;
      surgesBtn.classList.remove('disabled');
    }
    if (randomBtn) {
      randomBtn.disabled = false;
      randomBtn.classList.remove('disabled');
    }
  }
}

function updateFuguesSpeedButtons(active) {
  speedButtons.forEach(btn => {
    btn.disabled = !active;
    btn.classList.toggle('disabled', !active);
    btn.classList.toggle('active', btn.dataset.speed === fuguesSpeed && active);
  });
}

function updateRunButtonState() {
  const ops = getActiveOperations();
  const nums = getSelectedNumbers();
  const pokerReady = pokerActive && pokerSelection.outs.length > 0 && pokerSelection.types.length > 0;
  const ready = (ops.length > 0 && nums.length > 0) || pokerReady;
  if (runButton) {
    runButton.disabled = !ready;
    runButton.classList.toggle('disabled', !ready);
  }
  updateStats();
}

function updateStats() {
  if (!statsBox) return;
  const ops = getActiveOperations().length;
  const nums = getSelectedNumbers().length;
  const { start, end, chain } = readSpinners();
  const rangeSize = end - start + 1;
  const numericCount = ops === 0 || nums === 0 ? 0 : ops * nums * Math.pow(rangeSize, Math.max(chain - 1, 1));
  const pokerCount = pokerActive ? pokerSelection.outs.length * pokerSelection.types.length : 0;
  statsBox.textContent = `NUMA: ${numericCount}  Poker: ${pokerCount}  Total: ${numericCount + pokerCount}`;
}

function generateNumericExercises(modes) {
  const ops = getActiveOperations();
  const numbers = getSelectedNumbers();
  if (ops.length === 0 || numbers.length === 0) return [];
  const { start, end, chain } = readSpinners();
  const rangeValues = [];
  for (let value = start; value <= end; value++) {
    rangeValues.push(value);
  }

  const expressions = [];
  const build = (depth, currentValue, exprParts) => {
    if (depth === chain - 1) {
      expressions.push(exprParts.join(' '));
      return;
    }
    for (const op of ops) {
      for (const val of rangeValues) {
        const result = calc(currentValue, op, val);
        if (result === null || !Number.isFinite(result)) continue;
        build(depth + 1, result, [...exprParts, op, val]);
      }
    }
  };

  for (const base of numbers) {
    build(0, base, [base]);
  }

  let finalExpressions = expressions;
  if (modes.includes('Mirror')) {
    finalExpressions = finalExpressions.map(mirrorExpression);
  }
  if (modes.includes('Surges')) {
    finalExpressions = finalExpressions.slice().sort((a, b) => {
      const av = Math.abs(evaluateExpression(a) ?? 0);
      const bv = Math.abs(evaluateExpression(b) ?? 0);
      return av - bv;
    });
  }

  const templates = [];
  for (const expr of finalExpressions) {
    const result = evaluateExpression(expr);
    if (result === null) continue;
    templates.push({
      kind: 'numeric',
      prompt: `${expr} =`,
      answer: formatNumeric(result),
      numericAnswer: result
    });
  }
  return templates;
}

async function loadPokerData() {
  if (!pokerDataPromise) {
    pokerDataPromise = fetch('./potOdds.json')
      .then(resp => {
        if (!resp.ok) throw new Error('No se pudo cargar potOdds.json');
        return resp.json();
      })
      .catch(err => {
        pokerDataPromise = null;
        console.error(err);
        throw err;
      });
  }
  return pokerDataPromise;
}

function buildPokerTemplate(out, typeKey, data, meta) {
  const typeMap = {
    percent_flop_turn: { label: 'Flop→Turn (%)', path: ['flop_turn', 'percent'], format: v => Number(v).toFixed(meta.precision.percent_dp) },
    percent_turn_river: { label: 'Turn→River (%)', path: ['turn_river', 'percent'], format: v => Number(v).toFixed(meta.precision.percent_dp) },
    percent_flop_river: { label: 'Flop→River (%)', path: ['flop_river', 'percent'], format: v => Number(v).toFixed(meta.precision.percent_dp) },
    odds_flop_turn: { label: 'Flop→Turn (odds)', path: ['flop_turn', 'odds_display'], format: v => String(v) },
    odds_turn_river: { label: 'Turn→River (odds)', path: ['turn_river', 'odds_display'], format: v => String(v) },
    odds_flop_river: { label: 'Flop→River (odds)', path: ['flop_river', 'odds_display'], format: v => String(v) },
    percent_to_odds: { label: 'Convierte % → odds', path: ['flop_turn', 'percent'], format: v => ((100 - Number(v)) / Number(v)).toFixed(meta.precision.odds_dp) },
    odds_to_percent: { label: 'Convierte odds → %', path: ['flop_turn', 'odds_against'], format: v => (100 / (Number(v) + 1)).toFixed(meta.precision.percent_dp) }
  };

  const cfg = typeMap[typeKey];
  if (!cfg) return null;
  const base = data[out];
  if (!base) return null;
  let value = base;
  for (const key of cfg.path) {
    value = value?.[key];
    if (value === undefined) return null;
  }
  const formatted = cfg.format ? cfg.format(value) : String(value);
  const prompt = `Outs ${out} · ${cfg.label}`;
  return {
    kind: 'text',
    prompt: `${prompt} =`,
    answer: String(formatted).replace(/\.0+$/,'').replace(/0+$/,'')
  };
}

async function generatePokerExercises() {
  if (!pokerActive) return [];
  let data;
  try {
    data = await loadPokerData();
  } catch (error) {
    alert('No se pudieron cargar los datos de Poker Train.');
    setPokerActive(false);
    return [];
  }
  const meta = data.potOdds.meta;
  const outsData = data.potOdds.outs;
  const exercises = [];
  for (const out of pokerSelection.outs) {
    for (const typeKey of pokerSelection.types) {
      const tpl = buildPokerTemplate(String(out), typeKey, outsData, meta);
      if (tpl) {
        exercises.push(tpl);
      }
    }
  }
  return exercises;
}

function setPokerActive(active) {
  pokerActive = active;
  pokerButton.classList.toggle('active', active);
  ['start', 'end', 'chain'].forEach(key => {
    const input = spinners[key];
    input.disabled = active;
    input.classList.toggle('disabled', active);
    const wrapper = input.closest('.numa-input-group');
    if (wrapper) wrapper.classList.toggle('disabled', active);
  });
  if (!active) {
    pokerSelection = { outs: [], types: [] };
  }
  enforceChainRules();
  updateRunButtonState();
}

function createPokerModal() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.zIndex = '2000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  const modal = document.createElement('div');
  modal.style.background = '#000';
  modal.style.border = '1px solid #28a746';
  modal.style.padding = '1.5rem';
  modal.style.maxHeight = '80vh';
  modal.style.overflowY = 'auto';
  modal.style.minWidth = '320px';
  modal.style.fontFamily = 'monospace';
  modal.style.color = '#28a746';

  const title = document.createElement('h3');
  title.textContent = 'Configurar Poker Train';
  title.style.marginTop = '0';
  modal.appendChild(title);

  const outsContainer = document.createElement('div');
  outsContainer.style.display = 'grid';
  outsContainer.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  outsContainer.style.gap = '0.5rem';
  modal.appendChild(outsContainer);

  for (let i = 1; i <= 20; i++) {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.25rem';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = String(i);
    input.checked = pokerSelection.outs.includes(i);
    label.appendChild(input);
    label.append(String(i));
    outsContainer.appendChild(label);
  }

  const typesContainer = document.createElement('div');
  typesContainer.style.marginTop = '1rem';
  modal.appendChild(typesContainer);

  const typesTitle = document.createElement('p');
  typesTitle.textContent = 'Tipos de pregunta';
  typesContainer.appendChild(typesTitle);

  const typeList = document.createElement('div');
  typeList.style.display = 'grid';
  typeList.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  typeList.style.gap = '0.5rem';
  typesContainer.appendChild(typeList);

  const typeLabels = {
    percent_flop_turn: 'Flop→Turn (%)',
    percent_turn_river: 'Turn→River (%)',
    percent_flop_river: 'Flop→River (%)',
    odds_flop_turn: 'Flop→Turn (odds)',
    odds_turn_river: 'Turn→River (odds)',
    odds_flop_river: 'Flop→River (odds)',
    percent_to_odds: '% a odds',
    odds_to_percent: 'odds a %'
  };

  Object.entries(typeLabels).forEach(([key, labelText]) => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.25rem';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = key;
    input.checked = pokerSelection.types.includes(key);
    label.appendChild(input);
    label.append(labelText);
    typeList.appendChild(label);
  });

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '0.5rem';
  actions.style.marginTop = '1rem';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'numa-btn';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'numa-btn';
  saveBtn.type = 'button';
  saveBtn.textContent = 'Aceptar';
  saveBtn.addEventListener('click', () => {
    const selectedOuts = Array.from(outsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(el => Number(el.value));
    const selectedTypes = Array.from(typeList.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
    if (selectedOuts.length === 0 || selectedTypes.length === 0) {
      alert('Selecciona al menos un out y un tipo de pregunta.');
      return;
    }
    pokerSelection = { outs: selectedOuts, types: selectedTypes };
    setPokerActive(true);
    document.body.removeChild(overlay);
  });

  actions.append(cancelBtn, saveBtn);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  return overlay;
}

function handlePokerClick() {
  if (pokerActive) {
    setPokerActive(false);
    updateRunButtonState();
    return;
  }
  loadPokerData()
    .then(() => {
      const modal = createPokerModal();
      document.body.appendChild(modal);
    })
    .catch(() => {
      alert('No se pudieron cargar los datos de Poker Train.');
    });
}

function attachListeners() {
  leftColumn.querySelectorAll('button.numa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    });
  });

  numberGrid.querySelectorAll('button.numa-num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    });
  });

  spinners.chain.addEventListener('input', () => {
    enforceChainRules();
    updateRunButtonState();
  });
  spinners.start.addEventListener('input', () => {
    readSpinners();
    updateRunButtonState();
  });
  spinners.end.addEventListener('input', () => {
    readSpinners();
    updateRunButtonState();
  });

  modeButtons.forEach((btn, mode) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const wasActive = btn.classList.toggle('active');
      if (mode === 'Random' && wasActive) {
        const surges = modeButtons.get('Surges');
        if (surges) {
          surges.classList.remove('active');
        }
      }
      if (mode === 'Surges' && wasActive) {
        const random = modeButtons.get('Random');
        if (random) {
          random.classList.remove('active');
        }
      }
      if (mode === 'Fugues') {
        updateFuguesSpeedButtons(btn.classList.contains('active'));
      }
      updateRunButtonState();
    });
  });

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      speedButtons.forEach(other => other.classList.remove('active'));
      btn.classList.add('active');
      fuguesSpeed = btn.dataset.speed;
      localStorage.setItem('fuguesSpeed', fuguesSpeed);
    });
  });

  pokerButton.addEventListener('click', handlePokerClick);
}

function hideConfiguration() {
  if (configWrapper && configWrapper.parentElement) {
    configWrapper.parentElement.removeChild(configWrapper);
  }
}

function showConfiguration() {
  if (!termContainer) return;
  termContainer.innerHTML = '';
  if (configWrapper) {
    termContainer.appendChild(configWrapper);
  }
  enforceChainRules();
  updateRunButtonState();
}

async function startSession() {
  const modes = getModes();
  const numericExercises = generateNumericExercises(modes);
  const pokerExercises = await generatePokerExercises();
  const combined = [...numericExercises, ...pokerExercises];

  if (combined.length === 0) {
    alert('Selecciona ejercicios antes de comenzar.');
    return;
  }

  const shouldShuffle = modes.includes('Random') || pokerExercises.length > 0;

  hideConfiguration();

  renderExercises(combined, {
    shuffle: shouldShuffle,
    fuguesSpeed,
    onExit: () => {
      showConfiguration();
    }
  });
}

export function init(container) {
  container.innerHTML = '';

  const term = document.createElement('div');
  term.id = 'numa-terminal';
  term.className = 'numa-terminal';
  container.appendChild(term);

  termContainer = term;

  configWrapper = document.createElement('div');
  configWrapper.className = 'numa-config-wrapper';
  term.appendChild(configWrapper);

  cfgContainer = document.createElement('div');
  cfgContainer.className = 'numa-cfg-container';
  configWrapper.appendChild(cfgContainer);

  leftColumn = document.createElement('div');
  leftColumn.className = 'numa-cfg-col';
  cfgContainer.appendChild(leftColumn);

  const topOps = document.createElement('div');
  topOps.className = 'numa-cfg-row';
  leftColumn.appendChild(topOps);

  ['+', '-'].forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.dataset.op = op;
    btn.className = 'numa-btn';
    topOps.appendChild(btn);
  });

  const bottomOps = document.createElement('div');
  bottomOps.className = 'numa-cfg-row';
  leftColumn.appendChild(bottomOps);

  ['×', '÷'].forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.dataset.op = op;
    btn.className = 'numa-btn';
    bottomOps.appendChild(btn);
  });

  const rightColumn = document.createElement('div');
  rightColumn.className = 'numa-cfg-col';
  cfgContainer.appendChild(rightColumn);

  const modeRow = document.createElement('div');
  modeRow.className = 'numa-cfg-row';
  rightColumn.appendChild(modeRow);

  const modeOrder = ['Random', 'Mirror', 'Surges', 'Fugues'];
  const modeLabels = { Random: 'RND', Mirror: 'MRR', Surges: 'SRG', Fugues: 'FGS' };
  modeOrder.forEach(mode => {
    const btn = document.createElement('button');
    btn.textContent = modeLabels[mode];
    btn.className = 'numa-btn';
    btn.dataset.mode = mode;
    modeRow.appendChild(btn);
    modeButtons.set(mode, btn);
  });

  const speedRow = document.createElement('div');
  speedRow.className = 'numa-cfg-row speed-row';
  rightColumn.appendChild(speedRow);
  speedButtons = speedLabels.map(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.speed = label;
    btn.className = 'numa-btn disabled';
    btn.disabled = true;
    speedRow.appendChild(btn);
    return btn;
  });
  updateFuguesSpeedButtons(false);

  numberGrid = document.createElement('div');
  numberGrid.className = 'numa-scroll';
  configWrapper.appendChild(numberGrid);
  for (let i = 1; i <= 100; i++) {
    const btn = document.createElement('button');
    btn.className = 'numa-num-btn';
    btn.textContent = String(i);
    numberGrid.appendChild(btn);
  }

  bottomRowRef = document.createElement('div');
  bottomRowRef.className = 'numa-bottom';
  configWrapper.appendChild(bottomRowRef);

  const startSpinner = createSpinner('Inicio:', 'numa-start', 1);
  const endSpinner = createSpinner('Fin:', 'numa-end', 10);
  const chainSpinner = createSpinner('Chain:', 'numa-chain', 2);
  bottomRowRef.appendChild(startSpinner);
  bottomRowRef.appendChild(endSpinner);
  bottomRowRef.appendChild(chainSpinner);

  spinners = {
    start: startSpinner.querySelector('input'),
    end: endSpinner.querySelector('input'),
    chain: chainSpinner.querySelector('input')
  };

  statsBox = document.createElement('div');
  statsBox.id = 'numa-stats';
  statsBox.className = 'numa-stats';
  statsBox.textContent = 'NUMA: 0  Poker: 0  Total: 0';
  configWrapper.appendChild(statsBox);

  runButton = document.createElement('button');
  runButton.textContent = 'Comenzar';
  runButton.className = 'numa-btn disabled';
  runButton.disabled = true;
  runButton.addEventListener('click', startSession);

  pokerButton = document.createElement('button');
  pokerButton.textContent = 'Poker Train';
  pokerButton.className = 'numa-btn';

  buttonRowRef = document.createElement('div');
  buttonRowRef.className = 'numa-btn-row';
  buttonRowRef.appendChild(runButton);
  buttonRowRef.appendChild(pokerButton);
  configWrapper.appendChild(buttonRowRef);

  attachListeners();
  enforceChainRules();
  updateRunButtonState();
}
