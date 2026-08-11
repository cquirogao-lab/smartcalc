'use strict';

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