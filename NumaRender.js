// 📁 mathMode/modules/NumaRender.js
import { createNumericKeypad } from './numaKeypad.js';

// Map de velocidades para el modo Fugues
const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};

let sequence = [];
let originalSequence = [];
let failedExercises = [];
let idx = 0;

// Utilidades matemáticas
function calc(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
    default:  return null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function renderExercises(sequence, modes) {
  // Obtener panel y terminal
  const mathPanel = document.getElementById('math-panel');
  const term      = document.getElementById('numa-terminal');
  if (!term) return;

  // Botón “Salir” para restaurar centrado y recargar
  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'X';
  exitBtn.className = 'exit-btn';
  Object.assign(exitBtn.style, {
    position:   'absolute',
    top:        '8px',
    right:      '8px',
    width:      '24px',
    height:     '24px',
    lineHeight: '24px',
    textAlign:  'center',
    background: 'transparent',
    border:     'none',
    color:      '#ff0000',
    fontFamily: 'monospace',
    fontSize:   '0.8rem',
    borderRadius: '3px',
    cursor:     'pointer',
    zIndex:     '1001'
  });
  exitBtn.onclick = () => {
    if (mathPanel) mathPanel.style.justifyContent = 'center';
    localStorage.setItem('reopenMath', '1');
    location.reload();
  };
  mathPanel.appendChild(exitBtn);

  // Modos activos
  const isMirror = modes.includes('Mirror');
  const isFugues = modes.includes('Fugues');
  const isRandom = modes.includes('Random');
  const isSurges = modes.includes('Surges');


  // Preprocesar secuencia
  if (isRandom) shuffle(sequence);
  if (isSurges) {
    const computeComplexity = expr => {
      const parts = expr.split(/([+\-×÷])/);
      let value = parseFloat(parts[0]), complexity = Math.abs(value);
      for (let i = 1; i < parts.length; i += 2) {
        const op  = parts[i];
        const nxt = parseFloat(parts[i+1]);
        value = calc(value, op, nxt);
        if (value === null) break;
        complexity += Math.abs(value);
      }
      return complexity;
    };
    sequence.sort((a, b) => computeComplexity(a) - computeComplexity(b));
  }

  // Ajustes UI
  mathPanel.style.justifyContent = 'flex-start';
  term.innerHTML = '';
  createNumericKeypad();

  originalSequence = sequence.slice();        // ✅ CORRECTO
sequence = sequence.slice();           // Copia que se irá modificando
failedExercises = [];                       // Limpiamos errores anteriores
idx = 0;                                    // Reseteamos índice


  const outer = document.createElement('div');
  Object.assign(outer.style, {
    position:  'relative',
    flex:      '1',
    width:     '100%',
    alignSelf: 'stretch'
  });
  term.appendChild(outer);

  // Fijar historial y contenedor al tope
  term.style.overflowY = 'hidden';

  const answeredList = document.createElement('div');
  answeredList.className = 'answered-list';
  Object.assign(answeredList.style, {
    position:   'fixed',
    top:        '10.5rem',
    left:       '4rem',
    right:      '1rem',
    zIndex:     '999',
    background: '#000'
  });
  outer.appendChild(answeredList);

  const exContainer = document.createElement('div');
  exContainer.className = 'numa-output';
  Object.assign(exContainer.style, {
    position:   'fixed',
    top:        '7rem',
    left:       '1rem',
    right:      '1rem',
    zIndex:     '1000',
    background: '#000',
    color:      '#28a746',
    fontFamily: 'monospace',
    padding:    '1em'
  });
  outer.appendChild(exContainer);

  // Mostrar ejercicios secuenciales
  

  function restartSession(startingSequence) {
  idx = 0;
  sequence = [...startingSequence];
  failedExercises = [];
  exContainer.innerHTML = '';
  answeredList.innerHTML = '';
  showNext();
}




  function showNext() {
  if (idx >= sequence.length) {
    // Si hay fallos, repetirlos
    if (failedExercises.length > 0) {
      sequence = [...failedExercises];   // Repetimos SOLO los fallados
      failedExercises = [];
      idx = 0;
      return showNext();
    }

    // Si no hay fallos pendientes → Mostrar botón de repetir
      answeredList.innerHTML = '';
  exContainer.innerHTML = '';

    const repeatBtn = document.createElement('button');
    repeatBtn.textContent = 'Repetir';
    repeatBtn.className = 'numa-btn';
    repeatBtn.style.marginTop = '1em';
    repeatBtn.onclick = () => restartSession(originalSequence);
    exContainer.appendChild(repeatBtn);

    return;
  }

  let expr = sequence[idx++];
  if (isMirror) {
    const parts = expr.split(/([+\-×÷])/), ops = [], vals = [];
    parts.forEach((p, i) => (i % 2 ? ops : vals).push(p));
    vals.reverse(); ops.reverse();
    expr = vals.reduce((acc, v, i) => acc + (ops[i] || '') + (vals[i] || ''), vals[0]);
  }

  const jsExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
  let correctValue;
  try { correctValue = eval(jsExpr); } catch { correctValue = NaN; }
  const correctStr = String(correctValue);

  exContainer.innerHTML = '';
  const questionRow = document.createElement('div');
  questionRow.className = 'exercise-row';
  const spacedExpr = expr.replace(/([+\-×÷])/g, ' $1 ');
  const pregunta = document.createElement('div');
  pregunta.className = 'question';

  // 🕒 Modo Fugues (con delay personalizado)
  if (isFugues) {
    pregunta.textContent = `${spacedExpr} = `;
    questionRow.appendChild(pregunta);
    exContainer.appendChild(questionRow);

    const selectedSpeed = localStorage.getItem('fuguesSpeed') || '1H';
    const delay = speedMap[selectedSpeed] || speedMap['1H'];

    setTimeout(() => {
      pregunta.textContent = '';
      const input = document.createElement('input');
input.type = 'text';
input.maxLength = correctStr.length;
input.className = 'answer-input';

// 🛑 Evita teclado móvil sin romper eventos
input.setAttribute('readonly', 'true');
input.addEventListener('touchstart', e => {
  e.preventDefault();  // evita abrir el teclado
  input.removeAttribute('readonly'); // permite escribir desde teclado web
  input.focus();       // asegura foco
});
input.addEventListener('blur', () => {
  input.setAttribute('readonly', 'true'); // vuelve a bloquear
});

      questionRow.appendChild(input);
      input.focus();
      attachValidation(input, spacedExpr, correctStr);
    }, delay);
    return;
  }

  // Normal
 // Modo normal
pregunta.textContent = `${spacedExpr} = `;
questionRow.appendChild(pregunta);
exContainer.appendChild(questionRow);

const input = document.createElement('input');
input.type = 'text';
input.maxLength = correctStr.length;
input.className = 'answer-input';

// 🛑 Evita teclado móvil sin romper interacción
input.setAttribute('readonly', 'true');
input.addEventListener('touchstart', e => {
  e.preventDefault();                  // Evita abrir teclado móvil
  input.removeAttribute('readonly');  // Permite escritura con teclado web
  input.focus();                      // Asegura foco
});
input.addEventListener('blur', () => {
  input.setAttribute('readonly', 'true'); // Rebloquea si se pierde el foco
});

questionRow.appendChild(input);
input.focus();
attachValidation(input, spacedExpr, correctStr);

}

  originalSequence = sequence.slice();  // Guarda copia original
idx = 0;
failedExercises = [];
showNext();


function attachValidation(inputEl, spacedExpr, correctStr) {
  let firstTry = true;
  let timer = null;

  const maxLength = correctStr.length;
  inputEl.removeAttribute('readonly'); // ← permitir entrada solo desde keypad web

  const validate = () => {
    clearTimeout(timer);
    const userValue = inputEl.value.trim();

    // Evitar seguir escribiendo si ya se falló
    if (userValue.length > maxLength) {
      inputEl.value = userValue.slice(0, maxLength);
      return;
    }

    if (userValue.length === maxLength) {
      timer = setTimeout(() => {
        const isCorrect = userValue === correctStr;

        if (!isCorrect) {
          const questionRow = inputEl.closest('.exercise-row');
          if (questionRow) questionRow.style.color = '#ff0000';

          // Agregar al historial como incorrecto (solo 1 vez)
          if (firstTry) {
            failedExercises.push(spacedExpr);

            const item = document.createElement('div');
            item.className = 'answered-item incorrect';
            item.textContent = `${spacedExpr} = ${userValue}`;
            answeredList.insertBefore(item, answeredList.firstChild);
            adjustAnsweredListFadeOut();
          }

          // Limpiar input
          inputEl.value = '';
          inputEl.focus();
          firstTry = false;
          return;
        }

        // ✅ Correcto (solo se guarda si fue a la primera)
        if (firstTry) {
          const item = document.createElement('div');
          item.className = 'answered-item correct';
          item.textContent = `${spacedExpr} = ${userValue}`;
          answeredList.insertBefore(item, answeredList.firstChild);
          adjustAnsweredListFadeOut();
        }

        // Continuar
        showNext();
      }, 300);
    }
  };

  inputEl.addEventListener('input', validate);
}





  function adjustAnsweredListFadeOut() {
    const lis = Array.from(answeredList.children);
    while (lis.length > 10) lis.pop() && answeredList.removeChild(answeredList.lastChild);
    const N = lis.length, minOp = 0.2, maxOp = 1.0;
    lis.forEach((node, i) => {
      const t = N === 1 ? 0 : (i / (N - 1));
      node.style.opacity = (maxOp - (maxOp - minOp) * t).toString();
    });
  }
}
