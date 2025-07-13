// 📁 mathMode/modules/numaEssentialOps.js
// Módulo "NUMA" para Math Mode: Tablas básicas interacción tipo terminal
// Se asume que `container` es el DIV `#math-exercise-area` dentro de mathModeOrquest.js

import { renderExercises } from './NumaRender.js';

let leftCol = null;
let pokerLevel = null; // ← AQUÍ

let speedButtons = [];

const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};

let currentSpeed = '1H';

// ─────────────────────────────────────────────────────────
// Teclado numérico on-screen (solo en móvil)



export function init(container) {
 
  speedButtons.length = 0;
  // ─── Ejercicios personalizados para modo Poker Train ───

  // Limpiar contenido previo
  container.innerHTML = '';

  // Crear pantalla de terminal (solo este módulo)
  const term = document.createElement('div');
term.id = 'numa-terminal';
term.className = 'numa-terminal';
container.appendChild(term);





  // ─────────────────────────────────────────────────────────
  // Contenedor principal de configuración con dos columnas
  // ─────────────────────────────────────────────────────────
  const cfgContainer = document.createElement('div');
  cfgContainer.className = 'numa-cfg-container';
  term.appendChild(cfgContainer);

  // ─────────────────────────────────────────────────────────
  // COLUMNA IZQUIERDA: suma/resta arriba, mult/div abajo
  // ─────────────────────────────────────────────────────────
  leftCol = document.createElement('div');
  leftCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(leftCol);

  // Fila superior (suma y resta)
  const leftTopRow = document.createElement('div');
  leftTopRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftTopRow);
  ['+','-'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    
    btn.className = 'numa-btn';
    btn.onclick = () => btn.classList.toggle('active');
    leftTopRow.appendChild(btn);
  });

  // Fila inferior (multiplicación y división)
  const leftBottomRow = document.createElement('div');
  leftBottomRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftBottomRow);
  ['×','÷'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'numa-btn';
    btn.onclick = () => btn.classList.toggle('active');
    leftBottomRow.appendChild(btn);
  });

  // ─────────────────────────────────────────────────────────
  // COLUMNA DERECHA: Random/Mirror/Cipher/Fugues arriba, Vanish/Surges/Pulsar/Shades abajo
  // ─────────────────────────────────────────────────────────
  const rightCol = document.createElement('div');
  rightCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(rightCol);

  // Fila superior de la derecha
  const rightTopRow = document.createElement('div');
rightTopRow.className = 'numa-cfg-row';
rightCol.appendChild(rightTopRow);

const modeLabels = {
  Random: 'RND',
  Mirror: 'MRR',
  Surges: 'SRG',
  Fugues: 'FGS'
};

['Random', 'Mirror', 'Surges', 'Fugues'].forEach(label => {
  const btn = document.createElement('button');
  btn.textContent = modeLabels[label] || label;
  btn.className = 'numa-btn';
  btn.dataset.mode = label; // ← esto es lo importante

  if (label === 'Random')  btn.id = 'random-btn';
  if (label === 'Mirror')  btn.id = 'mirror-btn';   // ← añade esto
  if (label === 'Surges')  btn.id = 'surges-btn';
  if (label === 'Fugues')  btn.id = 'fugues-btn';   // ← y esto

  rightTopRow.appendChild(btn);
});

let randomBtn;
let surgesBtn;
const modeButtons = Array.from(rightTopRow.querySelectorAll('button.numa-btn'));

randomBtn = modeButtons.find(b => b.dataset.mode === 'Random');
surgesBtn = modeButtons.find(b => b.dataset.mode === 'Surges');





// Si ya están duplicados por error, me cargo los clones sobrantes





function forceActivateRandom() {

  if (!randomBtn || !surgesBtn) {
  console.warn('❌ No se puede forzar Random: botones no definidos');
  return;
}

  if (!randomBtn.classList.contains('active')) {
    randomBtn.classList.add('active');
  }
  randomBtn.disabled = true;
  randomBtn.classList.add('disabled');

  surgesBtn.classList.remove('active');
  surgesBtn.disabled = true;
  surgesBtn.classList.add('disabled');

  updateRunButtonState();
}

