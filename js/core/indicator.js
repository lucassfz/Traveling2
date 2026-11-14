// Indicador deslizante para grupos de botões (continentes, abas): uma pílula ou
// um traço que desliza até o item ativo, em vez de cada botão pintar o próprio
// fundo. Só transform/width animam (compositor). O item ativo é observado por
// MutationObserver, então quem troca a classe não precisa saber do indicador.

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {string} options.active      Seletor do item ativo (ex.: '.country-tabs__button--active').
 * @param {'pill'|'underline'} [options.mode]
 * @returns {() => void} Atualiza a posição manualmente.
 */
export function attachIndicator(container, { active, mode = 'pill' }) {
  if (!container) return () => {};
  const indicator = document.createElement('span');
  indicator.className = 'slide-indicator slide-indicator--hidden';
  indicator.setAttribute('aria-hidden', 'true');
  container.classList.add('has-indicator');
  container.prepend(indicator);
  let frame = 0;
  let placed = false;

  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      // Quem redesenha o grupo com innerHTML remove o indicador: volta a inserir.
      if (!indicator.isConnected) {
        placed = false;
        container.prepend(indicator);
      }
      const target = container.querySelector(active);
      if (!target || !target.offsetWidth) {
        indicator.classList.add('slide-indicator--hidden');
        return;
      }
      const height = mode === 'underline' ? 2 : target.offsetHeight;
      const y = mode === 'underline' ? target.offsetTop + target.offsetHeight - 2 : target.offsetTop;
      // Primeira posição sem animação (não "voa" do canto ao aparecer).
      if (!placed) indicator.style.transition = 'none';
      indicator.style.setProperty('--indicator-x', `${target.offsetLeft}px`);
      indicator.style.setProperty('--indicator-y', `${y}px`);
      indicator.style.setProperty('--indicator-width', `${target.offsetWidth}px`);
      indicator.style.setProperty('--indicator-height', `${height}px`);
      indicator.classList.remove('slide-indicator--hidden');
      if (!placed) {
        placed = true;
        requestAnimationFrame(() => { indicator.style.transition = ''; });
      }
    });
  };

  // Ignora mudanças do próprio indicador (senão ele se reagendaria a cada quadro).
  new MutationObserver(records => {
    if (records.some(record => record.target !== indicator)) update();
  }).observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'hidden'] });
  new ResizeObserver(update).observe(container);
  update();
  return update;
}
