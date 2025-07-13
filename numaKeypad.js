// 📁 mathMode/modules/numaKeypad.js

export function createNumericKeypad() {
  const term = document.getElementById('numa-terminal');
  if (!term) return;

  const keypad = document.createElement('div');
  keypad.id = 'numeric-keypad';

  ['7','8','9','4','5','6','1','2','3','0','C','←'].forEach(key => {
    const btn = document.createElement('button');
    btn.dataset.key = key;
    btn.textContent = key;
    keypad.appendChild(btn);
  });

  term.appendChild(keypad);

  keypad.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    const k = e.target.dataset.key;
    const input = document.querySelector('.answer-input');
    if (!input) return;

    if (k === 'C')      input.value = '';
    else if (k === '←') input.value = input.value.slice(0, -1);
    else                input.value += k;

    input.focus();
    input.dispatchEvent(new Event('input'));
  });
}
