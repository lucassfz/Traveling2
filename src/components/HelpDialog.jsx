// Atalhos de teclado (tecla ?). Diálogo modal nativo: o navegador prende o foco.
import { useEffect, useRef } from 'react';
import { useApp } from '../state/store.js';
import { setHelpOpen } from '../state/actions.js';
import { CloseButton } from './ui.jsx';

const GROUPS = [
  ['Em qualquer lugar', [
    ['Tab / Shift + Tab', 'Próximo item / item anterior'],
    ['Enter ou Espaço', 'Aciona o item em foco'],
    ['Esc', 'Fecha o painel ou cartão de cima e volta para onde você estava'],
    ['Ctrl + K', 'Busca de países'],
    ['/', 'Busca de países (pode ser desligado)'],
    ['?', 'Esta lista (pode ser desligado)']
  ]],
  ['Globo (com o globo em foco)', [
    ['← ↑ → ↓', 'Gira. Com Shift, gira mais rápido'],
    ['+ e −', 'Aproxima e afasta'],
    ['Enter', 'Abre o país ou a cidade no centro']
  ]],
  ['Busca', [
    ['↓ e ↑', 'Percorre as sugestões'],
    ['Enter', 'Abre a sugestão marcada (ou a primeira)']
  ]],
  ['Abas e menus', [
    ['← e →', 'Troca de aba'],
    ['Home e End', 'Primeira e última aba'],
    ['↓ e ↑', 'Percorre as opções de um menu']
  ]]
];

export function HelpDialog() {
  const open = useApp(state => state.helpOpen);
  const dialog = useRef(null);
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return (
    <dialog className="help-dialog" aria-labelledby="help-title" ref={dialog} onClose={() => setHelpOpen(false)}>
      {open && (
        <>
          <div className="a11y-panel__head">
            <h2 id="help-title">Atalhos de teclado</h2>
            <CloseButton label="Fechar atalhos" onClick={() => setHelpOpen(false)} />
          </div>
          {GROUPS.map(([title, items]) => (
            <section key={title}>
              <h3>{title}</h3>
              <dl className="help-dialog__keys">
                {items.map(([keys, text]) => <div key={keys}><dt><kbd>{keys}</kbd></dt><dd>{text}</dd></div>)}
              </dl>
            </section>
          ))}
          <p className="a11y-panel__note">Não quer usar o globo? A <strong>Lista de países</strong> abre todos os guias em texto. Com leitor de tela, use também os títulos (tecla H) e as regiões da página (tecla D ou R).</p>
        </>
      )}
    </dialog>
  );
}
