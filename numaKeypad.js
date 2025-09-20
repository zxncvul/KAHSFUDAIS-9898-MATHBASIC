// 📁 mathMode/modules/numaKeypad.js

let keypadEl = null;

function buildButton(key) {
  const btn = document.createElement('button');
  btn.dataset.key = key;
  btn.textContent = key;
  btn.type = 'button';
  return btn;
}

export function createNumericKeypad() {
  const term = document.getElementById('numa-terminal');
  if (!term) return null;

  if (keypadEl && keypadEl.isConnected) {
    return keypadEl;
  }

  keypadEl = document.createElement('div');
  keypadEl.id = 'numeric-keypad';

  const keys = ['7','8','9','%','4','5','6',':','1','2','3','.', '0','C','←'];
  keys.forEach(key => keypadEl.appendChild(buildButton(key)));

  keypadEl.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const key = target.dataset.key;
    const input = document.querySelector('.answer-input');
    if (!input) return;

    if (key === 'C') {
      input.value = '';
    } else if (key === '←') {
      input.value = input.value.slice(0, -1);
    } else {
      input.value += key;
    }

    input.focus();
    input.dispatchEvent(new Event('input'));
  });

  term.appendChild(keypadEl);
  return keypadEl;
}

export function removeNumericKeypad() {
  if (keypadEl && keypadEl.isConnected) {
    keypadEl.remove();
  }
  keypadEl = null;
}