modeButtons.forEach(btn => {
  const mode = btn.dataset.mode;

  // Saltamos los que ya tienen su listener independiente
  if (mode === 'Random' || mode === 'Surges') return;

  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    const isActive = btn.classList.toggle('active');

    if (mode === 'Fugues') {
      // 1) Habilita/deshabilita los speedButtons
      speedButtons.forEach(b => {
        b.disabled = !isActive;
        b.classList.toggle('disabled', !isActive);
        b.classList.remove('active'); // quitamos cualquier selección previa
      });

      // 2) Si activamos Fugues, marcamos la velocidad por defecto
      if (isActive) {
        const defaultSpeed = speedButtons[0];
        defaultSpeed.classList.add('active');
        currentSpeed = defaultSpeed.dataset.spinSpeed;
      }
    }

    updateRunButtonState();
  });
});






const speedRow = document.createElement('div');
speedRow.className = 'numa-cfg-row speed-row';
rightCol.appendChild(speedRow);
// Crear botones de velocidad y añadirlos a speedRow
const speedLabels = ['1H','2H','3H','4H','5H','6H'];

speedLabels.forEach(label => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.spinSpeed = label;
  btn.className = 'numa-btn';
  btn.disabled = true;

  btn.onclick = () => {
    if (btn.disabled) return;
    // Desactiva todos los demás
    speedButtons.forEach(sb => sb.classList.remove('active'));
    btn.classList.add('active');

    // Guarda velocidad actual
    currentSpeed = label;
    localStorage.setItem('fuguesSpeed', currentSpeed);
  };

  speedButtons.push(btn);
  speedRow.appendChild(btn);
});

// ¡Ahora definimos speedButtons justo tras crear todos los botones!










  // ─────────────────────────────────────────────────────────
  // Selector de tablas (botones 1-100 en grid 10×10)
  // ─────────────────────────────────────────────────────────
  const scroll = document.createElement('div');
  scroll.className = 'numa-scroll';
  for (let i = 1; i <= 100; i++) {
    const btnNum = document.createElement('button');
    btnNum.textContent = i;
    btnNum.className = 'numa-num-btn';
    btnNum.onclick = () => btnNum.classList.toggle('active');
    scroll.appendChild(btnNum);
  }
  term.appendChild(scroll);
 


  // ─────────────────────────────────────────────────────────
  // Fila inferior: Inicio, Fin, Chain debajo de la tabla
  // ─────────────────────────────────────────────────────────
  const rowBottom = document.createElement('div');
  rowBottom.className = 'numa-bottom';
  term.appendChild(rowBottom);

  // Función auxiliar para crear un spinner personalizado
  function createSpinner(labelText, inputId, initialValue, refs = {}) {
 
    const existing = document.getElementById(inputId);
  if (existing) existing.remove();
  
    const wrapper = document.createElement('div');
    wrapper.classList.add('numa-input-group');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0.3em';

    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    lbl.style.color = '#28a746';
    lbl.style.fontSize = '0.8rem';
    lbl.style.display = 'flex';
    lbl.style.alignItems = 'center';
    lbl.style.gap = '0.2em';

    const spinner = document.createElement('div');
    spinner.className = 'numa-spinner';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = inputId;
    input.value = String(initialValue);
    // Ajustar el mínimo para "chain" en 2; para inicio/fin, mínimo 1
    input.min = (inputId === 'numa-chain') ? '2' : '1';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.flexDirection = 'column';

    const btnUp = document.createElement('button');
    btnUp.className = 'numa-spinner-btn up';
    btnUp.innerHTML = '<span class="icon-up">▲</span>';
   btnUp.onclick = () => {
  let val = parseInt(input.value || '0', 10);
  val = isNaN(val) ? (inputId === 'numa-chain' ? 2 : 1) : val + 1;

  // Validaciones de límite
  if (inputId === 'numa-chain' && val < 2) {
    val = 2;
  }
  if (inputId === 'numa-start') {
    let e = parseInt(document.getElementById('numa-end').value, 10);
    if (isNaN(e) || e < 1) e = 1;
    if (val > e) val = e;
  }
  if (inputId === 'numa-end') {
    let s = parseInt(document.getElementById('numa-start').value, 10);
    if (isNaN(s) || s < 1) s = 1;
    if (val < s) val = s;
  }

  input.value = String(val);
  input.dispatchEvent(new Event('input'));
};

    const btnDown = document.createElement('button');
    btnDown.className = 'numa-spinner-btn down';
    btnDown.innerHTML = '<span class="icon-down">▼</span>';
    btnDown.onclick = () => {
  let val = parseInt(input.value || '0', 10);
  val = isNaN(val) ? (inputId === 'numa-chain' ? 2 : 1) : val - 1;

  // 1) Mínimos absolutos
  if (inputId === 'numa-chain' && val < 2) {
    val = 2;
  }
  if ((inputId === 'numa-start' || inputId === 'numa-end') && val < 1) {
    val = 1;
  }

  // 2) Validaciones cruzadas start/end
  if (inputId === 'numa-start') {
    let e = parseInt(document.getElementById('numa-end').value, 10);
    if (isNaN(e) || e < 1) e = 1;
    if (val > e) val = e;
  }
  if (inputId === 'numa-end') {
    let s = parseInt(document.getElementById('numa-start').value, 10);
    if (isNaN(s) || s < 1) s = 1;
    if (val < s) val = s;
  }

  input.value = String(val);
  input.dispatchEvent(new Event('input'));
};

    btnContainer.appendChild(btnUp);
    btnContainer.appendChild(btnDown);
    spinner.appendChild(input);
    spinner.appendChild(btnContainer);
    lbl.appendChild(spinner);
    wrapper.appendChild(lbl);

    return wrapper;
  }

  // “Inicio” spinner
  const inicioSpinner = createSpinner('Inicio:', 'numa-start', 1);
  rowBottom.appendChild(inicioSpinner);

  // “Fin” spinner
  const finSpinner = createSpinner('Fin:', 'numa-end', 10);
  rowBottom.appendChild(finSpinner);

  // “Chain” spinner
  const chainSpinner = createSpinner('Chain:', 'numa-chain', 2);
  rowBottom.appendChild(chainSpinner);
  const chainInputEl = chainSpinner.querySelector('input[type="number"]');
