// Peças pequenas usadas em todo o app.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { provenanceParts } from '../../js/provenance.js';
import { flagImageUrl } from '../../js/country.exploration.js';
import { pageUrl, shareLink, shareUrl } from '../../js/share.link.js';
import { announce } from '../state/focus.js';

export function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`.trim()} aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

export function CloseButton({ label, onClick, id, className = '' }) {
  return <button className={`icon-button ${className}`.trim()} id={id} type="button" aria-label={label} onClick={onClick}><Icon name="close" /></button>;
}

const isHttps = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

/**
 * Link para fora do site: avisa o leitor de tela que abre em outra aba. Só https;
 * qualquer outro endereço (javascript:, data:) vira texto comum.
 */
export function ExternalLink({ href, className, sponsored = false, children, ...rest }) {
  if (!isHttps(href)) return <span className={className}>{children}</span>;
  return (
    <a className={className} href={href} target="_blank" rel={sponsored ? 'noopener sponsored' : 'noopener noreferrer'} {...rest}>
      {children}<span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/** De onde vem um número: verificado, ao vivo, estimativa, calculado… */
export function Provenance({ kind, tag: Tag = 'p', className = '', ...options }) {
  const { label, parts } = provenanceParts(kind, options);
  return (
    <Tag className={`provenance provenance--${kind} ${className}`.trim()}>
      <span className="provenance__kind">{label}</span>
      {parts.map((part, index) => (
        <span className="provenance__part" key={index}>{part.href ? <ExternalLink href={part.href}>{part.text}</ExternalLink> : part.text}</span>
      ))}
    </Tag>
  );
}

/** Bandeira decorativa (o nome do país sempre está escrito ao lado). */
export function Flag({ country, className, width = 40, height = 30 }) {
  const [failed, setFailed] = useState(null);
  const url = flagImageUrl(country?.alpha2);
  if (!url || failed === url) return <span className={`${className} planner-flag-fallback`} aria-hidden="true">{country?.alpha2 || '🌍'}</span>;
  return <img className={className} src={url} alt="" width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(url)} />;
}

/** Abertura do artigo da Wikipédia, sempre com crédito. */
export function Summary({ entry, className }) {
  if (!entry?.text) return null;
  return <p className={className}>{entry.text} <ExternalLink className="summary__source" href={entry.url}>Wikipédia</ExternalLink></p>;
}

export function SummaryImage({ entry, alt }) {
  const image = entry?.image;
  if (!image) return null;
  return (
    <figure className="geo-photo">
      <img src={image.url} alt={alt} loading="lazy" decoding="async" />
      <figcaption><ExternalLink href={image.sourcePage}>{image.author} · {image.license}</ExternalLink></figcaption>
    </figure>
  );
}

/** Salvar / ✓ Salvo, com o nome do destino para o leitor de tela. */
export function SaveButton({ saved, name, onToggle, className = 'save-toggle', id }) {
  return (
    <button className={className} id={id} type="button" aria-pressed={saved} aria-label={`${saved ? 'Salvo' : 'Salvar'}: ${name}`} onClick={onToggle}>
      {saved ? '✓ Salvo' : 'Salvar'}
    </button>
  );
}

/** Compartilha pelo menu do sistema ou copia o link; mostra o resultado por 2 s. */
export function useShare() {
  const [result, setResult] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const share = async ({ title, text, hash = '', path = '', url = path ? pageUrl(path) : hash ? shareUrl(hash) : '' }) => {
    if (!url) return;
    const outcome = await shareLink({ title, text, url });
    if (outcome === 'shared' || outcome === 'cancelled') return;
    const message = outcome === 'copied' ? '✓ Link copiado' : 'Não deu para copiar';
    setResult(message);
    announce(outcome === 'copied' ? 'Link copiado.' : 'Não deu para copiar o link.');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setResult(''), 2000);
  };
  return [share, result];
}

/**
 * Pílula ou traço que desliza até o item ativo de um grupo. Decorativo.
 * O contêiner precisa da classe has-indicator.
 */
export function Indicator({ active, mode = 'pill', dependency }) {
  const ref = useRef(null);
  const placed = useRef(false);
  const update = useRef(() => {});
  update.current = () => {
    const indicator = ref.current;
    const target = indicator?.parentElement.querySelector(active);
    if (!indicator) return;
    if (!target || !target.offsetWidth) {
      indicator.classList.add('slide-indicator--hidden');
      return;
    }
    const height = mode === 'underline' ? 2 : target.offsetHeight;
    const y = mode === 'underline' ? target.offsetTop + target.offsetHeight - 2 : target.offsetTop;
    // Primeira posição sem animação (não "voa" do canto ao aparecer).
    if (!placed.current) indicator.style.transition = 'none';
    indicator.style.setProperty('--indicator-x', `${target.offsetLeft}px`);
    indicator.style.setProperty('--indicator-y', `${y}px`);
    indicator.style.setProperty('--indicator-width', `${target.offsetWidth}px`);
    indicator.style.setProperty('--indicator-height', `${height}px`);
    indicator.classList.remove('slide-indicator--hidden');
    if (!placed.current) {
      placed.current = true;
      requestAnimationFrame(() => { indicator.style.transition = ''; });
    }
  };
  useLayoutEffect(() => update.current(), [dependency]);
  useEffect(() => {
    const observer = new ResizeObserver(() => update.current());
    observer.observe(ref.current.parentElement);
    return () => observer.disconnect();
  }, []);
  return <span className="slide-indicator slide-indicator--hidden" aria-hidden="true" ref={ref} />;
}

/**
 * Teclas de um grupo de abas (padrão ARIA): setas trocam, Home/End vão às pontas.
 * Devolve o onKeyDown da lista.
 */
export function tabKeys(keys, current, select) {
  return event => {
    const index = keys.indexOf(current);
    const next = { ArrowRight: (index + 1) % keys.length, ArrowLeft: (index - 1 + keys.length) % keys.length, Home: 0, End: keys.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(keys[next]);
    const list = event.currentTarget;
    requestAnimationFrame(() => list.querySelector('[role="tab"][aria-selected="true"]')?.focus());
  };
}
