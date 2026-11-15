// Tour de boas-vindas: três passos curtos na primeira visita, sem bloquear o
// globo. Some com "Pular", no último passo, com Esc ou ao abrir um país.
// Só aparece uma vez por navegador (localStorage); falha em silêncio sem ele.
const KEY = 'traveling.tour';

const STEPS = [
  { target: '#globe-stage', title: 'Explore o mundo', text: 'Gire o globo e toque num país para ver o guia: visto para brasileiros, melhor época, preços e o que fazer.' },
  { target: '#discover-button', title: 'Não sabe para onde ir?', text: 'Em Descobrir, diga o que você quer (praia, cultura, frio...) e o mês, e o Traveling sugere destinos.' },
  { target: '#trips-launcher', title: 'Planeje a viagem', text: 'Em Viagens, monte o roteiro passo a passo: voo, hospedagem, custo total e documentos.' }
];

function seen() {
  try { return localStorage.getItem(KEY) === 'done'; } catch { return true; }
}

function remember() {
  try { localStorage.setItem(KEY, 'done'); } catch { /* sem armazenamento */ }
}

/** Mostra o tour se for a primeira visita. @returns {{ close: () => void } | null} */
export function startTour({ root = document.body } = {}) {
  if (seen() || document.querySelector('.tour')) return null;
  let index = 0;
  const card = document.createElement('section');
  card.className = 'tour';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-labelledby', 'tour-title');
  root.appendChild(card);

  function highlight(selector) {
    document.querySelectorAll('.tour-target').forEach(element => element.classList.remove('tour-target'));
    if (selector && selector !== '#globe-stage') document.querySelector(selector)?.classList.add('tour-target');
  }

  function close() {
    remember();
    highlight('');
    card.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(event) {
    if (event.key === 'Escape') close();
  }

  function render() {
    const step = STEPS[index];
    const last = index === STEPS.length - 1;
    card.innerHTML = `
      <span class="tour__count">${index + 1} de ${STEPS.length}</span>
      <h2 id="tour-title" tabindex="-1">${step.title}</h2>
      <p>${step.text}</p>
      <div class="tour__actions">
        <button class="secondary-button" type="button" data-tour="skip">${last ? 'Fechar' : 'Pular'}</button>
        ${last ? '<button class="primary-button" type="button" data-tour="done">Começar</button>' : '<button class="primary-button" type="button" data-tour="next">Próximo</button>'}
      </div>`;
    highlight(step.target);
  }

  card.addEventListener('click', event => {
    const action = event.target.closest('[data-tour]')?.dataset.tour;
    if (action === 'next') { index += 1; render(); card.querySelector('#tour-title')?.focus({ preventScroll: true }); }
    if (action === 'skip' || action === 'done') close();
  });
  document.addEventListener('keydown', onKey);
  render();
  return { close };
}