if (chainInputEl) {
  chainInputEl.addEventListener('input', validateSpinners);
}

  // ─────────────────────────────────────────────────────────
  // Referencias a inputs para restricciones adicionales
  // ─────────────────────────────────────────────────────────
  const inicioInput = document.getElementById('numa-start');
  const finInput    = document.getElementById('numa-end');
  const chainInput  = document.getElementById('numa-chain');

if (randomBtn && surgesBtn && chainInput) {
  randomBtn.addEventListener('click', () => {
    if (!chainInput) {
      console.warn('⚠️ randomBtn handler cancelado: chainInput no disponible');
      return;
    }

    const chain = parseInt(chainInput.value, 10);
    if (chain >= 3) {
      console.log('⛔ Chain >= 3: Random forzado, Surges desactivado');
      forceActivateRandom();
      return;
    }

    if (randomBtn.disabled) return;

    const isNowActive = !randomBtn.classList.contains('active');
    randomBtn.classList.toggle('active', isNowActive);
    if (isNowActive) {
      surgesBtn.classList.remove('active');
    }

    updateRunButtonState();
  });

  surgesBtn.addEventListener('click', () => {
    if (!chainInput) {
      console.warn('⚠️ surgesBtn handler cancelado: chainInput no disponible');
      return;
    }

    const chain = parseInt(chainInput.value, 10);
    if (chain >= 3) {
      console.log('⛔ Chain >= 3: Surges bloqueado');
      return;
    }

    if (surgesBtn.disabled) return;

    const isNowActive = !surgesBtn.classList.contains('active');
    surgesBtn.classList.toggle('active', isNowActive);
    if (isNowActive) {
      randomBtn.classList.remove('active');
    }

    updateRunButtonState();
  });
} else {
  console.warn('⚠️ Botones Random/Surges o chainInput no definidos todavía');
}


