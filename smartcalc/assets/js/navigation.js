'use strict';

/* ═══════════════════════════════════════════════
   MÓDULO: NAVEGACIÓN
═══════════════════════════════════════════════ */

const NavModule = {
  init() {
    const tabs = document.querySelectorAll('.nav-card[data-tab]');
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
        document.getElementById('main-content')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      });
    });
  }
};