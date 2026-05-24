/**
 * SmartCalc v2.0 — app.js
 * Arquitectura: JS Modular (IIFE + módulos por calculadora)
 * Compatible con migración futura a React/FastAPI
 * Autor: D&Q Labs
 */

'use strict';

/* ═══════════════════════════════════════════════
   MÓDULO: UTILIDADES GLOBALES
═══════════════════════════════════════════════ */
const Utils = {
  /** Formatea número como moneda CLP */
  fmtCLP: (n) => '$ ' + new Intl.NumberFormat('es-CL').format(Math.round(n)),

  /** Formatea número con decimales opcionales */
  fmtNum: (n, dec = 2) => {
    const fixed = parseFloat(n.toFixed(dec));
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: dec }).format(fixed);
  },

  /** Muestra toast de notificación */
  toast: (msg, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  /** Obtiene valor numérico de un input */
  getNum: (id) => parseFloat(document.getElementById(id)?.value) || null,

  /** Limpia inputs por array de IDs */
  clearInputs: (...ids) => ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }),

  /** Muestra/oculta panel de resultado */
  showResult: (id, show = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
      el.hidden = false;
      el.style.animation = 'none';
      requestAnimationFrame(() => {
        el.style.animation = '';
      });
    } else {
      el.hidden = true;
    }
  },

  /** Valida que los campos requeridos tengan valor */
  validate: (fields) => {
    for (const [id, label] of fields) {
      const val = parseFloat(document.getElementById(id)?.value);
      if (!val && val !== 0) {
        Utils.toast(`⚠ Ingresa un valor en: ${label}`, 'error');
        document.getElementById(id)?.focus();
        return false;
      }
    }
    return true;
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: NAVEGACIÓN
═══════════════════════════════════════════════ */
const NavModule = {
  init() {
    const tabs   = document.querySelectorAll('.nav-card[data-tab]');
    const panels = document.querySelectorAll('.calc-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Actualizar tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Actualizar paneles
        panels.forEach(p => {
          if (p.id === `panel-${target}`) {
            p.hidden = false;
            p.classList.add('active');
            p.focus({ preventScroll: true });
          } else {
            p.hidden = true;
            p.classList.remove('active');
          }
        });

        // Scroll suave al área de cálculo
        document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: CALCULADORA CIENTÍFICA
═══════════════════════════════════════════════ */
const SciCalc = {
  expr: '',
  display: '0',
  justEvaled: false,
  memory: 0,
  history: [],

  init() {
    // Botones
    document.getElementById('sci-buttons')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      this.handleAction(btn.dataset.action);
    });

    // Teclado físico
    document.addEventListener('keydown', e => {
      const panel = document.getElementById('panel-cientifica');
      if (panel?.hidden) return;
      this.handleKey(e);
    });

    // Historial: limpiar
    document.getElementById('history-clear-btn')?.addEventListener('click', () => {
      this.history = [];
      this.renderHistory();
    });

    // Historial: clic en item para reutilizar resultado
    document.getElementById('history-list')?.addEventListener('click', e => {
      const item = e.target.closest('.history-item');
      if (!item) return;
      const result = item.dataset.result;
      this.expr = result;
      this.display = result;
      this.justEvaled = false;
      this.updateDisplay();
    });

    this.updateDisplay();
  },

  handleAction(action) {
    if (action.startsWith('fn:')) {
      this.push(action.slice(3));
    } else {
      switch (action) {
        case 'clear': this.clear(); break;
        case 'del':   this.del(); break;
        case 'equal': this.equal(); break;
        case 'sign':  this.toggleSign(); break;
        case 'mc':    this.memory = 0; Utils.toast('Memoria limpiada', 'info'); this.updateMemDisplay(); break;
        case 'mr':    this.push(String(this.memory)); break;
        case 'ms':    this.memory = parseFloat(this.display) || 0; Utils.toast(`Guardado en memoria: ${this.memory}`, 'success'); this.updateMemDisplay(); break;
        case 'm+':    this.memory += parseFloat(this.display) || 0; this.updateMemDisplay(); break;
        case 'm-':    this.memory -= parseFloat(this.display) || 0; this.updateMemDisplay(); break;
      }
    }
  },

  handleKey(e) {
    const key = e.key;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const map = {
      '0':'fn:0','1':'fn:1','2':'fn:2','3':'fn:3','4':'fn:4',
      '5':'fn:5','6':'fn:6','7':'fn:7','8':'fn:8','9':'fn:9',
      '.':'fn:.', '+':'fn:+', '-':'fn:-', '*':'fn:*', '/':'fn:/',
      '%':'fn:%', '(':'fn:(', ')':'fn:)',
      'Enter': 'equal', '=': 'equal',
      'Backspace': 'del', 'Escape': 'clear', 'Delete': 'clear',
    };

    if (map[key]) {
      e.preventDefault();
      this.handleAction(map[key]);
      // Efecto visual en el botón
      const btn = document.querySelector(`[data-action="${map[key]}"]`);
      if (btn) {
        btn.style.transform = 'scale(0.91)';
        setTimeout(() => btn.style.transform = '', 120);
      }
    }
  },

  push(v) {
    if (this.justEvaled) {
      const starters = ['sin(','cos(','tan(','log(','ln(','sqrt(','abs(','1/'];
      const operators = ['+','-','*','/','**','%'];
      if (starters.includes(v)) {
        this.expr = v; this.display = v;
      } else if (operators.includes(v)) {
        this.expr = this.display + v;
      } else {
        this.expr = v; this.display = v;
      }
      this.justEvaled = false;
    } else {
      this.expr += v;
      this.display = this.expr;
    }
    this.updateDisplay();
  },

  del() {
    if (this.justEvaled) { this.clear(); return; }
    this.expr = this.expr.slice(0, -1);
    this.display = this.expr || '0';
    this.updateDisplay();
  },

  clear() {
    this.expr = ''; this.display = '0'; this.justEvaled = false;
    this.updateDisplay();
  },

  toggleSign() {
    if (this.expr.startsWith('-')) this.expr = this.expr.slice(1);
    else this.expr = '-' + this.expr;
    this.display = this.expr;
    this.updateDisplay();
  },

  equal() {
    if (!this.expr) return;
    try {
      let expr = this.expr
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g,  'Math.log(')
        .replace(/sqrt\(/g,'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(');

      // Trigonometría en grados
      expr = expr.replace(/Math\.(sin|cos|tan)\(([^)]+)\)/g,
        (_, fn, arg) => `Math.${fn}((${arg}) * Math.PI / 180)`
      );

      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')();
      if (!isFinite(result)) throw new Error('Resultado indefinido');

      const resultStr = parseFloat(result.toFixed(10)).toString();

      // Guardar en historial
      this.history.unshift({ expr: this.expr, result: resultStr });
      if (this.history.length > 50) this.history.pop();
      this.renderHistory();

      this.display = resultStr;
      document.getElementById('sci-expr').textContent = this.expr + ' =';
      document.getElementById('sci-num').textContent = resultStr;
      this.justEvaled = true;
      this.expr = resultStr;

    } catch (err) {
      document.getElementById('sci-num').textContent = 'ERROR';
      document.getElementById('sci-num').style.color = 'var(--c-red)';
      setTimeout(() => {
        document.getElementById('sci-num').style.color = '';
        this.clear();
      }, 1500);
    }
  },

  updateDisplay() {
    const numEl = document.getElementById('sci-num');
    const exprEl = document.getElementById('sci-expr');
    if (numEl) numEl.textContent = this.display;
    if (exprEl && !this.justEvaled) exprEl.textContent = '';
  },

  updateMemDisplay() {
    const el = document.getElementById('sci-memory-display');
    if (el) el.textContent = `M: ${this.memory}`;
  },

  renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    if (this.history.length === 0) {
      list.innerHTML = '<li class="history-empty">Tus cálculos aparecerán aquí</li>';
      return;
    }
    list.innerHTML = this.history.map(h => `
      <li class="history-item" data-result="${h.result}" tabindex="0"
          aria-label="Resultado: ${h.result}. Clic para usar.">
        <div class="history-item__expr">${h.expr}</div>
        <div class="history-item__result">= ${h.result}</div>
      </li>
    `).join('');
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: IMC
═══════════════════════════════════════════════ */
const IMCCalc = {
  init() {
    document.getElementById('imc-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('imc-clear-btn')?.addEventListener('click', () => this.clear());
    // Enter en inputs
    ['imc-peso','imc-altura','imc-edad'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.calculate();
      });
    });
  },

  calculate() {
    const peso   = Utils.getNum('imc-peso');
    const altura = Utils.getNum('imc-altura');
    if (!peso || !altura) { Utils.toast('⚠ Ingresa peso y altura', 'error'); return; }
    if (peso < 1 || peso > 500) { Utils.toast('⚠ Peso fuera de rango (1-500 kg)', 'error'); return; }
    if (altura < 50 || altura > 250) { Utils.toast('⚠ Altura fuera de rango (50-250 cm)', 'error'); return; }

    const imc = peso / Math.pow(altura / 100, 2);
    const { label, color } = this.classify(imc);

    document.getElementById('imc-val').textContent  = imc.toFixed(1);
    document.getElementById('imc-val').style.color  = `var(--c-${color})`;
    document.getElementById('imc-cat').textContent  = label;
    document.getElementById('imc-cat').style.background = `rgba(var(--c-${color}-rgb, 125,255,106),0.1)`;
    document.getElementById('imc-cat').style.color       = `var(--c-${color})`;

    // Marcador en escala (rango 16-40)
    const pct = Math.min(100, Math.max(0, ((imc - 16) / (40 - 16)) * 100));
    document.getElementById('imc-marker').style.left = pct + '%';

    Utils.showResult('imc-result');
  },

  classify(imc) {
    if (imc < 16)   return { label: '⚠ Desnutrición severa', color: 'cyan' };
    if (imc < 18.5) return { label: '↓ Bajo peso',           color: 'cyan' };
    if (imc < 25)   return { label: '✓ Peso normal',          color: 'green' };
    if (imc < 30)   return { label: '↑ Sobrepeso',            color: 'amber' };
    if (imc < 35)   return { label: '▲ Obesidad grado I',     color: 'red' };
    if (imc < 40)   return { label: '▲▲ Obesidad grado II',   color: 'red' };
    return              { label: '▲▲▲ Obesidad mórbida',      color: 'red' };
  },

  clear() {
    Utils.clearInputs('imc-peso', 'imc-altura', 'imc-edad');
    Utils.showResult('imc-result', false);
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: IVA CHILE
═══════════════════════════════════════════════ */
const IVACalc = {
  init() {
    document.getElementById('iva-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('iva-clear-btn')?.addEventListener('click', () => this.clear());
    document.getElementById('iva-monto')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.calculate();
    });
  },

  calculate() {
    const monto = Utils.getNum('iva-monto');
    const tasa  = Utils.getNum('iva-tasa');
    const tipo  = document.getElementById('iva-tipo').value;

    if (!monto || monto <= 0) { Utils.toast('⚠ Ingresa un monto válido', 'error'); return; }
    if (!tasa || tasa < 0)    { Utils.toast('⚠ Ingresa una tasa válida', 'error'); return; }

    const tasaDec = tasa / 100;
    let neto, iva, total;

    if (tipo === 'agregar') {
      neto  = monto;
      iva   = neto * tasaDec;
      total = neto + iva;
    } else {
      total = monto;
      neto  = total / (1 + tasaDec);
      iva   = total - neto;
    }

    document.getElementById('iva-neto').textContent       = Utils.fmtCLP(neto);
    document.getElementById('iva-iva').textContent        = Utils.fmtCLP(iva);
    document.getElementById('iva-total').textContent      = Utils.fmtCLP(total);
    document.getElementById('iva-tasa-label').textContent = `IVA (${tasa}%)`;

    Utils.showResult('iva-result');
  },

  clear() {
    Utils.clearInputs('iva-monto');
    document.getElementById('iva-tasa').value = '19';
    Utils.showResult('iva-result', false);
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: REGLA DE TRES
═══════════════════════════════════════════════ */
const ReglaCalc = {
  init() {
    document.getElementById('r3-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('r3-clear-btn')?.addEventListener('click', () => this.clear());
  },

  calculate() {
    const a    = Utils.getNum('r3-a');
    const b    = Utils.getNum('r3-b');
    const c    = Utils.getNum('r3-c');
    const tipo = document.getElementById('r3-tipo').value;

    if (!a || !b || !c) { Utils.toast('⚠ Completa los valores A, B y C', 'error'); return; }
    if (a === 0) { Utils.toast('⚠ A no puede ser cero', 'error'); return; }

    let x, formula;
    if (tipo === 'directa') {
      x = (b * c) / a;
      formula = `Directa: Si ${a} → ${b}, entonces ${c} → X = (${b} × ${c}) ÷ ${a} = ${Utils.fmtNum(x, 6)}`;
    } else {
      x = (a * b) / c;
      formula = `Inversa: Si ${a} → ${b}, entonces ${c} → X = (${a} × ${b}) ÷ ${c} = ${Utils.fmtNum(x, 6)}`;
    }

    document.getElementById('r3-x').value = Utils.fmtNum(x, 6);
    const fEl = document.getElementById('r3-formula');
    fEl.textContent = formula;
    fEl.hidden = false;
  },

  clear() {
    Utils.clearInputs('r3-a', 'r3-b', 'r3-c', 'r3-x');
    const fEl = document.getElementById('r3-formula');
    if (fEl) fEl.hidden = true;
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: CALORÍAS
═══════════════════════════════════════════════ */
const CaloriasCalc = {
  sexo: 'm',

  init() {
    // Toggle sexo
    document.querySelectorAll('.toggle-btn[data-sex]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sexo = btn.dataset.sex;
        document.querySelectorAll('.toggle-btn[data-sex]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      });
    });

    document.getElementById('cal-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('cal-clear-btn')?.addEventListener('click', () => this.clear());
  },

  calculate() {
    const edad   = Utils.getNum('cal-edad');
    const peso   = Utils.getNum('cal-peso');
    const altura = Utils.getNum('cal-altura');
    const act    = parseFloat(document.getElementById('cal-act').value);
    const obj    = document.getElementById('cal-obj').value;

    if (!edad || !peso || !altura) { Utils.toast('⚠ Completa todos los campos', 'error'); return; }

    // Mifflin-St Jeor
    const tmb = this.sexo === 'm'
      ? 10 * peso + 6.25 * altura - 5 * edad + 5
      : 10 * peso + 6.25 * altura - 5 * edad - 161;

    let tdee = tmb * act;
    if (obj === 'perder') tdee -= 500;
    if (obj === 'ganar')  tdee += 300;

    // Macros: 50% carbs, 25% prot, 25% grasa
    const carb = Math.round(tdee * 0.50 / 4);
    const prot = Math.round(tdee * 0.25 / 4);
    const gras = Math.round(tdee * 0.25 / 9);

    const notes = {
      perder:   'Déficit 500 kcal · ~0.5 kg/sem',
      mantener: 'Ingesta de mantenimiento',
      ganar:    'Superávit 300 kcal · ganancia muscular',
    };

    document.getElementById('cal-val').textContent  = Math.round(tdee) + ' kcal';
    document.getElementById('cal-note').textContent = notes[obj];
    document.getElementById('cal-carb').textContent = carb + ' g';
    document.getElementById('cal-prot').textContent = prot + ' g';
    document.getElementById('cal-gras').textContent = gras + ' g';

    Utils.showResult('cal-result');
  },

  clear() {
    Utils.clearInputs('cal-edad', 'cal-peso', 'cal-altura');
    Utils.showResult('cal-result', false);
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: PORCENTAJE
═══════════════════════════════════════════════ */
const PorcentajeCalc = {
  init() {
    document.getElementById('pct-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('pct-clear-btn')?.addEventListener('click', () => this.clear());
    document.getElementById('pct-modo')?.addEventListener('change', () => this.updateLabels());
    this.updateLabels();
  },

  updateLabels() {
    const modo = document.getElementById('pct-modo')?.value;
    const aLbl = document.getElementById('pct-a-label');
    const bLbl = document.getElementById('pct-b-label');
    if (!aLbl || !bLbl) return;

    const labels = {
      de:  ['Porcentaje (%)', 'Número base'],
      que: ['Valor parcial', 'Valor total'],
      var: ['Valor inicial', 'Valor final'],
    };
    aLbl.textContent = labels[modo][0];
    bLbl.textContent = labels[modo][1];
  },

  calculate() {
    const a    = Utils.getNum('pct-a');
    const b    = Utils.getNum('pct-b');
    const modo = document.getElementById('pct-modo').value;

    if (!a || !b) { Utils.toast('⚠ Ingresa ambos valores', 'error'); return; }

    let result, formula;
    if (modo === 'de') {
      result  = (a / 100) * b;
      formula = `${a}% de ${Utils.fmtNum(b)} = ${Utils.fmtNum(result)}`;
    } else if (modo === 'que') {
      result  = (a / b) * 100;
      formula = `${Utils.fmtNum(a)} es el ${Utils.fmtNum(result, 2)}% de ${Utils.fmtNum(b)}`;
    } else {
      result  = ((b - a) / Math.abs(a)) * 100;
      const signo = result >= 0 ? '+' : '';
      formula = `Variación de ${Utils.fmtNum(a)} a ${Utils.fmtNum(b)}: ${signo}${Utils.fmtNum(result, 2)}%`;
    }

    document.getElementById('pct-val').textContent     = Utils.fmtNum(result, 4);
    document.getElementById('pct-formula').textContent = formula;
    document.getElementById('pct-formula').hidden      = false;
    Utils.showResult('pct-result');
  },

  clear() {
    Utils.clearInputs('pct-a', 'pct-b');
    Utils.showResult('pct-result', false);
    document.getElementById('pct-formula').hidden = true;
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: INTERÉS COMPUESTO
═══════════════════════════════════════════════ */
const InteresCalc = {
  init() {
    document.getElementById('ic-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('ic-clear-btn')?.addEventListener('click', () => this.clear());
  },

  calculate() {
    const capital = Utils.getNum('ic-capital');
    const tasa    = Utils.getNum('ic-tasa');
    const años    = Utils.getNum('ic-años');
    const freq    = parseInt(document.getElementById('ic-freq').value);
    const aporte  = parseFloat(document.getElementById('ic-aporte').value) || 0;

    if (!capital || !tasa || !años) {
      Utils.toast('⚠ Completa capital, tasa y tiempo', 'error');
      return;
    }

    const r = tasa / 100 / freq;
    const n = freq * años;

    // Capital inicial compuesto
    const montoCapital = capital * Math.pow(1 + r, n);

    // Aportes periódicos (anualidad ordinaria)
    const montoAportes = aporte > 0
      ? aporte * ((Math.pow(1 + r, n) - 1) / r)
      : 0;

    const total      = montoCapital + montoAportes;
    const aportesTotal = aporte * n;
    const intereses  = total - capital - aportesTotal;

    document.getElementById('ic-r-capital').textContent   = Utils.fmtCLP(capital);
    document.getElementById('ic-r-aportes').textContent   = Utils.fmtCLP(aportesTotal);
    document.getElementById('ic-r-intereses').textContent = Utils.fmtCLP(intereses);
    document.getElementById('ic-r-total').textContent     = Utils.fmtCLP(total);

    Utils.showResult('ic-result');
  },

  clear() {
    Utils.clearInputs('ic-capital', 'ic-tasa', 'ic-años', 'ic-aporte');
    Utils.showResult('ic-result', false);
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: LEY DE OHM
═══════════════════════════════════════════════ */
const OhmCalc = {
  init() {
    document.getElementById('ohm-calc-btn')?.addEventListener('click', () => this.calculate());
    document.getElementById('ohm-clear-btn')?.addEventListener('click', () => this.clear());
  },

  calculate() {
    const V = Utils.getNum('ohm-v');
    const I = Utils.getNum('ohm-i');
    const R = Utils.getNum('ohm-r');
    const P = Utils.getNum('ohm-p');

    const known = [V, I, R, P].filter(v => v !== null && v !== 0);
    if (known.length < 2) {
      Utils.toast('⚠ Ingresa al menos 2 valores conocidos', 'error');
      return;
    }

    let rV = V, rI = I, rR = R, rP = P;

    // Calcular desconocidos (múltiples pasadas para resolver dependencias)
    for (let pass = 0; pass < 3; pass++) {
      if (rV && rI && !rR) rR = rV / rI;
      if (rV && rR && !rI) rI = rV / rR;
      if (rI && rR && !rV) rV = rI * rR;
      if (rV && rI)        rP = rV * rI;
      if (rP && rV && !rI) rI = rP / rV;
      if (rP && rI && !rV) rV = rP / rI;
      if (rP && rR && !rI) rI = Math.sqrt(rP / rR);
      if (rP && rI && !rR) rR = rP / Math.pow(rI, 2);
    }

    const results = [
      { sym: 'V', val: rV, unit: 'Voltios', color: 'var(--c-amber)' },
      { sym: 'I', val: rI, unit: 'Amperios', color: 'var(--c-cyan)' },
      { sym: 'R', val: rR, unit: 'Ohmios (Ω)', color: 'var(--c-red)' },
      { sym: 'P', val: rP, unit: 'Vatios', color: 'var(--c-green)' },
    ];

    const grid = document.getElementById('ohm-results-grid');
    if (!grid) return;
    grid.innerHTML = results.map(r => `
      <div class="ohm-result-card">
        <div class="ohm-result-sym" style="color:${r.color}">${r.sym}</div>
        <div class="ohm-result-val">${r.val !== null ? Utils.fmtNum(r.val, 4) : '—'}</div>
        <div class="ohm-result-unit">${r.unit}</div>
      </div>
    `).join('');

    Utils.showResult('ohm-result');
  },

  clear() {
    Utils.clearInputs('ohm-v', 'ohm-i', 'ohm-r', 'ohm-p');
    Utils.showResult('ohm-result', false);
  }
};

/* ═══════════════════════════════════════════════
   MÓDULO: PERFORMANCE (Lazy load animaciones)
═══════════════════════════════════════════════ */
const Performance = {
  init() {
    // Intersection Observer para animar cards al entrar en viewport
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.nav-card').forEach((el, i) => {
      el.style.animationDelay = `${i * 50}ms`;
      el.style.animation = 'fade-up 0.5s var(--ease-out) both paused';
      observer.observe(el);
    });
  }
};

/* ═══════════════════════════════════════════════
   INIT PRINCIPAL
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  NavModule.init();
  SciCalc.init();
  IMCCalc.init();
  IVACalc.init();
  ReglaCalc.init();
  CaloriasCalc.init();
  PorcentajeCalc.init();
  InteresCalc.init();
  OhmCalc.init();
  Performance.init();

  // Log de versión en consola (útil para debugging en producción)
  console.log('%cSmartCalc v2.0 · D&Q Labs', 'color:#7dff6a;font-family:monospace;font-size:14px;');
  console.log('%cArquitectura: HTML5 + CSS3 + JS Modular', 'color:#8888aa;font-family:monospace;font-size:10px;');
});