function validateSpinners() {
  console.log('🛠️ validateSpinners() ejecutada');

  if (!randomBtn || !surgesBtn) {
  console.warn('⚠️ validateSpinners cancelado: botones no definidos todavía');
  return;
}

  // 1. Normaliza chain
  let chain = parseInt(chainInput.value, 10);
  if (isNaN(chain) || chain < 2) {
    chain = 2;
    chainInput.value = '2';
  }

  // 2. Obtener botones Random y Surges
 

  console.log(`🎛️ Antes – Random(active=${randomBtn.classList.contains('active')}), Surges(active=${surgesBtn.classList.contains('active')})`);

  // 3. Lógica según chain
  if (chain >= 3) {
    // 🔒 Forzar Random activo
    if (!randomBtn.classList.contains('active')) {
      randomBtn.classList.add('active');
    }

    randomBtn.disabled = true;
    randomBtn.classList.add('disabled');

    // ❌ Desactivar Surges
    surgesBtn.classList.remove('active');
    surgesBtn.disabled = true;
    
  } else {
    // 🔓 Dejar ambos activables pero mutuamente excluyentes
    randomBtn.disabled = false;
    randomBtn.classList.remove('disabled');

    surgesBtn.disabled = false;
    surgesBtn.classList.remove('disabled');

    if (randomBtn.classList.contains('active')) {
      surgesBtn.classList.remove('active');
    }
    if (surgesBtn.classList.contains('active')) {
      randomBtn.classList.remove('active');
    }
  }

  console.log(`🎛️ Después – Random(active=${randomBtn.classList.contains('active')}), Surges(active=${surgesBtn.classList.contains('active')})`);

  updateRunButtonState();

  // 4. Validación final de rangos
  let start = parseInt(inicioInput.value, 10) || 1;
  let end   = parseInt(finInput.value,   10) || 1;
  if (start > end) {
    start = end;
    inicioInput.value = String(end);
  }
  if (end < start) {
    end = start;
    finInput.value = String(start);
  }
}





  // ─────────────────────────────────────────────────────────
  // Ajustes para evitar valores inválidos:
  //   - Chain no puede bajar menos de 2
  //   - Inicio no puede superar a Fin y viceversa
  // ─────────────────────────────────────────────────────────



  // ─────────────────────────────────────────────────────────
  // Estadísticas en tiempo real
  // ─────────────────────────────────────────────────────────
  const stats = document.createElement('div');
  stats.id = 'numa-stats';
  stats.className = 'numa-stats';
  term.appendChild(stats);

  // ─────────────────────────────────────────────────────────
  // Botón Comenzar
  // ─────────────────────────────────────────────────────────
  const run = document.createElement('button');
  run.textContent = 'Comenzar';
  run.classList.add('numa-btn', 'start-btn', 'disabled');
  run.disabled = true;

  const pokerBtn = document.createElement('button');
  pokerBtn.textContent = 'Poker Train';
  pokerBtn.classList.add('numa-btn');

  const btnRow = document.createElement('div');
  btnRow.className = 'numa-btn-row';
  btnRow.appendChild(run);
  btnRow.appendChild(pokerBtn);

  container.appendChild(btnRow);
  // ✅ AHORA SÍ: ya existen run y pokerBtn, así que ahora podemos usar validateSpinners
[inicioInput, finInput, chainInput].forEach(inp =>
  inp.addEventListener('input', validateSpinners)
);



// Añadir los botones FUERA de #numa-terminal para que sobrevivan al limpiar


function resetAllSelections() {
  // 1. Resetear operaciones activas
  const opBtns = document.querySelectorAll('button.numa-btn');
  opBtns.forEach(btn => {
    btn.classList.remove('active');
  });

  // 2. Resetear botones de tablas (1–100)
  const numBtns = document.querySelectorAll('button.numa-num-btn');
  numBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = false;
    btn.classList.remove('disabled');

    // ✅ Ya no clonas: solo limpias y reactivas
    btn.onclick = () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    };
  });

  // 3. Resetear nivel de Poker
  speedButtons.forEach(btn => {
  btn.classList.remove('active');
  btn.disabled = true;
  btn.classList.add('disabled');
});
  pokerLevel = null;
  attachListenersToTableButtons();
}

let isPokerTrainActive = false;

pokerBtn.addEventListener('click', () => {
  const wasActive = pokerBtn.classList.contains('active');

  resetAllSelections(); // Esto borra todas las clases .active

 if (wasActive) {
  pokerBtn.classList.remove('active');
  isPokerTrainActive = false;
  

  // Desactivar botón Comenzar al salir de Poker Train
  run.disabled = true;
  run.classList.add('disabled');

} else {
  pokerBtn.classList.add('active');
  isPokerTrainActive = true;

  document.getElementById('numa-start').value = '1';
  document.getElementById('numa-end').value = '10';
  document.getElementById('numa-chain').value = '2';
  validateSpinners();

}
updateTableButtonsForPokerTrain(isPokerTrainActive);
  const active = isPokerTrainActive;
  pokerLevel = null;


  // A) Spinners
  ['numa-start', 'numa-end', 'numa-chain'].forEach(id => {
  const input = document.getElementById(id);
  if (!input) return;

  input.disabled = active;
  input.classList.toggle('disabled', active);
  if (active) input.blur();

  const group = input.closest('.numa-input-group') || input.parentElement;
  if (!group) return;

  group.classList.toggle('disabled', active);

  // Desactiva botones visibles
  group.querySelectorAll('button').forEach(btn => {
    btn.disabled = active;
    btn.classList.toggle('disabled', active);
  });

  // Atenúa textos visibles
  group.querySelectorAll('label, span, p').forEach(el => {
    el.classList.toggle('disabled', active);
  });
});


  // B) Tabla: solo 1–4 si está activo
  updateTableButtonsForPokerTrain(active);

  if (active) {
    // C) Desactivar modos avanzados
    ['Mirror', 'Surges'].forEach(lbl => {
      const m = modeButtons.find(b => b.textContent === lbl);
      m.disabled = true;
      m.classList.add('disabled');
      m.classList.remove('active');
    });

    updateRunButtonState(); // solo al entrar, no al salir

   

  } else {
    // Rehabilitar botones
    ['Mirror', 'Surges'].forEach(lbl => {
      const m = modeButtons.find(b => b.textContent === lbl);
      m.disabled = false;
      m.classList.remove('disabled');
    });
  }

  // ← 🔧 Asegúrate de que el botón Comenzar refleja el nuevo estado
  updateRunButtonState();
});

