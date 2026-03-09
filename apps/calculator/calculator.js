function initCalculator() {
  let current = '0', prev = null, op = null, fresh = false;

  const display     = document.getElementById('calc-result');
  const expression  = document.getElementById('calc-expression');

  function update() { display.textContent = current; }

  window.calcNum = n => {
    if (fresh) { current = n; fresh = false; }
    else current = current === '0' ? n : current + n;
    update();
  };

  window.calcDot = () => {
    if (!current.includes('.')) current += '.';
    update();
  };

  window.calcSign = () => {
    current = String(parseFloat(current) * -1);
    update();
  };

  window.calcPercent = () => {
    current = String(parseFloat(current) / 100);
    update();
  };

  window.calcOp = o => {
    prev = parseFloat(current);
    op   = o;
    expression.textContent = `${prev} ${o}`;
    fresh = true;
  };

  window.calcEquals = () => {
    if (op === null || prev === null) return;
    const a = prev, b = parseFloat(current);
    const ops = { '+': a+b, '-': a-b, '*': a*b, '/': a/b };
    expression.textContent = `${a} ${op} ${b} =`;
    current = String(parseFloat(ops[op].toFixed(10)));
    op = null; prev = null; fresh = true;
    update();
  };

  window.calcClear = () => {
    current = '0'; prev = null; op = null; fresh = false;
    expression.textContent = '';
    update();
  };

  // Keyboard support
  document.addEventListener('keydown', e => {
    if ('0123456789'.includes(e.key)) calcNum(e.key);
    else if (e.key === '.')  calcDot();
    else if (e.key === '+')  calcOp('+');
    else if (e.key === '-')  calcOp('-');
    else if (e.key === '*')  calcOp('*');
    else if (e.key === '/')  { e.preventDefault(); calcOp('/'); }
    else if (e.key === 'Enter' || e.key === '=') calcEquals();
    else if (e.key === 'Escape') calcClear();
    else if (e.key === 'Backspace') {
      current = current.length > 1 ? current.slice(0, -1) : '0';
      update();
    }
  });
}