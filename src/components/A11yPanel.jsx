// Painel "Acessibilidade": comandos de voz, leitura em voz alta, texto maior,
// alto contraste, sem animações e atalhos. Só recursos do navegador; as escolhas
// ficam no navegador de quem usa. Regras das frases: js/accessibility.js.
import { useEffect, useRef, useState } from 'react';
import { TEXT_LABELS, TEXT_SIZES, VOICE_EXAMPLES, VOICE_MORE, rankVoices } from '../../js/accessibility.js';
import { reducedMotion } from '../../js/core/motion.js';
import { useApp } from '../state/store.js';
import { setA11yOpen, setHelpOpen, toggleTheme, updateA11y } from '../state/actions.js';
import { runCommand, speak, speechSupported, startListening, stopListening, useVoice } from '../state/voice.js';
import { CloseButton } from './ui.jsx';

export function A11yPanel() {
  const open = useApp(state => state.a11yOpen);
  return (
    <aside className="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title" hidden={!open}>
      {open && <Content />}
    </aside>
  );
}

// As vozes podem chegar depois do carregamento da página.
function useVoices() {
  const [list, setList] = useState(() => rankVoices(speechSupported() ? speechSynthesis.getVoices() : []));
  useEffect(() => {
    if (!speechSupported()) return undefined;
    const update = () => setList(rankVoices(speechSynthesis.getVoices()));
    speechSynthesis.addEventListener?.('voiceschanged', update);
    return () => speechSynthesis.removeEventListener?.('voiceschanged', update);
  }, []);
  return list;
}

function Toggle({ on, label, icon, note, pressed = on, onClick, className = '' }) {
  return (
    <button className={`a11y-toggle${on ? ' a11y-toggle--on' : ''} ${className}`} type="button" aria-pressed={pressed} onClick={onClick}>
      <span><span aria-hidden="true">{icon} </span>{label}</span>{note && <small>{note}</small>}
    </button>
  );
}

function Content() {
  const settings = useApp(state => state.a11y);
  const theme = useApp(state => state.theme);
  const voice = useVoice();
  const voices = useVoices();
  const current = voices.find(item => item.voiceURI === settings.voice) ?? voices[0] ?? null;
  const status = useRef(null);
  return (
    <>
      <div className="a11y-panel__head">
        <h2 id="a11y-title" tabIndex={-1}>Acessibilidade</h2>
        <CloseButton label="Fechar acessibilidade" onClick={() => setA11yOpen(false)} />
      </div>

      <section className="a11y-panel__group" aria-labelledby="a11y-voice">
        <h3 id="a11y-voice">Comandos de voz</h3>
        {voice.supported ? (
          <>
            <Toggle on={voice.listening} icon="🎙️" label={voice.listening ? 'Microfone ligado' : 'Ligar microfone'} note={voice.listening ? 'Toque para desligar' : 'Use o site falando'} onClick={voice.listening ? stopListening : startListening} />
            {voice.heard && <p className="a11y-panel__heard">Ouvi: "{voice.heard}"</p>}
            <div className="a11y-panel__examples">
              <span>Experimente dizer:</span>
              <ul>{VOICE_EXAMPLES.map(item => <li key={item}>“{item}”</li>)}</ul>
            </div>
            <details className="a11y-panel__help"><summary>Mais comandos</summary><ul>{VOICE_MORE.map(item => <li key={item}>{item}</li>)}</ul></details>
          </>
        ) : <p className="a11y-panel__note">Este navegador não oferece reconhecimento de voz. Funciona no Chrome, no Edge e no Safari.</p>}
      </section>

      <section className="a11y-panel__group" aria-labelledby="a11y-listen">
        <h3 id="a11y-listen">Ouvir</h3>
        {speechSupported() ? (
          <>
            <div className="a11y-row">
              <button className="secondary-button" type="button" onClick={() => runCommand({ action: 'read' })}><span aria-hidden="true">🔊 </span>Ler o que está aberto</button>
              <button className="secondary-button" type="button" onClick={() => runCommand({ action: 'stop-speaking' })}>Parar</button>
            </div>
            {voices.length > 0 && (
              <>
                <div className="a11y-voice">
                  <label htmlFor="a11y-voice-select">Voz</label>
                  <select id="a11y-voice-select" value={current?.voiceURI} onChange={event => { updateA11y({ voice: event.target.value }); speak('Olá! Esta é a voz escolhida.'); }}>
                    {voices.map(item => <option value={item.voiceURI} key={item.voiceURI}>{item.name.replace(/^Microsoft |^Google /, '')}</option>)}
                  </select>
                  <button className="secondary-button" type="button" onClick={() => speak('Olá! Eu leio para você os guias de viagem do Traveling.')}>Testar<span className="sr-only"> a voz</span></button>
                </div>
                <p className="a11y-panel__note">As vozes vêm do seu aparelho. As mais naturais: no Edge, as "Natural" (como Francisca); no iPhone, baixe a "Luciana (Aprimorada)" em Ajustes › Acessibilidade › Conteúdo Falado › Vozes.</p>
              </>
            )}
          </>
        ) : <p className="a11y-panel__note">Este navegador não lê textos em voz alta.</p>}
      </section>

      <section className="a11y-panel__group" aria-labelledby="a11y-view">
        <h3 id="a11y-view">Visual</h3>
        <div className="a11y-row" role="group" aria-label="Tamanho do texto">
          {TEXT_SIZES.map(size => <button className="a11y-chip" type="button" key={size} aria-pressed={settings.text === size} onClick={() => updateA11y({ text: size })}>{TEXT_LABELS[size]}</button>)}
        </div>
        <button className="a11y-toggle a11y-theme" type="button" onClick={toggleTheme}><span>{theme === 'light' ? '🌙 Modo escuro' : '☀️ Modo claro'}</span></button>
        <Toggle on={settings.contrast} icon="◐" label="Alto contraste" onClick={() => updateA11y({ contrast: !settings.contrast })} />
        <Toggle on={settings.motion || reducedMotion.matches} pressed={settings.motion} icon="⏸" label="Sem animações" note={!settings.motion && reducedMotion.matches ? 'Já ativo pelo sistema' : ''} onClick={() => updateA11y({ motion: !settings.motion })} />
      </section>

      <section className="a11y-panel__group" aria-labelledby="a11y-keys">
        <h3 id="a11y-keys">Teclado</h3>
        <Toggle on={settings.shortcuts} icon="⌨" label="Atalhos de uma tecla" note="/ e ?" onClick={() => updateA11y({ shortcuts: !settings.shortcuts })} />
        <button className="secondary-button" type="button" onClick={() => setHelpOpen(true)}>Ver todos os atalhos</button>
      </section>

      <p className="a11y-panel__status" role="status" ref={status}>{voice.feedback}</p>
      <p className="a11y-panel__note">Os comandos de voz usam o reconhecimento do próprio navegador, que pode enviar o áudio ao serviço dele (Google ou Apple) enquanto o microfone estiver ligado. <a href="privacidade.html" target="_blank" rel="noopener">Privacidade<span className="sr-only"> (abre em nova aba)</span></a></p>
    </>
  );
}