function attachListenersToTableButtons() {
  scroll.querySelectorAll('button.numa-num-btn')
    .forEach(b => b.addEventListener('click', updateRunButtonState));
}

// Actualiza estado del botón Comenzar
function updateRunButtonState() {
  if (!leftCol || !scroll) return;
  if (typeof pokerBtn === 'undefined' || pokerBtn === null) {
    console.warn('⚠️ updateRunButtonState(): pokerBtn no está definido aún');
    return;
  }
  const opSelected = Array.from(leftCol.querySelectorAll('button.numa-btn.active')).length > 0;
  const numSelected = Array.from(scroll.querySelectorAll('button.numa-num-btn.active')).length > 0;
  const pokerOn = pokerBtn?.classList.contains('active') ?? false;

  // Caso especial: Poker Train activado → verificar si se seleccionó un nivel (1-4)
    if (pokerOn) {
    const validPoker = pokerLevel >= 1 && pokerLevel <= 4;
    if (validPoker && opSelected) {
      run.disabled = false;
      run.classList.remove('disabled');
    } else {
      run.disabled = true;
      run.classList.add('disabled');
    }
    return;
  }


  // Caso normal (no Poker Train)
  if (opSelected && numSelected) {
    run.disabled = false;
    run.classList.remove('disabled');
  } else {
    run.disabled = true;
    run.classList.add('disabled');
  }
}
// Adjuntar listeners
leftCol.querySelectorAll('button.numa-btn').forEach(b => b.addEventListener('click', updateRunButtonState));
scroll.querySelectorAll('button.numa-num-btn').forEach(b => b.addEventListener('click', updateRunButtonState));

// Estado inicial
if (pokerBtn) {
  updateRunButtonState();
} else {
  console.warn('⚠️ No se puede ejecutar updateRunButtonState(): pokerBtn no está definido');
}


  // ─────────────────────────────────────────────────────────
  // Área de resultados
  // ─────────────────────────────────────────────────────────
  const output = document.createElement('div');
  output.id = 'numa-output';
  output.className = 'numa-output';
  term.appendChild(output);

  // ─────────────────────────────────────────────────────────
  // Función que reemplaza todo el contenido con ejercicio secuencial
  // ─────────────────────────────────────────────────────────
  
 

  // 📦 Datos Poker Train: bloques de dificultad  
