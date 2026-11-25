import { useEffect, useState } from 'react';
import { loadSummaries, summariesIfLoaded } from '../../js/summaries.js';

/** Resultado de uma promessa; troca de dependências descarta a resposta antiga. */
export function useAsync(load, dependencies) {
  const [state, setState] = useState({ value: null, error: null });
  useEffect(() => {
    let current = true;
    setState({ value: null, error: null });
    Promise.resolve().then(load).then(
      value => { if (current) setState({ value, error: null }); },
      error => { if (current) setState({ value: null, error }); }
    );
    return () => { current = false; };
  }, dependencies);
  return state;
}

/** Resumos da Wikipédia (null até carregar; as telas seguem sem eles). */
export function useSummaries() {
  const [data, setData] = useState(summariesIfLoaded);
  useEffect(() => {
    let current = true;
    loadSummaries().then(value => { if (current && value) setData(value); });
    return () => { current = false; };
  }, []);
  return data;
}
