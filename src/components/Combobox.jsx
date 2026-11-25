// Campo de busca com lista (padrão ARIA "combobox"): o foco fica no campo, as
// setas percorrem as opções, Enter escolhe e Esc fecha. O leitor de tela ouve a
// opção ativa (aria-activedescendant) e quantas há.
import { useEffect, useId, useRef, useState } from 'react';

/**
 * @param {object} props
 * @param {string} props.query
 * @param {(value: string) => void} props.onQuery
 * @param {Array<{ key: string }>} props.options  Vazio = lista fechada.
 * @param {(option: object) => void} props.onPick
 * @param {(option: object) => import('react').ReactNode} props.renderOption
 * @param {string} props.listLabel
 * @param {string} [props.emptyText]  Mostrado quando a busca não achou nada.
 */
export function Combobox({ id, query, onQuery, options, onPick, renderOption, listLabel, emptyText = '', inputClassName, listClassName, openClassName = '', optionClassName, onEscape, inputProps = {}, children }) {
  const listId = useId();
  const [active, setActive] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const list = useRef(null);
  const root = useRef(null);
  const open = options.length > 0 && !dismissed;

  useEffect(() => { setActive(-1); }, [query]);
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);
  useEffect(() => {
    const onPointer = event => { if (!root.current?.contains(event.target)) setDismissed(true); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  const pick = option => {
    setDismissed(true);
    onPick(option);
  };

  const onKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return;
      event.preventDefault();
      setDismissed(false);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(current => (current === -1 && step === -1 ? options.length - 1 : (current + step + options.length) % options.length));
    } else if (event.key === 'Enter') {
      const option = options[active] ?? options[0];
      if (!option) return;
      event.preventDefault();
      pick(option);
    } else if (event.key === 'Escape') {
      if (open) {
        // Primeiro Esc fecha só a lista.
        event.preventDefault();
        setDismissed(true);
      } else if (onEscape?.()) event.preventDefault();
    }
  };

  const status = query.trim().length < 2 ? '' : options.length
    ? `${options.length} ${options.length === 1 ? 'resultado' : 'resultados'}. Use as setas para escolher.`
    : emptyText;

  return (
    <div className="combobox" ref={root} onBlur={event => { if (!root.current.contains(event.relatedTarget)) setDismissed(true); }}>
      <input
        {...inputProps}
        className={inputClassName}
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        value={query}
        onChange={event => { setDismissed(false); onQuery(event.target.value); }}
        onKeyDown={onKeyDown}
      />
      {children}
      <div className={`${listClassName}${open ? ` ${openClassName}` : ''}`} id={listId} role="listbox" aria-label={listLabel} ref={list}>
        {open && options.map((option, index) => (
          <div
            className={optionClassName}
            key={option.key}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            data-option-key={option.key}
            onPointerDown={event => event.preventDefault()}
            onClick={() => pick(option)}
          >
            {renderOption(option)}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{open || !options.length ? status : ''}</span>
    </div>
  );
}