const pokerOps = {
  1: { // BLOQUE 1 — FUNDAMENTALES :contentReference[oaicite:0]{index=0}
    '×': ['2×2=4','2×3=6','2×4=8','2×5=10','3×2=6','3×3=9','4×3=12','5×2=10','5×3=15','5×4=20','6×2=12','6×3=18','10×10=100'],
    '+': ['1.5+1.5=3','2+2.5=4.5','2.5+2.5=5','3+3=6','5+5=10','6+6=12','10+15=25','25+25=50'],
    '-': ['10-2.5=7.5','15-5=10','25-15=10','50-25=25'],
    '÷': ['2÷2=1','4÷2=2','6÷2=3','10÷2=5','10÷5=2','20÷4=5','60÷10=6','100÷10=10']
  },
  2: { // BLOQUE 2 — INTERMEDIO :contentReference[oaicite:1]{index=1}
    '×': ['2×1.5=3','2×2.5=5','3×1.5=4.5','3×2.5=7.5','4×2.5=10','4×3.5=14','5×2=10','6×1.5=9','7.5×2=15','10×1.5=15','1.25×4=5','1.25×8=10','1.5×10=15'],
    '+': ['1+1.5=2.5','2.5+1.5=4','2.5+3=5.5','3.5+1.5=5','4.5+1.5=6','4.5+4.5=9','7.5+7.5=15'],
    '-': ['7.5-2.5=5','10-1.5=8.5','20-7.5=12.5','25-7.5=17.5','30-7.5=22.5','50-15=35'],
    '÷': ['1÷2=0.5','1÷4=0.25','1÷5=0.2','2÷1.5=1.33','3÷1.25=2.4','3÷4=0.75','4÷4=1','5÷1.5=3.33','5÷5=1','6÷3=2']
  },
  3: { // BLOQUE 3 — AVANZADO :contentReference[oaicite:2]{index=2}
    '×': ['2.5×2=5','2.5×3=7.5','2.5×4=10','2.5×6=15','2.5×10=25','3.5×2=7','3.5×3=10.5','3.5×4=14','4.5×2=9','4.5×3=13.5','4.5×4=18'],
    '+': ['3+4.5=7.5','12.5+25=37.5','25+50=75','75+75=150'],
    '-': ['10-1.25=8.75','10-1.75=8.25','25-12.5=12.5','30-12.5=17.5','100-75=25'],
    '÷': ['1÷3=0.33','1÷1.25=0.8','1÷1.75=0.57','1÷2.25=0.44','2÷1.75=1.14','2.5÷1.25=2','3.5÷1.25=2.8','4.5÷1.5=3','7.5÷2.5=3','10÷3=3.33','15÷2.5=6','27÷18.5=1.46']
  },
  4: { // BLOQUE 4 — PÓKER PRO :contentReference[oaicite:3]{index=3}
    '×': ['1.25×6=7.5','1.25×12=15','1.5×12=18','1.5×15=22.5','1.5×20=30','1.75×4=7','1.75×6=10.5','1.75×8=14','1.75×10=17.5','2.25×4=9','2.25×6=13.5','2.25×10=22.5','2.75×6=16.5','2.75×10=27.5'],
    '+': ['7.5+10=17.5','15+15=30'],
    '-': ['100-37.5=62.5'],
    '÷': ['3÷7=0.43','4÷1.75=2.29','5÷6=0.83','6÷2.5=2.4','9÷4.5=2','10÷2.5=4','15÷1.5=10','20÷5=4','25÷5.5=4.54','30÷6=5','30÷7.5=4','35÷8.5=4.11','40÷9.5=4.21','45÷12.5=3.6','70÷10=7','75÷7.5=10','80÷10=8','100÷8=12.5']
  }
};

// Actualiza estado del botón Comenzar


