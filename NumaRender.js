import { createNumericKeypad, removeNumericKeypad } from './numaKeypad.js';

const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};

let templates = [];
let activeExercises = [];
let failedExercises = [];
let index = 0;
let termRef = null;
let outputRef = null;
let answeredListRef = null;
let fuguesDelay = speedMap['1H'];
let onExitCallback = () => {};
let shuffleOnReset = false;

function cloneTemplate(tpl) {
  return {
    kind: tpl.kind,
    prompt: tpl.prompt,
    answer: tpl.answer,
    numericAnswer: tpl.numericAnswer,
    display: tpl.display ?? tpl.prompt.replace(' =', ''),
  };
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatHistoryItem(exercise, userValue, correct) {
  const item = document.createElement('div');
  item.className = `answered-item ${correct ? 'correct' : 'incorrect'}`;
  item.textContent = `${exercise.prompt} ${userValue}`;
  return item;
}

function cleanupSession() {
  removeNumericKeypad();
  templates = [];
  activeExercises = [];
  failedExercises = [];
  index = 0;
  termRef = null;
  outputRef = null;
  answeredListRef = null;
  fuguesDelay = speedMap['1H'];
  onExitCallback = () => {};
  shuffleOnReset = false;
}

function adjustHistoryFade() {
  if (!answeredListRef) return;
  const items = Array.from(answeredListRef.children);
  while (items.length > 12) {
    const node = items.pop();
    if (node) node.remove();
  }
  const total = answeredListRef.children.length;
  const min = 0.25;
  const max = 1;
  Array.from(answeredListRef.children).forEach((node, idx) => {
    const ratio = total <= 1 ? 0 : idx / (total - 1);
    node.style.opacity = String(max - (max - min) * ratio);
  });
}

function checkAnswer(exercise, value) {
  const trimmed = value.trim();
  if (exercise.kind === 'numeric') {
    const normalized = trimmed.replace(',', '.');
    const userNumber = Number(normalized);
    if (!Number.isFinite(userNumber) || typeof exercise.numericAnswer !== 'number') {
      return false;
    }
    const diff = Math.abs(userNumber - exercise.numericAnswer);
    return diff < 0.01;
  }
  return trimmed.toLowerCase() === exercise.answer.toLowerCase();
}

function normalizeAnswer(exercise) {
  if (exercise.kind === 'numeric' && typeof exercise.numericAnswer === 'number') {
    const value = Math.round(exercise.numericAnswer * 100) / 100;
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(/\.0+$/,'').replace(/0+$/,'');
  }
  return exercise.answer;
}

function showCompletion() {
  if (!outputRef) return;
  outputRef.innerHTML = '';

  const doneMsg = document.createElement('p');
  doneMsg.textContent = 'Sesión completada. ¡Bien hecho!';
  outputRef.appendChild(doneMsg);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'numa-btn';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    answeredListRef.innerHTML = '';
    startSession(true);
  });
  outputRef.appendChild(resetBtn);

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'numa-btn';
  exitBtn.style.marginLeft = '0.5rem';
  exitBtn.textContent = 'Salir';
  exitBtn.addEventListener('click', () => {
    const exit = onExitCallback;
    cleanupSession();
    exit();
  });
  outputRef.appendChild(exitBtn);
}

function handleFailed(exercise, inputEl, firstAttempt) {
  const historyItem = formatHistoryItem(exercise, inputEl.value.trim(), false);
  answeredListRef.prepend(historyItem);
  adjustHistoryFade();
  if (firstAttempt) {
    failedExercises.push(cloneTemplate(exercise));
  }
  inputEl.value = '';
  inputEl.focus();
}

function moveNext() {
  if (!outputRef) return;
  setTimeout(showNextExercise, 150);
}

function prepareInput(exercise) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'answer-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('inputmode', 'decimal');
  input.addEventListener('focus', () => {
    input.removeAttribute('readonly');
  });
  input.setAttribute('readonly', 'true');
  input.addEventListener('touchstart', evt => {
    evt.preventDefault();
    input.removeAttribute('readonly');
    input.focus();
  }, { passive: false });
  input.addEventListener('blur', () => {
    input.setAttribute('readonly', 'true');
  });
  return input;
}

function showNextExercise() {
  if (!outputRef) return;

  if (index >= activeExercises.length) {
    if (failedExercises.length > 0) {
      activeExercises = failedExercises.slice();
      failedExercises = [];
      index = 0;
    } else {
      showCompletion();
      return;
    }
  }

  const exercise = activeExercises[index++];
  outputRef.innerHTML = '';

  const questionRow = document.createElement('div');
  questionRow.className = 'exercise-row';

  const promptEl = document.createElement('div');
  promptEl.className = 'question';
  promptEl.textContent = exercise.prompt;
  questionRow.appendChild(promptEl);

  outputRef.appendChild(questionRow);

  const renderInput = () => {
    const input = prepareInput(exercise);
    questionRow.appendChild(input);
    input.focus();

    let firstAttempt = true;
    let validationTimer = null;

    const submit = () => {
      clearTimeout(validationTimer);
      const value = input.value.trim();
      if (!value) return;
      const isCorrect = checkAnswer(exercise, value);
      if (isCorrect) {
        const item = formatHistoryItem(exercise, normalizeAnswer(exercise), true);
        answeredListRef.prepend(item);
        adjustHistoryFade();
        moveNext();
      } else {
        handleFailed(exercise, input, firstAttempt);
        firstAttempt = false;
      }
    };

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    });

    input.addEventListener('input', () => {
      clearTimeout(validationTimer);
      validationTimer = setTimeout(submit, 200);
    });
  };

  if (fuguesDelay > 0 && exercise.kind === 'numeric') {
    setTimeout(renderInput, fuguesDelay);
  } else {
    renderInput();
  }
}

function startSession(forceShuffle = false) {
  failedExercises = [];
  index = 0;
  activeExercises = templates.map(cloneTemplate);
  if (shuffleOnReset || forceShuffle) {
    activeExercises = shuffle(activeExercises);
  }
  if (answeredListRef) {
    answeredListRef.innerHTML = '';
  }
  showNextExercise();
}

export function renderExercises(exerciseTemplates, options = {}) {
  const term = document.getElementById('numa-terminal');
  if (!term) return;

  templates = exerciseTemplates.map(cloneTemplate);
  shuffleOnReset = Boolean(options.shuffle);
  fuguesDelay = speedMap[options.fuguesSpeed] || speedMap['1H'];
  onExitCallback = typeof options.onExit === 'function' ? options.onExit : () => {};

  term.innerHTML = '';
  termRef = term;

  const keypad = createNumericKeypad();
  if (keypad) {
    keypad.style.position = 'fixed';
    keypad.style.bottom = '1rem';
    keypad.style.right = '1rem';
  }

  const container = document.createElement('div');
  container.style.position = 'relative';
  term.appendChild(container);

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.textContent = 'Salir';
  exitBtn.className = 'numa-btn';
  exitBtn.style.position = 'absolute';
  exitBtn.style.top = '0.5rem';
  exitBtn.style.right = '0.5rem';
  exitBtn.addEventListener('click', () => {
    const exit = onExitCallback;
    cleanupSession();
    exit();
  });
  container.appendChild(exitBtn);

  answeredListRef = document.createElement('div');
  answeredListRef.className = 'answered-list';
  answeredListRef.style.marginTop = '3.5rem';
  container.appendChild(answeredListRef);

  outputRef = document.createElement('div');
  outputRef.className = 'numa-output';
  outputRef.style.marginTop = '1rem';
  container.appendChild(outputRef);

  startSession(options.shuffle);
}