function getActiveOps() {
  if (!leftCol) {
    console.warn('⚠️ getActiveOps(): leftCol no está disponible');
    return [];
  }
  return Array.from(leftCol.querySelectorAll('button.numa-btn.active'))
    .map(b => b.textContent);
}
  // ─────────────────────────────────────────────────────────
  // Manejo del clic en “Comenzar”
  // ─────────────────────────────────────────────────────────
 run.onclick = () => {
  document.querySelectorAll('#controls, #quiz-section, #memory-controls').forEach(el => {
    el.style.display = 'none';
  });

  Array.from(document.body.children).forEach(child => {
    if (
      !child.contains(container) &&
      !child.matches('#math-panel')
    ) {
      child.style.visibility = 'hidden';
    }
  });

  btnRow.remove();
  console.log('Click en Comenzar');

  if (pokerLevel !== null) {
    const opsLeft = getActiveOps(); // botones + − × ÷
    const selectedOps = pokerOps[pokerLevel];
    const expressions = [];

    opsLeft.forEach(op => {
      if (selectedOps[op]) {
        const cleaned = selectedOps[op].map(expr => expr.split('=')[0].trim());
        expressions.push(...cleaned);
      }
    });

    const numaSubbar = document.getElementById('numa-subbar');
    if (numaSubbar) numaSubbar.style.visibility = 'hidden';

    const topbar = document.getElementById('math-topbar');
    if (topbar) topbar.style.visibility = 'hidden';

    const cfgContainerEl = document.querySelector('.numa-cfg-container');
    if (cfgContainerEl) cfgContainerEl.style.visibility = 'hidden';

    document.body.style.backgroundColor = 'black';

    renderExercises(expressions, opsLeft);

    setTimeout(() => {
  const darkBtn = document.querySelector('.dark-override-btn');
  if (darkBtn) darkBtn.click();
  else console.warn('❌ No se encontró el botón del ojito a tiempo');
}, 50);

    return; // salta el resto del comportamiento clásico
  
};
    // 1) Ocultar elementos de configuración
    const numaSubbar = document.getElementById('numa-subbar');
    if (numaSubbar) numaSubbar.style.visibility = 'hidden';

    const topbar = document.getElementById('math-topbar');
    if (topbar) topbar.style.visibility = 'hidden';

    const cfgContainerEl = document.querySelector('.numa-cfg-container');
    if (cfgContainerEl) cfgContainerEl.style.visibility = 'hidden';

    // 2) Ocultar TODO lo demás en la página (excepto #math-panel)
    document.body.style.backgroundColor = 'black';
    Array.from(document.body.children).forEach(child => {
      if (!child.contains(container)) {
        child.style.visibility = 'hidden';
      }
    });

    // 3) Recoger operaciones “activas” en la columna izquierda
    const opsLeft = Array.from(leftCol.querySelectorAll('button.numa-btn'))
      .filter(b => b.classList.contains('active'))
      .map(b => b.textContent);

    // 4) Recoger botones “extra” en la columna derecha (Random, etc.)
  const opsRight = [];
  if (randomBtn?.classList.contains('active')) opsRight.push('Random');
  if (surgesBtn?.classList.contains('active')) opsRight.push('Surges');
  const mirrorBtn = document.getElementById('mirror-btn');
  if (mirrorBtn?.classList.contains('active')) opsRight.push('Mirror');
  const fuguesBtn = document.getElementById('fugues-btn');
  if (fuguesBtn?.classList.contains('active')) opsRight.push('Fugues');



    // 5) Recoger los números de “tabla” seleccionados (por ejemplo, 1 y 2)
    let nums = Array.from(scroll.querySelectorAll('button.numa-num-btn.active'))
      .map(b => +b.textContent);

      if (nums.length === 0) nums = [1];
    // 6) Leer los valores de “Inicio” y “Fin” (spinners). Asegurar que inicio ≤ fin
    let s = parseInt(document.getElementById('numa-start').value, 10) || 1;
    let e = parseInt(document.getElementById('numa-end').value, 10) || 1;
    if (s > e) {
      e = s;
      document.getElementById('numa-end').value = String(s);
    }
    let rangeValues = [];
    for (let v = s; v <= e; v++) {
      rangeValues.push(v);
    }

    // 7) Leer “Chain” (mínimo 2); si es menor, forzamos a 2
    // 7) Leer “Chain” (mínimo 2); si es menor, forzamos a 2
let ch = parseInt(document.getElementById('numa-chain').value, 10) || 1;

if (ch > 2) {
  // Reutiliza ya definidas
  if (randomBtn) {
    randomBtn.classList.add('active');
    forceActivateRandom();
    randomBtn.disabled = true;
    randomBtn.classList.add('disabled');
  }
  if (surgesBtn) {
    surgesBtn.disabled = true;
    surgesBtn.classList.add('disabled');
    surgesBtn.classList.remove('active');
  }
} else {
  if (randomBtn) {
    randomBtn.disabled = false;
    randomBtn.classList.remove('disabled');
    randomBtn.classList.remove('active');
  }
  if (surgesBtn) {
    surgesBtn.disabled = false;
    surgesBtn.classList.remove('disabled');
  }
}




    // 9) Modo Cipher: reemplazar nums y rangeValues por números grandes de 2–3 dígitos
    if (opsRight.includes('Cipher')) {
      let bigNums = [];
      nums.forEach(() => {
        const digits = (Math.random() < 0.5) ? 2 : 3;
        const min = (digits === 2 ? 10 : 100);
        const max = (digits === 2 ? 99 : 999);
        bigNums.push(Math.floor(Math.random() * (max - min + 1)) + min);
      });
      nums = bigNums;

      const countRange = e - s + 1;
      let bigRange = [];
      for (let i = 0; i < countRange; i++) {
        const digits = (Math.random() < 0.5) ? 2 : 3;
        const min = (digits === 2 ? 10 : 100);
        const max = (digits === 2 ? 99 : 999);
        bigRange.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      rangeValues = bigRange;
    }

    // 10) Generar todas las combinaciones respetando “chain” y evitando resultados negativos o inválidos
    const expressions = [];
    function buildExpr(depth, currValue, exprStr) {
      if (depth === ch - 1) {
        expressions.push(exprStr);
        return;
      }
      for (const op of opsLeft) {
        const nextOperands = ((depth + 1) % 2 === 0) ? nums : rangeValues;
        for (const next of nextOperands) {
          const tentativeExpr = exprStr + op + next;
          const newValue = calc(currValue, op, next);

          if (newValue === null || newValue < 0) {
            // Intentar invertir operandos solo si es resta o división
            if (op === '-' || op === '÷') {
              const altValue = calc(next, op, currValue);
              if (altValue !== null && altValue >= 0) {
                const altExpr = String(next) + op + String(currValue);
                if (depth + 1 === ch) {
                  expressions.push(altExpr);
                } else {
                  buildExpr(depth + 1, altValue, altExpr);
                }
                continue; // Ya procesamos esta rama invertida
              }
            }
            // Si la inversión tampoco funciona, descartamos la rama
            continue;
          }

          // Si newValue es válido, seguimos la recursión normal
          buildExpr(depth + 1, newValue, tentativeExpr);
        }
      }
    }
    for (const first of nums) {
      buildExpr(0, first, String(first));
    }

    // 11) Si “Random” está activo (o forzado), barajar el array de expresiones
    if (opsRight.includes('Random')) {
      shuffle(expressions);
    }

    // 12) Modo Surges: ordenar por complejidad creciente
    if (opsRight.includes('Surges')) {
      const computeComplexity = expr => {
        const parts = expr.split(/([+\-×÷])/);
        let value = parseFloat(parts[0]);
        let complexity = Math.abs(value);
        for (let i = 1; i < parts.length; i += 2) {
          const op = parts[i];
          const nxt = parseFloat(parts[i + 1]);
          value = calc(value, op, nxt);
          if (value === null) break;
          complexity += Math.abs(value);
        }
        return complexity;
      };
      expressions.sort((a, b) => computeComplexity(a) - computeComplexity(b));
    }

    // 13) Estadísticas (opcional) antes de iniciar ejercicios
    stats.textContent = `Total: ${expressions.length}  Est. tiempo: ${Math.ceil(expressions.length * 5)}s`;

    if (expressions.length === 0) {
    alert('No se han podido generar ejercicios con la configuración actual.');
    return;
}
    // 14) Arrancar módulo de ejercicios con la lista generada
    renderExercises(expressions, opsRight);
  }; // <-- cierra run.onclick



  function updateTableButtonsForPokerTrain(active) {
  const allBtns = Array.from(scroll.querySelectorAll('button.numa-num-btn'));

  allBtns.forEach(oldBtn => {
    const n = +oldBtn.textContent;
    const isPokerBtn = n >= 1 && n <= 4;

    const newBtn = oldBtn.cloneNode(true);
    oldBtn.replaceWith(newBtn);
    newBtn.classList.add('numa-num-btn');

    if (active) {
      if (isPokerBtn) {
        
        newBtn.disabled = false;
        newBtn.classList.remove('disabled');
        newBtn.onclick = () => {
          if (pokerLevel === n) {
            // Si ya estaba seleccionado, lo desactivo
            newBtn.classList.remove('active');
            pokerLevel = null;
          } else {
            // Si era otro o ninguno, activo este
            allBtns.forEach(btn => btn.classList.remove('active'));
            newBtn.classList.add('active');
            pokerLevel = n;
          }
          updateRunButtonState();
        };
      } else {
        newBtn.disabled = true;
        newBtn.classList.add('disabled');
        newBtn.onclick = null;
      }
    } else {
  newBtn.disabled = false;
  newBtn.classList.remove('disabled');
  newBtn.classList.remove('active');

  if (isPokerBtn) {
    pokerLevel = null;
    updateRunButtonState();
  }

  newBtn.onclick = () => {
    newBtn.classList.toggle('active');
    updateRunButtonState();
  };
}
  });

  if (!active) {
    attachListenersToTableButtons();
  }
}
setTimeout(() => {
  if (randomBtn && surgesBtn) {
    validateSpinners();
  } else {
    console.warn('❌ validateSpinners() cancelado: botones no están listos');
  }
}, 50);
 // ← A
 // SEGÚRATE de que esté aquí, al final
 
} // <-- cierra export function init


// ─────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────
function calc(a, op, b) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
      
    case '÷':
      if (b === 0) return null;
      return a / b;
    default:
      return null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
